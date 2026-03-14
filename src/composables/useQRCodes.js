// src/composables/useQRCodes.js
// ─────────────────────────────────────────────
// QR Code library — saved per SKU in Supabase
// ─────────────────────────────────────────────

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/composables/useActivityLog'

const qrCodes  = ref([])
const loading  = ref(false)

export function useQRCodes() {

  // ── Fetch all QR codes ────────────────────
  async function fetchQRCodes() {
    loading.value = true
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) qrCodes.value = data || []
    loading.value = false
  }

  // ── Add or update a QR code ───────────────
  // If SKU already exists → updates it (upsert)
  async function saveQRCode(payload) {
    const { data, error } = await supabase
      .from('qr_codes')
      .upsert(
        [{
          sku:         payload.sku,
          name:        payload.name,
          category:    payload.category    || null,
          supplier:    payload.supplier    || null,
          unit:        payload.unit        || 'pcs',
          notes:       payload.notes       || null,
          label_style: payload.label_style || 'classic',
          label_size:  payload.label_size  || 150,
          copies:      payload.copies      || 1,
        }],
        { onConflict: 'sku', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) throw error

    // Update local list
    const idx = qrCodes.value.findIndex(q => q.sku === payload.sku)
    if (idx !== -1) qrCodes.value[idx] = data
    else            qrCodes.value.unshift(data)

    logActivity({
      action:     'qr.save',
      entityType: 'product',
      entityId:   payload.sku,
      entityName: payload.name,
      details:    { sku: payload.sku, style: payload.label_style },
    })

    return data
  }

  // ── Increment print count ─────────────────
  async function incrementPrintCount(ids) {
    // ids = array of qr_codes UUIDs that were printed
    for (const id of ids) {
      await supabase.rpc('increment_print_count', { row_id: id }).catch(() => {
        // fallback if RPC not available
        const item = qrCodes.value.find(q => q.id === id)
        if (item) {
          supabase.from('qr_codes')
            .update({ print_count: (item.print_count || 0) + 1 })
            .eq('id', id)
          item.print_count = (item.print_count || 0) + 1
        }
      })
    }
  }

  // ── Delete a QR code ─────────────────────
  async function deleteQRCode(id) {
    const item = qrCodes.value.find(q => q.id === id)
    const { error } = await supabase.from('qr_codes').delete().eq('id', id)
    if (error) throw error
    qrCodes.value = qrCodes.value.filter(q => q.id !== id)
    logActivity({
      action:     'qr.delete',
      entityType: 'product',
      entityId:   item?.sku,
      entityName: item?.name,
    })
  }

  // ── Update copies count ───────────────────
  async function updateCopies(id, copies) {
    const { error } = await supabase
      .from('qr_codes').update({ copies }).eq('id', id)
    if (error) throw error
    const item = qrCodes.value.find(q => q.id === id)
    if (item) item.copies = copies
  }

  return {
    qrCodes, loading,
    fetchQRCodes, saveQRCode, deleteQRCode,
    updateCopies, incrementPrintCount,
  }
}