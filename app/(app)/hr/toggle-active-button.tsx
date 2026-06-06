/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleActive } from "./actions";

export default function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleActive(userId, !active);
    setActive(!active);
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="text-xs"
    >
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
