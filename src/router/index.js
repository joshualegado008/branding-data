// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { getSession } from '@/composables/useAuth'

// Views
import LoginView         from '@/views/LoginView.vue'
import DashboardLayout   from '@/views/DashboardLayout.vue'
import DashboardOverview from '@/views/DashboardOverview.vue'

// Lazy-loaded dashboard pages
const InventoryView  = () => import('@/views/InventoryView.vue')
const CategoriesView = () => import('@/views/CategoriesView.vue')
const AlertsView     = () => import('@/views/AlertsView.vue')
const ActivitiesView = () => import('@/views/ActivitiesView.vue')
const EquipmentView  = () => import('@/views/EquipmentView.vue')
const ReportsView    = () => import('@/views/ReportsView.vue')
const UsersView      = () => import('@/views/UsersView.vue')
const SettingsView      = () => import('@/views/SettingsView.vue')
const QRGeneratorView      = () => import('@/views/QRGeneratorView.vue')
const ActivityLogView      = () => import('@/views/ActivityLogView.vue')
const UserManagementView   = () => import('@/views/UserManagementView.vue')
const EquipmentScanView    = () => import('@/views/EquipmentScanView.vue')
const DispenseRecordsView  = () => import('@/views/DispenseRecordsView.vue')

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView,
    meta: { guest: true },
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '',            name: 'Overview',   component: DashboardOverview },
      { path: 'inventory',   name: 'Inventory',  component: InventoryView     },
      { path: 'categories',  name: 'Categories', component: CategoriesView    },
      { path: 'alerts',      name: 'Alerts',     component: AlertsView        },
      { path: 'activities',  name: 'Activities', component: ActivitiesView    },
      { path: 'equipment',   name: 'Equipment',  component: EquipmentView     },
      { path: 'reports',     name: 'Reports',    component: ReportsView       },
      { path: 'users',       name: 'Users',      component: UsersView         },
      { path: 'settings',    name: 'Settings',   component: SettingsView      },
      { path: 'qr-generator',   name: 'QRGenerator',    component: QRGeneratorView,   meta: { adminOnly: true } },
      { path: 'activity-log',    name: 'ActivityLog',    component: ActivityLogView,    meta: { adminOnly: true } },
      { path: 'user-management',  name: 'UserManagement',  component: UserManagementView,  meta: { adminOnly: true } },
      { path: 'equipment-scan',    name: 'EquipmentScan',   component: EquipmentScanView },
      { path: 'dispense-records',  name: 'DispenseRecords', component: DispenseRecordsView },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Auth guard using Supabase session ─────────
router.beforeEach(async (to) => {
  const session = await getSession()

  if (to.meta.requiresAuth && !session) {
    return { name: 'Login' }
  }
  if (to.meta.guest && session) {
    return { name: 'Overview' }
  }
  // Block non-admins from admin-only routes
  if (to.meta.adminOnly && session) {
    const { data } = await import('@/lib/supabase').then(m => m.supabase.from('profiles').select('role').eq('id', session.user.id).single())
    if (data?.role !== 'Administrator') {
      return { name: 'Overview' }
    }
  }
})

export default router