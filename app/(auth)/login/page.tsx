/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Nabhangan Engineers</h1>
          <p className="text-slate-500 text-sm mt-1">Project & Workflow Tracker</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
}
