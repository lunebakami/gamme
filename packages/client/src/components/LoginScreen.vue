<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

const emit = defineEmits<{
  login: [data: { name: string; avatar: any }]
}>();

const playerName = ref('');
const selectedColor = ref('#ff0000');
const selectedBody = ref('Panda'); // Panda, Rabbit_Bald, etc.

let previewScene: THREE.Scene;
let previewCamera: THREE.PerspectiveCamera;
let previewRenderer: THREE.WebGLRenderer;
let previewModel: THREE.Group | null = null;
let animationId: number;

const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, THREE.Group>();

async function loadPreviewModel(modelName: string) {
  if (modelCache.has(modelName)) {
    return modelCache.get(modelName)!.clone();
  }

  try {
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.load(`/assets/${modelName}.gltf`, resolve, undefined, reject);
    });

    const model = gltf.scene;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    modelCache.set(modelName, model);
    return model.clone();
  } catch (error) {
    console.error(`Failed to load model ${modelName}:`, error);
    return null;
  }
}

async function updatePreviewModel() {
  if (!previewScene) return;

  // Remove old model
  if (previewModel) {
    previewScene.remove(previewModel);
  }

  // Load new model
  const model = await loadPreviewModel(selectedBody.value);
  if (model) {
    previewModel = model;
    previewModel.scale.set(0.5, 0.5, 0.5);
    previewModel.position.set(0, 1, 0);
    previewScene.add(previewModel);
  }
}

function initPreview() {
  const container = document.getElementById('avatar-preview');
  if (!container) return;

  // Scene
  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0xf0f0f0);

  // Camera
  previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  previewCamera.position.set(0, 2, 5);

  // Renderer
  previewRenderer = new THREE.WebGLRenderer({ antialias: true });
  previewRenderer.setSize(200, 200);
  previewRenderer.shadowMap.enabled = true;
  container.appendChild(previewRenderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  previewScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  previewScene.add(directionalLight);

  // Initial model
  updatePreviewModel();
  animatePreview();
}

function animatePreview() {
  animationId = requestAnimationFrame(animatePreview);

  if (previewModel) {
    previewModel.rotation.y += 0.01;
  }

  previewRenderer.render(previewScene, previewCamera);
}

onMounted(() => {
  initPreview();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (previewRenderer) {
    previewRenderer.dispose();
  }
});

watch(selectedBody, () => {
  updatePreviewModel();
});

const avatarOptions = {
  bodies: [
    { name: 'Panda', value: 'Panda' },
    { name: 'Rabbit (Bald)', value: 'Rabbit_Bald' },
    { name: 'Rabbit (Blond)', value: 'Rabbit_Blond' },
    { name: 'Rabbit (Cyan)', value: 'Rabbit_Cyan' },
    { name: 'Rabbit (Green)', value: 'Rabbit_Green' },
    { name: 'Rabbit (Grey)', value: 'Rabbit_Grey' },
    { name: 'Rabbit (Pink)', value: 'Rabbit_Pink' },
    { name: 'Rabbit (Purple)', value: 'Rabbit_Purple' },
  ]
};

const handleJoin = () => {
  if (playerName.value.trim()) {
    emit('login', {
      name: playerName.value.trim(),
      avatar: {
        color: selectedColor.value,
        body: selectedBody.value,
      }
    });
  }
};
</script>

<template>
  <div class="login-screen">
    <div class="login-card">
      <h1>Welcome to the Hub</h1>

      <div class="form-section">
        <label>Your Name</label>
        <input
          v-model="playerName"
          type="text"
          placeholder="Enter your name"
          maxlength="15"
          @keypress.enter="handleJoin"
        />
      </div>

      <div class="form-section">
        <label>Choose Your Avatar</label>
        <div class="body-options">
          <button
            v-for="body in avatarOptions.bodies"
            :key="body.value"
            class="body-option"
            :class="{ selected: selectedBody === body.value }"
            @click="selectedBody = body.value"
          >
            {{ body.name }}
          </button>
        </div>
        <div class="avatar-preview-container">
          <div id="avatar-preview" class="avatar-preview"></div>
        </div>
      </div>

      <button class="join-button" @click="handleJoin" :disabled="!playerName.trim()">
        Join Hub
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 500px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-section {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #555;
}

input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.color-option {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  cursor: pointer;
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.body-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.body-option {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.body-option:hover {
  background: #f5f5f5;
}

.body-option.selected {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.join-button {
  width: 100%;
  padding: 15px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.join-button:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.join-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.avatar-preview-container {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.avatar-preview {
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
