<template>
  <div class="overview">

    <!-- ── Greeting ── -->
    <div class="greeting">
      <div>
        <div class="greeting-text">Good {{ timeOfDay }}, <strong>{{ session.name }}</strong> 👋</div>
        <div class="greeting-sub">Here's what's happening with your inventory today.</div>
      </div>
      <div class="greeting-date">{{ today }}</div>
    </div>

    <!-- ── Stat Cards ── -->
    <div class="stat-grid">
      <div class="stat-card stat-primary">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Products</div>
          <div class="stat-value">{{ totalProducts }}</div>
          <div class="stat-sub">Across {{ categories.length }} categories</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Total Stock</div>
          <div class="stat-value">{{ totalStock.toLocaleString() }}</div>
          <div class="stat-sub">Units in inventory</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Inventory Value</div>
          <div class="stat-value">₱{{ Math.round(totalValue / 1000) }}K</div>
          <div class="stat-sub">Estimated total</div>
        </div>
      </div>

      <div class="stat-card stat-alert" @click="$router.push('/dashboard/alerts')">
        <div class="stat-icon stat-icon-red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">Low Stock Alerts</div>
          <div class="stat-value">{{ lowStockItems.length }}</div>
          <div class="stat-sub">Items need reorder ↗</div>
        </div>
      </div>
    </div>

    <!-- ── Bottom Grid ── -->
    <div class="bottom-grid">

      <!-- Low Stock Alerts -->
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="15" height="15">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Low Stock Alerts
          </div>
          <button class="panel-link" @click="$router.push('/dashboard/alerts')">View all</button>
        </div>

        <div class="alert-list">
          <div class="alert-empty" v-if="lowStockItems.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C4ADAF" stroke-width="1.5" width="32" height="32">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>All items are well stocked!</span>
          </div>
          <div
            class="alert-item"
            v-for="item in lowStockItems.slice(0, 6)"
            :key="item.id"
            @click="$router.push('/dashboard/inventory')"
          >
            <div class="alert-dot" :class="item.stock === 0 ? 'dot-out' : 'dot-low'"></div>
            <div class="alert-info">
              <div class="alert-name">{{ item.name }}</div>
              <div class="alert-sku">{{ item.sku }}</div>
            </div>
            <div class="alert-stock" :class="item.stock === 0 ? 'stock-out' : 'stock-low'">
              {{ item.stock === 0 ? 'Out' : item.stock + ' left' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2" width="15" height="15">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Recent Activity
          </div>
        </div>

        <div class="activity-list">
          <div class="activity-item" v-for="act in activities.slice(0, 8)" :key="act.id">
            <div class="activity-icon" :class="'act-' + act.type">
              <!-- restock -->
              <svg v-if="act.type === 'restock'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              <!-- dispatch -->
              <svg v-else-if="act.type === 'dispatch'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <!-- low -->
              <svg v-else-if="act.type === 'low'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
              <!-- new -->
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-desc">
                <span class="act-type-label">{{ actLabel(act.type) }}</span>
                {{ act.product }}
                <span class="act-qty" v-if="act.type !== 'low'">× {{ act.qty }}</span>
              </div>
              <div class="activity-meta">{{ act.user }} · {{ act.time }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventory } from '@/composables/useInventory'
import { useActivities } from '@/composables/useActivities'
import { getProfile } from '@/composables/useAuth'

const {
  totalProducts, totalStock, totalValue,
  lowStockItems, categories,
  fetchProducts, fetchCategories,
} = useInventory()

const { activities, fetchActivities } = useActivities()

const session = ref({ name: 'User', role: 'Staff' })

onMounted(async () => {
  const profile = await getProfile()
  if (profile) session.value = profile
  await Promise.all([fetchProducts(), fetchCategories(), fetchActivities()])
})

// Greeting
const hour = new Date().getHours()
const timeOfDay = computed(() => {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
})

const today = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

function actLabel(type) {
  return { restock: 'Restocked', dispatch: 'Dispatched', low: 'Low stock:', new: 'Added' }[type] || type
}
</script>

<style scoped>

.overview { display: flex; flex-direction: column; gap: 24px; }

/* Greeting */
.greeting {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
  animation: fadeUp 0.5s both;
}
.greeting-text {
  font-size: 18px; color: #1A1016; font-weight: 300;
}
.greeting-text strong { font-weight: 600; }
.greeting-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.greeting-date {
  font-size: 12px; color: #9A8589;
  text-align: right; white-space: nowrap; margin-top: 4px;
}

/* Stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  animation: fadeUp 0.5s 0.07s both;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1.5px solid #EDE3E5;
  display: flex; align-items: flex-start; gap: 14px;
  transition: all 0.2s;
  position: relative; overflow: hidden;
}
.stat-card::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
  pointer-events: none;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(176,16,32,0.1); }
.stat-card.stat-alert { cursor: pointer; }

.stat-card.stat-primary {
  background: #B01020; border-color: #B01020;
}
.stat-card.stat-primary .stat-label { color: rgba(255,255,255,0.65); }
.stat-card.stat-primary .stat-value { color: white; }
.stat-card.stat-primary .stat-sub   { color: rgba(255,255,255,0.5); }
.stat-card.stat-primary .stat-icon  { background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.2); }

.stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: #FFF5F6; border: 1.5px solid #EDE3E5;
  display: flex; align-items: center; justify-content: center;
  color: #B01020; flex-shrink: 0;
}
.stat-icon-green { background: #F0FDF4; border-color: #BBF7D0; color: #16A34A; }
.stat-icon-gold  { background: #FEFCE8; border-color: #FDE68A; color: #B45309; }
.stat-icon-red   { background: #FFF5F6; border-color: #FECDD3; color: #B01020; }

.stat-label { font-size: 11px; font-weight: 500; color: #9A8589; text-transform: uppercase; letter-spacing: 1px; }
.stat-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 34px; font-weight: 600;
  color: #1A1016; line-height: 1.1; margin-top: 4px;
}
.stat-sub { font-size: 11px; color: #9A8589; margin-top: 2px; }

/* Bottom grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  animation: fadeUp 0.5s 0.14s both;
}

.panel {
  background: white;
  border-radius: 16px;
  border: 1.5px solid #EDE3E5;
  overflow: hidden;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #EDE3E5;
}
.panel-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: #1A1016;
}
.panel-link {
  font-size: 12px; color: #B01020; font-weight: 500;
  background: none; border: none; cursor: pointer;
  border-bottom: 1px solid transparent; transition: border-color 0.18s;
  padding: 0;
}
.panel-link:hover { border-color: #B01020; }

/* Alert list */
.alert-list { padding: 8px 0; max-height: 320px; overflow-y: auto; }
.alert-list::-webkit-scrollbar { width: 0; }

.alert-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 40px 20px;
  font-size: 13px; color: #C4ADAF;
}

.alert-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; cursor: pointer; transition: background 0.15s;
}
.alert-item:hover { background: #FFF5F6; }
.alert-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.dot-low { background: #F59E0B; }
.dot-out { background: #B01020; }
.alert-info { flex: 1; min-width: 0; }
.alert-name { font-size: 13px; font-weight: 500; color: #1A1016; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alert-sku  { font-size: 11px; color: #9A8589; margin-top: 1px; }
.alert-stock { font-size: 12px; font-weight: 600; flex-shrink: 0; }
.stock-low { color: #F59E0B; }
.stock-out { color: #B01020; }

/* Activity list */
.activity-list { padding: 8px 0; max-height: 320px; overflow-y: auto; }
.activity-list::-webkit-scrollbar { width: 0; }

.activity-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 20px; transition: background 0.15s;
}
.activity-item:hover { background: #FFF5F6; }

.activity-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.act-restock { background: #F0FDF4; color: #16A34A; }
.act-dispatch { background: #EFF6FF; color: #2563EB; }
.act-low     { background: #FFF5F6; color: #B01020; }
.act-new     { background: #FEFCE8; color: #B45309; }

.activity-content { flex: 1; min-width: 0; }
.activity-desc {
  font-size: 13px; color: #1A1016; line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.act-type-label { font-weight: 600; }
.act-qty { color: #9A8589; font-size: 12px; }
.activity-meta { font-size: 11px; color: #9A8589; margin-top: 2px; }

/* Animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}

/* Responsive */
@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stat-grid  { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
  .greeting  { flex-direction: column; }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr 1fr !important; }
  .bottom-grid { grid-template-columns: 1fr !important; }
  .greeting-name { font-size: 22px; }
  .greeting-date { font-size: 12px; }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr !important; }
  .greeting-name { font-size: 19px; }
}
</style>