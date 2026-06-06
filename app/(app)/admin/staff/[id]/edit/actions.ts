/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateStaffMember(
  userId: string,
  data: {
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
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      role: data.role,
      designation: data.designation || null,
      employee_id: data.employee_id || null,
      phone: data.phone || null,
      salary: data.salary,
      dob: data.dob || null,
      doj: data.doj || null,
      address: data.address || null,
      emergency_contact: data.emergency_contact || null,
    })
    .eq("id", userId);
  if (error) return { error: error.message };
  return {};
}
