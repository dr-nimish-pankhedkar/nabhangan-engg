/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

export type UserRole = "admin" | "staff" | "third_party";
export type ProjectStatus = "lead" | "survey" | "rate_verification" | "drafting" | "checking" | "print" | "scan" | "dispatch" | "fees_received";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  salary: number | null;
  is_active: boolean;
  created_at: string;
  dob?: string | null;
  doj?: string | null;
  designation?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  employee_id?: string | null;
}

export interface Project {
  id: string;
  bank_name: string;
  project_address: string;
  latitude: number | null;
  longitude: number | null;
  bank_metadata: Record<string, unknown>;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  documents_pending: boolean;
  requires_review: boolean;
  profiles?: Profile;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  stage: ProjectStatus;
  assigned_at: string;
  profiles?: Profile;
  projects?: Project;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  stage: ProjectStatus;
  fields: ChecklistField[];
  created_by: string;
  created_at: string;
}

export interface ChecklistField {
  label: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[];
}

export interface ChecklistResponse {
  id: string;
  project_id: string;
  template_id: string;
  user_id: string;
  stage: ProjectStatus;
  responses: Record<string, unknown>;
  remarks: string | null;
  submitted_at: string;
  profiles?: Profile;
  checklist_templates?: ChecklistTemplate;
}

export interface TimeLog {
  id: string;
  project_id: string;
  user_id: string;
  stage: ProjectStatus;
  hours_spent: number;
  logged_at: string;
  notes: string | null;
  profiles?: Profile;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  stage: ProjectStatus;
  file_path: string;
  file_name: string;
  file_type: string | null;
  uploaded_at: string;
  remarks: string | null;
  profiles?: Profile;
}

export const PROJECT_STAGES: { value: ProjectStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "survey", label: "Survey" },
  { value: "rate_verification", label: "Rate Verification" },
  { value: "drafting", label: "Drafting Report" },
  { value: "checking", label: "Checking" },
  { value: "print", label: "Print" },
  { value: "scan", label: "Scan" },
  { value: "dispatch", label: "Dispatch" },
  { value: "fees_received", label: "Fees Received" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  third_party: "Third Party",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  lead: "bg-slate-100 text-slate-700",
  survey: "bg-blue-100 text-blue-700",
  rate_verification: "bg-orange-100 text-orange-700",
  drafting: "bg-amber-100 text-amber-700",
  checking: "bg-cyan-100 text-cyan-700",
  print: "bg-indigo-100 text-indigo-700",
  scan: "bg-violet-100 text-violet-700",
  dispatch: "bg-green-100 text-green-700",
  fees_received: "bg-teal-100 text-teal-700",
};

export interface StaffDocument {
  id: string;
  user_id: string;
  doc_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: "present" | "absent" | "half_day" | "leave";
  notes: string | null;
  marked_by: string | null;
}

export interface TaskRequest {
  id: string;
  user_id: string;
  project_id: string | null;
  stage: ProjectStatus | null;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles?: Profile;
  projects?: Project;
}

export interface SiteVisitReport {
  id: string;
  project_id: string;
  user_id: string;
  data: Record<string, string>;
  submitted_at: string;
  updated_at: string;
}

export const PROPERTY_TYPES = [
  "Flat", "Bungalow", "Row House", "Shop", "Industrial",
  "SSR", "Vacant Plot", "NPA Case", "Project", "Estimate Vetting",
] as const;

export const FACING_OPTIONS = ["East", "West", "North", "South", "Northeast", "Northwest", "Southeast", "Southwest"] as const;
export const RCC_OPTIONS = ["RCC", "Load Bearing", "Ac Sheet Roof"] as const;
export const VALUATION_METHODS = ["Composite Method", "Land + Building Method"] as const;

export const DOC_TYPES = [
  { value: "id_proof", label: "ID Proof (Aadhar/PAN)" },
  { value: "address_proof", label: "Address Proof" },
  { value: "qualification", label: "Qualification Certificate" },
  { value: "experience", label: "Experience Letter" },
  { value: "photo", label: "Photograph" },
  { value: "other", label: "Other" },
];

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  half_day: "bg-amber-100 text-amber-700",
  leave: "bg-blue-100 text-blue-700",
};
