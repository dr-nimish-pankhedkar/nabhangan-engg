# Security Audit Report — Nabhangan Engineers Workflow Tracker
**Date:** 2026-06-14  
**Auditor:** Automated codebase review (no live DB access — Supabase/RLS items require manual verification)

---

## Summary Table

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.1 | Middleware redirects unauthenticated users | ✅ PASS | middleware.ts:40 |
| 1.2 | Middleware redirects authenticated users away from /login | ✅ PASS | middleware.ts:46–50 |
| 1.3 | Supabase SSR session refresh correctly wired | ✅ PASS | lib/supabase/server.ts:18–28 |
| 1.4 | No route bypasses middleware matcher | ✅ PASS | All (app) routes covered |
| 1.5 | Login page redirects already-logged-in users | ⚠️ MINOR | Handled by middleware only; no page-level guard |
| 2.1 | RLS enabled on all tables | ❓ CANNOT VERIFY | No live DB access — must check manually |
| 2.2 | RLS policies match intended access model | ❓ CANNOT VERIFY | No live DB access — must check manually |
| 2.3 | No table with RLS on but zero policies | ❓ CANNOT VERIFY | No live DB access — must check manually |
| 3.1 | project-files bucket is private | ❓ CANNOT VERIFY | No live DB access — must check manually |
| 3.2 | Storage policies restrict access by project/stage | ❓ CANNOT VERIFY | No live DB access — must check manually |
| 3.3 | File URLs are signed/expiring (not permanent public) | 🔴 NEEDS FIX | lib/storage.ts:28 uses getPublicUrl() |
| 4.1 | UI hides admin-only links for non-admin roles | ✅ PASS | sidebar.tsx correctly gates adminNav |
| 4.2 | Admin pages check role server-side (not UI-only) | ✅ PASS | All admin page.tsx files redirect non-admins |
| 4.3 | Server Actions verify auth + role before mutations | 🔴 NEEDS FIX | NO actions.ts checks getUser() or role — see §4 |
| 5.1 | Server Actions validate input with Zod server-side | 🔴 NEEDS FIX | All validation is client-side only — see §5 |
| 5.2 | No raw user input passed directly into SQL | ✅ PASS | Supabase client uses parameterised queries |
| 6.1 | No secrets committed to repo | ✅ PASS | Grep confirms no hardcoded keys |
| 6.2 | .env.local is in .gitignore | ✅ PASS | .gitignore line 34: `.env*` |
| 6.3 | Service role key server-only | ✅ PASS | Only used in createAdminClient() in server.ts |
| 6.4 | Only safe NEXT_PUBLIC_ vars exposed to client | ✅ PASS | Only URL + anon key are public |
| 7.1 | HTTPS enforced in production | ✅ PASS | Vercel enforces HTTPS automatically |

---

## Section 1 — Authentication

### 1.1–1.4 PASS — Middleware
`middleware.ts` correctly:
- Refreshes the session via `supabase.auth.getUser()` on every request
- Redirects unauthenticated users to `/login` (line 40)
- Redirects authenticated users away from `/login` to `/dashboard` (lines 46–50)
- Matcher covers all routes except `/_next/**`, `/favicon.ico`, and static files (lines 56–59)
- `@supabase/ssr` cookie handling (`getAll`, `setAll`) is correctly wired (lines 18–28)

All `app/(app)/*/page.tsx` files also independently call `supabase.auth.getUser()` and redirect — good defence in depth at the page level.

### 1.5 ⚠️ MINOR — Login page has no page-level logged-in guard
`app/(auth)/login/page.tsx` does not redirect an already-authenticated user. The middleware handles this correctly (line 46–50 of middleware.ts), so there is **no actual vulnerability** — but defence in depth would add a server-side check at the page level too.

**Proposed fix (optional, low priority):**
```ts
// app/(auth)/login/page.tsx — add at top of LoginPage()
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (user) redirect("/dashboard");
```

---

## Section 2 — Row-Level Security (RLS)

