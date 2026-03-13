<template>
  <div class="settings-page">

    <div class="page-header">
      <div>
        <div class="page-title">Settings</div>
        <div class="page-sub">Manage your preferences and system access</div>
      </div>
    </div>

    <!-- ── Role badge ── -->
    <div class="role-banner" :class="isAdmin ? 'banner-admin' : 'banner-staff'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>You are logged in as <strong>{{ profile.role }}</strong> — {{ isAdmin ? 'You have full system access.' : 'Some settings are restricted to Administrators only.' }}</span>
    </div>

    <div class="settings-layout">

      <!-- ── Sidebar tabs ── -->
      <div class="settings-nav">
        <button v-for="s in visibleSections" :key="s.key"
          class="snav-item" :class="{ active: activeSection === s.key }"
          @click="activeSection = s.key">
          <span class="snav-icon" v-html="s.icon"></span>
          <span>{{ s.label }}</span>
        </button>
      </div>

      <div class="settings-content">

        <!-- ══ PROFILE ══ -->
        <div class="settings-panel" v-if="activeSection === 'profile'">
          <div class="panel-title">My Profile</div>
          <div class="panel-sub">Update your display name and view your account info</div>

          <div class="avatar-row">
            <div class="avatar-big">{{ userInitial }}</div>
            <div>
              <div class="avatar-name">{{ profile.name || 'User' }}</div>
              <div class="avatar-meta">{{ profile.email }}</div>
              <span class="role-pill" :class="isAdmin ? 'pill-admin' : 'pill-staff'">{{ profile.role }}</span>
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Display Name</label>
            <input class="form-input" v-model="profileForm.name" placeholder="Your full name" maxlength="60" />
            <div class="form-hint">This name appears in the sidebar and activity logs.</div>
          </div>

          <div class="form-field">
            <label class="form-label">Email Address</label>
            <input class="form-input form-disabled" :value="profile.email || '—'" disabled />
            <div class="form-hint">Email is managed by your Administrator.</div>
          </div>

          <div class="form-field" v-if="isAdmin">
            <label class="form-label">Your Role</label>
            <input class="form-input form-disabled" :value="profile.role" disabled />
            <div class="form-hint">Role is set in User Management.</div>
          </div>

          <div class="panel-footer">
            <button class="btn-save" @click="saveProfile" :disabled="saving || !profileForm.name.trim()">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>Save Name</span>
            </button>
          </div>
        </div>

        <!-- ══ PREFERENCES ══ -->
        <div class="settings-panel" v-if="activeSection === 'preferences'">
          <div class="panel-title">Preferences</div>
          <div class="panel-sub">Customize your personal experience</div>

          <!-- Appearance -->
          <div class="pref-section-label">Appearance</div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Sidebar Collapsed by Default</div>
              <div class="pref-sub">Start with the sidebar minimized to icons only</div>
            </div>
            <div class="toggle-wrap" :class="{ on: prefs.sidebarCollapsed }" @click="prefs.sidebarCollapsed = !prefs.sidebarCollapsed"></div>
          </div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Compact Table View</div>
              <div class="pref-sub">Show more rows in inventory with reduced row height</div>
            </div>
            <div class="toggle-wrap" :class="{ on: prefs.compactTable }" @click="prefs.compactTable = !prefs.compactTable"></div>
          </div>

          <!-- Notifications -->
          <div class="pref-section-label">Notifications</div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Show Stock Alert Badge</div>
              <div class="pref-sub">Display count badge on Stock Alerts in the sidebar</div>
            </div>
            <div class="toggle-wrap" :class="{ on: prefs.showAlertBadge }" @click="prefs.showAlertBadge = !prefs.showAlertBadge"></div>
          </div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Activity Upcoming Reminder</div>
              <div class="pref-sub">Show notification banner for activities due within 2 days</div>
            </div>
            <div class="toggle-wrap" :class="{ on: prefs.activityReminder }" @click="prefs.activityReminder = !prefs.activityReminder"></div>
          </div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Equipment Overdue Alerts</div>
              <div class="pref-sub">Highlight overdue borrowed equipment prominently</div>
            </div>
            <div class="toggle-wrap" :class="{ on: prefs.overdueAlerts }" @click="prefs.overdueAlerts = !prefs.overdueAlerts"></div>
          </div>

          <!-- Default values -->
          <div class="pref-section-label">Inventory Defaults</div>

          <div class="pref-form-row">
            <div class="form-field">
              <label class="form-label">Default Reorder Threshold</label>
              <input class="form-input" type="number" v-model.number="prefs.defaultReorder" min="1" max="9999" />
              <div class="form-hint">Alert when stock drops below this number</div>
            </div>
            <div class="form-field">
              <label class="form-label">Default Stock Unit</label>
              <select class="form-input form-select" v-model="prefs.defaultUnit">
                <option>pcs</option><option>sets</option><option>boxes</option>
                <option>rolls</option><option>sheets</option><option>meters</option>
                <option>liters</option><option>kg</option>
              </select>
            </div>
          </div>

          <div class="panel-footer">
            <button class="btn-save" @click="savePreferences" :disabled="saving">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>Save Preferences</span>
            </button>
          </div>
        </div>

        <!-- ══ ACCESSIBILITY (ADMIN ONLY) ══ -->
        <div class="settings-panel" v-if="activeSection === 'access'">
          <div class="panel-title">Accessibility & Permissions</div>
          <div class="panel-sub">Control what staff members can see and do</div>

          <div class="access-info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>These rules apply to all <strong>Staff</strong> accounts. Administrators always have full access.</span>
          </div>

          <div class="pref-section-label">Equipment Borrowing</div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Staff Can Submit Borrow Requests</div>
              <div class="pref-sub">Allow staff to create new borrow requests</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanBorrow }" @click="access.staffCanBorrow = !access.staffCanBorrow"></div>
          </div>

          <div class="pref-row pref-row-indent" v-if="access.staffCanBorrow">
            <div class="pref-info">
              <div class="pref-title">Require Admin Approval</div>
              <div class="pref-sub">Borrow requests stay "Pending" until an Admin approves them</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.requireApproval }" @click="access.requireApproval = !access.requireApproval"></div>
          </div>

          <div class="pref-row pref-row-indent" v-if="access.staffCanBorrow">
            <div class="pref-info">
              <div class="pref-title">Staff Can Process Returns</div>
              <div class="pref-sub">Allow staff to mark items as returned</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanReturn }" @click="access.staffCanReturn = !access.staffCanReturn"></div>
          </div>

          <div class="pref-section-label">Inventory</div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Staff Can Add Products</div>
              <div class="pref-sub">Allow staff to create new inventory items</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanAddProduct }" @click="access.staffCanAddProduct = !access.staffCanAddProduct"></div>
          </div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Staff Can Edit Products</div>
              <div class="pref-sub">Allow staff to modify existing inventory items</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanEditProduct }" @click="access.staffCanEditProduct = !access.staffCanEditProduct"></div>
          </div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Staff Can Delete Products</div>
              <div class="pref-sub">Allow staff to permanently remove inventory items</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanDeleteProduct }" @click="access.staffCanDeleteProduct = !access.staffCanDeleteProduct"></div>
          </div>

          <div class="pref-section-label">Activities</div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Staff Can Create Activities</div>
              <div class="pref-sub">Allow staff to add new team activities and events</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanCreateActivity }" @click="access.staffCanCreateActivity = !access.staffCanCreateActivity"></div>
          </div>

          <div class="pref-row">
            <div class="pref-info">
              <div class="pref-title">Staff Can Update Activity Status</div>
              <div class="pref-sub">Allow staff to change status (Upcoming → Ongoing → Done)</div>
            </div>
            <div class="toggle-wrap" :class="{ on: access.staffCanUpdateStatus }" @click="access.staffCanUpdateStatus = !access.staffCanUpdateStatus"></div>
          </div>

          <div class="panel-footer">
            <button class="btn-save" @click="saveAccess" :disabled="saving">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>Save Permissions</span>
            </button>
          </div>
        </div>

        <!-- ══ USER MANAGEMENT (ADMIN ONLY) ══ -->
        <div class="settings-panel" v-if="activeSection === 'users'">
          <div class="panel-title">User Accounts</div>
          <div class="panel-sub">View and manage staff and admin accounts</div>

          <div class="loading-state" v-if="usersLoading">
            <div class="spinner"></div> Loading users…
          </div>

          <div class="users-list" v-else>
            <div class="user-row" v-for="u in users" :key="u.id">
              <div class="user-avatar-sm">{{ u.name ? u.name.charAt(0).toUpperCase() : '?' }}</div>
              <div class="user-info-col">
                <div class="user-row-name">{{ u.name || 'Unnamed' }}</div>
                <div class="user-row-email">{{ u.email || '—' }}</div>
              </div>
              <select
                class="role-select"
                :value="u.role"
                @change="changeRole(u, $event.target.value)"
                :disabled="u.id === profile.id"
              >
                <option value="Administrator">Administrator</option>
                <option value="Staff">Staff</option>
                <option value="Viewer">Viewer</option>
              </select>
              <span class="you-badge" v-if="u.id === profile.id">You</span>
            </div>
            <div class="users-empty" v-if="users.length === 0">No users found.</div>
          </div>

          <div class="access-info-box" style="margin-top:4px">
            <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>To add or delete users, go to your <strong>Supabase Dashboard → Authentication → Users</strong>.</span>
          </div>
        </div>

        <!-- ══ ABOUT ══ -->
        <div class="settings-panel" v-if="activeSection === 'about'">
          <div class="panel-title">About</div>
          <div class="panel-sub">System information</div>

          <div class="about-card">
            <div class="about-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="1.5" width="32" height="32">
                <rect x="2" y="3"  width="20" height="4" rx="1"/>
                <rect x="2" y="10" width="12" height="4" rx="1"/>
                <rect x="2" y="17" width="16" height="4" rx="1"/>
              </svg>
            </div>
            <div class="about-name">SLU Branding Inventory System</div>
            <div class="about-version">Version 1.0.0</div>
          </div>

          <div class="about-rows">
            <div class="about-row"><span>Built with</span><span>Vue 3 + Vite</span></div>
            <div class="about-row"><span>Database</span><span>Supabase (PostgreSQL)</span></div>
            <div class="about-row"><span>Hosted on</span><span>Netlify</span></div>
            <div class="about-row"><span>Organization</span><span>Saint Louis University — Branding Office</span></div>
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
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/composables/useAuth'

