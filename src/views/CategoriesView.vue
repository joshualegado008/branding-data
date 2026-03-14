<template>
  <div class="cat-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Categories</div>
        <div class="page-sub">Organize your inventory into product categories</div>
      </div>
      <button class="btn-add" @click="openModal()" v-if="isAdmin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Category
      </button>
    </div>

    <!-- ── Summary cards ── -->
    <div class="summary-row">
      <div class="sum-card">
        <div class="sum-icon sum-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div><div class="sum-val">{{ categories.length }}</div><div class="sum-label">Total Categories</div></div>
      </div>
      <div class="sum-card">
        <div class="sum-icon sum-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div><div class="sum-val">{{ totalProducts }}</div><div class="sum-label">Total Products</div></div>
      </div>
      <div class="sum-card">
        <div class="sum-icon sum-red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        </div>
        <div><div class="sum-val">{{ uncategorized }}</div><div class="sum-label">Uncategorized</div></div>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div class="loading-state" v-if="loading">
      <div class="spinner-lg"></div>
      <span>Loading categories…</span>
    </div>

    <!-- ── Category grid ── -->
    <div class="cat-grid" v-else-if="categories.length">
      <div class="cat-card" v-for="cat in enriched" :key="cat.id" :style="{ '--accent': cat.color }">

        <div class="cat-header">
          <div class="cat-color-dot" :style="{ background: cat.color }"></div>
          <div class="cat-name">{{ cat.name }}</div>
          <div class="cat-actions" v-if="isAdmin">
            <button class="ca-btn" @click="openModal(cat)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ca-btn ca-del" @click="confirmDelete(cat)" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="cat-stats">
          <div class="cat-stat">
            <div class="cs-val">{{ cat.productCount }}</div>
            <div class="cs-label">Products</div>
          </div>
          <div class="cat-stat">
            <div class="cs-val">{{ cat.totalStock.toLocaleString() }}</div>
            <div class="cs-label">Total Stock</div>
          </div>
          <div class="cat-stat">
            <div class="cs-val">₱{{ cat.totalValue.toLocaleString() }}</div>
            <div class="cs-label">Value</div>
          </div>
        </div>

        <!-- Stock bar -->
        <div class="stock-bar-wrap">
          <div class="stock-bar">
            <div class="stock-bar-ok"  :style="{ width: cat.pctOk  + '%' }"></div>
            <div class="stock-bar-low" :style="{ width: cat.pctLow + '%' }"></div>
            <div class="stock-bar-out" :style="{ width: cat.pctOut + '%' }"></div>
          </div>
          <div class="stock-legend">
            <span class="sl-ok">{{ cat.okCount }} ok</span>
            <span class="sl-low">{{ cat.lowCount }} low</span>
            <span class="sl-out">{{ cat.outCount }} out</span>
          </div>
        </div>

        <!-- Product list preview -->
        <div class="product-chips" v-if="cat.products.length">
          <span class="p-chip" v-for="p in cat.products.slice(0, 4)" :key="p.id">{{ p.name }}</span>
          <span class="p-chip p-chip-more" v-if="cat.products.length > 4">+{{ cat.products.length - 4 }} more</span>
        </div>
        <div class="no-products" v-else>No products yet</div>

      </div>
    </div>

    <!-- ── Empty ── -->
    <div class="empty-state" v-else>
      <i class="bi bi-folder2-open empty-bi"></i>
      <div class="empty-title">No categories yet</div>
      <div class="empty-sub">Add your first category to organize your inventory</div>
      <button class="btn-add" @click="openModal()" v-if="isAdmin">+ Add Category</button>
    </div>

    <!-- ══ ADD / EDIT MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">{{ editing ? 'Edit Category' : 'Add Category' }}</div>
            <button class="modal-close" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">Category Name <span class="req">*</span></label>
              <input class="form-input" v-model="form.name" placeholder="e.g. Tarpaulin" maxlength="40" @keydown.enter="save" />
              <div class="form-error" v-if="errors.name">{{ errors.name }}</div>
            </div>
            <div class="form-field">
              <label class="form-label">Color</label>
              <div class="color-picker">
                <div
                  v-for="c in colorOptions" :key="c"
                  class="color-dot" :style="{ background: c }"
                  :class="{ active: form.color === c }"
                  @click="form.color = c"
                ></div>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Description (optional)</label>
              <input class="form-input" v-model="form.description" placeholder="Short description" maxlength="100" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal" :disabled="saving">Cancel</button>
            <button class="btn-save" @click="save" :disabled="saving || !form.name.trim()">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>{{ editing ? 'Save Changes' : 'Add Category' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

    <!-- ══ DELETE CONFIRM ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title">Delete Category</div>
            <button class="modal-close" @click="deleteTarget = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="delete-warn" v-if="deleteTarget && productCountFor(deleteTarget) > 0">
              <i class="bi bi-exclamation-triangle-fill" style="color:#D97706;margin-right:6px;"></i><strong>{{ productCountFor(deleteTarget) }} product(s)</strong> use this category. Deleting it won't delete the products but they will become uncategorized.
            </div>
            <p>Delete category <strong>"{{ deleteTarget?.name }}"</strong>? This cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="btn-delete" @click="doDelete">Yes, Delete</button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

    <!-- Toast -->
    <Teleport to="body"><Transition name="toast">
      <div class="toast" v-if="toast.show" :class="'toast-' + toast.type">{{ toast.message }}</div>
    </Transition></Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventory } from '@/composables/useInventory'
import { getProfile }   from '@/composables/useAuth'

const {
  products, categories, loading, totalProducts,
  fetchProducts, fetchCategories,
  addCategory, updateCategory, deleteCategory,
} = useInventory()

const profile = ref(null)
const isAdmin = computed(() => profile.value?.role === 'Administrator')

onMounted(async () => {
  profile.value = await getProfile()
  await Promise.all([fetchProducts(), fetchCategories()])
})

// ── Enrich categories with product stats ──────
const colorOptions = [
  '#B01020','#DC2626','#EA580C','#D97706','#CA8A04',
  '#65A30D','#16A34A','#059669','#0891B2','#2563EB',
  '#7C3AED','#9333EA','#DB2777','#6B7280','#1A1016',
]

const enriched = computed(() => {
  return categories.value.map(cat => {
    const catProducts = products.value.filter(p => p.category === cat.name)
    const okCount  = catProducts.filter(p => p.stock > p.reorder_at).length
    const lowCount = catProducts.filter(p => p.stock <= p.reorder_at && p.stock > 0).length
    const outCount = catProducts.filter(p => p.stock === 0).length
    const total    = catProducts.length || 1
    return {
      ...cat,
      color:        cat.color || '#B01020',
      products:     catProducts,
      productCount: catProducts.length,
      totalStock:   catProducts.reduce((s, p) => s + (p.stock || 0), 0),
      totalValue:   catProducts.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0),
      okCount, lowCount, outCount,
      pctOk:  Math.round(okCount  / total * 100),
      pctLow: Math.round(lowCount / total * 100),
      pctOut: Math.round(outCount / total * 100),
    }
  })
})

