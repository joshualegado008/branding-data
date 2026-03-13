<template>
  <div class="qr-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">QR Code Generator</div>
        <div class="page-sub">Create and print QR labels for your inventory items</div>
      </div>
      <div class="header-actions">
        <button class="btn-outline" @click="clearAll" :disabled="qrList.length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Clear All
        </button>
        <button class="btn-primary" @click="printAll" :disabled="qrList.length === 0 || printing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          {{ printing ? 'Preparing…' : `Print All (${qrList.length})` }}
        </button>
      </div>
    </div>

    <div class="main-layout">

      <!-- ── LEFT: Form ── -->
      <div class="form-card">
        <div class="form-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="1.8" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Item Details
        </div>

        <!-- Pick from inventory -->
        <div class="import-row">
          <span class="import-label">Pick from inventory</span>
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
            <input class="form-input" v-model="form.sku" placeholder="e.g. SLU-001" maxlength="30" />
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
            <select class="form-input form-select" v-model.number="qrSize">
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

        <!-- Label style -->
        <div class="form-field">
          <label class="form-label">Label Style</label>
          <div class="style-picker">
            <div v-for="s in labelStyles" :key="s.key"
              class="style-option" :class="{ active: labelStyle === s.key }"
              @click="labelStyle = s.key">{{ s.label }}</div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-add" @click="addToList" :disabled="!form.name || !form.sku">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add to Print List
          </button>
          <button class="btn-reset" @click="resetForm">Reset</button>
        </div>
      </div>

      <!-- ── RIGHT: Preview + List ── -->
      <div class="right-col">

        <!-- Live preview -->
        <div class="preview-card" v-if="form.name || form.sku">
          <div class="preview-label">Live Preview</div>
          <div class="preview-label-box" :class="'style-' + labelStyle">
            <canvas ref="previewCanvas" class="preview-qr-canvas"></canvas>
            <div class="plb-info">
              <div class="plb-name">{{ form.name || '—' }}</div>
              <div class="plb-sku">{{ form.sku || '—' }}</div>
              <div class="plb-supplier" v-if="form.supplier">{{ form.supplier }}</div>
              <div class="plb-meta" v-if="form.category">{{ form.category }}<span v-if="form.unit"> · {{ form.unit }}</span></div>
              <div class="plb-notes" v-if="form.notes">{{ form.notes }}</div>
              <div class="plb-brand">SLU Branding</div>
            </div>
          </div>
        </div>
        <div class="preview-empty" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="#DDD0D2" stroke-width="1.2" width="52" height="52"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Fill in the form to preview your label</span>
        </div>

        <!-- Print list -->
        <div class="print-list" v-if="qrList.length > 0">
          <div class="print-list-header">
            <span>Print List</span>
            <span class="print-count">{{ qrList.length }} item{{ qrList.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="print-item" v-for="(item, i) in qrList" :key="item.id">
            <div class="pi-qr-thumb">
              <canvas :ref="el => drawThumb(el, item)" width="40" height="40"></canvas>
            </div>
            <div class="pi-info">
              <div class="pi-name">{{ item.name }}</div>
              <div class="pi-meta">{{ item.sku }}<span v-if="item.supplier"> · {{ item.supplier }}</span></div>
            </div>
            <div class="pi-qty-wrap">
              <span class="pi-qty-label">Qty</span>
              <input class="pi-qty" type="number" v-model.number="item.copies" min="1" max="99" />
            </div>
            <button class="pi-remove" @click="removeFromList(i)" title="Remove">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div class="toast" v-if="toast.show" :class="'toast-' + toast.type">{{ toast.message }}</div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useInventory } from '@/composables/useInventory'

const { products, fetchProducts } = useInventory()
onMounted(() => { fetchProducts(); loadQRious() })

// ── QRious loader ─────────────────────────────
function loadQRious() {
  return new Promise((res) => {
    if (window.QRious) { res(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
    s.onload = res
    s.onerror = res
    document.head.appendChild(s)
  })
}

// ── Form state ────────────────────────────────
const form = ref({ name: '', sku: '', category: '', supplier: '', unit: 'pcs', notes: '' })
const qrSize      = ref(150)
const labelStyle  = ref('classic')
const labelStyles = [
  { key: 'classic', label: 'Classic' },
  { key: 'dark',    label: 'Dark' },
  { key: 'minimal', label: 'Minimal' },
]

const useInventoryPick = ref(false)
const pickedProduct    = ref('')

function fillFromProduct() {
  if (!pickedProduct.value) return
  const p = pickedProduct.value
  form.value = { name: p.name || '', sku: p.sku || '', category: p.category || '', supplier: '', unit: p.unit || 'pcs', notes: '' }
}

function resetForm() {
  form.value = { name: '', sku: '', category: '', supplier: '', unit: 'pcs', notes: '' }
  pickedProduct.value = ''
}

// ── QR payload ────────────────────────────────
function buildPayload(item) {
  return JSON.stringify({
    sku:      item.sku,
    name:     item.name,
    category: item.category || '',
    supplier: item.supplier || '',
    unit:     item.unit     || 'pcs',
  })
}

// ── Draw QR to a canvas element ───────────────
async function drawQR(canvas, payload, size, style) {
  if (!canvas) return
  await loadQRious()
  if (!window.QRious) return
  canvas.width  = size
  canvas.height = size
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

// ── Live preview canvas ───────────────────────
const previewCanvas = ref(null)

watch([form, qrSize, labelStyle], () => {
  nextTick(() => {
    if (!previewCanvas.value || !form.value.sku) return
    drawQR(previewCanvas.value, buildPayload(form.value), qrSize.value, labelStyle.value)
  })
}, { deep: true })

// ── Print list ────────────────────────────────
const qrList  = ref([])
let   idCount = 0

function addToList() {
  if (!form.value.name || !form.value.sku) return
  const exists = qrList.value.find(i => i.sku === form.value.sku)
  if (exists) { exists.copies++; showToast(`+1 copy for ${form.value.sku}`, 'success'); return }
  qrList.value.push({ ...form.value, id: ++idCount, copies: 1, style: labelStyle.value, size: qrSize.value })
  showToast(`"${form.value.name}" added to print list`, 'success')
}

function removeFromList(i) { qrList.value.splice(i, 1) }
function clearAll() { qrList.value = [] }

// Thumbnail canvases in the list
function drawThumb(canvas, item) {
  if (!canvas) return
  nextTick(() => drawQR(canvas, buildPayload(item), 40, item.style || 'classic'))
}

// ── PRINT ─────────────────────────────────────
const printing    = ref(false)
let   printIframe = null

async function printAll() {
  if (!qrList.value.length) return
  printing.value = true
  await loadQRious()

  try {
    // 1. Render every QR to offscreen canvas → PNG data URL (fully self-contained, no network)
    const labels = []
    for (const item of qrList.value) {
      const qrDataUrl = await getQRDataUrl(item)
      for (let c = 0; c < (item.copies || 1); c++) {
        labels.push({ ...item, qrDataUrl })
      }
    }

    // 2. Build self-contained HTML string with inline images
    const html = buildPrintHtml(labels)

    // 3. Inject into a hidden iframe inside this page — bypasses popup blockers entirely
    if (!printIframe) {
      printIframe = document.createElement('iframe')
      printIframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;'
      document.body.appendChild(printIframe)
    }

    printIframe.contentDocument.open()
    printIframe.contentDocument.write(html)
    printIframe.contentDocument.close()

    // 4. Wait for fonts + content to settle, then print from iframe context
    await new Promise(resolve => setTimeout(resolve, 900))
    printIframe.contentWindow.focus()
    printIframe.contentWindow.print()

    showToast('Print dialog opened!', 'success')
  } catch (err) {
    showToast('Print error: ' + err.message, 'error')
  } finally {
    printing.value = false
  }
}

async function getQRDataUrl(item) {
  return new Promise(async (resolve) => {
    const canvas = document.createElement('canvas')
    const size = item.size || 160
    await drawQR(canvas, buildPayload(item), size, item.style || 'classic')
    resolve(canvas.toDataURL('image/png'))
  })
}

function buildPrintHtml(labels) {
  const labelHtml = labels.map(item => {
    const isDark    = (item.style || 'classic') === 'dark'
    const isMinimal = (item.style || 'classic') === 'minimal'
    const bg        = isDark ? '#1A1016' : '#ffffff'
    const fg        = isDark ? '#ffffff' : isMinimal ? '#000000' : '#B01020'
    const border    = isDark ? '1.5px solid #333' : '1.5px solid #ccc'

    return `
      <div class="label" style="background:${bg}; border:${border}; color:${fg};">
        <img src="${item.qrDataUrl}" class="label-qr" />
        <div class="label-text" style="color:${isDark ? '#fff' : '#1A1016'};">
          <div class="label-name">${escHtml(item.name)}</div>
          <div class="label-sku" style="color:${fg};">SKU: ${escHtml(item.sku)}</div>
          ${item.supplier ? `<div class="label-supplier">${escHtml(item.supplier)}</div>` : ''}
          ${item.category ? `<div class="label-meta">${escHtml(item.category)}${item.unit ? ' · ' + item.unit : ''}</div>` : ''}
          ${item.notes    ? `<div class="label-notes">${escHtml(item.notes)}</div>` : ''}
          <div class="label-brand" style="border-top:0.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#eee'}; color:${fg};">SLU Branding</div>
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QR Labels — SLU Branding</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #f5f5f5; padding: 12mm; }
    .grid { display: flex; flex-wrap: wrap; gap: 5mm; }
    .label {
      display: flex; align-items: center; gap: 7px;
      border-radius: 8px; padding: 8px 10px;
      page-break-inside: avoid; break-inside: avoid;
      width: 8.5cm; min-height: 4.5cm;
    }
    .label-qr { flex-shrink: 0; width: 35%; aspect-ratio: 1/1; image-rendering: pixelated; }
    .label-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .label-name { font-size: 9pt; font-weight: 700; line-height: 1.2; word-break: break-word; }
    .label-sku  { font-size: 7pt; font-weight: 700; font-family: monospace; }
    .label-supplier { font-size: 6.5pt; opacity: 0.75; }
    .label-meta  { font-size: 6pt; opacity: 0.6; }
    .label-notes { font-size: 6pt; font-style: italic; opacity: 0.65; }
    .label-brand { font-size: 5.5pt; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 4px; padding-top: 3px; opacity: 0.7; }
    @media print {
      body { background: white; padding: 8mm; }
      .grid { gap: 4mm; }
      @page { margin: 8mm; }
    }
  </style>
</head>
<body>
  <div class="grid">${labelHtml}</div>
</body>
</html>`
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Toast ─────────────────────────────────────
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
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-primary { display: flex; align-items: center; gap: 7px; padding: 9px 18px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary:hover:not(:disabled) { background: #7A0A17; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: white; color: #6B5257; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover:not(:disabled) { border-color: #B01020; color: #B01020; }
.btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

.main-layout { display: grid; grid-template-columns: 360px 1fr; gap: 20px; align-items: start; }

/* Form card */
.form-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 13px; }
.form-card-title { display: flex; align-items: center; gap: 8px; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #1A1016; }
.form-divider { height: 1px; background: #F0E5E7; }
.import-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: #F7F3F4; border-radius: 10px; }
.import-label { font-size: 13px; font-weight: 500; color: #3D2830; }
.toggle-wrap { width: 40px; height: 22px; background: #DDD5D7; border-radius: 11px; cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0; }
.toggle-wrap.on { background: #B01020; }
.toggle-wrap::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
.toggle-wrap.on::after { transform: translateX(18px); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #3D2830; }
.req { color: #B01020; }
.form-input { width: 100%; padding: 9px 13px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.08); }
.form-select { cursor: pointer; }
.inventory-picker { display: flex; flex-direction: column; gap: 5px; }
.style-picker { display: flex; gap: 6px; }
.style-option { flex: 1; padding: 7px; border: 1.5px solid #EDE3E5; border-radius: 9px; font-size: 12px; font-weight: 500; color: #6B5257; cursor: pointer; text-align: center; transition: all 0.15s; }
.style-option:hover { border-color: #B01020; color: #B01020; }
.style-option.active { background: #B01020; border-color: #B01020; color: white; }
.form-actions { display: flex; gap: 8px; }
.btn-add { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add:hover:not(:disabled) { background: #7A0A17; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reset { padding: 10px 16px; background: white; color: #9A8589; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.18s; }
.btn-reset:hover { border-color: #9A8589; color: #3D2830; }

/* Right column */
.right-col { display: flex; flex-direction: column; gap: 16px; }

/* Preview */
.preview-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 18px; }
.preview-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #9A8589; margin-bottom: 14px; }
.preview-label-box {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; border-radius: 12px; border: 1.5px dashed #EDE3E5;
  max-width: 420px;
}
.preview-label-box.style-dark    { background: #1A1016; border-color: #333; }
.preview-label-box.style-minimal { background: white; border-color: #999; }
.preview-label-box.style-classic { background: white; }
.preview-qr-canvas { flex-shrink: 0; display: block; border-radius: 6px; }
.plb-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.plb-name { font-size: 14px; font-weight: 700; color: #1A1016; line-height: 1.2; }
.style-dark .plb-name { color: #fff; }
.plb-sku { font-size: 11px; font-weight: 700; color: #B01020; font-family: monospace; }
.style-dark .plb-sku { color: rgba(255,255,255,0.8); }
.plb-supplier { font-size: 11px; color: #6B5257; }
.style-dark .plb-supplier { color: rgba(255,255,255,0.55); }
.plb-meta { font-size: 10px; color: #9A8589; }
.style-dark .plb-meta { color: rgba(255,255,255,0.4); }
.plb-notes { font-size: 10px; color: #6B5257; font-style: italic; }
.plb-brand { font-size: 8px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #B01020; border-top: 1px solid #EDE3E5; padding-top: 5px; margin-top: 3px; }
.style-dark .plb-brand { color: rgba(255,255,255,0.5); border-top-color: rgba(255,255,255,0.15); }

.preview-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; color: #C4ADAF; font-size: 13px; text-align: center; }

/* Print list */
.print-list { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; overflow: hidden; }
.print-list-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #F0E5E7; font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: #1A1016; }
.print-count { font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; background: #B01020; color: white; padding: 2px 9px; border-radius: 20px; }
.print-item { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-bottom: 1px solid #F7F3F4; transition: background 0.15s; }
.print-item:last-child { border-bottom: none; }
.print-item:hover { background: #FFF5F6; }
.pi-qr-thumb { flex-shrink: 0; width: 40px; height: 40px; background: #F7F3F4; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.pi-qr-thumb canvas { display: block; }
.pi-info { flex: 1; min-width: 0; }
.pi-name { font-size: 13px; font-weight: 600; color: #1A1016; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pi-meta { font-size: 10px; color: #9A8589; font-family: monospace; }
.pi-qty-wrap { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.pi-qty-label { font-size: 10px; color: #9A8589; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.pi-qty { width: 44px; padding: 4px 6px; border: 1.5px solid #EDE3E5; border-radius: 7px; font-family: 'Outfit', sans-serif; font-size: 13px; text-align: center; outline: none; background: #F7F3F4; color: #1A1016; }
.pi-qty:focus { border-color: #B01020; background: white; }
.pi-remove { width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #EDE3E5; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9A8589; transition: all 0.15s; flex-shrink: 0; }
.pi-remove:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }

/* Toast */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 12px; font-size: 13px; font-weight: 500; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 10000; white-space: nowrap; }
.toast-success { background: #1A1016; }
.toast-error   { background: #B01020; }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

@media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } .form-actions { flex-direction: column; } }
</style>