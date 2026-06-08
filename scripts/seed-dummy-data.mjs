/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

// One-off helper to seed dummy staff + projects for demo/testing purposes.
//
// Usage:
//   node scripts/seed-dummy-data.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
// (or the environment). Requires at least one existing admin profile — that
// admin becomes the `created_by` for the seeded projects.
//
// Creates:
//   - 3 staff logins: Staff B (surveyor), Staff C (draughtsman), Staff D (report staff)
//     password: Password123
//   - 5 dummy bank projects spread across lead/survey/drafting stages, with
//     staff assigned so the dashboard's stage distribution and staff occupancy
//     panels have something interesting to show.

import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url).pathname;
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || url.includes("your_supabase")) {
  console.error(
    "Missing or placeholder NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Set the real values in .env.local (the same ones used by the deployed app) before running this."
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function ensureStaff(email, full_name, role, designation) {
  const { data: existing } = await supabase.from("profiles").select("id").eq("full_name", full_name).maybeSingle();
  if (existing) {
    console.log(`Staff "${full_name}" already exists (${existing.id}) — skipping creation.`);
    return existing.id;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: "Password123",
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (authError) throw new Error(`Create user "${full_name}": ${authError.message}`);

  const id = authData.user.id;
  const { error: profileError } = await supabase.from("profiles").upsert({
    id,
    full_name,
    role,
    designation,
    is_active: true,
  });
  if (profileError) throw new Error(`Upsert profile "${full_name}": ${profileError.message}`);

  console.log(`Created staff "${full_name}" <${email}> (${id})`);
  return id;
}

async function createProject(bank_name, project_address, status, created_by) {
  const { data, error } = await supabase
    .from("projects")
    .insert({ bank_name, project_address, status, created_by, bank_metadata: {} })
    .select("id")
    .single();
  if (error) throw new Error(`Create project "${bank_name}": ${error.message}`);

  console.log(`Created project "${bank_name}" (${data.id}) — status: ${status}`);
  return data.id;
}

async function assign(project_id, user_id, stage) {
  const { error } = await supabase.from("project_assignments").insert({ project_id, user_id, stage });
  if (error) throw new Error(`Assign "${stage}" on project ${project_id}: ${error.message}`);
}

async function main() {
  const { data: admin } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).maybeSingle();
  if (!admin) throw new Error("No admin profile found — create an admin account first.");

  const staffB = await ensureStaff("staffb@nabhangan.test", "Staff B", "surveyor", "Surveyor");
  const staffC = await ensureStaff("staffc@nabhangan.test", "Staff C", "draughtsman", "Draughtsman");
  const staffD = await ensureStaff("staffd@nabhangan.test", "Staff D", "report_staff", "Report Staff");

  // Project 1 — fresh lead, no assignments yet.
  await createProject("Konkan Cooperative Bank", "MG Road, Ratnagiri", "lead", admin.id);

  // Projects 2-4 — currently in survey, all worked by Staff B (gives B a "Heavy" load).
  const p2 = await createProject("Sahyadri Urban Bank", "FC Road, Pune", "survey", admin.id);
  await assign(p2, staffB, "survey");

  const p3 = await createProject("Vidarbha Gramin Bank", "Civil Lines, Nagpur", "survey", admin.id);
  await assign(p3, staffB, "survey");

  const p4 = await createProject("Deccan Mercantile Bank", "Shivaji Nagar, Pune", "survey", admin.id);
  await assign(p4, staffB, "survey");

  // Project 5 — further along (drafting), with a fuller staff trail: B's survey
  // work is done (historical), C is actively drafting, D is lined up for report.
  const p5 = await createProject("Konkan Heritage Bank", "Station Road, Kolhapur", "drafting", admin.id);
  await assign(p5, staffB, "survey");
  await assign(p5, staffC, "drafting");
  await assign(p5, staffD, "report");

  console.log("\nDone. Log in as Staff B / Staff C / Staff D using:");
  console.log("  staffb@nabhangan.test / staffc@nabhangan.test / staffd@nabhangan.test");
  console.log("  password: Password123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
