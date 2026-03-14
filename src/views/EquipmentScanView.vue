<template>
  <div class="scan-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Equipment QR Scanner</div>
        <div class="page-sub">Scan an equipment QR code to borrow or return it</div>
      </div>
      <router-link to="/dashboard/equipment" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Equipment
      </router-link>
    </div>

    <div class="scan-layout">

      <!-- ── LEFT: Scanner ── -->
      <div class="scanner-card">
        <div class="sc-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="16" height="16"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
          Scan Equipment QR
        </div>

        <!-- Step: scanning -->
        <template v-if="step === 'scanning'">
          <div class="scan-hint">Point camera at the equipment's QR label</div>
          <div class="scan-viewport">
            <div id="equip-qr-reader"></div>
            <div class="scan-overlay">
              <div class="sc-corner tl"></div><div class="sc-corner tr"></div>
              <div class="sc-corner bl"></div><div class="sc-corner br"></div>
              <div class="sc-line" :class="{ active: cameraOn }"></div>
            </div>
          </div>
          <div class="scan-status" :class="'ss-' + status.type" v-if="status.msg">
            <div class="ss-spinner" v-if="status.type === 'loading'"></div>
            {{ status.msg }}
          </div>
          <div class="manual-fallback">
            <div class="mf-label">Or enter serial number manually</div>
            <div class="mf-row">
              <input class="form-input" v-model="manualCode" placeholder="e.g. CAM-001" @keydown.enter="processCode(manualCode)" />
              <button class="btn-lookup" @click="processCode(manualCode)" :disabled="!manualCode.trim()">Look Up</button>
            </div>
          </div>
        </template>

        <!-- Step: item found → borrow form -->
        <template v-if="step === 'borrow'">
          <div class="item-card">
            <div class="item-card-header">
              <div class="item-available-badge">
                <i class="bi bi-check-circle-fill"></i> Available
              </div>
              <div class="item-serial">{{ foundItem.serial_no || foundItem.qr_code }}</div>
            </div>
            <div class="item-name">{{ foundItem.name }}</div>
            <div class="item-meta-row">
              <span class="item-tag">{{ foundItem.category }}</span>
              <span class="item-tag" v-if="foundItem.location">
                <i class="bi bi-geo-alt-fill"></i> {{ foundItem.location }}
              </span>
              <span class="item-tag" v-if="foundItem.department">{{ foundItem.department }}</span>
            </div>
            <div class="item-condition">
              <span class="cond-dot" :class="'cond-' + foundItem.condition"></span>
              Condition: <strong>{{ foundItem.condition }}</strong>
            </div>
            <div class="item-desc" v-if="foundItem.description">{{ foundItem.description }}</div>
            <div class="item-notes" v-if="foundItem.condition_notes">
              <i class="bi bi-info-circle"></i> {{ foundItem.condition_notes }}
            </div>
          </div>

          <div class="borrow-form">
            <div class="bf-title">Borrow Details</div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Borrower Name <span class="req">*</span></label>
                <input class="form-input" v-model="borrowForm.borrowerName" placeholder="Your full name" maxlength="80" />
                <div class="form-hint">Auto-filled from your account — edit if borrowing on behalf of someone</div>
                <div class="form-error" v-if="formErrors.borrowerName">{{ formErrors.borrowerName }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Department / Office</label>
                <input class="form-input" v-model="borrowForm.department" placeholder="e.g. SLU Branding Office" maxlength="80" />
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Purpose / Reason <span class="req">*</span></label>
              <input class="form-input" v-model="borrowForm.purpose" placeholder="e.g. Event documentation for SLU Day" maxlength="120" />
              <div class="form-error" v-if="formErrors.purpose">{{ formErrors.purpose }}</div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Expected Return <span class="req">*</span></label>
                <input class="form-input" type="date" v-model="borrowForm.expectedReturn" :min="today" />
                <div class="form-error" v-if="formErrors.expectedReturn">{{ formErrors.expectedReturn }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Quantity</label>
                <div class="qty-row">
                  <button class="qty-btn" @click="borrowForm.quantity = Math.max(1, borrowForm.quantity - 1)">−</button>
                  <input class="form-input qty-input" type="number" v-model.number="borrowForm.quantity" min="1" />
                  <button class="qty-btn" @click="borrowForm.quantity++">+</button>
                </div>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Current Condition</label>
              <div class="condition-picker">
                <button v-for="opt in conditionOpts" :key="opt.value"
                  class="cp-opt" :class="{ active: borrowForm.condition === opt.value, ['cp-' + opt.value]: true }"
                  @click="borrowForm.condition = opt.value">
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-cancel-scan" @click="resetScan">← Scan Again</button>
              <button class="btn-borrow" @click="submitBorrow" :disabled="saving">
                <div class="spinner-sm" v-if="saving"></div>
                <span v-else>
                  <i class="bi bi-box-arrow-right"></i> Confirm Borrow
                </span>
              </button>
            </div>
          </div>
        </template>

        <!-- Step: item already borrowed → return -->
        <template v-if="step === 'return'">
          <div class="item-card item-card-borrowed">
            <div class="item-card-header">
              <div class="item-borrowed-badge">
                <i class="bi bi-clock-fill"></i> Currently Borrowed
              </div>
              <div class="item-serial">{{ foundItem.serial_no || foundItem.qr_code }}</div>
            </div>
            <div class="item-name">{{ foundItem.name }}</div>
            <div class="item-meta-row">
              <span class="item-tag">{{ foundItem.category }}</span>
              <span class="item-tag" v-if="foundItem.location">
                <i class="bi bi-geo-alt-fill"></i> {{ foundItem.location }}
              </span>
            </div>
            <div class="item-desc" v-if="foundItem.description">{{ foundItem.description }}</div>
          </div>

          <!-- Who has it -->
          <div class="borrow-info-box">
            <div class="bib-row">
              <span class="bib-key">Borrowed by</span>
              <span class="bib-val"><strong>{{ activeBorrow.borrower_name }}</strong></span>
            </div>
            <div class="bib-row" v-if="activeBorrow.borrower_dept">
              <span class="bib-key">Department</span>
              <span class="bib-val">{{ activeBorrow.borrower_dept }}</span>
            </div>
            <div class="bib-row">
              <span class="bib-key">Since</span>
              <span class="bib-val">{{ formatDate(activeBorrow.borrow_date) }}</span>
            </div>
            <div class="bib-row">
              <span class="bib-key">Purpose</span>
              <span class="bib-val">{{ activeBorrow.reason }}</span>
            </div>
            <div class="bib-row">
              <span class="bib-key">Due</span>
              <span class="bib-val" :class="isOverdue(activeBorrow) ? 'text-red' : ''">
                {{ formatDate(activeBorrow.expected_return) }}
                <span class="overdue-tag" v-if="isOverdue(activeBorrow)">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  {{ daysOverdue(activeBorrow.expected_return) }}d overdue
                </span>
              </span>
            </div>
          </div>

          <!-- Confirm it's same item -->
          <div class="verify-box">
            <div class="verify-title">
              <i class="bi bi-shield-check"></i>
              Verify Item Before Return
            </div>
            <div class="verify-checks">
              <label class="verify-check">
                <input type="checkbox" v-model="verified.serial" />
                Serial number matches: <strong>{{ foundItem.serial_no }}</strong>
              </label>
              <label class="verify-check">
                <input type="checkbox" v-model="verified.name" />
                Item is: <strong>{{ foundItem.name }}</strong>
              </label>
              <label class="verify-check" v-if="foundItem.description">
                <input type="checkbox" v-model="verified.desc" />
                Matches description: <em>{{ foundItem.description }}</em>
              </label>
            </div>
          </div>

          <div class="return-form">
            <div class="bf-title">Return Details</div>
            <div class="form-field">
              <label class="form-label">Condition on Return <span class="req">*</span></label>
              <div class="condition-picker">
                <button v-for="opt in conditionOpts" :key="opt.value"
                  class="cp-opt" :class="{ active: returnForm.condition === opt.value, ['cp-' + opt.value]: true }"
                  @click="returnForm.condition = opt.value">
                  {{ opt.label }}
                </button>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Return Notes (optional)</label>
              <input class="form-input" v-model="returnForm.notes" placeholder="Any damage, missing parts, etc." maxlength="200" />
            </div>

            <div class="form-actions">
              <button class="btn-cancel-scan" @click="resetScan">← Scan Again</button>
              <button class="btn-return" @click="submitReturn" :disabled="saving || !allVerified">
                <div class="spinner-sm" v-if="saving"></div>
                <span v-else>
                  <i class="bi bi-box-arrow-in-left"></i> Confirm Return
                </span>
              </button>
            </div>
            <div class="verify-warning" v-if="!allVerified">
              <i class="bi bi-exclamation-circle"></i>
              Please check all verification boxes above before returning
            </div>
          </div>
        </template>

        <!-- Step: not found -->
        <template v-if="step === 'not-found'">
          <div class="not-found-box">
            <i class="bi bi-search empty-bi"></i>
            <div class="nf-title">Equipment Not Found</div>
            <div class="nf-sub">No equipment found with code <strong>"{{ lastScanned }}"</strong></div>
            <div class="nf-hint">Make sure you're scanning an equipment QR label (not a product label). Ask your admin to generate equipment QR codes.</div>
            <button class="btn-cancel-scan" @click="resetScan">← Try Again</button>
          </div>
        </template>

        <!-- Step: success -->
        <template v-if="step === 'success'">
          <div class="success-box">
            <i class="bi bi-check-circle-fill success-bi"></i>
            <div class="success-title">{{ successMsg }}</div>
            <div class="success-sub" v-if="successSub">{{ successSub }}</div>
            <div class="success-actions">
              <button class="btn-scan-another" @click="resetScan">Scan Another</button>
              <router-link to="/dashboard/equipment" class="btn-view-all">View All Equipment</router-link>
            </div>
          </div>
        </template>

      </div>

      <!-- ── RIGHT: Recent scans today ── -->
      <div class="right-panel">
        <div class="recent-title">
          <i class="bi bi-clock-history"></i>
          Today's Activity
        </div>

        <div class="recent-loading" v-if="loadingRecent">
          <div class="spinner-sm-gray"></div>
        </div>

        <div class="recent-empty" v-else-if="todayRecords.length === 0">
          No borrow/return activity today
        </div>

        <div class="recent-list" v-else>
          <div class="recent-item" v-for="r in todayRecords" :key="r.id">
            <div class="ri-icon" :class="r.status === 'returned' ? 'ri-return' : 'ri-borrow'">
              <i :class="r.status === 'returned' ? 'bi bi-box-arrow-in-left' : 'bi bi-box-arrow-right'"></i>
            </div>
            <div class="ri-info">
              <div class="ri-name">{{ r.item_name }}</div>
              <div class="ri-who">{{ r.borrower_name }}</div>
              <div class="ri-time">{{ timeOnly(r.status === 'returned' ? r.returned_at : r.borrowed_at) }}</div>
            </div>
            <span class="ri-badge" :class="r.status === 'returned' ? 'rb-return' : 'rb-borrow'">
              {{ r.status === 'returned' ? 'Returned' : 'Borrowed' }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- Toast -->
    <Teleport to="body"><Transition name="toast">
      <div class="toast" v-if="toast.show" :class="'toast-' + toast.type">{{ toast.message }}</div>
    </Transition></Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useEquipment } from '@/composables/useEquipment'
import { getProfile }   from '@/composables/useAuth'
import { logActivity }  from '@/composables/useActivityLog'

const {
  records, loading: loadingRecent,
  fetchRecords, fetchItems,
  findItemByQR, getActiveBorrow,
  borrowViaQR, returnViaQR,
  formatDate, daysOverdue, isOverdue,
} = useEquipment()

const profile     = ref(null)
const today       = new Date().toISOString().split('T')[0]

const conditionOpts = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good',      label: 'Good'      },
  { value: 'fair',      label: 'Fair'      },
  { value: 'poor',      label: 'Poor'      },
]

onMounted(async () => {
  profile.value = await getProfile()
  await fetchRecords()
  await loadHtml5Qr()
  waitForElement('equip-qr-reader', 3000).then(found => {
    if (found) startCamera()
    else status.value = { msg: 'Camera failed to initialize. Use manual entry below.', type: 'warn' }
  })
})

onUnmounted(() => {
  stopCamera()
  // Kill ALL camera tracks — ensures no ghost stream persists after page change
  try {
    navigator.mediaDevices?.getUserMedia({ video: true }).then(stream => {
      stream.getTracks().forEach(t => t.stop())
    }).catch(() => {})
  } catch {}
})

// ── Today's records ───────────────────────────
const todayRecords = computed(() => {
  const start = new Date(); start.setHours(0,0,0,0)
  return records.value.filter(r => {
    const ts = r.returned_at || r.borrowed_at
    return ts && new Date(ts) >= start
  }).slice(0, 10)
})

// ── Scanner state ─────────────────────────────
const step         = ref('scanning')
const status       = ref({ msg: 'Starting camera…', type: 'loading' })
const cameraOn     = ref(false)
const manualCode   = ref('')
const lastScanned  = ref('')
const foundItem    = ref(null)
const activeBorrow = ref(null)
const saving       = ref(false)
const successMsg   = ref('')
const successSub   = ref('')

const verified = ref({ serial: false, name: false, desc: true })
const allVerified = computed(() =>
  verified.value.serial && verified.value.name &&
  (foundItem.value?.description ? verified.value.desc : true)
)

const borrowForm = ref({ borrowerName: '', department: '', purpose: '', expectedReturn: '', quantity: 1, condition: 'good' })
const returnForm = ref({ condition: 'good', notes: '' })
const formErrors = ref({})

// ── Camera ────────────────────────────────────
let html5Scanner  = null
let scanLock      = false   // prevents multiple scan triggers on same QR

async function loadHtml5Qr() {
  if (window.Html5Qrcode) return
  const urls = [
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  ]
  for (const url of urls) {
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script')
        s.src = url; s.onload = res; s.onerror = rej
        document.head.appendChild(s)
      })
      if (window.Html5Qrcode) return
    } catch {}
  }
}

