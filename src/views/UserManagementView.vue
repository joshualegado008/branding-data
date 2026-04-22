<template>
  <div class="users-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">User Management</div>
        <div class="page-sub">Manage accounts, roles, and access permissions</div>
      </div>
      <button class="btn-invite" @click="showInvite = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add User
      </button>
    </div>

    <!-- ── Role summary ── -->
    <div class="role-summary">
      <div class="rs-card rs-admin">
        <div class="rs-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div class="rs-count">{{ adminCount }}</div>
          <div class="rs-label">Administrator{{ adminCount !== 1 ? 's' : '' }}</div>
        </div>
      </div>
      <div class="rs-card rs-staff">
        <div class="rs-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div>
          <div class="rs-count">{{ staffCount }}</div>
          <div class="rs-label">Staff Member{{ staffCount !== 1 ? 's' : '' }}</div>
        </div>
      </div>
      <div class="rs-card rs-viewer">
        <div class="rs-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <div>
          <div class="rs-count">{{ viewerCount }}</div>
          <div class="rs-label">Viewer{{ viewerCount !== 1 ? 's' : '' }}</div>
        </div>
      </div>
    </div>

    <!-- ── Role permissions info ── -->
    <div class="permissions-box">
      <div class="pb-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Role Permissions
      </div>
      <div class="pb-grid">
        <div class="pb-col">
          <div class="pb-role pb-role-admin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Administrator
          </div>
          <ul class="pb-list">
            <li>Full access to all features</li>
            <li>Manage users &amp; roles</li>
            <li>Add, edit, delete products</li>
            <li>View activity logs</li>
            <li>Access all reports</li>
          </ul>
        </div>
        <div class="pb-col">
          <div class="pb-role pb-role-staff">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Staff
          </div>
          <ul class="pb-list">
            <li>View inventory &amp; equipment</li>
            <li>Add/edit products (if permitted)</li>
            <li>Borrow &amp; return equipment</li>
            <li>Create &amp; update activities</li>
            <li>Cannot delete or manage users</li>
          </ul>
        </div>
        <div class="pb-col">
          <div class="pb-role pb-role-viewer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Viewer
          </div>
          <ul class="pb-list">
            <li>Read-only access</li>
            <li>View inventory &amp; stock levels</li>
            <li>View equipment list</li>
            <li>Cannot make any changes</li>
            <li>Cannot borrow equipment</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ── Users table ── -->
    <div class="users-card">
      <div class="users-card-header">
        <div class="uch-title">All Accounts</div>
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="search-input" v-model="search" placeholder="Search by name or email…" />
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="spinner-lg"></div>
        <span>Loading users…</span>
      </div>

      <div class="users-table-wrap" v-else>
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" class="user-row">

              <!-- User info -->
              <td>
                <div class="user-cell">
                  <div class="u-avatar" :class="avatarClass(user.role)">
                    {{ initial(user.name || user.email) }}
                  </div>
                  <div>
                    <div class="u-name">
                      {{ user.name || '—' }}
                      <span class="you-badge" v-if="user.id === currentUser?.id">You</span>
                    </div>
                    <div class="u-email">{{ user.email }}</div>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td>
                <select
                  class="role-select"
                  :class="roleSelectClass(user.role)"
                  :value="user.role"
                  @change="changeRole(user, $event.target.value)"
                  :disabled="user.id === currentUser?.id || savingRole === user.id"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Staff">Staff</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <div class="saving-badge" v-if="savingRole === user.id">saving…</div>
              </td>

              <!-- Status -->
              <td>
                <span class="status-badge" :class="user.confirmed ? 'st-active' : 'st-pending'">
                  <span class="st-dot"></span>
                  {{ user.confirmed ? 'Active' : 'Pending' }}
                </span>
              </td>

              <!-- Joined -->
              <td class="td-joined">{{ formatDate(user.created_at) }}</td>

              <!-- Actions -->
              <td>
                <div class="action-btns" v-if="user.id !== currentUser?.id">
                  <button class="act-btn act-danger" @click="confirmRemove(user)" title="Remove user (from Supabase Dashboard)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
                <span class="you-cell" v-else>—</span>
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ ADD USER MODAL ══ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="modal-overlay" v-if="showInvite" @click.self="closeInviteModal">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">Create New Account</div>
              <button class="modal-close" @click="closeInviteModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">

              <!-- Success state -->
              <div v-if="inviteSuccess" class="invite-success">
                <div class="invite-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" width="32" height="32"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="invite-success-title">Account Created!</div>
                <div class="invite-success-msg">
                  <strong>{{ inviteForm.name }}</strong> has been added as <strong>{{ inviteForm.role }}</strong>.<br/>
                  They can now log in with their email and password.
                </div>
                <button class="btn-save" style="margin-top:16px;width:100%" @click="closeInviteModal">Done</button>
              </div>

              <!-- Form state -->
              <template v-else>
                <div class="form-field">
                  <label class="form-label">Full Name <span class="req">*</span></label>
                  <input
                    class="form-input"
                    :class="{ 'input-error': inviteErrors.name }"
                    v-model="inviteForm.name"
                    placeholder="e.g. Juan dela Cruz"
                    maxlength="60"
                    @input="inviteErrors.name = ''"
                  />
                  <div class="field-error" v-if="inviteErrors.name">{{ inviteErrors.name }}</div>
                </div>

                <div class="form-field">
                  <label class="form-label">Email Address <span class="req">*</span></label>
                  <input
                    class="form-input"
                    :class="{ 'input-error': inviteErrors.email }"
                    v-model="inviteForm.email"
                    type="email"
                    placeholder="e.g. juan@example.com"
                    @input="inviteErrors.email = ''"
                  />
                  <div class="field-error" v-if="inviteErrors.email">{{ inviteErrors.email }}</div>
                </div>

                <div class="form-field">
                  <label class="form-label">Password <span class="req">*</span></label>
                  <div class="pw-wrap">
                    <input
                      class="form-input"
                      :class="{ 'input-error': inviteErrors.password }"
                      v-model="inviteForm.password"
                      :type="showInvitePw ? 'text' : 'password'"
                      placeholder="Minimum 6 characters"
                      @input="inviteErrors.password = ''"
                    />
                    <button class="pw-toggle" type="button" @click="showInvitePw = !showInvitePw" tabindex="-1">
                      <svg v-if="!showInvitePw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                  <div class="field-error" v-if="inviteErrors.password">{{ inviteErrors.password }}</div>
                </div>

                <div class="form-field">
                  <label class="form-label">Role <span class="req">*</span></label>
                  <select class="form-input form-select" v-model="inviteForm.role">
                    <option value="Staff">Staff</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                  <div class="form-hint">
                    <strong>Staff</strong> — can edit inventory &nbsp;·&nbsp;
                    <strong>Viewer</strong> — read only &nbsp;·&nbsp;
                    <strong>Administrator</strong> — full access
                  </div>
                </div>

                <div class="field-error global-error" v-if="inviteErrors.global">{{ inviteErrors.global }}</div>
              </template>

            </div>
            <div class="modal-footer" v-if="!inviteSuccess">
              <button class="btn-cancel" @click="closeInviteModal" :disabled="inviteLoading">Cancel</button>
              <button class="btn-save" @click="createUser" :disabled="inviteLoading">
                <svg v-if="inviteLoading" class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                {{ inviteLoading ? 'Creating...' : 'Create Account' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ REMOVE CONFIRM MODAL ══ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="modal-overlay" v-if="removeTarget" @click.self="removeTarget = null">
          <div class="modal modal-sm">
            <div class="modal-header">
              <div class="modal-title">Remove User</div>
              <button class="modal-close" @click="removeTarget = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="remove-text">
                To fully remove <strong>"{{ removeTarget?.name || removeTarget?.email }}"</strong>, delete them from Supabase → Authentication → Users. Their profile data will be automatically cleaned up.
              </div>
              <div class="supabase-link-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <a :href="supabaseAuthUrl" target="_blank" rel="noopener">Open Supabase → Authentication → Users</a>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="removeTarget = null">Cancel</button>
              <button class="btn-save" @click="removeTarget = null; refreshUsers()">Done — Refresh List</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { logActivity } from '@/composables/useActivityLog'

const SUPABASE_PROJECT = 'qcofsgjeitokpfdkjnlr'
const supabaseAuthUrl  = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/users`

// ── State ─────────────────────────────────────
const users       = ref([])
const loading     = ref(false)
const currentUser = ref(null)
const search      = ref('')
const savingRole  = ref(null)
const showInvite   = ref(false)
const removeTarget = ref(null)
const inviteForm   = ref({ name: '', email: '', password: '', role: 'Staff' })
const inviteErrors = ref({ name: '', email: '', password: '', global: '' })
const inviteLoading = ref(false)
const inviteSuccess = ref(false)
const showInvitePw  = ref(false)
const toast         = ref({ show: false, message: '', type: 'success' })
let toastTimer      = null

// ── Computed ──────────────────────────────────
const filteredUsers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.name?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q)
  )
})

const adminCount  = computed(() => users.value.filter(u => u.role === 'Administrator').length)
const staffCount  = computed(() => users.value.filter(u => u.role === 'Staff').length)
const viewerCount = computed(() => users.value.filter(u => u.role === 'Viewer').length)

// ── Fetch ─────────────────────────────────────
async function fetchUsers() {
  loading.value = true
  // Get all profiles from the profiles table
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, role, created_at')
    .order('created_at', { ascending: true })

  if (error) { showToast('Error loading users: ' + error.message, 'error'); loading.value = false; return }

  // Enrich with email from auth — we can only get the current user's email
  // For others we store email in profiles if available
  users.value = (profiles || []).map(p => ({
    ...p,
    email:     p.email || '(email hidden)',
    confirmed: true, // treat as active if in profiles
  }))

  // Try to enrich current user's email
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (authUser) {
    const me = users.value.find(u => u.id === authUser.id)
    if (me) me.email = authUser.email
  }

  loading.value = false
}

function closeInviteModal() {
  showInvite.value    = false
  inviteSuccess.value = false
  showInvitePw.value  = false
  inviteForm.value    = { name: '', email: '', password: '', role: 'Staff' }
  inviteErrors.value  = { name: '', email: '', password: '', global: '' }
}

async function createUser() {
  // Validate
  inviteErrors.value = { name: '', email: '', password: '', global: '' }
  let valid = true
  if (!inviteForm.value.name.trim()) { inviteErrors.value.name = 'Full name is required'; valid = false }
  if (!inviteForm.value.email.trim()) { inviteErrors.value.email = 'Email is required'; valid = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.value.email)) { inviteErrors.value.email = 'Enter a valid email address'; valid = false }
  if (!inviteForm.value.password) { inviteErrors.value.password = 'Password is required'; valid = false }
  else if (inviteForm.value.password.length < 6) { inviteErrors.value.password = 'Password must be at least 6 characters'; valid = false }
  if (!valid) return

  inviteLoading.value = true

  // Step 1: Create the auth user via Supabase signUp
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email:    inviteForm.value.email.trim(),
    password: inviteForm.value.password,
    options: {
      data: { name: inviteForm.value.name.trim() }
    }
  })

  if (signUpError) {
    inviteErrors.value.global = signUpError.message
    inviteLoading.value = false
    return
  }

  const newUserId = signUpData?.user?.id
  if (!newUserId) {
    inviteErrors.value.global = 'Account created but could not retrieve user ID. Check Supabase.'
    inviteLoading.value = false
    return
  }

  // Step 2: Upsert the profile with name + role
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:   newUserId,
      name: inviteForm.value.name.trim(),
      role: inviteForm.value.role,
    })

  if (profileError) {
    inviteErrors.value.global = 'Auth account created but failed to set profile: ' + profileError.message
    inviteLoading.value = false
    return
  }

  // Step 3: Log activity & refresh
  logActivity({
    action:     'user.created',
    entityType: 'user',
    entityId:   newUserId,
    entityName: inviteForm.value.name.trim(),
    details:    { email: inviteForm.value.email.trim(), role: inviteForm.value.role },
  })

  inviteLoading.value = false
  inviteSuccess.value = true
  await fetchUsers()
}

async function refreshUsers() {
  showInvite.value  = false
  removeTarget.value = null
  await fetchUsers()
  showToast('User list refreshed', 'success')
}

// ── Role change ───────────────────────────────
async function changeRole(user, newRole) {
  if (user.id === currentUser.value?.id) return
  savingRole.value = user.id
  const oldRole = user.role

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', user.id)

  if (error) {
    showToast('Failed to update role: ' + error.message, 'error')
  } else {
    user.role = newRole
    showToast(`${user.name || 'User'}'s role changed to ${newRole}`, 'success')
    logActivity({
      action:     'user.role_change',
      entityType: 'user',
      entityId:   user.id,
      entityName: user.name || user.email,
      details:    { old_role: oldRole, new_role: newRole },
    })
  }
  savingRole.value = null
}