// ── Session ───────────────────────────────────
const profile     = ref({ id: '', name: '', role: '', email: '' })
const profileForm = ref({ name: '' })
const saving      = ref(false)

const isAdmin = computed(() => profile.value.role === 'Administrator')

const userInitial = computed(() =>
  profile.value.name ? profile.value.name.charAt(0).toUpperCase() : 'U'
)

// ── Sections — admins see more tabs ──────────
const allSections = [
  { key: 'profile',     label: 'My Profile',     admin: false, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  { key: 'preferences', label: 'Preferences',    admin: false, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
  { key: 'access',      label: 'Permissions',    admin: true,  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
  { key: 'users',       label: 'User Accounts',  admin: true,  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { key: 'about',       label: 'About',          admin: false, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` },
]

const visibleSections = computed(() =>
  allSections.filter(s => !s.admin || isAdmin.value)
)

const activeSection = ref('profile')

// ── Preferences (localStorage) ────────────────
const prefs = ref({
  sidebarCollapsed:  false,
  compactTable:      false,
  showAlertBadge:    true,
  activityReminder:  true,
  overdueAlerts:     true,
  defaultReorder:    10,
  defaultUnit:       'pcs',
})

// ── Access control (localStorage, admin only) ─
const access = ref({
  staffCanBorrow:         true,
  requireApproval:        true,
  staffCanReturn:         true,
  staffCanAddProduct:     false,
  staffCanEditProduct:    false,
  staffCanDeleteProduct:  false,
  staffCanCreateActivity: true,
  staffCanUpdateStatus:   true,
})

onMounted(async () => {
  const p = await getProfile()
  if (p) {
    profile.value = p
    profileForm.value.name = p.name || ''
  }
  const savedPrefs = localStorage.getItem('slu_prefs')
  if (savedPrefs) Object.assign(prefs.value, JSON.parse(savedPrefs))
  const savedAccess = localStorage.getItem('slu_access')
  if (savedAccess) Object.assign(access.value, JSON.parse(savedAccess))
  if (isAdmin.value) loadUsers()
})

// ── Save profile (name only) ──────────────────
async function saveProfile() {
  if (!profileForm.value.name.trim()) return
  saving.value = true
  try {
    await supabase.from('profiles')
      .update({ name: profileForm.value.name.trim() })
      .eq('id', profile.value.id)
    profile.value.name = profileForm.value.name.trim()
    showToast('Name updated!', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Save preferences ──────────────────────────
function savePreferences() {
  saving.value = true
  setTimeout(() => {
    localStorage.setItem('slu_prefs', JSON.stringify(prefs.value))
    saving.value = false
    showToast('Preferences saved!', 'success')
  }, 300)
}

// ── Save access control ───────────────────────
function saveAccess() {
  saving.value = true
  setTimeout(() => {
    localStorage.setItem('slu_access', JSON.stringify(access.value))
    saving.value = false
    showToast('Permissions saved!', 'success')
  }, 300)
}

// ── Users (admin only) ────────────────────────
const users        = ref([])
const usersLoading = ref(false)

async function loadUsers() {
  usersLoading.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .order('name')
    if (error) throw error
    users.value = data || []
  } catch (err) {
    showToast('Could not load users: ' + err.message, 'error')
  } finally {
    usersLoading.value = false
  }
}

async function changeRole(user, newRole) {
  try {
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    user.role = newRole
    showToast(`${user.name}'s role updated to ${newRole}`, 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
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
.settings-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; width: 100%; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }

/* Role banner */
.role-banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; font-size: 13px; }
.banner-admin { background: #FFF5F6; border: 1.5px solid #FECDD3; color: #7A0A17; }
.banner-admin svg { color: #B01020; flex-shrink: 0; }
.banner-staff { background: #EFF6FF; border: 1.5px solid #BFDBFE; color: #1D4ED8; }
.banner-staff svg { color: #2563EB; flex-shrink: 0; }

/* Layout */
.settings-layout { display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: start; }

/* Sidebar */
.settings-nav { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 8px; display: flex; flex-direction: column; gap: 2px; position: sticky; top: 0; }
.snav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: none; background: none; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #6B5257; cursor: pointer; text-align: left; transition: all 0.18s; width: 100%; }
.snav-item:hover { background: #FFF5F6; color: #1A1016; }
.snav-item.active { background: #B01020; color: white; }
.snav-icon { flex-shrink: 0; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }

/* Panel */
.settings-panel { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; gap: 18px; }
.panel-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.panel-sub { font-size: 13px; color: #9A8589; margin-top: -12px; }
.panel-footer { display: flex; justify-content: flex-end; padding-top: 6px; border-top: 1px solid #EDE3E5; }

/* Avatar */
.avatar-row { display: flex; align-items: center; gap: 16px; padding: 16px; background: #FFF5F6; border: 1.5px solid #F0DADE; border-radius: 12px; }
.avatar-big { width: 54px; height: 54px; background: #B01020; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; color: white; flex-shrink: 0; }
.avatar-name { font-size: 16px; font-weight: 600; color: #1A1016; }
.avatar-meta { font-size: 12px; color: #9A8589; margin-top: 2px; }
.role-pill { display: inline-block; margin-top: 6px; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
.pill-admin { background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.pill-staff { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }

/* Forms */
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #3D2830; }
.form-input { width: 100%; padding: 10px 14px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.08); }
.form-disabled { background: #F7F3F4; color: #9A8589; cursor: not-allowed; }
.form-select { cursor: pointer; }
.form-hint { font-size: 11px; color: #9A8589; }

/* Pref rows */
.pref-section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #B01020; padding-bottom: 6px; border-bottom: 1px solid #F0E5E7; }
.pref-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #F7F3F4; }
.pref-row:last-of-type { border-bottom: none; }
.pref-row-indent { padding-left: 20px; background: #FDFAFA; border-radius: 8px; }
.pref-info { flex: 1; }
.pref-title { font-size: 13px; font-weight: 500; color: #1A1016; }
.pref-sub { font-size: 12px; color: #9A8589; margin-top: 2px; }
.pref-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* Toggle */
.toggle-wrap { width: 44px; height: 24px; background: #DDD5D7; border-radius: 12px; cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0; }
.toggle-wrap.on { background: #B01020; }
.toggle-wrap::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.18); }
.toggle-wrap.on::after { transform: translateX(20px); }

/* Access info box */
.access-info-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px; background: #EFF6FF; border: 1.5px solid #BFDBFE; font-size: 12.5px; color: #1E40AF; line-height: 1.5; }
.access-info-box svg { flex-shrink: 0; margin-top: 1px; }

/* Users list */
.loading-state { display: flex; align-items: center; gap: 10px; padding: 24px; color: #9A8589; font-size: 13px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }
.users-list { display: flex; flex-direction: column; gap: 8px; }
.user-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #F7F3F4; border-radius: 12px; border: 1.5px solid #EDE3E5; }
.user-avatar-sm { width: 36px; height: 36px; background: #B01020; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; }
.user-info-col { flex: 1; min-width: 0; }
.user-row-name { font-size: 13px; font-weight: 600; color: #1A1016; }
.user-row-email { font-size: 11px; color: #9A8589; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.role-select { padding: 6px 10px; border: 1.5px solid #EBE0E2; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 12px; background: white; color: #1A1016; cursor: pointer; outline: none; }
.role-select:focus { border-color: #B01020; }
.role-select:disabled { background: #F7F3F4; color: #9A8589; cursor: not-allowed; }
.you-badge { font-size: 10px; font-weight: 700; background: #FFF5F6; color: #B01020; padding: 2px 8px; border-radius: 20px; border: 1px solid #FECDD3; white-space: nowrap; }
.users-empty { font-size: 13px; color: #9A8589; padding: 20px; text-align: center; }

/* About */
.about-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; background: #FFF5F6; border: 1.5px solid #F0DADE; border-radius: 14px; text-align: center; }
.about-logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(176,16,32,0.1); }
.about-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1016; }
.about-version { font-size: 11px; background: #B01020; color: white; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
.about-rows { border: 1.5px solid #EDE3E5; border-radius: 12px; overflow: hidden; }
.about-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #F0E5E7; }
.about-row:last-child { border-bottom: none; }
.about-row span:first-child { color: #9A8589; }
.about-row span:last-child { font-weight: 500; color: #1A1016; text-align: right; }

/* Buttons */
.btn-save { padding: 10px 24px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; min-width: 130px; justify-content: center; }
.btn-save:hover:not(:disabled) { background: #7A0A17; box-shadow: 0 4px 14px rgba(176,16,32,0.3); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner-sm { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

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

@media (max-width: 768px) {
  .settings-layout { grid-template-columns: 1fr; }
  .settings-nav { flex-direction: row; overflow-x: auto; flex-wrap: nowrap; padding: 6px; }
  .snav-item { white-space: nowrap; flex-shrink: 0; font-size: 12px; padding: 8px 10px; }
  .settings-panel { padding: 18px; }
  .pref-form-row { grid-template-columns: 1fr; }
}
</style>