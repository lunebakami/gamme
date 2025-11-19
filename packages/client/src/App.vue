<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LoginScreen from './components/LoginScreen.vue';
import ChatBox from './components/ChatBox.vue';
import { initGame } from './game/Scene';

const isLoggedIn = ref(false);
const playerData = ref<{ name: string; avatar: any } | null>(null);

onMounted(() => {
  // Verificar se há uma sessão salva
  const savedSession = localStorage.getItem('gameSession');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      const age = Date.now() - session.timestamp;

      // Se a sessão tem menos de 5 minutos, auto-login
      if (age < 5 * 60 * 1000) {
        console.log('Restoring previous session...');
        handleLogin(session.playerData);
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem('gameSession');
    }
  }
});
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
