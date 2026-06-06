/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

-- Add extended fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS doj DATE,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Staff documents
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL,
  file_path    TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on staff_documents" ON public.staff_documents;
CREATE POLICY "Admin full access on staff_documents" ON public.staff_documents
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Staff can view own documents" ON public.staff_documents;
CREATE POLICY "Staff can view own documents" ON public.staff_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  status    TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','half_day','leave')),
  notes     TEXT,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (user_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on attendance" ON public.attendance;
CREATE POLICY "Admin full access on attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Staff can view own attendance" ON public.attendance;
CREATE POLICY "Staff can view own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Task requests (staff can request to be assigned to a project/stage)
CREATE TABLE IF NOT EXISTS public.task_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stage       project_status,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on task_requests" ON public.task_requests;
CREATE POLICY "Admin full access on task_requests" ON public.task_requests
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Staff can manage own task requests" ON public.task_requests;
CREATE POLICY "Staff can manage own task requests" ON public.task_requests
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_task_requests_user ON public.task_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_docs_user ON public.staff_documents(user_id);
