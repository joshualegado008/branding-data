<template>
  <div class="placeholder-page">
    <div class="placeholder-icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#B01020"
        stroke-width="1.5"
        width="40"
        height="40"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
    <div class="placeholder-title">User Management</div>
    <div class="placeholder-sub">User management coming in the next build.</div>
  </div>
</template>
<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 14px;
  text-align: center;
}
.placeholder-icon {
  width: 80px;
  height: 80px;
  background: #fff5f6;
  border-radius: 20px;
  border: 1.5px solid #ede3e5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 600;
  color: #1a1016;
}
.placeholder-sub {
  font-size: 14px;
  color: #9a8589;
}
</style>
