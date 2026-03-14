<template>
  <div class="reports-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Reports</div>
        <div class="page-sub">Inventory insights and performance summary</div>
      </div>
      <button class="btn-pdf" @click="exportPDF" :disabled="exporting">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        {{ exporting ? 'Generating PDF…' : 'Export PDF' }}
      </button>
    </div>

    <!-- ── Report date ── -->
    <div class="report-meta">
      <span>Generated: {{ now }}</span>
      <span class="sep">·</span>
      <span>SLU Branding Inventory System</span>
    </div>

    <!-- ── Loading ── -->
    <div class="loading-state" v-if="loading">
      <div class="spinner-lg"></div>
      <span>Loading report data…</span>
    </div>

    <template v-else>

      <!-- ══ SECTION 1: Inventory Value per Category ══ -->
      <div class="report-section" id="sec-value">
        <div class="section-header">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="16" height="16"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Inventory Value per Category
          </div>
        </div>
        <div class="report-card">
          <table class="report-table">
            <thead><tr><th>Category</th><th>Products</th><th>Total Stock</th><th>Unit Value</th><th>Total Value</th><th>% of Total</th></tr></thead>
            <tbody>
              <tr v-for="row in valueReport" :key="row.name">
                <td><div class="cat-label"><div class="cat-dot" :style="{ background: row.color }"></div>{{ row.name }}</div></td>
                <td>{{ row.productCount }}</td>
                <td>{{ row.totalStock.toLocaleString() }}</td>
                <td class="td-money">₱{{ row.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                <td class="td-money td-bold">₱{{ row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                <td>
                  <div class="pct-bar-row">
                    <div class="pct-bar"><div class="pct-fill" :style="{ width: row.pct + '%', background: row.color }"></div></div>
                    <span class="pct-label">{{ row.pct }}%</span>
                  </div>
                </td>
              </tr>
              <tr class="total-row">
                <td><strong>TOTAL</strong></td>
                <td><strong>{{ totalProducts }}</strong></td>
                <td><strong>{{ totalStock.toLocaleString() }}</strong></td>
                <td>—</td>
                <td class="td-money td-bold"><strong>₱{{ totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</strong></td>
                <td><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ SECTION 2: Low Stock & Out of Stock ══ -->
      <div class="report-section" id="sec-stock">
        <div class="section-header">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Low Stock & Out of Stock
          </div>
          <div class="section-badges">
            <span class="badge badge-out">{{ outOfStock.length }} Out of Stock</span>
            <span class="badge badge-low">{{ lowStockItems.length }} Low Stock</span>
          </div>
        </div>
        <div class="report-card" v-if="alertProducts.length">
          <table class="report-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Current Stock</th><th>Reorder At</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="p in alertProducts" :key="p.id" :class="p.stock === 0 ? 'row-out' : 'row-low'">
                <td class="td-name">{{ p.name }}</td>
                <td><span class="sku-badge">{{ p.sku }}</span></td>
                <td>{{ p.category }}</td>
                <td class="td-bold" :class="p.stock === 0 ? 'text-red' : 'text-amber'">{{ p.stock }} {{ p.unit }}</td>
                <td>{{ p.reorder_at }}</td>
                <td><span class="status-pill" :class="p.stock === 0 ? 'pill-out' : 'pill-low'">{{ p.stock === 0 ? 'Out of Stock' : 'Low Stock' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="report-card empty-card" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" width="32" height="32"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>All products are well stocked!</span>
        </div>
      </div>

      <!-- ══ SECTION 3: Stock Movement ══ -->
      <div class="report-section" id="sec-movement">
        <div class="section-header">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="16" height="16"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Stock Movement History
          </div>
          <div class="date-filter">
            <button v-for="d in dateRanges" :key="d.key" class="df-btn" :class="{ active: dateFilter === d.key }" @click="dateFilter = d.key">{{ d.label }}</button>
          </div>
        </div>
        <div class="report-card" v-if="movementLogs.length">
          <table class="report-table">
            <thead><tr><th>Date & Time</th><th>User</th><th>Action</th><th>Product</th><th>Details</th></tr></thead>
            <tbody>
              <tr v-for="log in movementLogs" :key="log.id">
                <td class="td-time">
                  <div>{{ timeShort(log.created_at) }}</div>
                  <div class="td-date">{{ datePart(log.created_at) }}</div>
                </td>
                <td>
                  <div class="user-cell">
                    <div class="u-av" :class="log.user_role === 'Administrator' ? 'av-admin' : 'av-staff'">{{ initial(log.user_name) }}</div>
                    {{ log.user_name }}
                  </div>
                </td>
                <td><span class="action-pill" :class="actionClass(log.action)">{{ actionLabel(log.action) }}</span></td>
                <td class="td-name">{{ log.entity_name || '—' }}</td>
                <td class="td-details">{{ formatDetails(log.details) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="report-card empty-card" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C4ADAF" stroke-width="1.5" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span>No stock movement in this period</span>
        </div>
      </div>

      <!-- ══ SECTION 4: Equipment Borrow History ══ -->
      <div class="report-section" id="sec-equipment">
        <div class="section-header">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Equipment Borrow History
          </div>
          <div class="section-badges">
            <span class="badge badge-blue">{{ activeBorrows }} Currently Borrowed</span>
          </div>
        </div>
        <div class="report-card" v-if="borrowLogs.length">
          <table class="report-table">
            <thead><tr><th>Date</th><th>Borrower</th><th>Equipment</th><th>Quantity</th><th>Status</th><th>Returned</th></tr></thead>
            <tbody>
              <tr v-for="log in borrowLogs" :key="log.id">
                <td class="td-time">
                  <div>{{ timeShort(log.created_at) }}</div>
                  <div class="td-date">{{ datePart(log.created_at) }}</div>
                </td>
                <td>
                  <div class="user-cell">
                    <div class="u-av av-staff">{{ initial(log.user_name) }}</div>
                    {{ log.user_name }}
                  </div>
                </td>
                <td class="td-name">{{ log.entity_name || '—' }}</td>
                <td>{{ log.details?.quantity || 1 }}</td>
                <td>
                  <span class="status-pill" :class="log.action === 'equipment.return' ? 'pill-ok' : 'pill-blue'">
                    {{ log.action === 'equipment.return' ? 'Returned' : 'Borrowed' }}
                  </span>
                </td>
                <td>{{ log.details?.returned_at ? datePart(log.details.returned_at) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="report-card empty-card" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C4ADAF" stroke-width="1.5" width="32" height="32"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
          <span>No equipment borrow records yet</span>
        </div>
      </div>

    </template>

    <!-- Hidden print iframe -->
    <iframe ref="printFrame" style="position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;"></iframe>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useInventory }    from '@/composables/useInventory'
import { useActivityLog }  from '@/composables/useActivityLog'

const { products, categories, loading: invLoading, totalProducts, totalStock, totalValue, lowStockItems, outOfStock, fetchProducts, fetchCategories } = useInventory()
const { logs, loading: logLoading, fetchLogs, actionLabel } = useActivityLog()

const loading  = computed(() => invLoading.value || logLoading.value)
const exporting = ref(false)
const dateFilter = ref('month')
const printFrame = ref(null)
const now = new Date().toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

const dateRanges = [
  { key: 'week',  label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all',   label: 'All time' },
]

onMounted(async () => {
  await Promise.all([fetchProducts(), fetchCategories(), fetchLogs({ limit: 500 })])
})

watch(dateFilter, () => fetchLogs({ limit: 500 }))

// ── Section 1: Value per category ────────────
const catColors = ['#B01020','#2563EB','#059669','#D97706','#7C3AED','#DB2777','#0891B2','#65A30D','#EA580C','#6B7280']

const valueReport = computed(() => {
  const tv = totalValue.value || 1
  return categories.value.map((cat, i) => {
    const catProds = products.value.filter(p => p.category === cat.name)
    const val = catProds.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0)
    const stock = catProds.reduce((s, p) => s + (p.stock || 0), 0)
    const avgPrice = catProds.length ? catProds.reduce((s, p) => s + (p.price || 0), 0) / catProds.length : 0
    return {
      name: cat.name,
      color: cat.color || catColors[i % catColors.length],
      productCount: catProds.length,
      totalStock: stock,
      totalValue: val,
      avgPrice,
      pct: Math.round(val / tv * 100),
    }
  }).sort((a, b) => b.totalValue - a.totalValue)
})

// ── Section 2: Alert products ─────────────────
const alertProducts = computed(() => {
  const out = outOfStock.value.map(p => ({ ...p, _priority: 0 }))
  const low = lowStockItems.value.filter(p => p.stock > 0).map(p => ({ ...p, _priority: 1 }))
  return [...out, ...low]
})

// ── Section 3: Stock movement ─────────────────
const movementLogs = computed(() => {
  const actions = ['product.add', 'product.edit', 'product.delete', 'stock.add', 'stock.deduct']
  let list = logs.value.filter(l => actions.includes(l.action))
  const now = new Date()
  if (dateFilter.value === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7)
    list = list.filter(l => new Date(l.created_at) >= start)
  } else if (dateFilter.value === 'month') {
    const start = new Date(now); start.setDate(now.getDate() - 30)
    list = list.filter(l => new Date(l.created_at) >= start)
  }
  return list
})

// ── Section 4: Equipment borrows ──────────────
const borrowLogs = computed(() =>
  logs.value.filter(l => l.action === 'equipment.borrow' || l.action === 'equipment.return')
)
const activeBorrows = computed(() =>
  logs.value.filter(l => l.action === 'equipment.borrow').length -
  logs.value.filter(l => l.action === 'equipment.return').length
)

// ── Helpers ───────────────────────────────────
function initial(name) { return (name || '?')[0].toUpperCase() }
function timeShort(ts) { return new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }) }
function datePart(ts)  { return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }

function actionClass(action) {
  if (action.includes('delete')) return 'ap-red'
  if (action.includes('add'))    return 'ap-green'
  if (action.includes('edit'))   return 'ap-blue'
  return 'ap-gray'
}

function formatDetails(details) {
  if (!details || !Object.keys(details).length) return '—'
  if (details.stock !== undefined) return `Stock: ${details.stock}`
  if (details.sku)                 return `SKU: ${details.sku}`
  return Object.entries(details).slice(0,2).map(([k,v]) => `${k}: ${v}`).join(', ')
}

// ── PDF Export ────────────────────────────────
async function exportPDF() {
  exporting.value = true
  try {
    const html = buildPDFHtml()
    const iframe = printFrame.value
    iframe.contentDocument.open()
    iframe.contentDocument.write(html)
    iframe.contentDocument.close()
    await new Promise(r => setTimeout(r, 1200))
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  } finally {
    exporting.value = false
  }
}

function buildPDFHtml() {
  const valueRows = valueReport.value.map(r => `
    <tr>
      <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.color};margin-right:6px;"></span>${r.name}</td>
      <td>${r.productCount}</td>
      <td>${r.totalStock.toLocaleString()}</td>
      <td>₱${r.avgPrice.toFixed(2)}</td>
      <td><strong>₱${r.totalValue.toLocaleString(undefined,{minimumFractionDigits:2})}</strong></td>
      <td>${r.pct}%</td>
    </tr>`).join('')

  const alertRows = alertProducts.value.map(p => `
    <tr>
      <td>${p.name}</td><td>${p.sku}</td><td>${p.category||'—'}</td>
      <td style="color:${p.stock===0?'#DC2626':'#D97706'};font-weight:700;">${p.stock} ${p.unit||'pcs'}</td>
      <td>${p.reorder_at}</td>
      <td><span style="padding:2px 8px;border-radius:12px;font-size:10pt;background:${p.stock===0?'#FEE2E2':'#FEF3C7'};color:${p.stock===0?'#B91C1C':'#92400E'};">${p.stock===0?'Out of Stock':'Low Stock'}</span></td>
    </tr>`).join('')

  const movRows = movementLogs.value.slice(0, 50).map(l => `
    <tr>
      <td>${datePart(l.created_at)} ${timeShort(l.created_at)}</td>
      <td>${l.user_name||'—'}</td>
      <td>${actionLabel(l.action)}</td>
      <td>${l.entity_name||'—'}</td>
      <td>${formatDetails(l.details)}</td>
    </tr>`).join('')

  const borRows = borrowLogs.value.slice(0, 50).map(l => `
    <tr>
      <td>${datePart(l.created_at)}</td>
      <td>${l.user_name||'—'}</td>
      <td>${l.entity_name||'—'}</td>
      <td>${l.details?.quantity||1}</td>
      <td>${l.action==='equipment.return'?'Returned':'Borrowed'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>SLU Branding — Inventory Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; font-size: 10pt; color: #1A1016; padding: 15mm; }
    .report-title { font-size: 22pt; font-weight: 700; color: #B01020; margin-bottom: 4px; }
    .report-meta  { font-size: 9pt; color: #9A8589; margin-bottom: 20px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-title { font-size: 13pt; font-weight: 700; color: #B01020; border-bottom: 2px solid #B01020; padding-bottom: 5px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { background: #F7F3F4; padding: 7px 10px; text-align: left; font-size: 8pt; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #6B5257; border-bottom: 1.5px solid #EDE3E5; }
    td { padding: 7px 10px; border-bottom: 1px solid #F0E5E7; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .total-row td { background: #F7F3F4; font-weight: 700; border-top: 2px solid #EDE3E5; }
    .empty { text-align: center; padding: 20px; color: #9A8589; font-style: italic; }
    @media print { @page { margin: 10mm; size: A4 portrait; } body { padding: 0; } }
  </style></head>
  <body>
    <div class="report-title">SLU Branding — Inventory Report</div>
    <div class="report-meta">Generated: ${now} &nbsp;·&nbsp; SLU Branding Inventory System</div>

    <div class="section">
      <div class="section-title">1. Inventory Value per Category</div>
      <table><thead><tr><th>Category</th><th>Products</th><th>Total Stock</th><th>Avg Price</th><th>Total Value</th><th>%</th></tr></thead>
      <tbody>${valueRows}<tr class="total-row"><td>TOTAL</td><td>${totalProducts.value}</td><td>${totalStock.value.toLocaleString()}</td><td>—</td><td>₱${totalValue.value.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>100%</td></tr></tbody></table>
    </div>

    <div class="section">
      <div class="section-title">2. Low Stock & Out of Stock</div>
      ${alertProducts.value.length ? `<table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Reorder At</th><th>Status</th></tr></thead><tbody>${alertRows}</tbody></table>` : '<p class="empty">All products are well stocked.</p>'}
    </div>

    <div class="section">
      <div class="section-title">3. Stock Movement History</div>
      ${movementLogs.value.length ? `<table><thead><tr><th>Date & Time</th><th>User</th><th>Action</th><th>Product</th><th>Details</th></tr></thead><tbody>${movRows}</tbody></table>` : '<p class="empty">No stock movement in this period.</p>'}
    </div>

    <div class="section">
      <div class="section-title">4. Equipment Borrow History</div>
      ${borrowLogs.value.length ? `<table><thead><tr><th>Date</th><th>Borrower</th><th>Equipment</th><th>Qty</th><th>Status</th></tr></thead><tbody>${borRows}</tbody></table>` : '<p class="empty">No equipment borrow records yet.</p>'}
    </div>
  </body></html>`
}
</script>

<style scoped>
.reports-page { display: flex; flex-direction: column; gap: 24px; animation: fadeUp 0.4s both; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.btn-pdf { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: #B01020; color: white; border: none; border-radius: 11px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-pdf:hover:not(:disabled) { background: #7A0A17; }
.btn-pdf:disabled { opacity: 0.6; cursor: not-allowed; }
.report-meta { font-size: 12px; color: #9A8589; display: flex; gap: 8px; align-items: center; }
.sep { color: #EDE3E5; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #9A8589; font-size: 13px; }
.spinner-lg { width: 26px; height: 26px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Sections */
.report-section { display: flex; flex-direction: column; gap: 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title { display: flex; align-items: center; gap: 8px; font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; }
.section-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.badge { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
.badge-out  { background: #FEE2E2; color: #B91C1C; }
.badge-low  { background: #FEF3C7; color: #92400E; }
.badge-blue { background: #DBEAFE; color: #1D4ED8; }
.date-filter { display: flex; gap: 6px; }
.df-btn { padding: 5px 12px; background: white; border: 1.5px solid #EDE3E5; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 500; color: #6B5257; cursor: pointer; transition: all 0.15s; }
.df-btn:hover { border-color: #B01020; color: #B01020; }
.df-btn.active { background: #B01020; border-color: #B01020; color: white; }

/* Report card */
.report-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; overflow: hidden; }
.empty-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; color: #9A8589; font-size: 13px; }

/* Table */
.report-table { width: 100%; border-collapse: collapse; }
.report-table th { padding: 10px 16px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; background: #FAFAFA; border-bottom: 1.5px solid #EDE3E5; white-space: nowrap; }
.report-table td { padding: 11px 16px; border-bottom: 1px solid #F7F3F4; font-size: 13px; vertical-align: middle; }
.report-table tr:last-child td { border-bottom: none; }
.report-table tr:hover td { background: #FFF5F6; }
.total-row td { background: #F7F3F4 !important; font-weight: 700; border-top: 2px solid #EDE3E5; }
.row-out td { background: #FFF5F5; }
.row-low td { background: #FFFBF0; }
.td-money { font-family: monospace; font-size: 13px; }
.td-bold { font-weight: 700; }
.td-name { font-weight: 600; color: #1A1016; }
.td-time { font-size: 12px; font-weight: 600; color: #1A1016; white-space: nowrap; }
.td-date { font-size: 10px; color: #9A8589; margin-top: 1px; }
.td-details { font-size: 11px; color: #9A8589; font-family: monospace; }
.text-red   { color: #DC2626; }
.text-amber { color: #D97706; }

.cat-label { display: flex; align-items: center; gap: 8px; font-weight: 500; }
.cat-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.sku-badge { font-family: monospace; font-size: 11px; font-weight: 700; color: #B01020; background: #FFF5F6; padding: 2px 7px; border-radius: 5px; }

.pct-bar-row { display: flex; align-items: center; gap: 8px; }
.pct-bar { flex: 1; height: 6px; background: #F0E5E7; border-radius: 10px; overflow: hidden; }
.pct-fill { height: 100%; border-radius: 10px; transition: width 0.5s; }
.pct-label { font-size: 11px; font-weight: 600; color: #6B5257; min-width: 32px; }

.status-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.pill-out  { background: #FEE2E2; color: #B91C1C; }
.pill-low  { background: #FEF3C7; color: #92400E; }
.pill-ok   { background: #D1FAE5; color: #065F46; }
.pill-blue { background: #DBEAFE; color: #1D4ED8; }

.action-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.ap-red   { background: #FEE2E2; color: #B91C1C; }
.ap-green { background: #D1FAE5; color: #065F46; }
.ap-blue  { background: #DBEAFE; color: #1D4ED8; }
.ap-gray  { background: #F3F4F6; color: #4B5563; }

.user-cell { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500; }
.u-av { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.av-admin { background: #FEE2E2; color: #B01020; }
.av-staff { background: #DBEAFE; color: #2563EB; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }
@media (max-width: 600px) { .section-header { flex-direction: column; align-items: flex-start; } }
</style>