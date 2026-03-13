// src/composables/useInventory.js
// ─────────────────────────────────────────────
// Products & Categories — all data from Supabase
// ─────────────────────────────────────────────

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/composables/useActivityLog'

// ── State (module-level so it's shared across views) ──
const products   = ref([])
const categories = ref([])
const loading    = ref(false)
const error      = ref(null)

// ── Computed Stats ────────────────────────────
const totalProducts = computed(() => products.value.length)
const totalStock    = computed(() => products.value.reduce((s, p) => s + (p.stock || 0), 0))
const totalValue    = computed(() => products.value.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0))
const lowStockItems = computed(() => products.value.filter(p => p.stock <= p.reorder_at))
const outOfStock    = computed(() => products.value.filter(p => p.stock === 0))

// ── Helpers ───────────────────────────────────
function stockStatus(product) {
  if (product.stock === 0)                  return { label: 'Out of Stock', cls: 'status-out' }
  if (product.stock <= product.reorder_at)  return { label: 'Low Stock',    cls: 'status-low' }
  return                                           { label: 'In Stock',     cls: 'status-ok'  }
}

// ── Products CRUD ─────────────────────────────

async function fetchProducts() {
  loading.value = true
  error.value   = null
  const { data, error: err } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (err) { error.value = err.message }
  else     { products.value = data }
  loading.value = false
}

async function addProduct(payload) {
  const { data, error: err } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single()
  if (err) throw err
  products.value.unshift(data)
  logActivity({ action: 'product.add', entityType: 'product', entityId: data.id, entityName: data.name, details: { sku: data.sku, stock: data.stock } })
  return data
}

async function updateProduct(id, payload) {
  const { data, error: err } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (err) throw err
  const i = products.value.findIndex(p => p.id === id)
  if (i !== -1) products.value[i] = data
  logActivity({ action: 'product.edit', entityType: 'product', entityId: id, entityName: data.name, details: payload })
  return data
}

async function deleteProduct(id) {
  const { error: err } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (err) throw err
  const deleted = products.value.find(p => p.id === id)
  products.value = products.value.filter(p => p.id !== id)
  logActivity({ action: 'product.delete', entityType: 'product', entityId: id, entityName: deleted?.name, details: { sku: deleted?.sku } })
}

// ── Categories CRUD ───────────────────────────

async function fetchCategories() {
  const { data, error: err } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (err) { error.value = err.message }
  else     { categories.value = data }
}

async function addCategory(payload) {
  const { data, error: err } = await supabase
    .from('categories')
    .insert([payload])
    .select()
    .single()
  if (err) throw err
  categories.value.push(data)
  return data
}

async function updateCategory(id, payload) {
  const { data, error: err } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (err) throw err
  const i = categories.value.findIndex(c => c.id === id)
  if (i !== -1) categories.value[i] = data
  return data
}

async function deleteCategory(id) {
  const { error: err } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  if (err) throw err
  categories.value = categories.value.filter(c => c.id !== id)
}

// ── Real-time subscriptions ───────────────────

let productsSub  = null
let categorySub  = null

function subscribeRealtime() {
  // Products channel
  productsSub = supabase
    .channel('products-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
      if (payload.eventType === 'INSERT') {
        products.value.unshift(payload.new)
      } else if (payload.eventType === 'UPDATE') {
        const i = products.value.findIndex(p => p.id === payload.new.id)
        if (i !== -1) products.value[i] = payload.new
      } else if (payload.eventType === 'DELETE') {
        products.value = products.value.filter(p => p.id !== payload.old.id)
      }
    })
    .subscribe()

  // Categories channel
  categorySub = supabase
    .channel('categories-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => {
      if (payload.eventType === 'INSERT') {
        categories.value.push(payload.new)
      } else if (payload.eventType === 'UPDATE') {
        const i = categories.value.findIndex(c => c.id === payload.new.id)
        if (i !== -1) categories.value[i] = payload.new
      } else if (payload.eventType === 'DELETE') {
        categories.value = categories.value.filter(c => c.id !== payload.old.id)
      }
    })
    .subscribe()
}

function unsubscribeRealtime() {
  if (productsSub) supabase.removeChannel(productsSub)
  if (categorySub) supabase.removeChannel(categorySub)
}

// ── Export ────────────────────────────────────
export function useInventory() {
  return {
    products, categories, loading, error,
    totalProducts, totalStock, totalValue,
    lowStockItems, outOfStock,
    stockStatus,
    fetchProducts, addProduct, updateProduct, deleteProduct,
    fetchCategories, addCategory, updateCategory, deleteCategory,
    subscribeRealtime, unsubscribeRealtime,
  }
}