> ❓ **Cannot verify from code alone.** No live Supabase CLI or MCP access is configured for this session.

**Manual checks required in the Supabase dashboard (SQL Editor or Table Editor → Policies):**

1. Run this query to confirm RLS is ON for all tables:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles','projects','project_assignments',
    'checklist_templates','checklist_responses',
    'time_logs','project_files'
  );
```
Every row should show `rowsecurity = true`.

2. Run this to list all active policies:
```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

3. **Critical flag:** If any table shows `rowsecurity = true` but has **zero rows** in `pg_policies`, ALL access (including admin) is blocked. If any table shows `rowsecurity = false`, the table is open to all authenticated users — relying on app-layer checks only.

**Expected policy model to verify:**
| Table | Admin | Staff (own assigned projects only) |
|-------|-------|-------------------------------------|
| profiles | Full CRUD | SELECT own row only |
| projects | Full CRUD | SELECT assigned projects only |
| project_assignments | Full CRUD | SELECT own assignments only |
| checklist_templates | Full CRUD | SELECT all (read-only) |
| checklist_responses | Full CRUD | INSERT/SELECT own stage only |
| time_logs | Full CRUD | INSERT/SELECT own stage only |
| project_files | Full CRUD | INSERT/SELECT own stage only |

---

## Section 3 — Storage Security

> ❓ **Bucket visibility and storage policies cannot be verified from code alone.**

**Manual check in Supabase dashboard → Storage → project-files bucket:**
- Confirm bucket is set to **Private** (not Public)
- Confirm storage policies restrict `SELECT` to files under `{projectId}/` paths matching the user's assigned projects

### 3.3 🔴 NEEDS FIX — Public file URLs instead of signed URLs

**File:** `lib/storage.ts:28`

```ts
// CURRENT — returns a permanent public URL
const { data } = supabase.storage.from("project-files").getPublicUrl(filePath);
return data.publicUrl;
```

If the bucket is private, `getPublicUrl` will return a URL that **doesn't work**. If the bucket is public, **any URL is permanently accessible without authentication** — a significant data exposure risk for sensitive bank valuation files.

**Proposed fix — use signed URLs (1-hour expiry):**
```ts
// lib/storage.ts — replace getPublicUrl with createSignedUrl
const { data, error } = await supabase.storage
  .from("project-files")
  .createSignedUrl(filePath, 3600); // 1 hour
if (error) throw error;
return data.signedUrl;
```

Note: signed URLs must be generated server-side (in a Server Action or Route Handler), not in client components. `lib/storage.ts` currently runs on the client — the file record logging and URL retrieval should be split so the signed URL is generated server-side.

---

## Section 4 — Role-Based Access (Application Layer)

### 4.1–4.2 PASS — Page-level role guards
All admin-only pages correctly check `profile.role !== "admin"` server-side and redirect to `/dashboard`:
- `admin/staff/page.tsx` ✅
- `admin/staff/new/page.tsx` ✅
- `admin/checklists/page.tsx` ✅
- `admin/assignments/page.tsx` ✅
- `hr/page.tsx` ✅
- `projects/new/page.tsx` ✅
- `projects/[id]/review/page.tsx` ✅

### 4.3 🔴 NEEDS FIX — Server Actions do NOT verify auth or role

**This is the most significant finding.** Every `actions.ts` file performs mutations **without first confirming the caller is authenticated and authorised**. The current security model relies entirely on:
1. Page-level role redirects (bypassable via direct POST to the action endpoint)
2. Supabase RLS policies (unverified — see §2)

**Affected files and functions:**

