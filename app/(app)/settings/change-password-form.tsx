/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, Eye, EyeOff } from "lucide-react";

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPw.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPw !== confirm) { setError("New passwords do not match."); return; }
    if (current === newPw) { setError("New password must be different from your current password."); return; }

    setLoading(true);
    const supabase = createClient();

    // Get session email to verify old password
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Could not retrieve account details."); setLoading(false); return; }

    // Verify current password before updating
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInErr) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }

    // Current password verified — update to new password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setSuccess(true);
      setCurrent("");
      setNewPw("");
      setConfirm("");
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-slate-700">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex items-center gap-2 text-green-600 py-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Password updated successfully.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Current Password</label>
              <PasswordInput value={current} onChange={setCurrent} placeholder="Enter your current password" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">New Password</label>
              <PasswordInput value={newPw} onChange={setNewPw} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Confirm New Password</label>
              <PasswordInput value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white">
              {loading ? "Verifying…" : "Update Password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
