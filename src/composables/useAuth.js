// src/composables/useAuth.js
// ─────────────────────────────────────────────
// Authentication via Supabase Auth
// Replaces the old hardcoded users system
// ─────────────────────────────────────────────

import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { logActivity, clearUserCache } from '@/composables/useActivityLog'

export function useAuth() {
  const router = useRouter()

  // ── Form state ────────────────────────────
  const form         = ref({ username: '', password: '' })
  const errors       = ref({ username: '', password: '' })
  const globalError  = ref('')
  const focusedField = ref('')
  const showPassword = ref(false)
  const rememberMe   = ref(false)

  // ── UI state ──────────────────────────────
  const isLoading    = ref(false)
  const loginSuccess = ref(false)
  const loggedInUser = ref('')

  // ── Lockout ───────────────────────────────
  const loginAttempts    = ref(0)
  const maxAttempts      = 5
  const isLockedOut      = ref(false)
  const lockoutCountdown = ref(0)

  // ── Toast ─────────────────────────────────
  const toast = ref({ show: false, message: '' })
  let lockoutTimer = null
  let toastTimer   = null

  // ── Clear helpers (used by @input) ────────
  function clearUsernameError() {
    errors.value.username = ''
    globalError.value     = ''
  }
  function clearPasswordError() {
    errors.value.password = ''
    globalError.value     = ''
  }

  // ── Toast ─────────────────────────────────
  function showToast(message, duration = 3500) {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { show: true, message }
    toastTimer  = setTimeout(() => { toast.value.show = false }, duration)
  }
  function handleForgotPassword() {
    showToast('Please contact your system administrator to reset your password.')
  }

  // ── Lockout ───────────────────────────────
  function startLockout() {
    isLockedOut.value      = true
    lockoutCountdown.value = 30
    lockoutTimer = setInterval(() => {
      lockoutCountdown.value--
      if (lockoutCountdown.value <= 0) {
        clearInterval(lockoutTimer)
        isLockedOut.value   = false
        loginAttempts.value = 0
        globalError.value   = ''
      }
    }, 1000)
  }

  // ── Validation ────────────────────────────
  function validate() {
    let valid             = true
    errors.value.username = ''
    errors.value.password = ''
    globalError.value     = ''

    if (!form.value.username.trim()) {
      errors.value.username = 'Email is required'
      valid = false
    }
    if (!form.value.password) {
      errors.value.password = 'Password is required'
      valid = false
    } else if (form.value.password.length < 6) {
      errors.value.password = 'Password must be at least 6 characters'
      valid = false
    }
    return valid
  }

  // ── Submit ────────────────────────────────
  async function submit() {
    if (isLoading.value || isLockedOut.value) return
    if (!validate()) return

    isLoading.value = true

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    form.value.username.trim(),
      password: form.value.password,
    })

    if (error) {
      isLoading.value = false
      loginAttempts.value++
      if (loginAttempts.value >= maxAttempts) {
        globalError.value = 'Too many failed attempts. Account temporarily locked.'
        startLockout()
      } else {
        globalError.value = `Incorrect email or password. (${loginAttempts.value}/${maxAttempts} attempts)`
      }
      return
    }

    // Fetch name from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', data.user.id)
      .single()

    isLoading.value     = false
    loginAttempts.value = 0
    loggedInUser.value  = profile?.name || data.user.email
    loginSuccess.value  = true
    logActivity({ action: 'auth.login', entityType: 'auth', entityName: profile?.name || data.user.email, details: { email: data.user.email, role: profile?.role } })

    setTimeout(() => router.push('/dashboard'), 1800)
  }

  // ── Cleanup ───────────────────────────────
  onUnmounted(() => {
    if (lockoutTimer) clearInterval(lockoutTimer)
    if (toastTimer)   clearTimeout(toastTimer)
  })

  return {
    form,
    errors,
    globalError,
    focusedField,
    showPassword,
    rememberMe,
    isLoading,
    loginSuccess,
    loggedInUser,
    loginAttempts,
    isLockedOut,
    lockoutCountdown,
    toast,
    maxAttempts,
    clearUsernameError,
    clearPasswordError,
    handleForgotPassword,
    submit,
  }
}

// ── Standalone helpers (router guard + layout) ──────────

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()
  return data ? { ...data, email: user.email, id: user.id } : null
}

export async function signOut() {
  await logActivity({ action: 'auth.logout', entityType: 'auth' })
  clearUserCache()
  await supabase.auth.signOut()
}