<template>
  <div class="dashboard-root" @click="closeAllDropdowns">

    <!-- ══ SIDEBAR ══ -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileOpen }">
      <div class="sidebar-brand">
        <div class="sidebar-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
            <rect x="2" y="3"  width="20" height="4" rx="1"/>
            <rect x="2" y="10" width="12" height="4" rx="1"/>
            <rect x="2" y="17" width="16" height="4" rx="1"/>
          </svg>
        </div>
        <Transition name="label">
          <div class="sidebar-brand-text" v-show="!sidebarCollapsed">
            <span class="sidebar-brand-name">SLU Branding</span>
            <span class="sidebar-brand-sub">Inventory System</span>
          </div>
        </Transition>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label" v-show="!sidebarCollapsed">Main</div>
        <router-link
          v-for="item in visibleMainNav" :key="item.to" :to="item.to"
          class="nav-item" :class="{ active: $route.path === item.to }"
          :title="sidebarCollapsed ? item.label : ''"
          @click="closeMobile"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <Transition name="label">
            <span class="nav-label" v-show="!sidebarCollapsed">{{ item.label }}</span>
          </Transition>
          <Transition name="label">
            <span class="nav-badge" v-if="item.badge && alertCount > 0 && !sidebarCollapsed">{{ alertCount }}</span>
          </Transition>
        </router-link>

        <div class="nav-divider"></div>
        <div class="nav-section-label" v-show="!sidebarCollapsed">System</div>
        <router-link
          v-for="item in visibleSystemNav" :key="item.to" :to="item.to"
          class="nav-item" :class="{ active: $route.path === item.to }"
          :title="sidebarCollapsed ? item.label : ''"
          @click="closeMobile"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <Transition name="label">
            <span class="nav-label" v-show="!sidebarCollapsed">{{ item.label }}</span>
          </Transition>
        </router-link>
      </nav>

      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitial }}</div>
        <Transition name="label">
          <div class="user-info" v-show="!sidebarCollapsed">
            <span class="user-name">{{ session.name }}</span>
            <span class="user-role">{{ session.role }}</span>
          </div>
        </Transition>
        <Transition name="label">
          <button class="user-logout" v-show="!sidebarCollapsed" @click="logout" title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </Transition>
      </div>
    </aside>

    <!-- ══ MAIN AREA ══ -->
    <div class="main-area">

      <Teleport to="body">
        <div v-if="mobileOpen" class="mobile-backdrop" @click="closeMobile"></div>
      </Teleport>

      <!-- ── TOPBAR ── -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="collapse-btn" @click="toggleSidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="topbar-page-title">{{ currentPageTitle }}</div>
        </div>

        <div class="topbar-right">

          <!-- ── SEARCH ── -->
          <div class="topbar-search" :class="{ 'search-active': searchQuery }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref="searchInput"
              type="text"
              placeholder="Search products, activities…"
              v-model="searchQuery"
              @input="onSearch"
              @keydown.escape="clearSearch"
              @click.stop
            />
            <button class="search-clear" v-if="searchQuery" @click="clearSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Search results dropdown -->
          <Teleport to="body">
            <Transition name="dropdown">
              <div class="search-dropdown" v-if="searchQuery && searchResults.length > 0" :style="searchDropdownStyle" @click.stop>
                <div class="search-section-label">Products</div>
                <div
                  v-for="r in searchResults.slice(0, 6)" :key="r.id"
                  class="search-result-item"
                  @click="goToSearchResult(r)"
                >
                  <div class="sr-icon" :class="r.stock === 0 ? 'sr-icon-out' : r.stock <= r.reorder_at ? 'sr-icon-low' : 'sr-icon-ok'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                  <div class="sr-info">
                    <div class="sr-name" v-html="highlight(r.name, searchQuery)"></div>
                    <div class="sr-meta">{{ r.category }} · {{ r.stock }} {{ r.unit || 'pcs' }}</div>
                  </div>
                  <span class="sr-badge" v-if="r.stock === 0">Out</span>
                  <span class="sr-badge sr-low" v-else-if="r.stock <= r.reorder_at">Low</span>
                </div>
                <div class="search-footer" @click="goToInventory">
                  View all in Inventory →
                </div>
              </div>
              <div class="search-dropdown search-empty" v-else-if="searchQuery && searchResults.length === 0" :style="searchDropdownStyle" @click.stop>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C4ADAF" stroke-width="1.5" width="28" height="28"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>No results for "<strong>{{ searchQuery }}</strong>"</span>
              </div>
            </Transition>
          </Teleport>

          <!-- ── BELL ── -->
          <div class="topbar-icon-btn" :class="{ 'btn-active': showNotifs }" @click.stop="toggleNotifs" ref="bellBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="icon-badge" v-if="alertCount > 0">{{ alertCount > 9 ? '9+' : alertCount }}</span>
          </div>

          <!-- Bell dropdown -->
          <Teleport to="body">
            <Transition name="dropdown">
              <div class="notif-dropdown" v-if="showNotifs" :style="notifDropdownStyle" @click.stop>
                <div class="notif-header">
                  <span class="notif-title">Notifications</span>
                  <span class="notif-count" v-if="alertCount > 0">{{ alertCount }} alerts</span>
                </div>

                <div class="notif-empty" v-if="alertCount === 0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C4ADAF" stroke-width="1.5" width="30" height="30"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span>All clear! No alerts right now.</span>
                </div>

                <div v-else>
                  <div
                    v-for="item in lowStockItems.slice(0, 5)" :key="item.id"
                    class="notif-item"
                    @click="goToAlerts"
                  >
                    <div class="notif-dot" :class="item.stock === 0 ? 'dot-red' : 'dot-amber'"></div>
                    <div class="notif-info">
                      <div class="notif-name">{{ item.name }}</div>
                      <div class="notif-desc">
                        {{ item.stock === 0 ? 'Out of stock' : `Only ${item.stock} ${item.unit || 'pcs'} left` }}
                      </div>
                    </div>
                    <span class="notif-pill" :class="item.stock === 0 ? 'pill-out' : 'pill-low'">
                      {{ item.stock === 0 ? 'Out' : 'Low' }}
                    </span>
                  </div>
                  <div class="notif-more" v-if="alertCount > 5">+{{ alertCount - 5 }} more alerts</div>
                </div>

                <div class="notif-footer" @click="goToAlerts">
                  View all in Stock Alerts →
                </div>
              </div>
            </Transition>
          </Teleport>

          <!-- ── AVATAR ── -->
          <div class="topbar-avatar" :class="{ 'avatar-active': showUserMenu }" @click.stop="toggleUserMenu" ref="avatarBtn" title="Account">
            {{ userInitial }}
          </div>

          <!-- Avatar dropdown -->
          <Teleport to="body">
            <Transition name="dropdown">
              <div class="user-dropdown" v-if="showUserMenu" :style="userMenuStyle" @click.stop>
                <div class="ud-profile">
                  <div class="ud-avatar">{{ userInitial }}</div>
                  <div>
                    <div class="ud-name">{{ session.name }}</div>
                    <div class="ud-email">{{ session.email || 'No email' }}</div>
                    <span class="ud-role-pill" :class="session.role === 'Administrator' ? 'pill-admin' : 'pill-staff'">
                      {{ session.role }}
                    </span>
                  </div>
                </div>
                <div class="ud-divider"></div>
                <div class="ud-item" @click="goTo('/dashboard/settings')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </div>
                <div class="ud-item" @click="goTo('/dashboard')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Dashboard
                </div>
                <div class="ud-divider"></div>
                <div class="ud-item ud-logout" @click="logout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </div>
              </div>
            </Transition>
          </Teleport>

        </div>
      </header>

      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getProfile, signOut } from '@/composables/useAuth'
