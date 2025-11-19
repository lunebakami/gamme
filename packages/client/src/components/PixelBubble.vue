<template>
  <div v-if="visible" class="pixel-bubble-container">
    <div class="pixel-bubble">
      <p class="bubble-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  visible: boolean;
}>();
</script>

<style scoped>
.pixel-bubble-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.pixel-bubble {
  background-color: white;
  border: 8px solid black;
  padding: 20px;
  border-image-slice: 3;
  border-image-width: 8px;
  border-image-repeat: stretch;
  border-image-source: url('data:image/svg+xml;utf8,<?xml version="1.0" encoding="UTF-8" ?><svg version="1.1" width="9" height="9" xmlns="http://www.w3.org/2000/svg"><g><rect x="0" y="0" width="3" height="3" fill="black" /><rect x="3" y="0" width="3" height="3" fill="black" /><rect x="6" y="0" width="3" height="3" fill="black" /><rect x="0" y="3" width="3" height="3" fill="black" /><rect x="3" y="3" width="3" height="3" fill="white" /><rect x="6" y="3" width="3" height="3" fill="black" /><rect x="0" y="6" width="3" height="3" fill="black" /><rect x="3" y="6" width="3" height="3" fill="black" /><rect x="6" y="6" width="3" height="3" fill="black" /></g></svg>');
  position: relative;
  box-shadow: 8px 8px 0px 0px #888888;
}

.pixel-bubble::after {
  content: '';
  position: absolute;
  bottom: -24px;
  right: 40px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 16px solid black;
}

.bubble-text {
  font-family: 'Pixel', monospace;
  font-size: 18px;
  color: black;
  margin: 0;
}
</style>
