<template>
  <div class="login-root">
    <!-- ── Background Orbs ── -->
    <div class="bg-canvas">
      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>
      <div class="bg-orb bg-orb-3"></div>
    </div>

    <!-- ── Main Card ── -->
    <div class="page">
      <div class="card">
        <!-- Success Overlay -->
        <Transition name="fade-overlay">
          <div class="success-overlay" v-if="loginSuccess">
            <div class="success-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="#B01020" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="success-title">Welcome back, {{ loggedInUser }}</div>
            <div class="success-sub">Redirecting to dashboard…</div>
            <div class="success-loader">
              <div class="success-loader-bar"></div>
            </div>
          </div>
        </Transition>

        <!-- ══ LEFT PANEL ══ -->
        <div class="panel-left">
          <div class="panel-left-inner">
            <!-- Brand Display -->
            <div class="brand-display">
              <div class="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6">
                  <rect x="2" y="3" width="20" height="4" rx="1" />
                  <rect x="2" y="10" width="12" height="4" rx="1" />
                  <rect x="2" y="17" width="16" height="4" rx="1" />
                </svg>
              </div>
              <div class="brand-name">SLU<br />Branding</div>
              <div class="brand-divider"></div>
              <div class="brand-sub">Inventory Management System</div>
            </div>
          </div>
        </div>

        <!-- ══ RIGHT PANEL ══ -->
        <div class="panel-right">
          <div class="form-eyebrow">Secure Access Portal</div>
          <div class="form-title">Sign <strong>in</strong> to<br />your account</div>
          <div class="form-subtitle">Enter your credentials to access the system</div>

          <div class="form-sep">
            <div class="sep-line"></div>
            <span class="sep-text">credentials</span>
            <div class="sep-line"></div>
          </div>

          <!-- ── Fields ── -->
          <div class="field-group">
            <!-- Username -->
            <div class="field">
              <label class="field-label">Username</label>
              <div class="field-wrap" :class="{ 'is-focused': focusedField === 'username' }">
                <span class="field-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    width="15"
                    height="15"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </span>
                <input
                  class="field-input"
                  :class="{ 'is-error': errors.username }"
                  type="text"
                  placeholder="Enter your username"
                  v-model="form.username"
                  @focus="focusedField = 'username'"
                  @blur="focusedField = ''"
                  @input="clearUsernameError"
                  @keyup.enter="submit"
                  autocomplete="username"
                  :disabled="isLoading"
                />
              </div>
              <Transition name="err">
                <div class="field-error" v-if="errors.username">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="11"
                    height="11"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {{ errors.username }}
                </div>
              </Transition>
            </div>

            <!-- Password -->
            <div class="field">
              <label class="field-label">Password</label>
              <div class="field-wrap" :class="{ 'is-focused': focusedField === 'password' }">
                <span class="field-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    width="15"
                    height="15"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  class="field-input"
                  :class="{ 'is-error': errors.password }"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  v-model="form.password"
                  @focus="focusedField = 'password'"
                  @blur="focusedField = ''"
                  @input="clearPasswordError"
                  @keyup.enter="submit"
                  autocomplete="current-password"
                  :disabled="isLoading"
                />
                <button
                  class="field-eye"
                  type="button"
                  @click="showPassword = !showPassword"
                  :disabled="isLoading"
                  tabindex="-1"
                >
                  <svg
                    v-if="!showPassword"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    width="15"
                    height="15"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    width="15"
                    height="15"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <Transition name="err">
                <div class="field-error" v-if="errors.password">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="11"
                    height="11"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {{ errors.password }}
                </div>
              </Transition>
            </div>
          </div>
          <!-- end field-group -->

          <!-- Global error banner -->
          <Transition name="err">
            <div class="global-error" v-if="globalError">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="14"
                height="14"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ globalError }}
            </div>
          </Transition>

          <!-- Attempts warning -->
          <Transition name="err">
            <div class="attempts-warning" v-if="loginAttempts >= 2 && loginAttempts < maxAttempts">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="13"
                height="13"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {{ maxAttempts - loginAttempts }} attempt(s) remaining before lockout
            </div>
          </Transition>

          <!-- Options row -->
          <div class="options-row">
            <div class="remember-wrap" @click="!isLoading && (rememberMe = !rememberMe)">
              <div class="remember-box" :class="{ checked: rememberMe }">
                <svg
                  v-if="rememberMe"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2.5"
                  width="9"
                  height="9"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span class="remember-text">Remember me</span>
            </div>
            <a href="#" class="forgot-link" @click.prevent="handleForgotPassword"
              >Forgot password?</a
            >
          </div>

          <!-- Submit button -->
          <button class="btn-submit" @click="submit" :disabled="isLoading || isLockedOut">
            <div class="spinner" v-if="isLoading"></div>
            <template v-else-if="isLockedOut">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
                width="15"
                height="15"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Locked — wait {{ lockoutCountdown }}s</span>
            </template>
            <template v-else>
              <span>Sign In</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
                width="16"
                height="16"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </template>
          </button>
        </div>
        <!-- end panel-right -->
      </div>
    </div>
    <!-- end page -->

    <!-- Toast notification -->
    <Transition name="toast">
      <div class="toast" v-if="toast.show">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E8B4BB"
          stroke-width="2"
          width="14"
          height="14"
          style="flex-shrink: 0"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<!-- ═══════════════════════════════════════════
     SCRIPT — imports composable only, zero logic
     ═══════════════════════════════════════════ -->
