/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

export type UserRole = "admin" | "surveyor" | "draughtsman" | "report_staff";
export type ProjectStatus = "lead" | "survey" | "drafting" | "report" | "review";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  salary: number | null;
  is_active: boolean;
  created_at: string;
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
  { value: "drafting", label: "Drafting" },
  { value: "report", label: "Report" },
  { value: "review", label: "Review" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  surveyor: "Surveyor",
  draughtsman: "Draughtsman",
  report_staff: "Report Staff",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  lead: "bg-slate-100 text-slate-700",
  survey: "bg-blue-100 text-blue-700",
  drafting: "bg-amber-100 text-amber-700",
  report: "bg-purple-100 text-purple-700",
  review: "bg-green-100 text-green-700",
};
