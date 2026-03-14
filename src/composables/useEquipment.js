// src/composables/useEquipment.js
// ─────────────────────────────────────────────
// Equipment Borrowing System — Supabase backed
// Tracks: borrow requests, active use, returns
// ─────────────────────────────────────────────

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// ── Constants ─────────────────────────────────

export const BORROW_STATUSES = [
  { value: 'pending',   label: 'Pending',   cls: 'status-pending'  },
  { value: 'approved',  label: 'Approved',  cls: 'status-approved' },
  { value: 'borrowed',  label: 'Borrowed',  cls: 'status-borrowed' },
  { value: 'returned',  label: 'Returned',  cls: 'status-returned' },
  { value: 'overdue',   label: 'Overdue',   cls: 'status-overdue'  },
  { value: 'cancelled', label: 'Cancelled', cls: 'status-cancelled'},
]

export const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good',      label: 'Good'      },
  { value: 'fair',      label: 'Fair'      },
  { value: 'poor',      label: 'Poor'      },
]

export const EQUIPMENT_CATEGORIES = [
  'Camera & Photography',
  'Audio / Visual',
  'Printing Equipment',
  'Cutting & Fabrication',
  'Computers & Devices',
  'Event & Display',
  'Tools & Hardware',
  'Others',
]

// ── State ─────────────────────────────────────
const records  = ref([])   // all borrow records
const items    = ref([])   // equipment master list
const loading  = ref(false)
const error    = ref(null)

// ── Computed ──────────────────────────────────
const borrowedList  = computed(() => records.value.filter(r => r.status === 'borrowed' || r.status === 'approved'))
const returnedList  = computed(() => records.value.filter(r => r.status === 'returned'))
const pendingList   = computed(() => records.value.filter(r => r.status === 'pending'))
const overdueList   = computed(() => records.value.filter(r => {
  if (r.status !== 'borrowed') return false
  return new Date(r.expected_return) < new Date()
}))

const activeCount   = computed(() => borrowedList.value.length)
const returnedCount = computed(() => returnedList.value.length)
const overdueCount  = computed(() => overdueList.value.length)