<script setup>
import { useAuth } from '@/composables/useAuth'

const {
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
} = useAuth()
</script>

<!-- ═══════════════════════════════════════════
     STYLES — presentation only
     ═══════════════════════════════════════════ -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  font-family: 'Outfit', sans-serif;
  background: #fdfaf9;
  overflow: hidden;
}
</style>

<style scoped>
/* ── ROOT ─────────────────────────────── */
.login-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #fdfaf9;
}

/* ── BACKGROUND ORBS ──────────────────── */
.bg-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: drift 14s ease-in-out infinite alternate;
}
.bg-orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(176, 16, 32, 0.1) 0%, transparent 70%);
  top: -200px;
  right: -150px;
  animation-duration: 16s;
}
.bg-orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(201, 169, 110, 0.07) 0%, transparent 70%);
  bottom: -100px;
  left: -100px;
  animation-duration: 20s;
  animation-delay: -8s;
}
.bg-orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(176, 16, 32, 0.06) 0%, transparent 70%);
  top: 40%;
  left: 30%;
  animation-duration: 18s;
  animation-delay: -4s;
}
@keyframes drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(40px, 30px) scale(1.08);
  }
}

/* ── PAGE ─────────────────────────────── */
.page {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

/* ── CARD ─────────────────────────────── */
.card {
  display: flex;
  width: 100%;
  max-width: 960px;
  height: 580px;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  background: white;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.1),
    0 40px 80px rgba(176, 16, 32, 0.12);
  animation: cardIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ══ LEFT PANEL ══════════════════════════ */
.panel-left {
  flex: 0 0 42%;
  background: #b01020;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 48px 44px;
}
.panel-left::before {
  content: '';
  position: absolute;
  top: -70px;
  right: -70px;
  width: 280px;
  height: 280px;
  border: 55px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  pointer-events: none;
}
.panel-left::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -50px;
  width: 240px;
  height: 240px;
  border: 45px solid rgba(255, 255, 255, 0.04);
  border-radius: 50%;
  pointer-events: none;
}
.panel-left-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Brand Display */
.brand-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  animation: fadeUp 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.brand-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  margin-bottom: 28px;
}
.brand-icon svg {
  width: 30px;
  height: 30px;
}
.brand-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 64px;
  font-weight: 600;
  color: white;
  line-height: 1.05;
  letter-spacing: 1px;
}
.brand-divider {
  width: 48px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(201, 169, 110, 0.9), transparent);
  margin: 24px auto;
}
.brand-sub {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

/* ══ RIGHT PANEL ══════════════════════════ */
.panel-right {
  flex: 1;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 50px;
  overflow-y: auto;
}
.form-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #b01020;
  animation: fadeUp 0.5s 0.2s both;
}
.form-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 300;
  color: #1a1016;
  margin-top: 6px;
  line-height: 1.2;
  animation: fadeUp 0.5s 0.3s both;
}
.form-title strong {
  font-weight: 600;
}
.form-subtitle {
  font-size: 13px;
  color: #9a8589;
  margin-top: 5px;
  font-weight: 300;
  animation: fadeUp 0.5s 0.35s both;
}
.form-sep {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  animation: fadeUp 0.5s 0.4s both;
}
.sep-line {
  flex: 1;
  height: 1px;
  background: rgba(176, 16, 32, 0.1);
}
.sep-text {
  font-size: 10px;
  letter-spacing: 2px;
  color: #9a8589;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Fields */
.field-group {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeUp 0.5s 0.45s both;
}
.field-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #3d2830;
  margin-bottom: 6px;
}
.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.field-icon {
  position: absolute;
  left: 14px;
  color: #9a8589;
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: color 0.2s;
  z-index: 1;
}
.field-wrap.is-focused .field-icon {
  color: #b01020;
}
.field-input {
  width: 100%;
  padding: 12px 42px 12px 42px;
  border: 1.5px solid #ebe0e2;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1a1016;
  background: #fff5f6;
  outline: none;
  transition: all 0.2s;
}
.field-input::placeholder {
  color: #c4adaf;
}
.field-input:focus {
  border-color: #b01020;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(176, 16, 32, 0.08);
}
.field-input.is-error {
  border-color: #e8394a;
  background: #fff5f6;
}
.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.field-eye {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9a8589;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.18s;
}
.field-eye:hover {
  color: #b01020;
}
.field-eye:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.field-error {
  margin-top: 5px;
  font-size: 12px;
  color: #e8394a;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Banners */
.global-error {
  margin-top: 10px;
  padding: 10px 14px;
  background: #fff0f1;
  border: 1px solid #f5c0c5;
  border-radius: 10px;
  font-size: 12px;
  color: #c0142a;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.attempts-warning {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 11px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 7px;
}

/* Options row */
.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  animation: fadeUp 0.5s 0.5s both;
}
.remember-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.remember-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #d8c8ca;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
  background: white;
}
.remember-box.checked {
  background: #b01020;
  border-color: #b01020;
}
.remember-text {
  font-size: 12px;
  color: #9a8589;
}
.forgot-link {
  font-size: 12px;
  color: #b01020;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: border-color 0.18s;
}
.forgot-link:hover {
  border-color: #b01020;
}