const uncategorized = computed(() =>
  products.value.filter(p => !p.category || !categories.value.find(c => c.name === p.category)).length
)

function productCountFor(cat) {
  return products.value.filter(p => p.category === cat?.name).length
}

// ── Modal ─────────────────────────────────────
const showModal = ref(false)
const editing   = ref(null)
const saving    = ref(false)
const errors    = ref({})
const form      = ref({ name: '', color: '#B01020', description: '' })

function openModal(cat = null) {
  errors.value = {}
  if (cat) {
    editing.value = cat.id
    form.value = { name: cat.name, color: cat.color || '#B01020', description: cat.description || '' }
  } else {
    editing.value = null
    form.value = { name: '', color: '#B01020', description: '' }
  }
  showModal.value = true
}

function closeModal() { showModal.value = false; editing.value = null; errors.value = {} }

async function save() {
  if (!form.value.name.trim()) { errors.value.name = 'Name is required'; return }
  saving.value = true
  try {
    if (editing.value) {
      await updateCategory(editing.value, form.value)
      showToast('Category updated', 'success')
    } else {
      await addCategory(form.value)
      showToast('Category added', 'success')
    }
    closeModal()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(cat) { deleteTarget.value = cat }
async function doDelete() {
  try {
    await deleteCategory(deleteTarget.value.id)
    showToast('Category deleted', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    deleteTarget.value = null
  }
}

// ── Toast ─────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(msg, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message: msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
</script>


<style scoped>
.cat-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.btn-add { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: #B01020; color: white; border: none; border-radius: 11px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(176,16,32,0.25); }
.btn-add:hover { background: #7A0A17; }

.summary-row { display: flex; gap: 12px; flex-wrap: wrap; }
.sum-card { display: flex; align-items: center; gap: 14px; background: white; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 16px 22px; flex: 1; min-width: 150px; }
.sum-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sum-blue  { background: #DBEAFE; color: #2563EB; }
.sum-green { background: #D1FAE5; color: #059669; }
.sum-red   { background: #FEE2E2; color: #B01020; }
.sum-val   { font-size: 24px; font-weight: 700; color: #1A1016; font-family: 'Cormorant Garamond', serif; line-height: 1; }
.sum-label { font-size: 12px; color: #9A8589; margin-top: 2px; }

.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #9A8589; font-size: 13px; }
.spinner-lg { width: 26px; height: 26px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Category grid */
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.cat-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: all 0.2s; border-top: 3px solid var(--accent); }
.cat-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
.cat-header { display: flex; align-items: center; gap: 10px; }
.cat-color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.cat-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; flex: 1; }
.cat-actions { display: flex; gap: 5px; }
.ca-btn { width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid #EDE3E5; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9A8589; transition: all 0.15s; }
.ca-btn:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }
.ca-del:hover { border-color: #DC2626; color: #DC2626; background: #FEF2F2; }

.cat-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.cat-stat { text-align: center; background: #F7F3F4; border-radius: 10px; padding: 10px 6px; }
.cs-val   { font-size: 18px; font-weight: 700; color: #1A1016; font-family: 'Cormorant Garamond', serif; }
.cs-label { font-size: 10px; color: #9A8589; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

.stock-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.stock-bar { height: 6px; border-radius: 10px; background: #F0E5E7; overflow: hidden; display: flex; }
.stock-bar-ok  { background: #16A34A; border-radius: 10px 0 0 10px; transition: width 0.5s; }
.stock-bar-low { background: #F59E0B; transition: width 0.5s; }
.stock-bar-out { background: #DC2626; border-radius: 0 10px 10px 0; transition: width 0.5s; }
.stock-legend  { display: flex; gap: 10px; }
.sl-ok  { font-size: 10px; color: #16A34A; font-weight: 600; }
.sl-low { font-size: 10px; color: #F59E0B; font-weight: 600; }
.sl-out { font-size: 10px; color: #DC2626; font-weight: 600; }

.product-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.p-chip { font-size: 11px; background: #F7F3F4; color: #6B5257; padding: 3px 9px; border-radius: 20px; border: 1px solid #EDE3E5; }
.p-chip-more { background: #FFF5F6; color: #B01020; border-color: #F5C6C9; }
.no-products { font-size: 12px; color: #C4ADAF; font-style: italic; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; text-align: center; }
.empty-icon  { font-size: 40px; }
.empty-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.empty-sub   { font-size: 13px; color: #9A8589; }

/* Color picker */
.color-picker { display: flex; flex-wrap: wrap; gap: 8px; }
.color-dot { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; transition: all 0.15s; border: 2.5px solid transparent; }
.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: #1A1016; transform: scale(1.2); box-shadow: 0 2px 8px rgba(0,0,0,0.25); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
.modal-sm { max-width: 380px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 0; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.modal-close { background: #F7F3F4; border: none; border-radius: 8px; color: #9A8589; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: #FFF5F6; color: #B01020; }
.modal-body { padding: 16px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 10px 22px 20px; border-top: 1px solid #EDE3E5; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #3D2830; }
.req { color: #B01020; }
.form-input { width: 100%; padding: 9px 13px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; }
.form-error { font-size: 11px; color: #B01020; }
.delete-warn { background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #92400E; }
.btn-cancel { padding: 10px 20px; background: none; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #9A8589; cursor: pointer; }
.btn-cancel:hover { border-color: #9A8589; color: #3D2830; }
.btn-save { display: flex; align-items: center; gap: 7px; padding: 10px 22px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-save:hover:not(:disabled) { background: #7A0A17; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-delete { padding: 10px 20px; background: #DC2626; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
.spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 12px; font-size: 13px; font-weight: 500; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 10000; white-space: nowrap; }
.toast-success { background: #1A1016; }
.toast-error   { background: #B01020; }
.modal-fade-enter-active { transition: all 0.28s cubic-bezier(0.16,1,0.3,1); }
.modal-fade-leave-active { transition: all 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal { transform: scale(0.95) translateY(12px); }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }
@media (max-width: 600px) { .summary-row { flex-direction: column; } .cat-grid { grid-template-columns: 1fr; } }
</style>