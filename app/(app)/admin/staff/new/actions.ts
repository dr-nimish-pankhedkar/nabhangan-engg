/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DEMO_MAX_USERS } from "@/lib/demo";
import { z } from "zod";

const CreateStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1).max(200),
  role: z.enum(["admin", "staff", "third_party"]),
  designation: z.string().max(200).optional(),
  employee_id: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  salary: z.number().nonnegative().nullable(),
  dob: z.string().optional(),
  doj: z.string().optional(),
  address: z.string().max(500).optional(),
  emergency_contact: z.string().max(200).optional(),
});

export async function createStaffMember(input: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  designation?: string;
  employee_id?: string;
  phone?: string;
  salary: number | null;
  dob?: string;
  doj?: string;
  address?: string;
  emergency_contact?: string;
  adminId: string;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "admin") return { error: "Forbidden" };

  const parsed = CreateStaffSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid input";
    return { error: msg };
  }

  const adminSupabase = await createAdminClient();

  const { count } = await adminSupabase.from("profiles").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= DEMO_MAX_USERS) {
    return { error: `Demo version limit reached: only ${DEMO_MAX_USERS} users are allowed. Please contact Dr. Nimish Pankhedkar to upgrade to the full version.` };
  }

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, role: parsed.data.role },
  });
  if (authError) return { error: authError.message };

  const userId = authData.user.id;
  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: userId,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    designation: parsed.data.designation || null,
    employee_id: parsed.data.employee_id || null,
    phone: parsed.data.phone || null,
    salary: parsed.data.salary,
    dob: parsed.data.dob || null,
    doj: parsed.data.doj || null,
    address: parsed.data.address || null,
    emergency_contact: parsed.data.emergency_contact || null,
    is_active: true,
  });
  if (profileError) return { error: profileError.message };
  return { id: userId };
}
