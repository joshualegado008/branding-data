<template>
  <div class="log-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Activity Logs</div>
        <div class="page-sub">Complete audit trail of all system actions</div>
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
      <div class="sum-card" v-for="s in summaryCards" :key="s.label" :style="{ '--accent': s.color }">
        <div class="sum-icon" v-html="s.icon"></div>
        <div class="sum-body">
          <div class="sum-val">{{ s.value }}</div>
          <div class="sum-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="filters-bar">
      <!-- Search -->
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" v-model="search" placeholder="Search by user, action, or item…" />
        <button class="search-clear" v-if="search" @click="search = ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Entity type filter -->
      <div class="filter-pills">
        <button
          v-for="f in entityFilters" :key="f.key"
          class="pill" :class="{ active: entityFilter === f.key }"
          @click="entityFilter = f.key"
        >
          <span v-html="f.icon" class="pill-icon"></span>
          {{ f.label }}
        </button>
      </div>

      <!-- Date range -->
      <div class="date-filters">
        <button v-for="d in dateRanges" :key="d.key"
          class="pill" :class="{ active: dateRange === d.key }"
          @click="dateRange = d.key">{{ d.label }}</button>
      </div>
    </div>

    <!-- ── Log list ── -->
    <div class="log-card">

      <!-- Loading -->
      <div class="log-loading" v-if="loading">
        <div class="spinner-lg"></div>
        <span>Loading activity logs…</span>
      </div>

      <!-- Empty -->
      <div class="log-empty" v-else-if="filtered.length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="#DDD0D2" stroke-width="1.2" width="44" height="44"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span>No activity logs found</span>
      </div>

      <!-- Table -->
      <div class="log-table-wrap" v-else>
        <table class="log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Item</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginated" :key="log.id" class="log-row">

              <!-- Time -->
              <td class="td-time">
                <div class="time-main">{{ timeShort(log.created_at) }}</div>
                <div class="time-date">{{ datePart(log.created_at) }}</div>
              </td>

              <!-- User -->
              <td class="td-user">
                <div class="user-row">
                  <div class="user-avatar" :class="log.user_role === 'Administrator' ? 'av-admin' : 'av-staff'">
                    {{ initial(log.user_name) }}
                  </div>
                  <div>
                    <div class="user-name">{{ log.user_name || 'System' }}</div>
                    <span class="role-pill" :class="log.user_role === 'Administrator' ? 'pill-admin' : 'pill-staff'">
                      {{ log.user_role || 'Staff' }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Action -->
              <td class="td-action">
                <div class="action-badge" :class="'ac-' + actionColor(log.action)">
                  <span class="action-dot"></span>
                  {{ actionLabel(log.action) }}
                </div>
              </td>

              <!-- Item -->
              <td class="td-item">
                <div class="item-name" v-if="log.entity_name">{{ log.entity_name }}</div>
                <div class="item-id" v-if="log.entity_id">{{ log.entity_id }}</div>
                <span class="entity-tag" v-if="log.entity_type">{{ log.entity_type }}</span>
              </td>

              <!-- Details -->
              <td class="td-details">
                <button class="details-btn" v-if="hasDetails(log.details)"
                  @click="openDetails(log)">
                  View
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <span class="no-details" v-else>—</span>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="pg-btn" @click="page--" :disabled="page === 1">← Prev</button>
        <span class="pg-info">Page {{ page }} of {{ totalPages }} · {{ filtered.length }} total</span>
        <button class="pg-btn" @click="page++" :disabled="page === totalPages">Next →</button>
      </div>
      <div class="log-count" v-else-if="filtered.length > 0">
        {{ filtered.length }} log{{ filtered.length !== 1 ? 's' : '' }} found
      </div>
    </div>

    <!-- ── Details Modal ── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="modal-overlay" v-if="detailLog" @click.self="detailLog = null">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">Log Details</div>
              <button class="modal-close" @click="detailLog = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body" v-if="detailLog">
              <div class="detail-row">
                <span class="detail-key">Time</span>
                <span class="detail-val">{{ formatTime(detailLog.created_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">User</span>
                <span class="detail-val">{{ detailLog.user_name }} ({{ detailLog.user_role }})</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Action</span>
                <span class="detail-val">{{ actionLabel(detailLog.action) }} <code>{{ detailLog.action }}</code></span>
              </div>
              <div class="detail-row" v-if="detailLog.entity_name">
                <span class="detail-key">Item</span>
                <span class="detail-val">{{ detailLog.entity_name }}</span>
              </div>
              <div class="detail-row" v-if="detailLog.entity_id">
                <span class="detail-key">ID / SKU</span>
                <span class="detail-val"><code>{{ detailLog.entity_id }}</code></span>
              </div>
              <div class="detail-json" v-if="hasDetails(detailLog.details)">
                <div class="detail-key" style="margin-bottom:8px;">Change Details</div>
                <div class="json-entry" v-for="(val, key) in detailLog.details" :key="key">
                  <span class="json-key">{{ key }}</span>
                  <span class="json-val">{{ formatVal(val) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useActivityLog } from '@/composables/useActivityLog'

const { logs, loading, fetchLogs, actionLabel, actionColor, formatTime } = useActivityLog()

// ── Filters ───────────────────────────────────
const search       = ref('')
const entityFilter = ref('all')
const dateRange    = ref('all')
const page         = ref(1)
const perPage      = 25

const entityFilters = [
  { key: 'all',       label: 'All',       icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/></svg>` },
  { key: 'auth',      label: 'Logins',    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>` },
  { key: 'product',   label: 'Products',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>` },
  { key: 'stock',     label: 'Stock',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` },
  { key: 'equipment', label: 'Equipment', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>` },
  { key: 'user',      label: 'Users',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
]

const dateRanges = [
  { key: 'all',    label: 'All time' },
  { key: 'today',  label: 'Today' },
  { key: 'week',   label: 'This week' },
  { key: 'month',  label: 'This month' },
]

// ── Filtered logs ─────────────────────────────
const filtered = computed(() => {
  let list = logs.value

  // Entity type
  if (entityFilter.value !== 'all') {
    list = list.filter(l => l.entity_type === entityFilter.value)
  }

  // Date range
  const now  = new Date()
  if (dateRange.value === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    list = list.filter(l => new Date(l.created_at) >= start)
  } else if (dateRange.value === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7)
    list = list.filter(l => new Date(l.created_at) >= start)
  } else if (dateRange.value === 'month') {
    const start = new Date(now); start.setDate(now.getDate() - 30)
    list = list.filter(l => new Date(l.created_at) >= start)
  }

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l =>
      l.user_name?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.entity_name?.toLowerCase().includes(q) ||
      l.entity_id?.toLowerCase().includes(q) ||
      actionLabel(l.action).toLowerCase().includes(q)
    )
  }

  return list
})

// Reset page on filter change
watch([search, entityFilter, dateRange], () => { page.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

// ── Summary cards ─────────────────────────────
const summaryCards = computed(() => {
  const all     = logs.value
  const today   = new Date(); today.setHours(0,0,0,0)
  const todayLogs = all.filter(l => new Date(l.created_at) >= today)
  const deletions = all.filter(l => l.action.includes('delete'))
  const logins    = all.filter(l => l.action === 'auth.login')
  const uniqueUsers = new Set(all.map(l => l.user_id).filter(Boolean)).size

  return [
    {
      label: "Today's Actions", value: todayLogs.length, color: '#B01020',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
    },
    {
      label: 'Total Logins', value: logins.length, color: '#7C3AED',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
    },
    {
      label: 'Deletions', value: deletions.length, color: '#DC2626',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`
    },
    {
      label: 'Active Users', value: uniqueUsers, color: '#059669',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    },
  ]
})

// ── Details modal ─────────────────────────────
const detailLog = ref(null)
function openDetails(log) { detailLog.value = log }
function hasDetails(d) { return d && typeof d === 'object' && Object.keys(d).length > 0 }
function formatVal(v) { return typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—') }

// ── Helpers ───────────────────────────────────
function initial(name) { return (name || '?')[0].toUpperCase() }
function timeShort(ts) {
  return new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function datePart(ts) {
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function load() { await fetchLogs({ limit: 500 }) }
onMounted(load)
</script>

<style scoped>
.log-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }

.btn-refresh { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #6B5257; cursor: pointer; transition: all 0.2s; }
.btn-refresh:hover { border-color: #B01020; color: #B01020; }
.btn-refresh.spinning svg { animation: spin 0.8s linear infinite; }

/* Summary */
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.sum-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; }
.sum-icon { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 12%, white); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent); }
.sum-val   { font-size: 24px; font-weight: 700; color: #1A1016; font-family: 'Cormorant Garamond', serif; line-height: 1; }
.sum-label { font-size: 11px; color: #9A8589; margin-top: 3px; }

/* Filters */
.filters-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; padding: 8px 13px; flex: 0 0 280px; transition: all 0.2s; }
.search-wrap:focus-within { border-color: #B01020; box-shadow: 0 0 0 3px rgba(176,16,32,0.07); }
.search-wrap svg { color: #9A8589; flex-shrink: 0; }
.search-input { border: none; background: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; flex: 1; min-width: 0; }
.search-clear { background: none; border: none; cursor: pointer; color: #9A8589; display: flex; padding: 0; }
.search-clear:hover { color: #B01020; }
.filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: white; border: 1.5px solid #EDE3E5; border-radius: 20px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 500; color: #6B5257; cursor: pointer; transition: all 0.18s; }
.pill:hover { border-color: #B01020; color: #B01020; }
.pill.active { background: #B01020; border-color: #B01020; color: white; }
.pill-icon { display: flex; align-items: center; }
.date-filters { display: flex; gap: 6px; }

/* Log card */
.log-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; overflow: hidden; }
.log-loading, .log-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #9A8589; font-size: 13px; }
.spinner-lg { width: 28px; height: 28px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Table */
.log-table-wrap { overflow-x: auto; }
.log-table { width: 100%; border-collapse: collapse; min-width: 700px; }
.log-table thead th { padding: 11px 16px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; background: #FAFAFA; border-bottom: 1.5px solid #EDE3E5; white-space: nowrap; }
.log-row { border-bottom: 1px solid #F7F3F4; transition: background 0.12s; }
.log-row:last-child { border-bottom: none; }
.log-row:hover { background: #FFF5F6; }
.log-table td { padding: 11px 16px; vertical-align: middle; }

.td-time .time-main { font-size: 12px; font-weight: 600; color: #1A1016; white-space: nowrap; }
.td-time .time-date { font-size: 10px; color: #9A8589; margin-top: 1px; }

.td-user .user-row { display: flex; align-items: center; gap: 8px; }
.user-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.av-admin { background: #FEE2E2; color: #B01020; }
.av-staff { background: #DBEAFE; color: #2563EB; }
.user-name { font-size: 12px; font-weight: 600; color: #1A1016; white-space: nowrap; }
.role-pill { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 1px 7px; border-radius: 10px; margin-top: 2px; }
.pill-admin { background: #FEE2E2; color: #B01020; }
.pill-staff { background: #DBEAFE; color: #2563EB; }

/* Action badge */
.action-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.action-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.ac-red    { background: #FEE2E2; color: #B91C1C; }
.ac-green  { background: #D1FAE5; color: #065F46; }
.ac-blue   { background: #DBEAFE; color: #1D4ED8; }
.ac-purple { background: #EDE9FE; color: #5B21B6; }
.ac-amber  { background: #FEF3C7; color: #92400E; }
.ac-teal   { background: #CCFBF1; color: #0F766E; }
.ac-orange { background: #FFEDD5; color: #9A3412; }
.ac-gray   { background: #F3F4F6; color: #4B5563; }

/* Item */
.td-item .item-name { font-size: 12px; font-weight: 600; color: #1A1016; }
.td-item .item-id   { font-size: 10px; color: #B01020; font-family: monospace; }
.entity-tag { display: inline-block; font-size: 9px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #9A8589; background: #F7F3F4; padding: 1px 6px; border-radius: 4px; margin-top: 2px; }

.details-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #F7F3F4; border: 1.5px solid #EDE3E5; border-radius: 7px; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; color: #6B5257; cursor: pointer; transition: all 0.15s; }
.details-btn:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }
.no-details { font-size: 12px; color: #C4ADAF; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 14px; border-top: 1px solid #F0E5E7; }
.pg-btn { padding: 7px 16px; background: white; border: 1.5px solid #EDE3E5; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; color: #6B5257; cursor: pointer; transition: all 0.15s; }
.pg-btn:hover:not(:disabled) { border-color: #B01020; color: #B01020; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: #9A8589; }
.log-count { text-align: center; padding: 12px; font-size: 12px; color: #9A8589; border-top: 1px solid #F0E5E7; }

/* Details modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 0; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; }
.modal-close { background: #F7F3F4; border: none; border-radius: 8px; color: #9A8589; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: #FFF5F6; color: #B01020; }
.modal-body { padding: 16px 22px 22px; display: flex; flex-direction: column; gap: 10px; }
.detail-row { display: flex; gap: 12px; }
.detail-key { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #9A8589; flex-shrink: 0; width: 70px; padding-top: 1px; }
.detail-val { font-size: 13px; color: #1A1016; } 
.detail-val code { font-family: monospace; font-size: 11px; background: #F7F3F4; padding: 1px 6px; border-radius: 4px; color: #B01020; margin-left: 4px; }
.detail-json { background: #F7F3F4; border-radius: 10px; padding: 12px 14px; margin-top: 4px; }
.json-entry { display: flex; gap: 10px; padding: 4px 0; border-bottom: 1px solid #EDE3E5; }
.json-entry:last-child { border-bottom: none; }
.json-key { font-size: 11px; font-weight: 600; color: #6B5257; min-width: 100px; font-family: monospace; }
.json-val { font-size: 11px; color: #1A1016; font-family: monospace; word-break: break-all; }

.modal-fade-enter-active { transition: all 0.28s cubic-bezier(0.16,1,0.3,1); }
.modal-fade-leave-active { transition: all 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal { transform: scale(0.95) translateY(12px); }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }

@media (max-width: 900px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .summary-row { grid-template-columns: 1fr 1fr; } .search-wrap { flex: 1 1 100%; } }
</style>