// ── Helpers ───────────────────────────────────
function initial(str) { return (str || '?')[0].toUpperCase() }
function avatarClass(role) {
  if (role === 'Administrator') return 'av-admin'
  if (role === 'Staff')         return 'av-staff'
  return 'av-viewer'
}
function roleSelectClass(role) {
  if (role === 'Administrator') return 'rs-admin'
  if (role === 'Staff')         return 'rs-staff'
  return 'rs-viewer'
}
function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
function confirmRemove(user) { removeTarget.value = user }

function showToast(msg, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message: msg, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

onMounted(async () => {
  currentUser.value = await getProfile()
  await fetchUsers()
})
</script>


<style scoped>
.req { color: #B01020; }
.input-error { border-color: #B01020 !important; background: #fff5f5 !important; }
.field-error { color: #B01020; font-size: 11.5px; margin-top: 4px; font-weight: 500; }
.global-error { margin-top: 8px; padding: 10px 12px; background: #fff5f5; border-radius: 8px; border: 1px solid #fecaca; }
.pw-wrap { position: relative; }
.pw-wrap .form-input { padding-right: 40px; width: 100%; box-sizing: border-box; }
.pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #888; padding: 4px; display: flex; align-items: center; }
.pw-toggle:hover { color: #333; }
.invite-success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px 0 8px; gap: 10px; }
.invite-success-icon { width: 64px; height: 64px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.invite-success-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #1A1016; }
.invite-success-msg { color: #555; font-size: 13.5px; line-height: 1.6; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin-icon { animation: spin 0.8s linear infinite; }
.users-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }

.btn-invite { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: #B01020; color: white; border: none; border-radius: 11px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(176,16,32,0.25); }
.btn-invite:hover { background: #7A0A17; }

/* Role summary */
.role-summary { display: flex; gap: 12px; flex-wrap: wrap; }
.rs-card { display: flex; align-items: center; gap: 14px; background: white; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 16px 22px; flex: 1; min-width: 160px; }
.rs-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rs-admin  .rs-icon { background: #FEE2E2; color: #B01020; }
.rs-staff  .rs-icon { background: #DBEAFE; color: #2563EB; }
.rs-viewer .rs-icon { background: #F0FDF4; color: #059669; }
.rs-count { font-size: 26px; font-weight: 700; font-family: 'Cormorant Garamond', serif; color: #1A1016; line-height: 1; }
.rs-label { font-size: 12px; color: #9A8589; margin-top: 2px; }

/* Permissions box */
.permissions-box { background: white; border: 1.5px solid #EDE3E5; border-radius: 14px; padding: 18px 20px; }
.pb-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #1A1016; margin-bottom: 14px; }
.pb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.pb-col { display: flex; flex-direction: column; gap: 8px; }
.pb-role { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 8px; width: fit-content; }
.pb-role-admin  { background: #FEE2E2; color: #B01020; }
.pb-role-staff  { background: #DBEAFE; color: #2563EB; }
.pb-role-viewer { background: #D1FAE5; color: #059669; }
.pb-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.pb-list li { font-size: 12px; color: #6B5257; padding-left: 14px; position: relative; line-height: 1.4; }
.pb-list li::before { content: '·'; position: absolute; left: 4px; color: #B01020; }

/* Users card */
.users-card { background: white; border: 1.5px solid #EDE3E5; border-radius: 16px; overflow: hidden; }
.users-card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #F0E5E7; gap: 12px; flex-wrap: wrap; }
.uch-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #1A1016; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #F7F3F4; border: 1.5px solid #EDE3E5; border-radius: 10px; padding: 7px 13px; width: 240px; transition: all 0.2s; }
.search-wrap:focus-within { border-color: #B01020; background: white; }
.search-input { border: none; background: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; flex: 1; width: 100%; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 50px; color: #9A8589; font-size: 13px; }
.spinner-lg { width: 26px; height: 26px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Table */
.users-table-wrap { overflow-x: auto; }
.users-table { width: 100%; border-collapse: collapse; min-width: 580px; }
.users-table thead th { padding: 10px 18px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; background: #FAFAFA; border-bottom: 1.5px solid #EDE3E5; }
.user-row { border-bottom: 1px solid #F7F3F4; transition: background 0.12s; }
.user-row:last-child { border-bottom: none; }
.user-row:hover { background: #FFF5F6; }
.users-table td { padding: 12px 18px; vertical-align: middle; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.u-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.av-admin  { background: #FEE2E2; color: #B01020; }
.av-staff  { background: #DBEAFE; color: #2563EB; }
.av-viewer { background: #D1FAE5; color: #059669; }
.u-name  { font-size: 13px; font-weight: 600; color: #1A1016; display: flex; align-items: center; gap: 6px; }
.u-email { font-size: 11px; color: #9A8589; }
.you-badge { font-size: 9px; font-weight: 700; background: #F7F3F4; color: #9A8589; padding: 1px 7px; border-radius: 10px; letter-spacing: 0.5px; text-transform: uppercase; }

/* Role select */
.role-select { padding: 5px 10px; border-radius: 8px; border: 1.5px solid; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: all 0.18s; }
.role-select:disabled { opacity: 0.55; cursor: not-allowed; }
.role-select.rs-admin  { border-color: #FCA5A5; background: #FEF2F2; color: #B01020; }
.role-select.rs-staff  { border-color: #93C5FD; background: #EFF6FF; color: #2563EB; }
.role-select.rs-viewer { border-color: #6EE7B7; background: #ECFDF5; color: #059669; }
.saving-badge { font-size: 10px; color: #9A8589; margin-top: 3px; }

/* Status */
.status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.st-active  { background: #D1FAE5; color: #065F46; }
.st-pending { background: #FEF3C7; color: #92400E; }
.st-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

.td-joined { font-size: 12px; color: #9A8589; white-space: nowrap; }

.action-btns { display: flex; gap: 6px; }
.act-btn { width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid #EDE3E5; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9A8589; transition: all 0.15s; }
.act-danger:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }
.you-cell { font-size: 12px; color: #C4ADAF; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
.modal-sm { max-width: 400px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 0; position: sticky; top: 0; background: white; z-index: 1; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.modal-close { background: #F7F3F4; border: none; border-radius: 8px; color: #9A8589; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: #FFF5F6; color: #B01020; }
.modal-body { padding: 16px 22px 4px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px 20px; border-top: 1px solid #EDE3E5; }

/* Invite modal pieces */
.step-notice { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; font-size: 13px; color: #2563EB; font-weight: 500; }
.step-list { display: flex; flex-direction: column; gap: 12px; }
.step { display: flex; gap: 12px; align-items: flex-start; }
.step-num { width: 24px; height: 24px; border-radius: 50%; background: #B01020; color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.step-text { font-size: 13px; color: #3D2830; line-height: 1.5; }
.step-text strong { color: #1A1016; }
.supabase-link-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; font-size: 13px; }
.supabase-link-box a { color: #059669; font-weight: 600; text-decoration: none; }
.supabase-link-box a:hover { text-decoration: underline; }
.remove-text { font-size: 13px; color: #3D2830; line-height: 1.6; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #3D2830; }
.form-hint { font-size: 11px; color: #9A8589; }
.form-input { width: 100%; padding: 9px 13px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; }
.form-select { cursor: pointer; }
.btn-cancel { padding: 10px 20px; background: none; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #9A8589; cursor: pointer; }
.btn-cancel:hover { border-color: #9A8589; color: #3D2830; }
.btn-save { display: flex; align-items: center; gap: 7px; padding: 10px 20px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-save:hover { background: #7A0A17; }

/* Toast */
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

@media (max-width: 700px) { .pb-grid { grid-template-columns: 1fr; } .role-summary { flex-direction: column; } }
</style>