// ── Helpers ───────────────────────────────────
function getStatus(value) {
  return BORROW_STATUSES.find(s => s.value === value) || BORROW_STATUSES[0]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function daysOverdue(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function isOverdue(record) {
  return record.status === 'borrowed' && new Date(record.expected_return) < new Date()
}

// ── Equipment Items CRUD ──────────────────────
async function fetchItems() {
  const { data, error: err } = await supabase
    .from('equipment_items')
    .select('*')
    .order('name')
  if (err) { error.value = err.message; return }
  items.value = data
}

async function addItem(payload) {
  const { data, error: err } = await supabase
    .from('equipment_items')
    .insert([payload])
    .select()
    .single()
  if (err) throw err
  items.value.push(data)
  return data
}

async function updateItem(id, payload) {
  const { data, error: err } = await supabase
    .from('equipment_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (err) throw err
  const i = items.value.findIndex(x => x.id === id)
  if (i !== -1) items.value[i] = data
  return data
}

async function deleteItem(id) {
  const { error: err } = await supabase
    .from('equipment_items')
    .delete()
    .eq('id', id)
  if (err) throw err
  items.value = items.value.filter(x => x.id !== id)
}

// ── Borrow Records CRUD ───────────────────────
async function fetchRecords() {
  loading.value = true
  error.value   = null
  const { data, error: err } = await supabase
    .from('equipment_borrows')
    .select('*, equipment_items(name, category, serial_no)')
    .order('created_at', { ascending: false })
  if (err) { error.value = err.message }
  else     { records.value = data }
  loading.value = false
}

async function createBorrow(payload) {
  const { data, error: err } = await supabase
    .from('equipment_borrows')
    .insert([payload])
    .select('*, equipment_items(name, category, serial_no)')
    .single()
  if (err) throw err
  records.value.unshift(data)
  return data
}

async function updateRecord(id, payload) {
  const { data, error: err } = await supabase
    .from('equipment_borrows')
    .update(payload)
    .eq('id', id)
    .select('*, equipment_items(name, category, serial_no)')
    .single()
  if (err) throw err
  const i = records.value.findIndex(r => r.id === id)
  if (i !== -1) records.value[i] = data
  return data
}

async function returnEquipment(id, payload) {
  // payload: { return_date, return_condition, return_notes }
  return updateRecord(id, {
    ...payload,
    status: 'returned',
    returned_at: new Date().toISOString(),
  })
}

async function approveRequest(id) {
  return updateRecord(id, { status: 'approved' })
}

async function markBorrowed(id) {
  return updateRecord(id, { status: 'borrowed', borrowed_at: new Date().toISOString() })
}

async function cancelRequest(id) {
  return updateRecord(id, { status: 'cancelled' })
}

async function deleteRecord(id) {
  const { error: err } = await supabase
    .from('equipment_borrows')
    .delete()
    .eq('id', id)
  if (err) throw err
  records.value = records.value.filter(r => r.id !== id)
}

// ── QR Scan: Lookup item by serial/qr_code ────
async function findItemByQR(code) {
  // Try qr_code field first, then serial_no
  let { data } = await supabase
    .from('equipment_items')
    .select('*')
    .eq('qr_code', code.trim())
    .maybeSingle()

  if (!data) {
    const res = await supabase
      .from('equipment_items')
      .select('*')
      .eq('serial_no', code.trim())
      .maybeSingle()
    data = res.data
  }
  return data || null
}

// ── QR Scan: Get active borrow for an item ────
async function getActiveBorrow(equipmentId) {
  const { data } = await supabase
    .from('equipment_borrows')
    .select('*')
    .eq('equipment_id', equipmentId)
    .in('status', ['borrowed', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

// ── QR Scan: Borrow via QR ────────────────────
async function borrowViaQR({ equipmentId, itemName, borrowerId, borrowerName,
  department, purpose, expectedReturn, quantity, conditionBefore }) {
  // Create borrow record
  const { data, error: err } = await supabase
    .from('equipment_borrows')
    .insert([{
      equipment_id:    equipmentId,
      item_name:       itemName,
      borrower_id:     borrowerId,
      borrower_name:   borrowerName,
      borrower_dept:   department || null,
      borrow_date:     new Date().toISOString().split('T')[0],
      expected_return: expectedReturn,
      reason:          purpose,
      quantity:        quantity || 1,
      status:          'borrowed',
      condition_before: conditionBefore || 'good',
      borrowed_at:     new Date().toISOString(),
    }])
    .select()
    .single()
  if (err) throw err

  // Mark item as unavailable
  await supabase
    .from('equipment_items')
    .update({ is_available: false })
    .eq('id', equipmentId)

  // Update local state
  const itemIdx = items.value.findIndex(x => x.id === equipmentId)
  if (itemIdx !== -1) items.value[itemIdx].is_available = false
  records.value.unshift(data)

  return data
}

// ── QR Scan: Return via QR ────────────────────
async function returnViaQR({ borrowId, equipmentId, conditionAfter, returnNotes }) {
  const { data, error: err } = await supabase
    .from('equipment_borrows')
    .update({
      status:          'returned',
      condition_after: conditionAfter || 'good',
      return_notes:    returnNotes || '',
      actual_return:   new Date().toISOString().split('T')[0],
      returned_at:     new Date().toISOString(),
    })
    .eq('id', borrowId)
    .select()
    .single()
  if (err) throw err

  // Mark item as available again
  await supabase
    .from('equipment_items')
    .update({ is_available: true })
    .eq('id', equipmentId)

  // Update local state
  const itemIdx = items.value.findIndex(x => x.id === equipmentId)
  if (itemIdx !== -1) items.value[itemIdx].is_available = true
  const recIdx = records.value.findIndex(r => r.id === borrowId)
  if (recIdx !== -1) records.value[recIdx] = data

  return data
}

// ── Real-time ─────────────────────────────────
let borrowSub = null
let itemSub   = null

function subscribeRealtime() {
  borrowSub = supabase
    .channel('borrow-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_borrows' }, async () => {
      await fetchRecords()
    })
    .subscribe()

  itemSub = supabase
    .channel('equipment-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_items' }, async () => {
      await fetchItems()
    })
    .subscribe()
}

function unsubscribeRealtime() {
  if (borrowSub) supabase.removeChannel(borrowSub)
  if (itemSub)   supabase.removeChannel(itemSub)
}

// ── Export ────────────────────────────────────
export function useEquipment() {
  return {
    records, items, loading, error,
    borrowedList, returnedList, pendingList, overdueList,
    activeCount, returnedCount, overdueCount,
    getStatus, formatDate, daysOverdue, isOverdue,
    fetchItems, addItem, updateItem, deleteItem,
    fetchRecords, createBorrow, updateRecord,
    returnEquipment, approveRequest, markBorrowed,
    cancelRequest, deleteRecord,
    subscribeRealtime, unsubscribeRealtime,
    findItemByQR, getActiveBorrow, borrowViaQR, returnViaQR,
  }
}