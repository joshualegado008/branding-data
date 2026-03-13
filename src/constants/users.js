// src/constants/users.js
// ─────────────────────────────────────────────
// All system users for SLU Branding Inventory
// In production, replace with real API auth
// ─────────────────────────────────────────────

export const USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'Administrator',
    name: 'Admin User',
  },
  {
    username: 'staff',
    password: 'staff123',
    role: 'Staff',
    name: 'Staff User',
  },
]

export const MAX_ATTEMPTS = 5
export const LOCKOUT_SECS = 30
export const SESSION_KEY = 'slu_session'