/* Submit */
.btn-submit {
  margin-top: 18px;
  width: 100%;
  padding: 14px 24px;
  background: #b01020;
  color: white;
  border: none;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.22s;
  animation: fadeUp 0.5s 0.55s both;
  position: relative;
  overflow: hidden;
}
.btn-submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 60%);
  pointer-events: none;
}
.btn-submit:hover:not(:disabled) {
  background: #7a0a17;
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(176, 16, 32, 0.35);
}
.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}
.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Success overlay */
.success-overlay {
  position: absolute;
  inset: 0;
  background: white;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.success-ring {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #fff5f6;
  border: 2px solid #b01020;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.success-ring svg {
  width: 32px;
  height: 32px;
}
.success-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 600;
  color: #1a1016;
  margin-top: 18px;
  animation: fadeUp 0.4s 0.2s both;
}
.success-sub {
  font-size: 13px;
  color: #9a8589;
  margin-top: 6px;
  animation: fadeUp 0.4s 0.3s both;
}
.success-loader {
  width: 140px;
  height: 3px;
  background: #f0dade;
  border-radius: 3px;
  margin-top: 28px;
  overflow: hidden;
  animation: fadeUp 0.4s 0.4s both;
}
.success-loader-bar {
  height: 100%;
  background: #b01020;
  border-radius: 3px;
  animation: loadBar 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes loadBar {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1016;
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 200;
  max-width: 90vw;
}

/* Keyframes */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Transitions */
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.35s;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

.err-enter-active {
  transition: all 0.25s ease;
}
.err-leave-active {
  transition: all 0.2s ease;
}
.err-enter-from,
.err-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* Responsive */
@media (max-width: 768px) {
  .login-root {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }
  .page {
    height: auto;
    min-height: 100vh;
    padding: 24px 16px;
  }
  .card {
    flex-direction: column;
    height: auto;
    border-radius: 22px;
    max-width: 460px;
    margin: auto;
  }
  .panel-left {
    flex: none;
    padding: 40px 28px;
  }
  .brand-name {
    font-size: 48px;
  }
  .brand-icon {
    width: 52px;
    height: 52px;
    margin-bottom: 20px;
  }
  .panel-right {
    padding: 28px 28px 36px;
  }
  .form-title {
    font-size: 30px;
  }
}
@media (max-width: 400px) {
  .panel-left {
    padding: 32px 20px;
  }
  .panel-right {
    padding: 24px 20px 30px;
  }
  .brand-name {
    font-size: 40px;
  }
  .form-title {
    font-size: 26px;
  }
}
</style>