import { useInventory } from '@/composables/useInventory'

const router = useRouter()
const route  = useRoute()

// ── Session ───────────────────────────────────
const session = ref({ name: 'User', role: 'Staff', email: '' })
const { products, fetchProducts, lowStockItems } = useInventory()

onMounted(async () => {
  const profile = await getProfile()
  if (profile) session.value = profile
  await fetchProducts()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))

function onResize() {
  if (window.innerWidth > 768) mobileOpen.value = false
  closeAllDropdowns()
}

const userInitial = computed(() =>
  session.value.name ? session.value.name.charAt(0).toUpperCase() : 'U'
)
const alertCount = computed(() => lowStockItems.value.length)

// ── Sidebar ───────────────────────────────────
const sidebarCollapsed = ref(false)
const mobileOpen       = ref(false)

function toggleSidebar() {
  if (window.innerWidth <= 768) mobileOpen.value = !mobileOpen.value
  else sidebarCollapsed.value = !sidebarCollapsed.value
}
function closeMobile() { mobileOpen.value = false }

// ── Navigation ────────────────────────────────
// adminOnly: true  → only Administrators see it
// staffOnly: false (default) → everyone sees it
const mainNav = [
  { to: '/dashboard',              label: 'Dashboard',            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
  { to: '/dashboard/inventory',    label: 'Products / Inventory', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>` },
  { to: '/dashboard/categories',   label: 'Categories',           icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>` },
  { to: '/dashboard/alerts',       label: 'Stock Alerts',         badge: true, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
  { to: '/dashboard/activities',   label: 'Activities',           icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
  { to: '/dashboard/dispense-records', label: 'Dispense Records',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="9 11 12 14 22 4"/></svg>` },
  { to: '/dashboard/equipment',    label: 'Equipment',            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
  { to: '/dashboard/reports',      label: 'Reports',              icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  { to: '/dashboard/qr-generator', label: 'QR Generator',        adminOnly: true, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { to: '/dashboard/activity-log',    label: 'Activity Logs',    adminOnly: true, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>` },
  { to: '/dashboard/user-management', label: 'User Management',  adminOnly: true, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
]

// System section — Settings visible to all, nothing else needed here
const systemNav = [
  { to: '/dashboard/settings', label: 'Settings', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="17" height="17"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
]

const isAdmin = computed(() => session.value.role === 'Administrator')

const visibleMainNav = computed(() =>
  mainNav.filter(i => !i.adminOnly || isAdmin.value)
)

const visibleSystemNav = computed(() =>
  systemNav.filter(i => !i.adminOnly || isAdmin.value)
)

const pageTitles = {
  '/dashboard':            'Dashboard Overview',
  '/dashboard/inventory':  'Products & Inventory',
  '/dashboard/categories': 'Categories',
  '/dashboard/alerts':     'Stock Alerts',
  '/dashboard/activities': 'Team Activities',
  '/dashboard/dispense-records': 'Dispense Records',
  '/dashboard/equipment':  'Equipment',
  '/dashboard/reports':        'Reports',
  '/dashboard/qr-generator':   'QR Code Generator',
  '/dashboard/activity-log':    'Activity Logs',
  '/dashboard/user-management':  'User Management',
  '/dashboard/equipment-scan':    'Equipment QR Scanner',
  '/dashboard/users':          'User Management',
  '/dashboard/settings':   'Settings',
}
const currentPageTitle = computed(() => pageTitles[route.path] || 'Dashboard')

// ── SEARCH ────────────────────────────────────
const searchQuery  = ref('')
const searchInput  = ref(null)

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q || !products.value) return []
  return products.value.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.sku?.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q)
  )
})

