import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three-stdlib';
import { createPlayerCharacter } from './Player';
import { connectToServer, sendMovement } from './Network';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let labelRenderer: CSS2DRenderer;
let myPlayer: THREE.Group | null = null;
let myLabel: CSS2DObject | null = null;

const otherPlayers = new Map<string, THREE.Group>();
const playerLabels = new Map<string, CSS2DObject>();

// Movement state
const keys: { [key: string]: boolean } = {};
const moveSpeed = 0.1;

export async function initGame(playerData: { name: string; avatar: any }) {
  setupScene();
  setupCamera();
  setupRenderer();
  setupLights();
  createGround();
  await createMyPlayer(playerData);
  setupControls();
  connectToServer(playerData.name, playerData.avatar);
  animate();
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Add fog for atmosphere
  scene.fog = new THREE.Fog(0x87ceeb, 10, 50);
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);
}

function setupRenderer() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.appendChild(renderer.domElement);

  // CSS2D Renderer for labels
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  canvas.appendChild(labelRenderer.domElement);

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function setupLights() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
}

function createGround() {
  // Main ground
  const groundGeometry = new THREE.CircleGeometry(20, 64);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d8659,
    roughness: 0.8,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper for reference
  const gridHelper = new THREE.GridHelper(40, 40, 0x000000, 0x000000);
  gridHelper.material.opacity = 0.1;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);
}

async function createMyPlayer(playerData: { name: string; avatar: any }) {
  myPlayer = await createPlayerCharacter(playerData.avatar.color, playerData.avatar.body);
  myPlayer.position.set(0, 0, 0);
  scene.add(myPlayer);

  // Add label
  myLabel = createNameLabel(playerData.name, 0);
  myPlayer.add(myLabel);
}

function createNameLabel(name: string, score: number): CSS2DObject {
  const labelDiv = document.createElement('div');
  labelDiv.className = 'player-label';
  labelDiv.style.cssText = `
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.7);
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    text-align: center;
    user-select: none;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  `;
  labelDiv.textContent = `${name}`;

  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 2, 0);

  return label;
}

function setupControls() {
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

function updateMovement() {
  if (!myPlayer) return;

  let moved = false;

  if (keys['w'] || keys['arrowup']) {
    myPlayer.position.z -= moveSpeed;
    moved = true;
  }
  if (keys['s'] || keys['arrowdown']) {
    myPlayer.position.z += moveSpeed;
    moved = true;
  }
  if (keys['a'] || keys['arrowleft']) {
    myPlayer.position.x -= moveSpeed;
    moved = true;
  }
  if (keys['d'] || keys['arrowright']) {
    myPlayer.position.x += moveSpeed;
    moved = true;
  }

  // Keep player within bounds
  const maxDistance = 18;
  const distance = Math.sqrt(myPlayer.position.x ** 2 + myPlayer.position.z ** 2);
  if (distance > maxDistance) {
    const angle = Math.atan2(myPlayer.position.z, myPlayer.position.x);
    myPlayer.position.x = Math.cos(angle) * maxDistance;
    myPlayer.position.z = Math.sin(angle) * maxDistance;
  }

  if (moved) {
    sendMovement({
      x: myPlayer.position.x,
      y: myPlayer.position.y,
      z: myPlayer.position.z,
    });
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateMovement();

  // Camera follows player
  if (myPlayer) {
    camera.position.x = myPlayer.position.x;
    camera.position.z = myPlayer.position.z + 15;
    camera.position.y = 10;
    camera.lookAt(myPlayer.position);
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// Export functions for network to use
export async function spawnOtherPlayer(player: any) {
  const playerModel = await createPlayerCharacter(
    player.avatar?.color || '#0000ff',
    player.avatar?.body || 'cube'
  );

  playerModel.position.set(
    player.position.x,
    player.position.y,
    player.position.z
  );

  scene.add(playerModel);
  otherPlayers.set(player.id, playerModel);

  const label = createNameLabel(player.name, player.score || 0);
  playerModel.add(label);
  playerLabels.set(player.id, label);

  console.log('Spawned player:', player.name);
}

export function removeOtherPlayer(playerId: string) {
  const playerModel = otherPlayers.get(playerId);
  if (playerModel) {
    scene.remove(playerModel);
    otherPlayers.delete(playerId);
  }

  const label = playerLabels.get(playerId);
  if (label) {
    playerLabels.delete(playerId);
  }
}

export function updateOtherPlayer(playerId: string, position: any) {
  const playerModel = otherPlayers.get(playerId);
  if (playerModel) {
    playerModel.position.set(position.x, position.y, position.z);
  }
}
