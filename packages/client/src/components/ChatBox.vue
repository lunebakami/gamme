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
  const btn = document.getElementById("mobile-chat-toggle");
  const box = document.querySelector(".chat-box") as HTMLElement;
  const overlay = document.getElementById("chat-overlay");

  if (btn && box && overlay) {

    // Função de abrir/fechar
    const toggleChat = () => {
      const isOpen = box.classList.toggle("open");
      overlay.classList.toggle("open", isOpen);

      if (isOpen) {
        nextTick(() => {
          const input = box.querySelector("input") as HTMLInputElement;
          input?.focus();
        });
      }
    };

    // Botão abre/fecha o chat
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleChat();
    });

    // Clicar no overlay → fecha o chat
    overlay.addEventListener("click", () => {
      box.classList.remove("open");
      overlay.classList.remove("open");
    });
  }

  // Seu listener de mensagens permanece
  onChatMessage((data) => {
    messages.value.push({
      playerId: data.playerId,
      playerName: data.playerName,
      text: data.message,
    });

    nextTick(() => {
      if (chatMessagesEl.value) {
        chatMessagesEl.value.scrollTop =
          chatMessagesEl.value.scrollHeight;
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

  <!-- Overlay para bloquear toques quando o chat está aberto -->
  <div id="chat-overlay" class="chat-overlay"></div>
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

/* Botão flutuante do chat (somente mobile) */
.mobile-chat-btn {
  position: absolute;
  bottom: 90px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 26px;
  border: none;
  background: rgba(0,0,0,0.7);
  color: white;
  display: none; /* escondido no desktop */
  z-index: 9999;
  backdrop-filter: blur(5px);
}

/* MOBILE */
@media (max-width: 768px) {
  .mobile-chat-btn {
    display: block;
  }

  .chat-box {
    display: none; /* escondido por padrão */
    position: fixed;
    left: 20px;
    right: 20px;
    bottom: 100px;
  }

  .chat-box.open {
    display: flex; /* aparece ao abrir */
  }
}
/* Overlay que bloqueia interações quando o chat está aberto */
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0); /* transparente */
  display: none;
  z-index: 9998; /* abaixo do chat, acima do resto */
}

/* MOBILE ONLY */
@media (max-width: 768px) {
  .chat-overlay.open {
    display: block;
  }

  .chat-box {
    z-index: 9999; /* chat acima do overlay */
  }

  .mobile-chat-btn {
    z-index: 10000; /* botão do chat sempre no topo */
  }
}
</style>
