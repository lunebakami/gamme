<script setup lang="ts">
import { ref } from 'vue';
import LoginScreen from './components/LoginScreen.vue';
import ChatBox from './components/ChatBox.vue';
import { initGame } from './game/Scene';

const isLoggedIn = ref(false);
const playerData = ref<{ name: string; avatar: any } | null>(null);

const handleLogin = async (data: { name: string; avatar: any }) => {
  playerData.value = data;
  isLoggedIn.value = true;

  // Initialize the game after login
  setTimeout(async () => {
    await initGame(data);
  }, 100);
};
</script>

<template>
  <div class="app-container">
    <!-- Login/Character Creation Screen -->
    <LoginScreen v-if="!isLoggedIn" @login="handleLogin" />

    <!-- Game View -->
    <div v-else class="game-view">
      <div id="game-canvas"></div>
      <ChatBox />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.game-view {
  width: 100%;
  height: 100%;
  position: relative;
}

#game-canvas {
  width: 100%;
  height: 100%;
}
</style>