function waitForElement(id, timeout = 3000) {
  return new Promise(resolve => {
    const start = Date.now()
    function check() {
      if (document.getElementById(id)) { resolve(true); return }
      if (Date.now() - start > timeout) { resolve(false); return }
      requestAnimationFrame(check)
    }
    check()
  })
}

async function startCamera() {
  try {
    if (!window.Html5Qrcode) { status.value = { msg: 'Scanner library not loaded. Use manual entry.', type: 'warn' }; return }
    if (html5Scanner) {
      try { await html5Scanner.stop() } catch {}
      try { html5Scanner.clear() } catch {}
      html5Scanner = null
    }
    // Clear the div completely before re-initializing to prevent ghost elements
    const el = document.getElementById('equip-qr-reader')
    if (el) el.innerHTML = ''
    html5Scanner = new window.Html5Qrcode('equip-qr-reader')
    cameraOn.value = true
    status.value = { msg: '', type: '' }
    await html5Scanner.start(
      { facingMode: 'environment' },
      { fps: 5, qrbox: { width: 220, height: 220 }, disableFlip: true },
      (decoded) => onScan(decoded),
      () => {}
    )
  } catch (err) {
    cameraOn.value = false
    const msg = err?.message || ''
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
      status.value = { msg: 'Camera permission denied. Use manual serial entry below.', type: 'warn' }
    } else {
      status.value = { msg: 'Camera unavailable. Use manual serial entry below.', type: 'warn' }
    }
  }
}

