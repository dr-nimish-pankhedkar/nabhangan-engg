/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createAdminClient } from "@/lib/supabase/server";

interface CreateStaffInput {
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
}

export async function createStaffMember(input: CreateStaffInput): Promise<{ id?: string; error?: string }> {
  const adminSupabase = await createAdminClient();

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name, role: input.role },
  });

  if (authError) return { error: authError.message };

  const userId = authData.user.id;

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: input.full_name,
      role: input.role,
      designation: input.designation || null,
      employee_id: input.employee_id || null,
      phone: input.phone || null,
      salary: input.salary,
      dob: input.dob || null,
      doj: input.doj || null,
      address: input.address || null,
      emergency_contact: input.emergency_contact || null,
      is_active: true,
    });

  if (profileError) return { error: profileError.message };

  return { id: userId };
}
