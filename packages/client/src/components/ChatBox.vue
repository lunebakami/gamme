<script setup lang="ts">
import { ref } from 'vue';

const messages = ref<Array<{ player: string; text: string }>>([]);
const messageInput = ref('');

const sendMessage = () => {
  if (messageInput.value.trim()) {
    // TODO: Send to server via WebSocket
    messages.value.push({
      player: 'You',
      text: messageInput.value.trim()
    });
    messageInput.value = '';
  }
};
</script>

<template>
  <div class="chat-box">
    <div class="chat-messages">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
      >
        <strong>{{ msg.player }}:</strong> {{ msg.text }}
      </div>
    </div>
    <div class="chat-input">
      <input
        v-model="messageInput"
        type="text"
        placeholder="Type a message... (Press Enter)"
        @keypress.enter="sendMessage"
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<style scoped>
.chat-box {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 350px;
  height: 250px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  color: white;
  font-size: 14px;
}

.message {
  margin-bottom: 8px;
}

.message strong {
  color: #4CAF50;
}

.chat-input {
  display: flex;
  padding: 10px;
  gap: 10px;
  background: rgba(0, 0, 0, 0.5);
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.9);
}

.chat-input button {
  padding: 8px 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
}

.chat-input button:hover {
  background: #45a049;
}
</style>
