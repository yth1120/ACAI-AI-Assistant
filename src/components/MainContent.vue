<template>
  <main class="main-content">
    <!-- Router View -->
    <router-view />
  </main>
</template>

<script setup>
</script>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  z-index: 1;
}
</style>
