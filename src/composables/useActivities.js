// src/composables/useActivities.js
// ─────────────────────────────────────────────
// Activities — all data from Supabase
// ─────────────────────────────────────────────

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// ── Mascot options ────────────────────────────
export const MASCOTS = [
  { id: 'megaphone', label: 'Megaphone', emoji: '📣' },
  { id: 'flag', label: 'Flag', emoji: '🚩' },
  { id: 'shirt', label: 'Shirt', emoji: '👕' },
  { id: 'star', label: 'Star Event', emoji: '⭐' },
  { id: 'trophy', label: 'Competition', emoji: '🏆' },
  { id: 'palette', label: 'Design', emoji: '🎨' },
  { id: 'camera', label: 'Photography', emoji: '📷' },
  { id: 'calendar', label: 'Meeting', emoji: '📅' },
  { id: 'box', label: 'Delivery', emoji: '📦' },
  { id: 'pin', label: 'On-site', emoji: '📍' },
]

export const STATUSES = [
  { value: 'upcoming', label: 'Upcoming', cls: 'status-upcoming' },
  { value: 'ongoing', label: 'Ongoing', cls: 'status-ongoing' },
  { value: 'done', label: 'Done', cls: 'status-done' },
]

// ── State ─────────────────────────────────────
const activities = ref([])
const loading = ref(false)
const error = ref(null)

// ── Computed ──────────────────────────────────
const upcomingCount = computed(() => activities.value.filter((a) => a.status === 'upcoming').length)
const ongoingCount = computed(() => activities.value.filter((a) => a.status === 'ongoing').length)
const doneCount = computed(() => activities.value.filter((a) => a.status === 'done').length)

const notifications = computed(() => {
  const now = new Date()
  return activities.value.filter((a) => {
    if (a.status === 'done') return false
    const eventDate = new Date(a.date)
    const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24))
    return diffDays <= a.notify_before + 1 && diffDays >= 0
  })
})

// ── Helpers ───────────────────────────────────
function getMascot(id) {
  return MASCOTS.find((m) => m.id === id) || MASCOTS[0]
}
function getStatus(value) {
  return STATUSES.find((s) => s.value === value) || STATUSES[0]
}
function formatDate(dateStr, timeStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T${timeStr || '00:00'}`)
  return (
    d.toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + (timeStr ? ` · ${formatTime(timeStr)}` : '')
  )
}
function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}
function daysUntil(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const event = new Date(dateStr)
  const diff = Math.ceil((event - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Past'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days`
}

// ── Supabase CRUD ─────────────────────────────

async function fetchActivities() {
  loading.value = true
  error.value = null
  const { data, error: err } = await supabase
    .from('activities')
    .select('*')
    .order('date', { ascending: true })
  if (err) {
    error.value = err.message
  } else {
    activities.value = data
  }
  loading.value = false
}

async function addActivity(payload) {
  // Map camelCase → snake_case for Supabase
  const row = {
    mascot: payload.mascot,
    title: payload.title,
    description: payload.description,
    date: payload.date,
    time: payload.time || null,
    assigned_to: payload.assignedTo,
    status: payload.status,
    notify_before: payload.notifyBefore,
    inventory_items: payload.inventoryItems,
    image_url: payload.imageUrl || null,
    link: payload.link || null,
  }
  const { data, error: err } = await supabase.from('activities').insert([row]).select().single()
  if (err) throw err
  activities.value.unshift(data)
  return data
}

async function updateActivity(id, payload) {
  const row = {
    mascot: payload.mascot,
    title: payload.title,
    description: payload.description,
    date: payload.date,
    time: payload.time || null,
    assigned_to: payload.assignedTo,
    status: payload.status,
    notify_before: payload.notifyBefore,
    inventory_items: payload.inventoryItems,
    image_url: payload.imageUrl || null,
    link: payload.link || null,
  }
  const { data, error: err } = await supabase
    .from('activities')
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (err) throw err
  const i = activities.value.findIndex((a) => a.id === id)
  if (i !== -1) activities.value[i] = data
  return data
}

async function deleteActivity(id) {
  const { error: err } = await supabase.from('activities').delete().eq('id', id)
  if (err) throw err
  activities.value = activities.value.filter((a) => a.id !== id)
}

async function updateStatus(id, status) {
  const { data, error: err } = await supabase
    .from('activities')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (err) throw err
  const i = activities.value.findIndex((a) => a.id === id)
  if (i !== -1) activities.value[i] = data
}

// ── Real-time ─────────────────────────────────
let activitiesSub = null

function subscribeRealtime() {
  activitiesSub = supabase
    .channel('activities-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        activities.value.unshift(payload.new)
      } else if (payload.eventType === 'UPDATE') {
        const i = activities.value.findIndex((a) => a.id === payload.new.id)
        if (i !== -1) activities.value[i] = payload.new
      } else if (payload.eventType === 'DELETE') {
        activities.value = activities.value.filter((a) => a.id !== payload.old.id)
      }
    })
    .subscribe()
}

function unsubscribeRealtime() {
  if (activitiesSub) supabase.removeChannel(activitiesSub)
}

// ── Export ────────────────────────────────────
export function useActivities() {
  return {
    activities,
    loading,
    error,
    upcomingCount,
    ongoingCount,
    doneCount,
    notifications,
    getMascot,
    getStatus,
    formatDate,
    formatTime,
    daysUntil,
    fetchActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    updateStatus,
    subscribeRealtime,
    unsubscribeRealtime,
  }
}