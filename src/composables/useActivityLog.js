// src/composables/useActivityLog.js
// ─────────────────────────────────────────────
// Central activity logging — writes to Supabase activity_logs table
// Import logActivity() anywhere to record an action
// ─────────────────────────────────────────────

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

// Cached current user info to avoid repeated lookups
let _cachedUser = null

async function getCurrentUser() {
  if (_cachedUser) return _cachedUser
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()
  _cachedUser = {
    id:    user.id,
    email: user.email,
    name:  profile?.name || user.email,
    role:  profile?.role || 'Staff',
  }
  return _cachedUser
}

// Call this whenever auth state changes (login/logout)
export function clearUserCache() {
  _cachedUser = null
}

// ── Core log function ─────────────────────────
// action:      dot-notation string  e.g. 'product.add', 'auth.login', 'user.role_change'
// entityType:  'product' | 'category' | 'equipment' | 'auth' | 'user' | 'stock'
// entityId:    string id or SKU of the record
// entityName:  human-readable name
// details:     any extra JSON payload
export async function logActivity({
  action,
  entityType = null,
  entityId   = null,
  entityName = null,
  details    = {},
}) {
  try {
    const user = await getCurrentUser()
    await supabase.from('activity_logs').insert([{
      user_id:     user?.id    || null,
      user_name:   user?.name  || 'Unknown',
      user_role:   user?.role  || 'Staff',
      action,
      entity_type: entityType,
      entity_id:   entityId   ? String(entityId) : null,
      entity_name: entityName || null,
      details,
    }])
  } catch (err) {
    // Never crash the app over a log failure — just silently ignore
    console.warn('[ActivityLog] Failed to write log:', err?.message)
  }
}

// ── Fetch logs (for the UI) ───────────────────
const logs    = ref([])
const loading = ref(false)

export function useActivityLog() {
  async function fetchLogs({ limit = 200, userId = null, entityType = null, action = null } = {}) {
    loading.value = true
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId)     query = query.eq('user_id', userId)
    if (entityType) query = query.eq('entity_type', entityType)
    if (action)     query = query.ilike('action', `${action}%`)

    const { data, error } = await query
    if (!error) logs.value = data || []
    loading.value = false
  }

  // ── Action label map ──────────────────────────
  function actionLabel(action) {
    const map = {
      'auth.login':          'Logged in',
      'auth.logout':         'Logged out',
      'product.add':         'Added product',
      'product.edit':        'Edited product',
      'product.delete':      'Deleted product',
      'stock.add':           'Restocked item',
      'stock.deduct':        'Deducted stock',
      'category.add':        'Added category',
      'category.edit':       'Edited category',
      'category.delete':     'Deleted category',
      'equipment.borrow':    'Borrowed equipment',
      'equipment.return':    'Returned equipment',
      'equipment.add':       'Added equipment',
      'equipment.edit':      'Edited equipment',
      'equipment.delete':    'Deleted equipment',
      'user.role_change':    'Changed user role',
      'user.add':            'Added user',
    }
    return map[action] || action
  }

  // ── Action icon map ───────────────────────────
  function actionIcon(action) {
    if (action.startsWith('auth'))       return 'auth'
    if (action.startsWith('product'))    return 'product'
    if (action.startsWith('stock'))      return 'stock'
    if (action.startsWith('category'))   return 'category'
    if (action.startsWith('equipment'))  return 'equipment'
    if (action.startsWith('user'))       return 'user'
    return 'default'
  }

  // ── Action color ──────────────────────────────
  function actionColor(action) {
    if (action.includes('delete'))  return 'red'
    if (action.includes('add'))     return 'green'
    if (action.includes('edit'))    return 'blue'
    if (action.startsWith('auth'))  return 'purple'
    if (action.includes('borrow'))  return 'amber'
    if (action.includes('return'))  return 'teal'
    if (action.includes('role'))    return 'orange'
    return 'gray'
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  return {
    logs, loading,
    fetchLogs,
    actionLabel,
    actionIcon,
    actionColor,
    formatTime,
  }
}