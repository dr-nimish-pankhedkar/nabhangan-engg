/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Drop into any server-component page that shows project data.
 * Subscribes to Supabase Realtime for the given project and calls
 * router.refresh() (re-runs the server component fetch) on any change.
 *
 * Requires Realtime to be enabled in Supabase Dashboard → Database → Replication
 * for tables: projects, stage_submissions, time_logs, project_files, checklist_responses
 */
export default function RealtimeProjectRefresh({ projectId }: { projectId: string }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function scheduleRefresh() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => routerRef.current.refresh(), 800);
    }

    const channel = supabase
      .channel(`project-rt-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `id=eq.${projectId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "stage_submissions", filter: `project_id=eq.${projectId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "time_logs", filter: `project_id=eq.${projectId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_files", filter: `project_id=eq.${projectId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_responses", filter: `project_id=eq.${projectId}` }, scheduleRefresh)
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return null;
}
