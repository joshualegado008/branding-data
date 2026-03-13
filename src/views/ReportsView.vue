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
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    </div>
    <div class="placeholder-title">Reports</div>
    <div class="placeholder-sub">Reporting & analytics coming in the next build.</div>
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
