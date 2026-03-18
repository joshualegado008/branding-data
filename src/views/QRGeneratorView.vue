<template>
  <div class="qr-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">QR Code Generator</div>
        <div class="page-sub">All QR codes are saved to the database — never lost on refresh</div>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="printSelected" :disabled="selectedIds.size === 0 || printing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          {{ printing ? 'Preparing…' : `Print Selected (${selectedIds.size})` }}
        </button>
      </div>
    </div>

    <div class="main-layout">

      <!-- ── LEFT: Form ── -->
      <div class="form-card">
        <div class="form-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="1.8" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          {{ editing ? 'Edit QR Code' : 'New QR Code' }}
        </div>

        <!-- ── Type switcher ── -->
        <div class="type-switcher">
          <button class="type-btn" :class="{ active: qrType === 'product' }" @click="setType('product')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Product QR
          </button>
          <button class="type-btn" :class="{ active: qrType === 'equipment' }" @click="setType('equipment')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Equipment QR
          </button>
        </div>

        <!-- ══ PRODUCT fields ══ -->
        <template v-if="qrType === 'product'">
          <div class="import-row">
            <span class="import-label">Fill from inventory</span>
            <div class="toggle-wrap" :class="{ on: useInventoryPick }" @click="useInventoryPick = !useInventoryPick"></div>
          </div>
          <div class="inventory-picker" v-if="useInventoryPick">
            <label class="form-label">Select Product</label>
            <select class="form-input form-select" v-model="pickedProduct" @change="fillFromProduct">
              <option value="">— Choose a product —</option>
              <option v-for="p in products" :key="p.id" :value="p">{{ p.name }} ({{ p.sku }})</option>
            </select>
          </div>
          <div class="form-divider" v-if="useInventoryPick"></div>

          <div class="form-field">
            <label class="form-label">Product Name <span class="req">*</span></label>
            <input class="form-input" v-model="form.name" placeholder="e.g. SLU Red T-Shirt" maxlength="60" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">SKU <span class="req">*</span></label>
              <input class="form-input" v-model="form.sku" placeholder="e.g. SLU-001" maxlength="30" :class="{ 'input-warn': skuExists && !editing }" />
              <div class="form-hint warn" v-if="skuExists && !editing"><i class="bi bi-exclamation-triangle-fill" style="margin-right:4px;color:#D97706;"></i>This SKU already exists — saving will update it</div>
            </div>
            <div class="form-field">
              <label class="form-label">Category</label>
              <input class="form-input" v-model="form.category" placeholder="e.g. Apparel" maxlength="30" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Supplier</label>
            <input class="form-input" v-model="form.supplier" placeholder="e.g. Printworks PH" maxlength="60" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Unit</label>
              <select class="form-input form-select" v-model="form.unit">
                <option>pcs</option><option>sets</option><option>boxes</option>
                <option>rolls</option><option>sheets</option><option>meters</option>
                <option>liters</option><option>kg</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">QR Size</label>
              <select class="form-input form-select" v-model.number="form.label_size">
                <option :value="100">Small</option>
                <option :value="150">Medium</option>
                <option :value="200">Large</option>
              </select>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Notes (optional)</label>
            <input class="form-input" v-model="form.notes" placeholder="Extra info on the label" maxlength="60" />
          </div>
        </template>

        <!-- ══ EQUIPMENT fields ══ -->
        <template v-if="qrType === 'equipment'">
          <!-- Pick from equipment list -->
          <div class="import-row">
            <span class="import-label">Fill from equipment list</span>
            <div class="toggle-wrap" :class="{ on: useEquipmentPick }" @click="useEquipmentPick = !useEquipmentPick"></div>
          </div>
          <div class="inventory-picker" v-if="useEquipmentPick">
            <label class="form-label">Select Equipment</label>
            <select class="form-input form-select" v-model="pickedEquipment" @change="fillFromEquipment">
              <option value="">— Choose equipment —</option>
              <option v-for="e in equipmentItems" :key="e.id" :value="e">{{ e.name }} — {{ e.serial_no }}</option>
            </select>
          </div>
          <div class="form-divider" v-if="useEquipmentPick"></div>

          <div class="form-field">
            <label class="form-label">Equipment Name <span class="req">*</span></label>
            <input class="form-input" v-model="form.name" placeholder="e.g. Canon EOS M50 Camera" maxlength="60" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Serial Number <span class="req">*</span></label>
              <input class="form-input" v-model="form.sku" placeholder="e.g. CAM-001" maxlength="30" :class="{ 'input-warn': skuExists && !editing }" />
              <div class="form-hint">This is the unique code embedded in the QR</div>
              <div class="form-hint warn" v-if="skuExists && !editing"><i class="bi bi-exclamation-triangle-fill" style="margin-right:4px;color:#D97706;"></i>Serial already exists — saving will update it</div>
            </div>
            <div class="form-field">
              <label class="form-label">Category</label>
              <select class="form-input form-select" v-model="form.category">
                <option value="">— Select —</option>
                <option v-for="c in equipmentCategories" :key="c">{{ c }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Location</label>
              <input class="form-input" v-model="form.supplier" placeholder="e.g. Office Cabinet A" maxlength="60" />
            </div>
            <div class="form-field">
              <label class="form-label">Department</label>
              <input class="form-input" v-model="form.unit" placeholder="e.g. SLU Branding" maxlength="40" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Description / Condition Notes</label>
            <input class="form-input" v-model="form.notes" placeholder="e.g. Mirrorless camera — handle with care" maxlength="100" />
          </div>
          <div class="form-field">
            <label class="form-label">QR Size</label>
            <select class="form-input form-select" v-model.number="form.label_size">
              <option :value="100">Small</option>
              <option :value="150">Medium</option>
              <option :value="200">Large</option>
            </select>
          </div>

          <!-- Update equipment DB toggle -->
          <div class="import-row update-row">
            <div>
              <span class="import-label">Update equipment database</span>
              <div class="form-hint" style="margin-top:2px;">Also save QR code / serial back to equipment_items table</div>
            </div>
            <div class="toggle-wrap" :class="{ on: updateEquipmentDB }" @click="updateEquipmentDB = !updateEquipmentDB"></div>
          </div>
          <div class="eq-db-notice" v-if="updateEquipmentDB">
            <i class="bi bi-info-circle"></i>
            When you save, the <strong>qr_code</strong> field of this equipment item will also be updated in Supabase so scanning works immediately.
          </div>
        </template>
        <div class="form-field">
          <label class="form-label">Label Style</label>
          <div class="style-picker">
            <div v-for="s in labelStyles" :key="s.key"
              class="style-option" :class="{ active: form.label_style === s.key }"
              @click="form.label_style = s.key">{{ s.label }}</div>
          </div>
        </div>

        <!-- Live preview -->
        <div class="inline-preview" v-if="form.sku">
          <div class="ip-label">Preview</div>
          <div class="preview-label-box" :class="'style-' + form.label_style">
            <canvas ref="previewCanvas" class="preview-qr-canvas"></canvas>
            <div class="plb-info">
              <div class="plb-name">{{ form.name || '—' }}</div>
              <div class="plb-sku">{{ qrType === 'equipment' ? 'Serial: ' : 'SKU: ' }}{{ form.sku }}</div>
              <div class="plb-supplier" v-if="form.supplier">
                <i class="bi bi-geo-alt-fill" v-if="qrType === 'equipment'" style="font-size:10px;margin-right:3px;"></i>{{ form.supplier }}
              </div>
              <div class="plb-meta" v-if="form.category">{{ form.category }}<span v-if="form.unit"> · {{ form.unit }}</span></div>
              <div class="plb-notes" v-if="form.notes">{{ form.notes }}</div>
              <div class="plb-brand">SLU Branding</div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-save-qr" @click="saveQR" :disabled="!form.name || !form.sku || saving">
            <div class="spinner-sm" v-if="saving"></div>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {{ editing ? 'Update QR Code' : (skuExists ? 'Update Existing' : 'Save to Database') }}
            </span>
          </button>
          <button class="btn-reset" @click="resetForm" v-if="editing || form.name">
            Cancel
          </button>
        </div>
      </div>

      <!-- ── RIGHT: Saved QR Library ── -->
      <div class="right-col">

        <!-- Search + select all -->
        <div class="library-header">
          <div class="library-title">
            QR Library
            <span class="lib-count">{{ qrCodes.length }}</span>
          </div>
          <div class="lib-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input class="search-input" v-model="search" placeholder="Search SKU or name…" />
            </div>
            <button class="btn-select-all" @click="toggleSelectAll" v-if="filteredQR.length">
              {{ selectedIds.size === filteredQR.length ? 'Deselect All' : 'Select All' }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div class="lib-loading" v-if="loading">
          <div class="spinner-lg"></div>
          <span>Loading QR library…</span>
        </div>

        <!-- Empty -->
        <div class="lib-empty" v-else-if="filteredQR.length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#DDD0D2" stroke-width="1.2" width="44" height="44"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>{{ search ? 'No QR codes match your search' : 'No QR codes saved yet — create one using the form' }}</span>
        </div>

        <!-- QR Grid -->
        <div class="qr-grid" v-else>
          <div
            v-for="qr in filteredQR" :key="qr.id"
            class="qr-card" :class="{ selected: selectedIds.has(qr.id) }"
            @click="toggleSelect(qr.id)"
          >
            <!-- Select checkbox -->
            <div class="qr-check" :class="{ checked: selectedIds.has(qr.id) }">
              <svg v-if="selectedIds.has(qr.id)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
            </div>

            <!-- QR canvas -->
            <div class="qr-canvas-wrap">
              <canvas :ref="el => drawThumb(el, qr)" width="70" height="70" class="qr-thumb"></canvas>
            </div>

            <!-- Info -->
            <div class="qr-info">
              <div class="qr-name">{{ qr.name }}</div>
              <div class="qr-sku">{{ qr.sku }}</div>
              <div class="qr-meta" v-if="qr.supplier || qr.category">
                {{ qr.supplier || qr.category }}
              </div>
              <div class="qr-stats">
                <span class="qr-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  {{ qr.print_count || 0 }} printed
                </span>
                <span class="qr-stat">{{ formatDate(qr.created_at) }}</span>
              </div>
            </div>

            <!-- Copies -->
            <div class="qr-copies" @click.stop>
              <div class="copies-label">Qty</div>
              <div class="copies-row">
                <button class="cp-btn" @click.stop="changeCopies(qr, -1)">−</button>
                <span class="cp-val">{{ qr.copies || 1 }}</span>
                <button class="cp-btn" @click.stop="changeCopies(qr, 1)">+</button>
              </div>
            </div>

            <!-- Actions -->
            <div class="qr-actions" @click.stop>
              <button class="qa-btn" @click.stop="editQR(qr)" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="qa-btn qa-print" @click.stop="printOne(qr)" title="Print this one">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
              <button class="qa-btn qa-del" @click.stop="confirmDelete(qr)" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- ══ DELETE CONFIRM ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Delete QR Code</div>
            <button class="modal-close" @click="deleteTarget = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>Delete QR code for <strong>"{{ deleteTarget?.name }}"</strong> ({{ deleteTarget?.sku }})?<br/>This cannot be undone.</p>
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useInventory } from '@/composables/useInventory'
import { useQRCodes }   from '@/composables/useQRCodes'
import { useEquipment, EQUIPMENT_CATEGORIES as equipmentCategories } from '@/composables/useEquipment'
import { supabase }     from '@/lib/supabase'

const { products, fetchProducts } = useInventory()
const { qrCodes, loading, fetchQRCodes, saveQRCode, deleteQRCode, updateCopies, incrementPrintCount } = useQRCodes()
const { items: equipmentItems, fetchItems } = useEquipment()

onMounted(() => { fetchProducts(); fetchQRCodes(); fetchItems(); loadQRious() })

// ── QRious ────────────────────────────────────
function loadQRious() {
  return new Promise((res) => {
    if (window.QRious) { res(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
    s.onload = res; s.onerror = res
    document.head.appendChild(s)
  })
}

// ── Form ──────────────────────────────────────
const qrType           = ref('product')   // 'product' | 'equipment'
const updateEquipmentDB = ref(true)        // also save back to equipment_items
const pickedEquipment  = ref('')
const useEquipmentPick = ref(false)
const selectedEquipmentId = ref(null)     // id of equipment_items row being edited

const emptyForm = () => ({ name: '', sku: '', category: '', supplier: '', unit: '', notes: '', label_style: 'classic', label_size: 150 })
const form          = ref(emptyForm())
const editing       = ref(null)
const saving        = ref(false)
const labelStyles   = [{ key: 'classic', label: 'Classic' }, { key: 'dark', label: 'Dark' }, { key: 'minimal', label: 'Minimal' }]
const useInventoryPick = ref(false)
const pickedProduct    = ref('')

function setType(type) {
  qrType.value = type
  resetForm()
}

// Check if SKU/serial already exists in library
const skuExists = computed(() =>
  !!form.value.sku && qrCodes.value.some(q => q.sku.toLowerCase() === form.value.sku.toLowerCase() && q.id !== editing.value)
)

function fillFromProduct() {
  if (!pickedProduct.value) return
  const p = pickedProduct.value
  form.value = { ...emptyForm(), name: p.name || '', sku: p.sku || '', category: p.category || '', unit: p.unit || 'pcs' }
}

function fillFromEquipment() {
  if (!pickedEquipment.value) return
  const e = pickedEquipment.value
  selectedEquipmentId.value = e.id
  form.value = {
    ...emptyForm(),
    name:     e.name        || '',
    sku:      e.serial_no   || e.qr_code || '',
    category: e.category    || '',
    supplier: e.location    || '',
    unit:     e.department  || '',
    notes:    e.description || e.condition_notes || '',
  }
}

function editQR(qr) {
  editing.value = qr.id
  // Detect if it was an equipment QR by checking equipment_items
  const matchedEquip = equipmentItems.value.find(e =>
    e.serial_no === qr.sku || e.qr_code === qr.sku
  )
  if (matchedEquip) {
    qrType.value = 'equipment'
    selectedEquipmentId.value = matchedEquip.id
    pickedEquipment.value = matchedEquip
    useEquipmentPick.value = false
  } else {
    qrType.value = 'product'
  }
  form.value = {
    name: qr.name, sku: qr.sku, category: qr.category || '',
    supplier: qr.supplier || '', unit: qr.unit || '',
    notes: qr.notes || '', label_style: qr.label_style || 'classic',
    label_size: qr.label_size || 150,
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  form.value    = emptyForm()
  editing.value = null
  pickedProduct.value    = ''
  pickedEquipment.value  = ''
  useInventoryPick.value = false
  useEquipmentPick.value = false
  selectedEquipmentId.value = null
}

// ── Save to Supabase ──────────────────────────
async function saveQR() {
  if (!form.value.name || !form.value.sku) return
  saving.value = true
  try {
    // 1. Save to qr_codes table
    await saveQRCode({ ...form.value, id: editing.value || undefined })

    // 2. If equipment QR + update DB toggle is on → update equipment_items too
    if (qrType.value === 'equipment' && updateEquipmentDB.value) {
      // Find equipment item by old serial or selected id
      const equipId = selectedEquipmentId.value ||
        equipmentItems.value.find(e => e.serial_no === form.value.sku || e.qr_code === form.value.sku)?.id

      if (equipId) {
        const { error } = await supabase
          .from('equipment_items')
          .update({
            qr_code:         form.value.sku,
            serial_no:       form.value.sku,
            name:            form.value.name,
            category:        form.value.category  || null,
            location:        form.value.supplier  || null,
            department:      form.value.unit       || null,
            description:     form.value.notes     || null,
            condition_notes: form.value.notes     || null,
          })
          .eq('id', equipId)

        if (error) {
          showToast('QR saved but equipment DB update failed: ' + error.message, 'error')
        } else {
          // Refresh local equipment list
          await fetchItems()
          showToast(`"${form.value.name}" saved & equipment database updated ✓`, 'success')
          resetForm()
          return
        }
      } else {
        showToast('QR saved — equipment item not matched in DB (check serial number)', 'success')
      }
    }

    showToast(editing.value ? `"${form.value.name}" updated` : `"${form.value.name}" saved to QR library`, 'success')
    resetForm()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(qr) { deleteTarget.value = qr }
async function doDelete() {
  try {
    await deleteQRCode(deleteTarget.value.id)
    selectedIds.value.delete(deleteTarget.value.id)
    showToast('QR code deleted', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    deleteTarget.value = null
  }
}

// ── Copies ────────────────────────────────────
async function changeCopies(qr, delta) {
  const newVal = Math.max(1, (qr.copies || 1) + delta)
  qr.copies = newVal   // optimistic update
  await updateCopies(qr.id, newVal)
}

// ── Search + Select ───────────────────────────
const search      = ref('')
const selectedIds = ref(new Set())

const filteredQR = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return qrCodes.value
  return qrCodes.value.filter(qr =>
    qr.name?.toLowerCase().includes(q) ||
    qr.sku?.toLowerCase().includes(q) ||
    qr.supplier?.toLowerCase().includes(q) ||
    qr.category?.toLowerCase().includes(q)
  )
})

function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function toggleSelectAll() {
  if (selectedIds.value.size === filteredQR.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredQR.value.map(q => q.id))
  }
}

// ── QR drawing ────────────────────────────────
function buildPayload(qr) {
  // Equipment QR encodes serial field so scanner can look it up
  const isEquip = equipmentItems.value.some(e => e.serial_no === qr.sku || e.qr_code === qr.sku)
  if (isEquip) {
    return JSON.stringify({ serial: qr.sku, name: qr.name, category: qr.category || '', type: 'equipment' })
  }
  return JSON.stringify({ sku: qr.sku, name: qr.name, category: qr.category || '', supplier: qr.supplier || '', unit: qr.unit || 'pcs' })
}

async function drawQR(canvas, payload, size, style) {
  if (!canvas) return
  await loadQRious()
  if (!window.QRious) return
  canvas.width = size; canvas.height = size
  new window.QRious({
    element:    canvas,
    value:      payload,
    size:       size,
    background: style === 'dark' ? '#1A1016' : '#ffffff',
    foreground: style === 'dark' ? '#ffffff' : style === 'minimal' ? '#000000' : '#B01020',
    level:      'H',
    padding:    Math.round(size * 0.04),
  })
}

// Preview canvas
const previewCanvas = ref(null)
watch([form], () => {
  nextTick(() => {
    if (!previewCanvas.value || !form.value.sku) return
    drawQR(previewCanvas.value, buildPayload(form.value), form.value.label_size || 150, form.value.label_style)
  })
}, { deep: true })

// Grid thumbnails
function drawThumb(canvas, qr) {
  if (!canvas) return
  nextTick(() => drawQR(canvas, buildPayload(qr), 70, qr.label_style || 'classic'))
}

// ── PRINT ─────────────────────────────────────
const printing = ref(false)

async function printSelected() {
  const items = filteredQR.value.filter(q => selectedIds.value.has(q.id))
  if (!items.length) return
  await doPrint(items)
  // Increment print count in DB
  incrementPrintCount(items.map(q => q.id))
}

async function printOne(qr) {
  await doPrint([qr])
  incrementPrintCount([qr.id])
}

async function doPrint(items) {
  printing.value = true
  await loadQRious()
  try {
    // Build labels with embedded QR data URLs
    const labels = []
    for (const qr of items) {
      const canvas = document.createElement('canvas')
      await drawQR(canvas, buildPayload(qr), qr.label_size || 150, qr.label_style || 'classic')
      const qrDataUrl = canvas.toDataURL('image/png')
      for (let i = 0; i < (qr.copies || 1); i++) {
        labels.push({ ...qr, qrDataUrl })
      }
    }

    const html = buildPrintHtml(labels)

    // Use Blob URL → opens in a real Chrome tab → Chrome print dialog (not Epson fax)
    const blob = new Blob([html], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    const win = window.open(blobUrl, '_blank')

    if (!win) {
      // Popup blocked — fallback to iframe
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;'
      document.body.appendChild(iframe)
      iframe.contentDocument.open()
      iframe.contentDocument.write(html)
      iframe.contentDocument.close()
      await new Promise(r => setTimeout(r, 1000))
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 3000)
    } else {
      // Clean up blob URL after window loads
      win.onload = () => {
        setTimeout(() => {
          win.print()
          URL.revokeObjectURL(blobUrl)
        }, 500)
      }
      // Fallback if onload doesn't fire
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    }

    showToast('Print dialog opened!', 'success')
  } catch (err) {
    showToast('Print error: ' + err.message, 'error')
  } finally {
    printing.value = false
  }
}

function buildPrintHtml(labels) {
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const labelHtml = labels.map(item => {
    const isDark = (item.label_style||'classic') === 'dark'
    const isMin  = (item.label_style||'classic') === 'minimal'
    const bg     = isDark ? '#1A1016' : '#fff'
    const fg     = isDark ? '#fff' : isMin ? '#000' : '#B01020'
    return `
      <div class="label" style="background:${bg};border:1.5px solid ${isDark?'#333':'#ccc'};">
        <img src="${item.qrDataUrl}" class="label-qr"/>
        <div class="label-text" style="color:${isDark?'#fff':'#1A1016'};">
          <div class="label-name">${esc(item.name)}</div>
          <div class="label-sku" style="color:${fg};">SKU: ${esc(item.sku)}</div>
          ${item.supplier ? `<div class="label-supplier">${esc(item.supplier)}</div>` : ''}
          ${item.category ? `<div class="label-meta">${esc(item.category)}${item.unit?' · '+item.unit:''}</div>` : ''}
          ${item.notes    ? `<div class="label-notes">${esc(item.notes)}</div>` : ''}
          <div class="label-brand" style="color:${fg};">SLU Branding</div>
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Labels</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Outfit',sans-serif;background:white;padding:10mm}
    /* Grid: 2 columns on A4, auto rows */
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5mm;width:100%}
    .label{display:flex;align-items:center;gap:8px;border-radius:8px;padding:10px 12px;page-break-inside:avoid;break-inside:avoid;border:1.5px solid #ccc;box-sizing:border-box}
    .label-qr{flex-shrink:0;width:28%;aspect-ratio:1/1;image-rendering:pixelated}
    .label-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
    .label-name{font-size:9.5pt;font-weight:700;line-height:1.2;word-break:break-word}
    .label-sku{font-size:7.5pt;font-weight:700;font-family:monospace}
    .label-supplier{font-size:7pt;opacity:.75}
    .label-meta{font-size:6.5pt;opacity:.6}
    .label-notes{font-size:6pt;font-style:italic;opacity:.65}
    .label-brand{font-size:5.5pt;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-top:4px;padding-top:3px;border-top:.5px solid #ddd;opacity:.7}
    @media print{
      body{background:white;padding:0;margin:0}
      @page{margin:10mm;size:A4 portrait}
      .grid{gap:4mm}
    }
  </style></head>
  <body><div class="grid">${labelHtml}</div></body></html>`
}

// ── Helpers ───────────────────────────────────
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(msg, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message: msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 2800)
}
</script>


<style scoped>
.qr-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; width: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.header-actions { display: flex; gap: 8px; }
.btn-primary { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary:hover:not(:disabled) { background: #7A0A17; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Layout */
.main-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }

/* Form card */
.form-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 13px; }
.form-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #1A1016; }
.form-divider { height: 1px; background: #F0E5E7; }
/* Type switcher */
.type-switcher { display: flex; gap: 6px; background: #F7F3F4; border-radius: 12px; padding: 4px; }
.type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 10px; border: none; border-radius: 9px; background: transparent; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; color: #9A8589; cursor: pointer; transition: all 0.2s; }
.type-btn:hover { color: #3D2830; }
.type-btn.active { background: white; color: #B01020; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

/* Update DB row */
.update-row { align-items: flex-start !important; }
.eq-db-notice { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 10px 13px; font-size: 12px; color: #2563EB; display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }

.import-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: #F7F3F4; border-radius: 10px; }
.import-label { font-size: 13px; font-weight: 500; color: #3D2830; }
.toggle-wrap { width: 40px; height: 22px; background: #DDD5D7; border-radius: 11px; cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0; }
.toggle-wrap.on { background: #B01020; }
.toggle-wrap::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
.toggle-wrap.on::after { transform: translateX(18px); }
.inventory-picker { display: flex; flex-direction: column; gap: 5px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #3D2830; }
.req { color: #B01020; }
.form-input { width: 100%; padding: 9px 13px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; }
.form-select { cursor: pointer; }
.input-warn { border-color: #F59E0B !important; }
.form-hint { font-size: 11px; color: #9A8589; }
.form-hint.warn { color: #D97706; font-weight: 500; }
.style-picker { display: flex; gap: 6px; }
.style-option { flex: 1; padding: 7px; border: 1.5px solid #EDE3E5; border-radius: 9px; font-size: 12px; font-weight: 500; color: #6B5257; cursor: pointer; text-align: center; transition: all 0.15s; }
.style-option:hover { border-color: #B01020; color: #B01020; }
.style-option.active { background: #B01020; border-color: #B01020; color: white; }

/* Inline preview */
.inline-preview { border: 1.5px dashed #EDE3E5; border-radius: 12px; padding: 12px; }
.ip-label { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; margin-bottom: 10px; }
.preview-label-box { display: flex; align-items: center; gap: 10px; }
.preview-label-box.style-dark { background: #1A1016; padding: 8px; border-radius: 8px; }
.preview-qr-canvas { flex-shrink: 0; display: block; border-radius: 4px; }
.plb-info { flex: 1; min-width: 0; }
.plb-name { font-size: 12px; font-weight: 700; color: #1A1016; line-height: 1.2; margin-bottom: 2px; }
.style-dark .plb-name { color: #fff; }
.plb-sku { font-size: 10px; font-weight: 700; color: #B01020; font-family: monospace; }
.style-dark .plb-sku { color: rgba(255,255,255,0.7); }
.plb-supplier, .plb-meta { font-size: 10px; color: #9A8589; }
.style-dark .plb-supplier, .style-dark .plb-meta { color: rgba(255,255,255,0.45); }
.plb-notes { font-size: 9px; color: #9A8589; font-style: italic; }
.plb-brand { font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #B01020; border-top: 1px solid #EDE3E5; padding-top: 3px; margin-top: 3px; }
.style-dark .plb-brand { color: rgba(255,255,255,0.4); border-top-color: rgba(255,255,255,0.1); }

.form-actions { display: flex; gap: 8px; }
.btn-save-qr { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 11px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-save-qr:hover:not(:disabled) { background: #7A0A17; }
.btn-save-qr:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reset { padding: 11px 16px; background: white; color: #9A8589; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; cursor: pointer; }
.btn-reset:hover { border-color: #9A8589; color: #3D2830; }

/* Right col */
.right-col { display: flex; flex-direction: column; gap: 14px; }
.library-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.library-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; display: flex; align-items: center; gap: 8px; }
.lib-count { font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; background: #B01020; color: white; padding: 2px 9px; border-radius: 20px; }
.lib-actions { display: flex; gap: 8px; align-items: center; }
.search-wrap { display: flex; align-items: center; gap: 7px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; padding: 7px 12px; }
.search-wrap:focus-within { border-color: #B01020; }
.search-input { border: none; background: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; width: 160px; }
.btn-select-all { padding: 7px 13px; background: white; border: 1.5px solid #EDE3E5; border-radius: 9px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 500; color: #6B5257; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.btn-select-all:hover { border-color: #B01020; color: #B01020; }
.lib-loading, .lib-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 50px; background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; color: #9A8589; font-size: 13px; text-align: center; }
.spinner-lg { width: 26px; height: 26px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* QR Grid */
.qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.qr-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 0.18s; position: relative; }
.qr-card:hover { border-color: #B01020; box-shadow: 0 4px 16px rgba(176,16,32,0.08); }
.qr-card.selected { border-color: #B01020; background: #FFF5F6; box-shadow: 0 0 0 3px rgba(176,16,32,0.12); }
.qr-check { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 6px; border: 2px solid #EDE3E5; background: white; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.qr-card.selected .qr-check { background: #B01020; border-color: #B01020; }
.qr-canvas-wrap { display: flex; justify-content: center; }
.qr-thumb { display: block; border-radius: 8px; }
.qr-info { text-align: center; }
.qr-name { font-size: 13px; font-weight: 700; color: #1A1016; margin-bottom: 2px; }
.qr-sku  { font-size: 11px; font-weight: 700; color: #B01020; font-family: monospace; margin-bottom: 3px; }
.qr-meta { font-size: 11px; color: #9A8589; margin-bottom: 4px; }
.qr-stats { display: flex; justify-content: center; gap: 10px; }
.qr-stat  { font-size: 10px; color: #C4ADAF; display: flex; align-items: center; gap: 3px; }
.qr-copies { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.copies-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #9A8589; }
.copies-row { display: flex; align-items: center; gap: 8px; }
.cp-btn { width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid #EDE3E5; background: white; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B5257; transition: all 0.15s; }
.cp-btn:hover { border-color: #B01020; color: #B01020; }
.cp-val { font-size: 15px; font-weight: 700; color: #1A1016; min-width: 24px; text-align: center; }
.qr-actions { display: flex; justify-content: center; gap: 6px; }
.qa-btn { width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid #EDE3E5; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9A8589; transition: all 0.15s; }
.qa-btn:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }
.qa-del:hover { border-color: #DC2626; color: #DC2626; background: #FEF2F2; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 0; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; }
.modal-close { background: #F7F3F4; border: none; border-radius: 8px; color: #9A8589; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 14px 22px; font-size: 13px; color: #3D2830; line-height: 1.6; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 10px 22px 20px; }
.btn-cancel { padding: 9px 18px; background: none; border: 1.5px solid #EDE3E5; border-radius: 9px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #9A8589; cursor: pointer; }
.btn-delete { padding: 9px 18px; background: #DC2626; color: white; border: none; border-radius: 9px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }

/* Spinner */
.spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Toast */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 12px; font-size: 13px; font-weight: 500; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 10000; white-space: nowrap; }
.toast-success { background: #1A1016; }
.toast-error   { background: #B01020; }

.modal-fade-enter-active { transition: all 0.28s cubic-bezier(0.16,1,0.3,1); }
.modal-fade-leave-active { transition: all 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal { transform: scale(0.95) translateY(10px); }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }

@media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } .qr-grid { grid-template-columns: 1fr 1fr; } }
</style>