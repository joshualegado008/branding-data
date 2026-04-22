<template>
  <div class="alerts-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Stock Alerts</div>
        <div class="page-sub">Monitor low stock and out-of-stock inventory items</div>
      </div>
      <button class="btn-refresh" @click="refresh" :class="{ spinning: loading }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- ── Summary cards ── -->
    <div class="summary-cards">
      <div class="summary-card summary-red">
        <div class="summary-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div class="summary-val">{{ outOfStock.length }}</div>
          <div class="summary-label">Out of Stock</div>
        </div>
      </div>
      <div class="summary-card summary-amber">
        <div class="summary-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="summary-val">{{ lowStock.length }}</div>
          <div class="summary-label">Low Stock</div>
        </div>
      </div>
      <div class="summary-card summary-green">
        <div class="summary-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div class="summary-val">{{ Math.max(0, totalProducts - outOfStock.length - lowStock.length) }}</div>
          <div class="summary-label">Well Stocked</div>
        </div>
      </div>
      <div class="summary-card summary-blue">
        <div class="summary-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div>
          <div class="summary-val">{{ totalProducts }}</div>
          <div class="summary-label">Total Products</div>
        </div>
      </div>
      <!-- Room 1 cards -->
      <div class="summary-card summary-red" v-if="room1OutOfStock.length">
        <div class="summary-icon">
          <i class="bi bi-door-open" style="font-size:18px;"></i>
        </div>
        <div>
          <div class="summary-val">{{ room1OutOfStock.length }}</div>
          <div class="summary-label">Room 1 Empty</div>
        </div>
      </div>
      <div class="summary-card summary-amber" v-if="room1LowStock.length">
        <div class="summary-icon">
          <i class="bi bi-door-open" style="font-size:18px;"></i>
        </div>
        <div>
          <div class="summary-val">{{ room1LowStock.length }}</div>
          <div class="summary-label">Room 1 Low</div>
        </div>
      </div>
    </div>

    <!-- ── Filter tabs ── -->
    <div class="filter-tabs">
      <button class="ftab" :class="{ active: filter === 'all' }" @click="filter = 'all'">
        All Alerts
        <span class="ftab-count">{{ outOfStock.length + lowStock.length }}</span>
      </button>
      <button class="ftab" :class="{ active: filter === 'out' }" @click="filter = 'out'">
        <span class="dot dot-red"></span>
        Out of Stock
        <span class="ftab-count">{{ outOfStock.length }}</span>
      </button>
      <button class="ftab" :class="{ active: filter === 'low' }" @click="filter = 'low'">
        <span class="dot dot-amber"></span>
        Low Stock
        <span class="ftab-count">{{ lowStock.length }}</span>
      </button>
      <button class="ftab ftab-room1" :class="{ active: filter === 'room1' }" @click="filter = 'room1'" v-if="room1LowStock.length || room1OutOfStock.length">
        <i class="bi bi-door-open"></i>
        Room 1
        <span class="ftab-count ftab-count-r1">{{ room1LowStock.length + room1OutOfStock.length }}</span>
      </button>
    </div>

    <!-- ── Loading ── -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <span>Loading alerts…</span>
    </div>

    <!-- ── Empty ── -->
    <div class="empty-state" v-else-if="filteredAlerts.length === 0 && filter !== 'room1'">
      <i class="bi bi-check-circle-fill empty-bi" style="color:#16A34A;"></i>
      <div class="empty-title">All clear!</div>
      <div class="empty-sub">No stock alerts right now. All items are well stocked.</div>
    </div>

        <!-- ── Room 1 Alerts ── -->
    <div class="r1-alerts-section" v-if="(room1OutOfStock.length || room1LowStock.length) && (filter === 'all' || filter === 'room1')">
      <div class="r1-section-title">
        <i class="bi bi-door-open"></i>
        Room 1 Needs Restocking
        <span class="r1-badge">{{ room1OutOfStock.length + room1LowStock.length }} items</span>
      </div>
      <div class="r1-items">
        <div class="r1-item" v-for="p in [...room1OutOfStock, ...room1LowStock.filter(i => i.room1_stock > 0)]" :key="p.id">
          <div class="r1-item-info">
            <div class="r1-item-name">{{ p.name }}</div>
            <div class="r1-item-sku">{{ p.sku }}</div>
          </div>
          <div class="r1-stock-info">
            <div class="r1-stock-row">
              <span class="r1-loc"><i class="bi bi-building"></i> Warehouse</span>
              <span class="r1-val" :class="p.stock === 0 ? 'r1-empty' : ''">{{ p.stock }} {{ p.unit }}</span>
            </div>
            <div class="r1-stock-row">
              <span class="r1-loc"><i class="bi bi-door-open"></i> Room 1</span>
              <span class="r1-val r1-empty">{{ p.room1_stock || 0 }} {{ p.unit }}</span>
            </div>
          </div>
          <span class="r1-status" :class="(p.room1_stock||0) === 0 ? 'r1-s-empty' : 'r1-s-low'">
            {{ (p.room1_stock||0) === 0 ? 'Empty' : 'Low' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Alert table ── -->
    <div class="table-wrap" v-else>
      <table class="alert-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Reorder At</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr class="alert-row" v-for="item in filteredAlerts" :key="item.id" :class="item.stock === 0 ? 'row-out' : 'row-low'">
            <td><div class="product-name">{{ item.name }}</div></td>
            <td><span class="sku-tag">{{ item.sku }}</span></td>
            <td><span class="cat-tag">{{ item.category }}</span></td>
            <td>
              <div class="stock-cell">
                <div class="stock-bar-wrap">
                  <div
                    class="stock-bar"
                    :class="item.stock === 0 ? 'bar-out' : 'bar-low'"
                    :style="{ width: Math.min((item.stock / Math.max(item.reorder_at * 3, 1)) * 100, 100) + '%' }"
                  ></div>
                </div>
                <span class="stock-num" :class="item.stock === 0 ? 'num-out' : 'num-low'">
                  {{ item.stock }} {{ item.unit || 'pcs' }}
                </span>
              </div>
            </td>
            <td class="reorder-cell">{{ item.reorder_at }}</td>
            <td>
              <span class="status-pill" :class="item.stock === 0 ? 'pill-out' : 'pill-low'">
                {{ item.stock === 0 ? 'Out of Stock' : 'Low Stock' }}
              </span>
            </td>
            <td>
              <button class="btn-restock" @click="openRestock(item)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Restock
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Restock Modal ── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="modal-overlay" v-if="showRestock" @click.self="showRestock = false">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">Restock Item</div>
              <button class="modal-close" @click="showRestock = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body" v-if="restockItem">
              <div class="restock-item-info">
                <div class="restock-name">{{ restockItem.name }}</div>
                <div class="restock-meta">
                  {{ restockItem.sku }} · Current stock:
                  <strong :class="restockItem.stock === 0 ? 'text-red' : 'text-amber'">
                    {{ restockItem.stock }} {{ restockItem.unit || 'pcs' }}
                  </strong>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Add Quantity <span class="req">*</span></label>
                <input class="form-input" type="number" v-model.number="restockQty" min="1" placeholder="e.g. 50" />
              </div>
              <div class="form-field">
                <label class="form-label">Notes (optional)</label>
                <input class="form-input" type="text" v-model="restockNote" placeholder="e.g. Purchased from supplier" />
              </div>
              <div class="restock-preview" v-if="restockQty > 0">
                New total stock will be: <strong>{{ restockItem.stock + restockQty }}</strong> {{ restockItem.unit || 'pcs' }}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showRestock = false" :disabled="saving">Cancel</button>
              <button class="btn-save" @click="saveRestock" :disabled="saving || !restockQty || restockQty < 1">
                <div class="spinner-sm" v-if="saving"></div>
                <span v-else>Confirm Restock</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Toast ── -->
    <Teleport to="body">
      <Transition name="toast">
        <div class="toast" v-if="toast.show" :class="'toast-' + toast.type">{{ toast.message }}</div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventory } from '@/composables/useInventory'

const { products, totalProducts, lowStockItems, outOfStock, room1LowStock, room1OutOfStock, fetchProducts, updateProduct } = useInventory()

const loading = ref(false)
const filter  = ref('all')

const lowStock = computed(() => lowStockItems.value.filter(p => p.stock > 0))

const filteredAlerts = computed(() => {
  if (filter.value === 'out')   return outOfStock.value
  if (filter.value === 'low')   return lowStock.value
  if (filter.value === 'room1') return []  // Room 1 has its own section below
  return [...outOfStock.value, ...lowStock.value]
})

async function refresh() {
  loading.value = true
  await fetchProducts()
  loading.value = false
}

onMounted(() => fetchProducts())

// ── Restock modal ──
const showRestock = ref(false)
const restockItem = ref(null)
const restockQty  = ref(0)
const restockNote = ref('')
const saving      = ref(false)

function openRestock(item) {
  restockItem.value = item
  restockQty.value  = item.reorder_at ? item.reorder_at * 2 : 10
  restockNote.value = ''
  showRestock.value = true
}

async function saveRestock() {
  if (!restockQty.value || restockQty.value < 1) return
  saving.value = true
  try {
    const newStock = restockItem.value.stock + restockQty.value
    await updateProduct(restockItem.value.id, { stock: newStock })
    showToast(`Restocked! ${restockItem.value.name} is now at ${newStock} ${restockItem.value.unit || 'pcs'}`, 'success')
    showRestock.value = false
    await fetchProducts()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Toast ──
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3500)
}
</script>


<style scoped>
.alerts-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; width: 100%; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.btn-refresh { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: white; color: #3D2830; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-refresh:hover { border-color: #B01020; color: #B01020; }
.btn-refresh.spinning svg { animation: spin 0.8s linear infinite; }

.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.summary-card { display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-radius: 14px; border: 1.5px solid #EDE3E5; background: white; }
.summary-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.summary-val { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; line-height: 1; }
.summary-label { font-size: 11px; color: #9A8589; margin-top: 3px; }
.summary-red   .summary-icon { background: #FFF5F6; color: #B01020; } .summary-red   .summary-val { color: #B01020; }
.summary-amber .summary-icon { background: #FFFBEB; color: #D97706; } .summary-amber .summary-val { color: #D97706; }
.summary-green .summary-icon { background: #F0FDF4; color: #16A34A; } .summary-green .summary-val { color: #16A34A; }
.summary-blue  .summary-icon { background: #EFF6FF; color: #2563EB; } .summary-blue  .summary-val { color: #1A1016; }

.filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.ftab { display: flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; background: white; border: 1.5px solid #EDE3E5; color: #9A8589; cursor: pointer; transition: all 0.18s; }
.ftab:hover { border-color: #B01020; color: #1A1016; }
.ftab.active { background: #1A1016; color: white; border-color: #1A1016; }
.ftab-count { padding: 1px 7px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #F7F3F4; color: #6B5257; }
.ftab.active .ftab-count { background: rgba(255,255,255,0.15); color: white; }
.dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: #B01020; } .dot-amber { background: #D97706; }

.loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #9A8589; font-size: 14px; }
.spinner { width: 24px; height: 24px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
.empty-icon { font-size: 52px; } .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; color: #1A1016; } .empty-sub { font-size: 13px; color: #9A8589; }

.table-wrap { background: white; border-radius: 16px; border: 1.5px solid #EDE3E5; overflow-x: auto; }
.alert-table { width: 100%; min-width: 700px; border-collapse: collapse; }
.alert-table thead tr { background: #F7F3F4; border-bottom: 1.5px solid #EDE3E5; }
.alert-table th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; white-space: nowrap; }
.alert-row { border-bottom: 1px solid #F0E5E7; transition: background 0.15s; }
.alert-row:last-child { border-bottom: none; }
.alert-row:hover { background: #FFFBFB; }
.row-out { background: #FFFAFA; }
.alert-table td { padding: 13px 16px; font-size: 13px; color: #3D2830; vertical-align: middle; }
.product-name { font-size: 13px; font-weight: 600; color: #1A1016; }
.sku-tag { font-size: 11px; font-weight: 600; background: #F7F3F4; color: #6B5257; padding: 3px 8px; border-radius: 6px; font-family: monospace; }
.cat-tag { font-size: 11px; background: #EFF6FF; color: #2563EB; padding: 3px 8px; border-radius: 6px; font-weight: 500; white-space: nowrap; }
.reorder-cell { color: #9A8589; }
.stock-cell { display: flex; align-items: center; gap: 10px; min-width: 130px; }
.stock-bar-wrap { flex: 1; height: 6px; background: #EDE3E5; border-radius: 3px; overflow: hidden; }
.stock-bar { height: 100%; border-radius: 3px; min-width: 2px; }
.bar-out { background: #B01020; } .bar-low { background: #F59E0B; }
.stock-num { font-size: 12px; font-weight: 600; white-space: nowrap; }
.num-out { color: #B01020; } .num-low { color: #D97706; }
.status-pill { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; }
.pill-out { background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.pill-low { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
.btn-restock { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; background: #F0FDF4; color: #16A34A; border: 1.5px solid #BBF7D0; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.btn-restock:hover { background: #16A34A; color: white; border-color: #16A34A; }

.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.55); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.modal { background: white; border-radius: 20px; width: 100%; max-width: 440px; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.modal-close { background: #F7F3F4; border: none; border-radius: 8px; color: #9A8589; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; transition: all 0.18s; }
.modal-close:hover { background: #FFF5F6; color: #B01020; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { padding: 16px 24px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #EDE3E5; }
.restock-item-info { background: #FFF5F6; border: 1.5px solid #F0DADE; border-radius: 12px; padding: 14px 16px; }
.restock-name { font-size: 15px; font-weight: 600; color: #1A1016; }
.restock-meta { font-size: 12px; color: #6B5257; margin-top: 4px; }
.text-red { color: #B01020; } .text-amber { color: #D97706; }
.restock-preview { background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #16A34A; }
.restock-preview strong { font-weight: 700; font-size: 15px; }
.form-field { display: flex; flex-direction: column; }
.form-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #3D2830; margin-bottom: 6px; }
.req { color: #B01020; }
.form-input { width: 100%; padding: 10px 14px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.08); }
.btn-cancel { padding: 10px 20px; background: none; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #9A8589; cursor: pointer; transition: all 0.18s; }
.btn-cancel:hover:not(:disabled) { border-color: #9A8589; color: #3D2830; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { padding: 10px 22px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center; }
.btn-save:hover:not(:disabled) { background: #7A0A17; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner-sm { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 12px; font-size: 13px; font-weight: 500; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 10000; white-space: nowrap; }
.toast-success { background: #1A1016; } .toast-error { background: #B01020; }
.modal-fade-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal { transform: scale(0.95) translateY(16px); }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .summary-cards { grid-template-columns: 1fr 1fr; } .page-header { flex-direction: column; } }
@media (max-width: 480px) { .summary-cards { grid-template-columns: 1fr; } .page-title { font-size: 22px; } }

/* Room 1 alerts */
.r1-alerts-section { background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 16px 18px; }
.r1-section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #92400E; margin-bottom: 12px; }
.r1-badge { font-size: 11px; background: #F59E0B; color: white; padding: 2px 9px; border-radius: 20px; font-weight: 700; }
.r1-items { display: flex; flex-direction: column; gap: 8px; }
.r1-item { display: flex; align-items: center; gap: 12px; background: white; border-radius: 10px; padding: 10px 14px; border: 1px solid #FDE68A; }
.r1-item-info { flex: 1; }
.r1-item-name { font-size: 13px; font-weight: 600; color: #1A1016; }
.r1-item-sku  { font-size: 11px; color: #B01020; font-family: monospace; }
.r1-stock-info { display: flex; flex-direction: column; gap: 3px; }
.r1-stock-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.r1-loc { color: #9A8589; display: flex; align-items: center; gap: 4px; min-width: 90px; }
.r1-val { font-weight: 600; color: #1A1016; }
.r1-empty { color: #DC2626 !important; }
.r1-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; flex-shrink: 0; }
.r1-s-empty { background: #FEE2E2; color: #B91C1C; }
.r1-s-low   { background: #FEF3C7; color: #92400E; }


/* Room 1 filter tab */
.ftab-room1 { display: flex; align-items: center; gap: 5px; }
.ftab-count-r1 { background: #7C3AED !important; }
.ftab-room1.active { background: #7C3AED !important; border-color: #7C3AED !important; color: white !important; }

</style>