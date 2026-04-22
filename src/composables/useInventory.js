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
const totalProducts    = computed(() => products.value.length)
const totalStock       = computed(() => products.value.reduce((s, p) => s + (p.stock || 0), 0))
const totalValue       = computed(() => products.value.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0))
const totalRoom1Stock  = computed(() => products.value.reduce((s, p) => s + (p.room1_stock || 0), 0))
const lowStockItems    = computed(() => products.value.filter(p => p.stock <= p.reorder_at))
const outOfStock       = computed(() => products.value.filter(p => p.stock === 0))
const room1LowStock    = computed(() => products.value.filter(p => (p.room1_stock || 0) <= (p.room1_reorder_at ?? 2) && (p.room1_stock || 0) > 0))
const room1OutOfStock  = computed(() => products.value.filter(p => (p.room1_stock || 0) === 0))

// ── Helpers ───────────────────────────────────
function stockStatus(product) {
  if (product.stock === 0)                  return { label: 'Out of Stock', cls: 'status-out' }
  if (product.stock <= product.reorder_at)  return { label: 'Low Stock',    cls: 'status-low' }
  return                                           { label: 'In Stock',     cls: 'status-ok'  }
}

function room1Status(product) {
  const s = product.room1_stock || 0
  const r = product.room1_reorder_at ?? 2
  if (s === 0)   return { label: 'Empty',    cls: 'status-out' }
  if (s <= r)    return { label: 'Low',      cls: 'status-low' }
  return               { label: 'Stocked',  cls: 'status-ok'  }
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

// ── Room 1 Stock Operations ───────────────────

async function updateRoom1Stock(id, room1_stock) {
  const { data, error: err } = await supabase
    .from('products')
    .update({ room1_stock })
    .eq('id', id)
    .select()
    .single()
  if (err) throw err
  const i = products.value.findIndex(p => p.id === id)
  if (i !== -1) products.value[i] = data
  logActivity({
    action:     'stock.room1_update',
    entityType: 'product',
    entityId:   id,
    entityName: data.name,
    details:    { room1_stock },
  })
  return data
}

async function transferToRoom1(product, qty, notes, userName) {
  if (qty <= 0) throw new Error('Quantity must be greater than 0')
  if (qty > product.stock) throw new Error('Not enough warehouse stock')

  const newWarehouse = product.stock - qty
  const newRoom1     = (product.room1_stock || 0) + qty

  // Update both stock values atomically
  const { data, error: err } = await supabase
    .from('products')
    .update({ stock: newWarehouse, room1_stock: newRoom1 })
    .eq('id', product.id)
    .select()
    .single()
  if (err) throw err

  const i = products.value.findIndex(p => p.id === product.id)
  if (i !== -1) products.value[i] = data

  // Record transfer
  await supabase.from('stock_transfers').insert([{
    product_id:          product.id,
    product_name:        product.name,
    quantity:            qty,
    from_location:       'warehouse',
    to_location:         'room1',
    notes:               notes || null,
    transferred_by_name: userName || 'Unknown',
  }])

  logActivity({
    action:     'stock.transfer',
    entityType: 'stock',
    entityId:   product.id,
    entityName: product.name,
    details:    { qty, from: 'warehouse', to: 'room1', warehouse_after: newWarehouse, room1_after: newRoom1 },
  })

  return data
}

async function transferFromRoom1(product, qty, notes, userName) {
  if (qty <= 0) throw new Error('Quantity must be greater than 0')
  if (qty > (product.room1_stock || 0)) throw new Error('Not enough Room 1 stock')

  const newWarehouse = product.stock + qty
  const newRoom1     = (product.room1_stock || 0) - qty

  const { data, error: err } = await supabase
    .from('products')
    .update({ stock: newWarehouse, room1_stock: newRoom1 })
    .eq('id', product.id)
    .select()
    .single()
  if (err) throw err

  const i = products.value.findIndex(p => p.id === product.id)
  if (i !== -1) products.value[i] = data

  await supabase.from('stock_transfers').insert([{
    product_id:          product.id,
    product_name:        product.name,
    quantity:            qty,
    from_location:       'room1',
    to_location:         'warehouse',
    notes:               notes || null,
    transferred_by_name: userName || 'Unknown',
  }])

  logActivity({
    action:     'stock.transfer',
    entityType: 'stock',
    entityId:   product.id,
    entityName: product.name,
    details:    { qty, from: 'room1', to: 'warehouse', warehouse_after: newWarehouse, room1_after: newRoom1 },
  })

  return data
}

// ── Export ────────────────────────────────────
export function useInventory() {
  return {
    products, categories, loading, error,
    totalProducts, totalStock, totalValue, totalRoom1Stock,
    lowStockItems, outOfStock,
    room1LowStock, room1OutOfStock,
    stockStatus, room1Status,
    fetchProducts, addProduct, updateProduct, deleteProduct,
    fetchCategories, addCategory, updateCategory, deleteCategory,
    subscribeRealtime, unsubscribeRealtime,
    updateRoom1Stock, transferToRoom1, transferFromRoom1,
  }
}