async function stopCamera() {
  cameraOn.value = false
  if (html5Scanner) {
    try { await html5Scanner.stop() } catch {}
    try { html5Scanner.clear() } catch {}
    html5Scanner = null
  }
  // Kill any orphaned video streams
  try {
    document.querySelectorAll('#equip-qr-reader video').forEach(v => {
      try { v.srcObject?.getTracks()?.forEach(t => t.stop()); v.srcObject = null } catch {}
    })
  } catch {}
}

// ── Scan processing ───────────────────────────
async function onScan(raw) {
  // Prevent multiple triggers from the same scan
  if (scanLock) return
  scanLock = true
  await stopCamera()
  // Try JSON first (from QR generator), then plain serial
  let code = raw.trim()
  try {
    const parsed = JSON.parse(raw)
    code = parsed.serial || parsed.sku || raw.trim()
  } catch {}
  await processCode(code)
  // Lock is released when user resets / scans again
}

async function processCode(code) {
  if (!code?.trim()) return
  lastScanned.value = code.trim()
  status.value = { msg: 'Looking up equipment…', type: 'loading' }

  const item = await findItemByQR(code.trim())

  if (!item) {
    step.value = 'not-found'
    status.value = { msg: '', type: '' }
    return
  }

  foundItem.value = item
  status.value = { msg: '', type: '' }

  if (item.is_available) {
    // Ready to borrow — pre-fill borrower name from logged-in profile
    step.value = 'borrow'
    borrowForm.value = {
      borrowerName:   profile.value?.name || profile.value?.email || '',
      department:     '',
      purpose:        '',
      expectedReturn: '',
      quantity:       1,
      condition:      item.condition || 'good',
    }
    formErrors.value = {}
  } else {
    // Currently borrowed — check who has it
    const borrow = await getActiveBorrow(item.id)
    activeBorrow.value = borrow
    verified.value = { serial: false, name: false, desc: false }
    returnForm.value = { condition: 'good', notes: '' }
    step.value = 'return'
  }
}

