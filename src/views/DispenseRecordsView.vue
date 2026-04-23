<template>
  <div class="dispense-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Dispense Records</div>
        <div class="page-sub">Track all released and dispensed inventory items</div>
      </div>
      <button class="btn-refresh" @click="load" :class="{ spinning: loading }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- ── Summary cards ── -->
    <div class="summary-row">
      <div class="sum-card">
        <div class="sum-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="9 11 12 14 22 4"/></svg>
        </div>
        <div class="sum-body">
          <div class="sum-val">{{ records.length }}</div>
          <div class="sum-label">Total Releases</div>
        </div>
      </div>
      <div class="sum-card sum-card-green">
        <div class="sum-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div class="sum-body">
          <div class="sum-val">{{ totalQty }}</div>
          <div class="sum-label">Total Items Released</div>
        </div>
      </div>
      <div class="sum-card sum-card-blue">
        <div class="sum-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="sum-body">
          <div class="sum-val">{{ uniqueRecipients }}</div>
          <div class="sum-label">Unique Recipients</div>
        </div>
      </div>
      <div class="sum-card sum-card-amber">
        <div class="sum-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="sum-body">
          <div class="sum-val">{{ thisMonthCount }}</div>
          <div class="sum-label">This Month</div>
        </div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="filters-bar">
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" v-model="search" placeholder="Search product, recipient, or purpose…" />
        <button class="search-clear" v-if="search" @click="search = ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="filter-pills">
        <button v-for="d in dateRanges" :key="d.key" class="pill" :class="{ active: dateRange === d.key }" @click="dateRange = d.key">
          {{ d.label }}
        </button>
      </div>

      <div class="filter-pills">
        <button class="pill" :class="{ active: locationFilter === 'all' }" @click="locationFilter = 'all'">All Locations</button>
        <button class="pill" :class="{ active: locationFilter === 'warehouse' }" @click="locationFilter = 'warehouse'">
          <i class="bi bi-building"></i> Warehouse
        </button>
        <button class="pill" :class="{ active: locationFilter === 'room1' }" @click="locationFilter = 'room1'">
          <i class="bi bi-door-open"></i> Room 1
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div class="loading-state" v-if="loading">
      <div class="spinner-lg"></div>
      <span>Loading dispense records…</span>
    </div>

    <!-- ── Empty ── -->
    <div class="empty-state" v-else-if="filtered.length === 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="#DDD0D2" stroke-width="1.2" width="48" height="48"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="9 11 12 14 22 4"/></svg>
      <div class="empty-title">No dispense records found</div>
      <div class="empty-sub">Records will appear here after releasing inventory items.</div>
    </div>

    <!-- ── Records table ── -->
    <div class="records-card" v-else>
      <div class="records-table-wrap">
        <table class="records-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Product</th>
              <th>Qty</th>
              <th>From</th>
              <th>Given To</th>
              <th>Purpose</th>
              <th>Released By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id" class="record-row" @click="viewRecord(r)">
              <td class="td-date">
                <div class="date-main">{{ formatDate(r.created_at) }}</div>
                <div class="date-time">{{ formatTime(r.created_at) }}</div>
              </td>
              <td class="td-product">
                <div class="product-name">{{ r.product_name }}</div>
              </td>
              <td class="td-qty">
                <span class="qty-badge">{{ r.quantity }}</span>
              </td>
              <td class="td-loc">
                <span class="loc-badge" :class="r.from_location === 'room1' ? 'loc-room1' : 'loc-warehouse'">
                  <i :class="r.from_location === 'room1' ? 'bi bi-door-open' : 'bi bi-building'"></i>
                  {{ r.from_location === 'room1' ? 'Room 1' : 'Warehouse' }}
                </span>
              </td>
              <td class="td-recipient">
                <div class="recipient-name">{{ parseRecipient(r.notes) }}</div>
              </td>
              <td class="td-purpose">
                <div class="purpose-text">{{ parsePurpose(r.notes) }}</div>
              </td>
              <td class="td-by">
                <div class="by-avatar">{{ (r.transferred_by_name || '?')[0].toUpperCase() }}</div>
                <span class="by-name">{{ r.transferred_by_name || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Detail Modal ── -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="viewTarget" @click.self="viewTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title">Release Details</div>
            <button class="modal-close" @click="viewTarget = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" v-if="viewTarget">
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Product</div>
                <div class="detail-value">{{ viewTarget.product_name }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Quantity Released</div>
                <div class="detail-value detail-qty">{{ viewTarget.quantity }} pcs</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Released From</div>
                <div class="detail-value">
                  <span class="loc-badge" :class="viewTarget.from_location === 'room1' ? 'loc-room1' : 'loc-warehouse'">
                    {{ viewTarget.from_location === 'room1' ? '🚪 Room 1' : '🏢 Warehouse' }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date & Time</div>
                <div class="detail-value">{{ formatDate(viewTarget.created_at) }} · {{ formatTime(viewTarget.created_at) }}</div>
              </div>
              <div class="detail-item detail-full">
                <div class="detail-label">Given To / Recipient</div>
                <div class="detail-value detail-highlight">{{ parseRecipient(viewTarget.notes) }}</div>
              </div>
              <div class="detail-item detail-full">
                <div class="detail-label">Purpose</div>
                <div class="detail-value">{{ parsePurpose(viewTarget.notes) }}</div>
              </div>
              <div class="detail-item detail-full">
                <div class="detail-label">Released By</div>
                <div class="detail-value">{{ viewTarget.transferred_by_name || '—' }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-save" @click="viewTarget = null">Close</button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const records  = ref([])
const loading  = ref(false)
const search   = ref('')
const dateRange     = ref('all')
const locationFilter = ref('all')
const viewTarget = ref(null)

const dateRanges = [
  { key: 'all',   label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('stock_transfers')
    .select('*')
    .eq('to_location', 'released')
    .order('created_at', { ascending: false })
  if (!error) records.value = data || []
  loading.value = false
}

onMounted(load)

// ── Parse notes field ─────────────────────────
function parseRecipient(notes) {
  if (!notes) return '—'
  const match = notes.match(/Recipient:\s*(.+?)\s*\|/)
  return match ? match[1] : notes
}
function parsePurpose(notes) {
  if (!notes) return '—'
  const match = notes.match(/Purpose:\s*(.+)$/)
  return match ? match[1] : '—'
}

// ── Computed stats ────────────────────────────
const totalQty = computed(() => records.value.reduce((s, r) => s + (r.quantity || 0), 0))
const uniqueRecipients = computed(() => {
  const set = new Set(records.value.map(r => parseRecipient(r.notes)).filter(v => v !== '—'))
  return set.size
})
const thisMonthCount = computed(() => {
  const now = new Date()
  return records.value.filter(r => {
    const d = new Date(r.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

// ── Filter ────────────────────────────────────
const filtered = computed(() => {
  let list = records.value

  // Date range
  if (dateRange.value !== 'all') {
    const now = new Date()
    list = list.filter(r => {
      const d = new Date(r.created_at)
      if (dateRange.value === 'today') {
        return d.toDateString() === now.toDateString()
      }
      if (dateRange.value === 'week') {
        const start = new Date(now); start.setDate(now.getDate() - 7)
        return d >= start
      }
      if (dateRange.value === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  // Location
  if (locationFilter.value !== 'all') {
    list = list.filter(r => r.from_location === locationFilter.value)
  }

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.product_name?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q) ||
      r.transferred_by_name?.toLowerCase().includes(q)
    )
  }

  return list
})

// ── Helpers ───────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function viewRecord(r) { viewTarget.value = r }
</script>

<style scoped>
.dispense-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 2px; }
.btn-refresh { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; transition: all 0.2s; }
.btn-refresh:hover { border-color: #B01020; color: #B01020; }
.btn-refresh.spinning svg { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Summary */
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.sum-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
.sum-card-green { border-color: #D1FAE5; }
.sum-card-blue  { border-color: #DBEAFE; }
.sum-card-amber { border-color: #FEF3C7; }
.sum-icon { width: 40px; height: 40px; border-radius: 10px; background: #FFF5F6; display: flex; align-items: center; justify-content: center; color: #B01020; flex-shrink: 0; }
.sum-card-green .sum-icon { background: #ECFDF5; color: #059669; }
.sum-card-blue  .sum-icon { background: #EFF6FF; color: #2563EB; }
.sum-card-amber .sum-icon { background: #FFFBEB; color: #D97706; }
.sum-val { font-size: 24px; font-weight: 800; color: #1A1016; line-height: 1; }
.sum-label { font-size: 11.5px; color: #9A8589; margin-top: 3px; }

/* Filters */
.filters-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #9A8589; pointer-events: none; }
.search-input { padding: 9px 34px 9px 34px; border: 1.5px solid #EDE3E5; border-radius: 10px; font-size: 13px; outline: none; width: 260px; transition: border 0.15s; }
.search-input:focus { border-color: #B01020; }
.search-clear { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #9A8589; display: flex; align-items: center; }
.filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { padding: 6px 14px; border-radius: 20px; border: 1.5px solid #EDE3E5; background: white; font-size: 12.5px; font-weight: 500; color: #6B5257; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
.pill.active { background: #B01020; border-color: #B01020; color: white; font-weight: 600; }
.pill:hover:not(.active) { border-color: #B01020; color: #B01020; }

/* Loading / Empty */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #9A8589; }
.spinner-lg { width: 32px; height: 32px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; text-align: center; }
.empty-title { font-size: 16px; font-weight: 600; color: #3D2830; }
.empty-sub { font-size: 13px; color: #9A8589; }

/* Records table */
.records-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; overflow: hidden; }
.records-table-wrap { overflow-x: auto; }
.records-table { width: 100%; border-collapse: collapse; }
.records-table thead tr { background: #FAF6F7; border-bottom: 1.5px solid #EDE3E5; }
.records-table th { padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9A8589; text-align: left; white-space: nowrap; }
.record-row { border-bottom: 1px solid #F5F0F1; cursor: pointer; transition: background 0.12s; }
.record-row:last-child { border-bottom: none; }
.record-row:hover { background: #FFF5F6; }
.records-table td { padding: 12px 14px; vertical-align: middle; }

.td-date { white-space: nowrap; }
.date-main { font-size: 13px; font-weight: 600; color: #1A1016; }
.date-time { font-size: 11px; color: #9A8589; margin-top: 2px; }

.td-product .product-name { font-size: 13.5px; font-weight: 600; color: #1A1016; }

.qty-badge { font-size: 13px; font-weight: 800; color: #B01020; background: #FFF5F6; padding: 3px 10px; border-radius: 20px; border: 1.5px solid #FECDD3; }

.loc-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.loc-warehouse { background: #F0F9FF; color: #0369A1; border: 1px solid #BAE6FD; }
.loc-room1 { background: #FFF7ED; color: #C2410C; border: 1px solid #FED7AA; }

.recipient-name { font-size: 13px; font-weight: 600; color: #1A1016; }

.purpose-text { font-size: 12.5px; color: #6B5257; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.td-by { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.by-avatar { width: 24px; height: 24px; background: #B01020; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.by-name { font-size: 12.5px; color: #555; }

/* Detail modal */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { background: #FAF6F7; border-radius: 10px; padding: 12px 14px; }
.detail-full { grid-column: 1 / -1; }
.detail-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9A8589; margin-bottom: 5px; }
.detail-value { font-size: 13.5px; font-weight: 600; color: #1A1016; line-height: 1.5; }
.detail-qty { font-size: 20px; color: #B01020; }
.detail-highlight { color: #B01020; }

/* Modal shared */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 500px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
.modal-sm { max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 0; position: sticky; top: 0; background: white; z-index: 1; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.modal-close { background: none; border: none; cursor: pointer; color: #888; padding: 4px; display: flex; align-items: center; }
.modal-body { padding: 18px 22px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 0 22px 20px; }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 9px 20px; background: #B01020; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #7A0A17; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .summary-row { grid-template-columns: 1fr 1fr; }
  .filters-bar { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .purpose-text { max-width: 120px; }
}
</style>