// Position search dropdown under the search box
const searchDropdownStyle = ref({})
function onSearch() {
  nextTick(() => {
    if (!searchInput.value) return
    const rect = searchInput.value.closest('.topbar-search').getBoundingClientRect()
    searchDropdownStyle.value = {
      top:   rect.bottom + 8 + 'px',
      left:  rect.left + 'px',
      width: Math.max(rect.width, 320) + 'px',
    }
  })
}

function highlight(text, query) {
  if (!query) return text
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(re, '<mark>$1</mark>')
}
function clearSearch() { searchQuery.value = '' }
function goToInventory() { clearSearch(); router.push('/dashboard/inventory') }
function goToSearchResult(item) {
  clearSearch()
  router.push('/dashboard/inventory')
}

// ── NOTIFICATIONS ─────────────────────────────
const showNotifs       = ref(false)
const bellBtn          = ref(null)
const notifDropdownStyle = ref({})

function toggleNotifs() {
  showNotifs.value = !showNotifs.value
  showUserMenu.value = false
  if (showNotifs.value) {
    nextTick(() => {
      if (!bellBtn.value) return
      const rect = bellBtn.value.getBoundingClientRect()
      notifDropdownStyle.value = {
        top:   rect.bottom + 8 + 'px',
        right: window.innerWidth - rect.right + 'px',
      }
    })
  }
}
function goToAlerts() {
  showNotifs.value = false
  router.push('/dashboard/alerts')
}