// ── Borrow submit ─────────────────────────────
async function submitBorrow() {
  formErrors.value = {}
  if (!borrowForm.value.borrowerName.trim()) { formErrors.value.borrowerName = 'Borrower name is required'; return }
  if (!borrowForm.value.purpose.trim())      { formErrors.value.purpose = 'Purpose is required'; return }
  if (!borrowForm.value.expectedReturn)      { formErrors.value.expectedReturn = 'Return date is required'; return }

  saving.value = true
  try {
    await borrowViaQR({
      equipmentId:     foundItem.value.id,
      itemName:        foundItem.value.name,
      borrowerId:      profile.value?.id,
      borrowerName:    borrowForm.value.borrowerName,
      department:      borrowForm.value.department,
      purpose:         borrowForm.value.purpose,
      expectedReturn:  borrowForm.value.expectedReturn,
      quantity:        borrowForm.value.quantity,
      conditionBefore: borrowForm.value.condition,
    })

    logActivity({
      action:     'equipment.borrow',
      entityType: 'equipment',
      entityId:   String(foundItem.value.id),
      entityName: foundItem.value.name,
      details: {
        serial:     foundItem.value.serial_no,
        borrower:   borrowForm.value.borrowerName,
        department: borrowForm.value.department,
        purpose:    borrowForm.value.purpose,
        due:        borrowForm.value.expectedReturn,
        quantity:   borrowForm.value.quantity,
      },
    })

    successMsg.value = `"${foundItem.value.name}" borrowed successfully`
    successSub.value = `Due back: ${formatDate(borrowForm.value.expectedReturn)}`
    step.value = 'success'
    await fetchRecords()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Return submit ─────────────────────────────
async function submitReturn() {
  if (!allVerified.value) return
  saving.value = true
  try {
    await returnViaQR({
      borrowId:      activeBorrow.value.id,
      equipmentId:   foundItem.value.id,
      conditionAfter: returnForm.value.condition,
      returnNotes:   returnForm.value.notes,
    })

    logActivity({
      action:     'equipment.return',
      entityType: 'equipment',
      entityId:   String(foundItem.value.id),
      entityName: foundItem.value.name,
      details: {
        serial:    foundItem.value.serial_no,
        condition: returnForm.value.condition,
        notes:     returnForm.value.notes,
      },
    })

    successMsg.value = `"${foundItem.value.name}" returned successfully`
    successSub.value = `Condition: ${returnForm.value.condition}${returnForm.value.notes ? ' — ' + returnForm.value.notes : ''}`
    step.value = 'success'
    await fetchRecords()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Reset ─────────────────────────────────────
async function resetScan() {
  scanLock = false   // release lock so next scan works
  await stopCamera()
  step.value         = 'scanning'
  foundItem.value    = null
  activeBorrow.value = null
  manualCode.value   = ''
  lastScanned.value  = ''
  status.value = { msg: 'Starting camera…', type: 'loading' }
  await nextTick()
  waitForElement('equip-qr-reader', 3000).then(found => {
    if (found) startCamera()
    else status.value = { msg: 'Camera failed to initialize. Use manual entry below.', type: 'warn' }
  })
}

// ── Helpers ───────────────────────────────────
function timeOnly(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(msg, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message: msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
</script>

<style scoped>
.scan-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.btn-back { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #6B5257; text-decoration: none; transition: all 0.18s; }
.btn-back:hover { border-color: #B01020; color: #B01020; }

/* Layout */
.scan-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }

/* Scanner card */
.scanner-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.sc-title { display: flex; align-items: center; gap: 8px; font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; border-bottom: 1px solid #F0E5E7; padding-bottom: 14px; }
.scan-hint { font-size: 13px; color: #9A8589; text-align: center; }

/* Viewport */
.scan-viewport { position: relative; border-radius: 14px; overflow: hidden; background: #1A1016; max-width: 380px; margin: 0 auto; width: 100%; }
#equip-qr-reader { width: 100% !important; }
#equip-qr-reader video { width: 100% !important; border-radius: 10px; }
#equip-qr-reader * { border: none !important; }
#equip-qr-reader img { display: none !important; }
.scan-overlay { position: absolute; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; }
.sc-corner { position: absolute; width: 22px; height: 22px; border-color: #B01020; border-style: solid; }
.sc-corner.tl { top: 16px; left: 16px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
.sc-corner.tr { top: 16px; right: 16px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
.sc-corner.bl { bottom: 16px; left: 16px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
.sc-corner.br { bottom: 16px; right: 16px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
.sc-line { position: absolute; left: 16px; right: 16px; height: 2px; background: linear-gradient(90deg, transparent, #B01020, transparent); top: 16px; }
.sc-line.active { animation: scanMove 2s ease-in-out infinite; }
@keyframes scanMove { 0%,100% { top: 16px; } 50% { top: calc(100% - 16px); } }

/* Status */
.scan-status { padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; max-width: 380px; margin: 0 auto; width: 100%; }
.ss-warn    { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
.ss-error   { background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.ss-loading { background: #F7F3F4; color: #6B5257; border: 1px solid #EDE3E5; }
.ss-spinner { width: 14px; height: 14px; border: 2px solid #DDD5D7; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }

/* Manual fallback */
.manual-fallback { border-top: 1px solid #F0E5E7; padding-top: 14px; }
.mf-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; margin-bottom: 8px; }
.mf-row { display: flex; gap: 8px; }
.btn-lookup { padding: 10px 16px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-lookup:hover:not(:disabled) { background: #7A0A17; }
.btn-lookup:disabled { opacity: 0.5; cursor: not-allowed; }

/* Item card */
.item-card { background: #F7F3F4; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 16px 18px; }
.item-card-borrowed { background: #FFF8F0; border-color: #F59E0B; }
.item-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.item-available-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #16A34A; background: #D1FAE5; padding: 3px 10px; border-radius: 20px; }
.item-borrowed-badge  { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #D97706; background: #FEF3C7; padding: 3px 10px; border-radius: 20px; }
.item-serial { font-size: 11px; font-weight: 700; color: #B01020; font-family: monospace; background: #FFF5F6; padding: 2px 8px; border-radius: 6px; }
.item-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; margin-bottom: 8px; }
.item-meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.item-tag { font-size: 11px; background: white; border: 1px solid #EDE3E5; color: #6B5257; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }
.item-condition { font-size: 12px; color: #6B5257; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.cond-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cond-excellent { background: #16A34A; }
.cond-good      { background: #65A30D; }
.cond-fair      { background: #D97706; }
.cond-poor      { background: #DC2626; }
.item-desc  { font-size: 12px; color: #6B5257; line-height: 1.5; }
.item-notes { font-size: 12px; color: #2563EB; margin-top: 6px; display: flex; align-items: flex-start; gap: 5px; }

/* Borrow form */
.borrow-form, .return-form { display: flex; flex-direction: column; gap: 14px; }
.bf-title { font-size: 13px; font-weight: 700; color: #1A1016; letter-spacing: 0.3px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #3D2830; }
.req { color: #B01020; }
.form-input { width: 100%; padding: 9px 13px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; }
.form-disabled { opacity: 0.7; cursor: not-allowed; }
.form-error { font-size: 11px; color: #B01020; }
.qty-row { display: flex; align-items: center; gap: 6px; }
.qty-btn { width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #EDE3E5; background: white; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #3D2830; transition: all 0.15s; flex-shrink: 0; }
.qty-btn:hover { border-color: #B01020; color: #B01020; }
.qty-input { width: 60px; text-align: center; flex-shrink: 0; }

/* Condition picker */
.condition-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.cp-opt { padding: 6px 14px; border-radius: 8px; border: 1.5px solid #EDE3E5; background: white; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; color: #6B5257; }
.cp-opt:hover { border-color: #B01020; }
.cp-opt.active.cp-excellent { background: #D1FAE5; border-color: #16A34A; color: #065F46; }
.cp-opt.active.cp-good      { background: #ECFDF5; border-color: #65A30D; color: #3F6212; }
.cp-opt.active.cp-fair      { background: #FEF3C7; border-color: #D97706; color: #92400E; }
.cp-opt.active.cp-poor      { background: #FEE2E2; border-color: #DC2626; color: #991B1B; }

/* Borrow info box */
.borrow-info-box { background: #FFFBF0; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.bib-row { display: flex; gap: 10px; align-items: flex-start; }
.bib-key { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #92400E; min-width: 70px; padding-top: 1px; flex-shrink: 0; }
.bib-val { font-size: 13px; color: #1A1016; }
.text-red { color: #DC2626 !important; }
.overdue-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #DC2626; background: #FEE2E2; padding: 1px 8px; border-radius: 10px; margin-left: 6px; }

/* Verify box */
.verify-box { background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 12px; padding: 14px 16px; }
.verify-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: #1D4ED8; margin-bottom: 12px; }
.verify-checks { display: flex; flex-direction: column; gap: 10px; }
.verify-check { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #1A1016; cursor: pointer; line-height: 1.4; }
.verify-check input { margin-top: 2px; accent-color: #B01020; flex-shrink: 0; width: 16px; height: 16px; cursor: pointer; }
.verify-warning { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #D97706; background: #FFFBEB; padding: 8px 12px; border-radius: 8px; border: 1px solid #FDE68A; }

/* Form actions */
.form-actions { display: flex; gap: 8px; }
.btn-cancel-scan { padding: 10px 16px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #6B5257; cursor: pointer; transition: all 0.18s; }
.btn-cancel-scan:hover { border-color: #9A8589; color: #3D2830; }
.btn-borrow { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 11px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-borrow:hover:not(:disabled) { background: #7A0A17; }
.btn-borrow:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-return { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 11px; background: #059669; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-return:hover:not(:disabled) { background: #047857; }
.btn-return:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Not found */
.not-found-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 16px; text-align: center; }
.nf-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.nf-sub   { font-size: 13px; color: #6B5257; }
.nf-hint  { font-size: 12px; color: #9A8589; background: #F7F3F4; padding: 12px; border-radius: 10px; line-height: 1.5; }

/* Success */
.success-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 16px; text-align: center; }
.success-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.success-sub   { font-size: 13px; color: #6B5257; }
.success-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.btn-scan-another { padding: 10px 20px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-view-all { padding: 10px 20px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #6B5257; text-decoration: none; }

/* Right panel */
.right-panel { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.recent-title { display: flex; align-items: center; gap: 7px; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #1A1016; }
.recent-loading { display: flex; justify-content: center; padding: 20px; }
.recent-empty { font-size: 12px; color: #C4ADAF; text-align: center; padding: 20px; }
.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #F7F3F4; border-radius: 10px; }
.ri-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.ri-borrow { background: #FEE2E2; color: #B01020; }
.ri-return { background: #D1FAE5; color: #059669; }
.ri-info { flex: 1; min-width: 0; }
.ri-name { font-size: 12px; font-weight: 600; color: #1A1016; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ri-who  { font-size: 11px; color: #9A8589; }
.ri-time { font-size: 10px; color: #C4ADAF; }
.ri-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }
.rb-borrow { background: #FEE2E2; color: #B91C1C; }
.rb-return { background: #D1FAE5; color: #065F46; }
.spinner-sm-gray { width: 20px; height: 20px; border: 2px solid #EDE3E5; border-top-color: #9A8589; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Toast */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 12px; font-size: 13px; font-weight: 500; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 10000; white-space: nowrap; }
.toast-success { background: #1A1016; }
.toast-error   { background: #B01020; }
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }

@media (max-width: 900px) { .scan-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
</style>