| File | Functions | Missing checks |
|------|-----------|----------------|
| `admin/staff/new/actions.ts` | `createStaffMember` | getUser, role=admin |
| `admin/staff/[id]/actions.ts` | `markAttendance`, `uploadStaffDocument` | getUser, role=admin |
| `admin/staff/[id]/edit/actions.ts` | `updateStaffMember` | getUser, role=admin |
| `admin/checklists/actions.ts` | `createTemplate` | getUser, role=admin |
| `admin/assignments/actions.ts` | `createAssignment`, `reviewTaskRequest` | getUser, role=admin |
| `projects/new/actions.ts` | `createProject` | getUser, role=admin |
| `projects/[id]/actions.ts` | `startSurvey`, `advanceProjectStage` | getUser, role=admin |
| `projects/[id]/survey/actions.ts` | `submitChecklist`, `advanceStage`, `logFileRecord` | getUser |
| `projects/[id]/drafting/actions.ts` | `logFileRecord`, `logTime`, `advanceStage` | getUser |
| `projects/[id]/report/actions.ts` | `logFileRecord`, `logTime`, `submitForReview` | getUser |
| `projects/[id]/review/actions.ts` | `markComplete` | getUser, role=admin |
| `hr/actions.ts` | `toggleActive` | getUser, role=admin |
| `my-tasks/actions.ts` | `submitTaskRequest` | getUser |

**Proposed fix — standard guard to add at the top of every action:**

For admin-only actions:
```ts
export async function someAdminAction(...) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };
  // ... rest of action
}
```

For staff actions (any authenticated user, but scoped to themselves):
```ts
export async function someStaffAction(...) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  // use user.id — do NOT accept userId from client input
  // ... rest of action
}
```

---

## Section 5 — Input Validation

### 5.1 🔴 NEEDS FIX — No server-side Zod validation in any Server Action

Zod schemas exist on the **client side** (in form components), which is correct for UX but **not a security control** — a malicious caller can POST directly to the Server Action endpoint with arbitrary data.

**None** of the `actions.ts` files validate their inputs with Zod.

**Proposed fix pattern** (example for `createProject`):
```ts
import { z } from "zod";

const CreateProjectSchema = z.object({
  bank_name: z.string().min(1).max(200),
  project_address: z.string().min(1).max(500),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function createProject(formData: FormData) {
  // ... auth check first ...
  const parsed = CreateProjectSchema.safeParse({
    bank_name: formData.get("bank_name"),
    project_address: formData.get("project_address"),
    // ...
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  // use parsed.data — never raw formData values
}
```

### 5.2 PASS — No raw SQL injection risk
All database operations use the Supabase JS client which parameterises all queries. No raw `.rpc()` calls with unescaped user input were found.

---

## Section 6 — Secrets & Environment

### 6.1–6.4 PASS
- `.gitignore` line 34 excludes `.env*` — `.env.local` will never be committed ✅
- `SUPABASE_SERVICE_ROLE_KEY` is only referenced in `lib/supabase/server.ts:39` inside `createAdminClient()`, which is only callable in Server Actions / Route Handlers ✅
- No hardcoded secrets found in any `.ts` / `.tsx` file ✅
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the browser — the anon key is safe **only because RLS is assumed to be enforced** (see §2) ✅

---

## Section 7 — Transport Security

### 7.1 PASS — HTTPS
Vercel enforces HTTPS on all deployments automatically. HTTP requests are permanently redirected to HTTPS. No configuration required.

---

## Prioritised Fix List

Before presenting to a client, address in this order:

### P1 — Critical (must fix before sign-off)
1. **Add auth + role checks to all Server Actions** (§4.3) — a motivated user can bypass all page-level guards by calling action endpoints directly
2. **Manually verify RLS is ON with correct policies** on all 7 tables in Supabase (§2) — the entire data isolation model depends on this
3. **Confirm project-files bucket is Private** in Supabase Storage (§3.1)

### P2 — High (fix before production with real client data)
4. **Switch file uploads to signed URLs** (§3.3) — permanent public URLs on sensitive bank valuation documents are inappropriate
5. **Add Zod validation to all Server Actions** (§5.1) — defence against direct API abuse

### P3 — Low / Optional
6. **Add page-level auth redirect to login page** (§1.5) — minor defence-in-depth improvement

---

*This audit covers the application code layer only. Items marked ❓ CANNOT VERIFY require manual inspection of the live Supabase project via the dashboard or Supabase CLI (`supabase db inspect`).*