// ── USER MENU ─────────────────────────────────
const showUserMenu   = ref(false)
const avatarBtn      = ref(null)
const userMenuStyle  = ref({})

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
  showNotifs.value = false
  if (showUserMenu.value) {
    nextTick(() => {
      if (!avatarBtn.value) return
      const rect = avatarBtn.value.getBoundingClientRect()
      userMenuStyle.value = {
        top:   rect.bottom + 8 + 'px',
        right: window.innerWidth - rect.right + 'px',
      }
    })
  }
}

function goTo(path) {
  showUserMenu.value = false
  router.push(path)
}

function closeAllDropdowns() {
  showNotifs.value   = false
  showUserMenu.value = false
  if (!document.activeElement?.closest?.('.topbar-search')) {
    // keep search results if user is typing
  }
}

async function logout() {
  showUserMenu.value = false
  await signOut()
  router.push('/')
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { width: 100%; height: 100%; font-family: 'Outfit', sans-serif; background: #F7F3F4; overflow: hidden; }
.mobile-backdrop { position: fixed; inset: 0; z-index: 998; background: rgba(26,16,22,0.55); backdrop-filter: blur(2px); }

/* ── Teleported dropdowns (global) ── */
.search-dropdown {
  position: fixed; z-index: 9990;
  background: white; border-radius: 14px;
  border: 1.5px solid #EDE3E5;
  box-shadow: 0 12px 40px rgba(26,16,22,0.14);
  overflow: hidden;
}
.search-section-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #9A8589; padding: 10px 14px 6px; }
.search-result-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; cursor: pointer; transition: background 0.15s; }
.search-result-item:hover { background: #FFF5F6; }
.sr-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sr-icon-ok  { background: #F0FDF4; color: #16A34A; }
.sr-icon-low { background: #FFFBEB; color: #D97706; }
.sr-icon-out { background: #FFF5F6; color: #B01020; }
.sr-info { flex: 1; min-width: 0; }
.sr-name { font-size: 13px; font-weight: 500; color: #1A1016; }
.sr-name mark { background: #FFEEBB; color: #1A1016; border-radius: 2px; padding: 0 1px; }
.sr-meta { font-size: 11px; color: #9A8589; margin-top: 1px; }
.sr-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.sr-low { background: #FFFBEB; color: #D97706; border-color: #FDE68A; }
.search-footer { padding: 10px 14px; font-size: 12px; color: #B01020; font-weight: 600; cursor: pointer; border-top: 1px solid #F0E5E7; transition: background 0.15s; }
.search-footer:hover { background: #FFF5F6; }
.search-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; font-size: 13px; color: #9A8589; text-align: center; min-height: 80px; }

.notif-dropdown {
  position: fixed; z-index: 9990;
  width: 320px; background: white;
  border-radius: 16px; border: 1.5px solid #EDE3E5;
  box-shadow: 0 12px 40px rgba(26,16,22,0.14);
  overflow: hidden;
}
.notif-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; border-bottom: 1px solid #F0E5E7; }
.notif-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: #1A1016; }
.notif-count { font-size: 11px; font-weight: 600; background: #FFF5F6; color: #B01020; padding: 2px 9px; border-radius: 20px; border: 1px solid #FECDD3; }
.notif-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px 16px; color: #9A8589; font-size: 13px; }
.notif-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #FAF0F1; }
.notif-item:hover { background: #FFF5F6; }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: #B01020; } .dot-amber { background: #D97706; }
.notif-info { flex: 1; min-width: 0; }
.notif-name { font-size: 13px; font-weight: 500; color: #1A1016; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-desc { font-size: 11px; color: #9A8589; margin-top: 1px; }
.notif-pill { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; flex-shrink: 0; }
.pill-out { background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.pill-low { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
.notif-more { font-size: 12px; color: #9A8589; padding: 8px 16px; text-align: center; }
.notif-footer { padding: 10px 16px; font-size: 12px; color: #B01020; font-weight: 600; cursor: pointer; border-top: 1px solid #F0E5E7; transition: background 0.15s; }
.notif-footer:hover { background: #FFF5F6; }

.user-dropdown {
  position: fixed; z-index: 9990;
  width: 230px; background: white;
  border-radius: 16px; border: 1.5px solid #EDE3E5;
  box-shadow: 0 12px 40px rgba(26,16,22,0.14);
  overflow: hidden;
}
.ud-profile { display: flex; align-items: center; gap: 12px; padding: 16px; background: #FFF5F6; }
.ud-avatar { width: 42px; height: 42px; background: #B01020; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: white; flex-shrink: 0; }
.ud-name { font-size: 14px; font-weight: 600; color: #1A1016; }
.ud-email { font-size: 11px; color: #9A8589; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
.ud-role-pill { display: inline-block; margin-top: 5px; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
.pill-admin { background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.pill-staff { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
.ud-divider { height: 1px; background: #EDE3E5; }
.ud-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; font-size: 13px; font-weight: 500; color: #3D2830; cursor: pointer; transition: background 0.15s; }
.ud-item:hover { background: #FFF5F6; color: #B01020; }
.ud-item svg { flex-shrink: 0; color: #9A8589; }
.ud-item:hover svg { color: #B01020; }
.ud-logout { color: #B01020; }
.ud-logout svg { color: #B01020; }
.ud-logout:hover { background: #FFF5F6; }

/* Dropdown animation */
.dropdown-enter-active { transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1); }
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-6px) scale(0.97); }
.dropdown-leave-to   { opacity: 0; transform: translateY(-4px) scale(0.98); }

/* ── Bootstrap Icons global helpers ── */
.empty-bi   { font-size: 42px; color: #DDD5D7; display: block; text-align: center; }
.success-bi { font-size: 48px; color: #16A34A; display: block; text-align: center; }
.bi { line-height: 1; }
</style>

<style scoped>
.dashboard-root { display: flex; width: 100vw; height: 100vh; overflow: hidden; background: #F7F3F4; }

/* ══ SIDEBAR ══ */
.sidebar { width: 240px; flex-shrink: 0; background: #B01020; display: flex; flex-direction: column; height: 100%; transition: width 0.28s cubic-bezier(0.4,0,0.2,1); overflow: hidden; position: relative; z-index: 10; }
.sidebar.collapsed { width: 64px; }
.sidebar::before { content: ''; position: absolute; top: -80px; right: -80px; width: 220px; height: 220px; border: 50px solid rgba(255,255,255,0.05); border-radius: 50%; pointer-events: none; }
.sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 20px 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; min-height: 68px; }
.sidebar-logo-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; }
.sidebar-logo-icon svg { width: 18px; height: 18px; }
.sidebar-brand-text { overflow: hidden; white-space: nowrap; }
.sidebar-brand-name { display: block; font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: white; letter-spacing: 0.3px; line-height: 1.2; }
.sidebar-brand-sub  { display: block; font-size: 9px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 1px; }
.sidebar-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
.sidebar-nav::-webkit-scrollbar { width: 0; }
.nav-section-label { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); padding: 4px 8px 6px; white-space: nowrap; overflow: hidden; }
.nav-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 8px 4px; }
.nav-item { display: flex; align-items: center; gap: 11px; padding: 10px; border-radius: 10px; text-decoration: none; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 400; transition: all 0.18s; white-space: nowrap; overflow: hidden; min-height: 40px; flex-shrink: 0; }
.nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
.nav-item.active { background: rgba(255,255,255,0.18); color: white; font-weight: 600; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15); }
.nav-icon { flex-shrink: 0; width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; }
.nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.nav-badge { margin-left: auto; background: rgba(255,255,255,0.25); color: white; font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 20px; flex-shrink: 0; }
.sidebar-user { display: flex; align-items: center; gap: 10px; padding: 14px; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; min-height: 60px; }
.user-avatar { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; border: 1.5px solid rgba(255,255,255,0.3); }
.user-info { flex: 1; overflow: hidden; }
.user-name { display: block; font-size: 12px; font-weight: 500; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { display: block; font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-top: 1px; }
.user-logout { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.45); display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: color 0.18s; flex-shrink: 0; }
.user-logout:hover { color: white; }

/* ══ MAIN AREA ══ */
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; width: 0; }
.topbar { height: 60px; background: white; border-bottom: 1px solid #EDE3E5; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0; box-shadow: 0 1px 4px rgba(176,16,32,0.06); position: relative; z-index: 20; }
.topbar-left { display: flex; align-items: center; gap: 16px; }
.collapse-btn { background: none; border: none; cursor: pointer; color: #9A8589; display: flex; align-items: center; padding: 6px; border-radius: 8px; transition: all 0.18s; }
.collapse-btn:hover { background: #FFF5F6; color: #B01020; }
.topbar-page-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; letter-spacing: 0.3px; }
.topbar-right { display: flex; align-items: center; gap: 10px; }

/* Search */
.topbar-search { display: flex; align-items: center; gap: 8px; background: #F7F3F4; border: 1.5px solid #EDE3E5; border-radius: 10px; padding: 7px 14px; transition: all 0.2s; position: relative; }
.topbar-search:focus-within { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.07); }
.topbar-search svg { color: #9A8589; flex-shrink: 0; }
.topbar-search input { border: none; background: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; width: 200px; }
.topbar-search input::placeholder { color: #C4ADAF; }
.search-clear { background: none; border: none; cursor: pointer; color: #9A8589; display: flex; align-items: center; padding: 2px; border-radius: 4px; transition: color 0.15s; }
.search-clear:hover { color: #B01020; }

/* Bell & Avatar */
.topbar-icon-btn { position: relative; width: 36px; height: 36px; border-radius: 10px; background: #F7F3F4; border: 1.5px solid #EDE3E5; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9A8589; transition: all 0.18s; }
.topbar-icon-btn:hover, .topbar-icon-btn.btn-active { background: #FFF5F6; border-color: #B01020; color: #B01020; }
.icon-badge { position: absolute; top: -5px; right: -5px; background: #B01020; color: white; font-size: 9px; font-weight: 700; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
.topbar-avatar { width: 36px; height: 36px; background: #B01020; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; cursor: pointer; border: 2px solid rgba(176,16,32,0.2); transition: all 0.18s; user-select: none; }
.topbar-avatar:hover, .topbar-avatar.avatar-active { box-shadow: 0 0 0 3px rgba(176,16,32,0.2); transform: scale(1.05); }

.page-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 28px; min-width: 0; box-sizing: border-box; background: #F7F3F4; }
.page-content::-webkit-scrollbar { width: 5px; }
.page-content::-webkit-scrollbar-track { background: transparent; }
.page-content::-webkit-scrollbar-thumb { background: #E0CBCE; border-radius: 3px; }

.label-enter-active { transition: opacity 0.2s 0.05s, transform 0.2s 0.05s; }
.label-leave-active { transition: opacity 0.12s, transform 0.12s; }
.label-enter-from   { opacity: 0; transform: translateX(-6px); }
.label-leave-to     { opacity: 0; transform: translateX(-6px); }

@media (max-width: 768px) {
  .sidebar { position: fixed; top: 0; left: 0; width: 260px; height: 100dvh; z-index: 999; transform: translateX(-100%); transition-property: transform; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
  .sidebar.mobile-open { transform: translateX(0); box-shadow: 8px 0 32px rgba(0,0,0,0.3); }
  .sidebar.collapsed { width: 260px; }
  .main-area { width: 100vw; flex: none; min-width: 0; }
  .topbar { padding: 0 14px; }
  .topbar-search { display: none; }
  .topbar-page-title { font-size: 17px; }
  .page-content { padding: 16px 14px; }
}
@media (max-width: 480px) {
  .topbar-page-title { font-size: 15px; }
  .page-content { padding: 12px 10px; }
}
</style>