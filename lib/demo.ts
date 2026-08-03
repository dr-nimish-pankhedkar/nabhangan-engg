/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

export const DEMO_EXPIRY = new Date("2026-08-09T23:59:59+05:30");
export const DEMO_MAX_USERS = 4;

export function demoStatus(): { expired: boolean; daysLeft: number } {
  const now = new Date();
  const msLeft = DEMO_EXPIRY.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return { expired: msLeft <= 0, daysLeft: Math.max(daysLeft, 0) };
}
