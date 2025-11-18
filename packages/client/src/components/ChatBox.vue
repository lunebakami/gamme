<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { sendChatMessage, onChatMessage } from '../game/Network';

interface Message {
  playerId: string;
  playerName: string;
  text: string;
}

const messages = ref<Message[]>([]);
const messageInput = ref('');
const chatMessagesEl = ref<HTMLElement | null>(null);

onMounted(() => {
  // Listen for incoming chat messages
  onChatMessage((data) => {
    messages.value.push({
      playerId: data.playerId,
      playerName: data.playerName,
      text: data.message,
    });

    // Auto-scroll to bottom
    nextTick(() => {
      if (chatMessagesEl.value) {
        chatMessagesEl.value.scrollTop = chatMessagesEl.value.scrollHeight;
      }
    });
  });
});

const sendMessage = () => {
  if (messageInput.value.trim()) {
    sendChatMessage(messageInput.value.trim());
    messageInput.value = '';
  }
};
</script>

<template>
  <div class="chat-box">
    <div class="chat-messages" ref="chatMessagesEl">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
      >
        <strong>{{ msg.playerName }}:</strong> {{ msg.text }}
      </div>
      <div v-if="messages.length === 0" class="no-messages">
        No messages yet. Say hello! 👋
      </div>
    </div>
    <div class="chat-input">
      <input
        v-model="messageInput"
        type="text"
        placeholder="Type a message... (Press Enter)"
        maxlength="200"
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
  width: 400px;
  height: 300px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  color: white;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.message {
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  word-wrap: break-word;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message strong {
  color: #4CAF50;
  margin-right: 5px;
}

.no-messages {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.chat-input {
  display: flex;
  padding: 10px;
  gap: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.chat-input input:focus {
  outline: none;
  background: white;
}

.chat-input button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.chat-input button:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.chat-input button:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .chat-box {
    width: calc(100% - 40px);
    height: 250px;
  }
}
</style>
