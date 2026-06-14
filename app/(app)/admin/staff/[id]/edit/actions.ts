/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateStaffSchema = z.object({
  full_name: z.string().min(1).max(200),
  role: z.enum(["admin", "surveyor", "draughtsman", "report_staff"]),
  designation: z.string().max(200).optional(),
  employee_id: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  salary: z.number().nonnegative().nullable(),
  dob: z.string().optional(),
  doj: z.string().optional(),
  address: z.string().max(500).optional(),
  emergency_contact: z.string().max(200).optional(),
});

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  if (!z.string().uuid().safeParse(userId).success) return { error: "Invalid user ID" };

  const parsed = UpdateStaffSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  const { error } = await supabase
    .from("profiles")
    .update({
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
    })
    .eq("id", userId);
  if (error) return { error: error.message };
  return {};
}
