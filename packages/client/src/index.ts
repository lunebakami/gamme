import * as THREE from 'three';
import { GAME_CONFIG, type PlayerState } from '@gamme/shared';

console.log('Game config:', GAME_CONFIG);

// GAME START AND INITIALIZATION
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('app')?.appendChild(renderer.domElement);

const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 0.5;
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// GAME OVER
let isGameOver = false;
const groundSize = 20;
const groundBoundary = groundSize / 2;
let fallInterval: Timer | null = null;

const gameOverDiv = document.createElement('div');
gameOverDiv.id = 'game-over';
gameOverDiv.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  display: none;
  font-family: system-ui, -apple-system, sans-serif;
`;
gameOverDiv.innerHTML = `
  <h1 style="margin-bottom: 20px; font-size: 48px;">GAME OVER</h1>
  <button id="restart-btn" style="
    padding: 15px 30px;
    font-size: 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  ">Restart</button>
`;
document.body.appendChild(gameOverDiv);

document.getElementById('restart-btn')?.addEventListener('click', () => {
  if (fallInterval) {
    clearInterval(fallInterval);
    fallInterval = null;
  }

  cube.position.set(0, 0.5, 0);
  cube.rotation.set(0, 0, 0);
  isGameOver = false;
  isJumping = false;
  velocityY = 0;
  isDashing = false;
  dashCooldown = false
  gameOverDiv.style.display = 'none';
});

// MOVEMENT
// Jump Variables
let isJumping = false;
let velocityY = 0;
const gravity = -0.02;
const jumpStrength = 0.3;
const groundY = 0.5;

// Dash variables
let isDashing = false;
let dashCooldown = false;
const dashSpeed = 0.5;
const dashDuration = 200; // milliseconds
const dashCooldownTime = 1000; // milliseconds

const keys: { [key: string]: boolean } = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  // Jump
  if (e.key === ' ' && !isJumping && !isGameOver) {
    isJumping = true;
    velocityY = jumpStrength;
  }

  // Dash
  if (e.key.toLowerCase() === 'shift' && !isDashing && !dashCooldown && !isGameOver) {
    isDashing = true;
    dashCooldown = true;

    setTimeout(() => {
      isDashing = false;
    }, dashDuration)

    setTimeout(() => {
      dashCooldown = false;
    }, dashCooldownTime)
  }
})

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
})

function updateMovement() {
  if (isGameOver) return

  const moveSpeed = isDashing ? dashSpeed : 0.1;

  if (keys['w'] || keys['arrowup']) {
    cube.position.z -= moveSpeed;
  }

  if (keys['s'] || keys['arrowdown']) {
    cube.position.z += moveSpeed;
  }

  if (keys['a'] || keys['arrowleft']) {
    cube.position.x -= moveSpeed;
  }

  if (keys['d'] || keys['arrowright']) {
    cube.position.x += moveSpeed;
  }

  // Jump physics
if (isJumping) {
    velocityY += gravity;
    cube.position.y += velocityY;

    // Check if landed
    if (cube.position.y <= groundY) {
      cube.position.y = groundY;
      velocityY = 0;
      isJumping = false;
    }
  }

  // Send position to server (throttled)
  const now = Date.now();
  if (ws && ws.readyState === WebSocket.OPEN &&
      now - lastPositionSent > POSITION_UPDATE_INTERVAL
  ) {
    ws.send(JSON.stringify({
      type: 'player:move',
      position: {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
      },
      rotation: cube.rotation.y
    }));
    lastPositionSent = now;
  }

  if ((Math.abs(cube.position.x) > groundBoundary ||
    Math.abs(cube.position.z) > groundBoundary) &&
    cube.position.y <= groundY) {
    isGameOver = true;
    gameOverDiv.style.display = 'block';

    if (fallInterval) {
      clearInterval(fallInterval);
    }

    fallInterval = setInterval(() => {
      cube.position.y -= 0.1;
      if (cube.position.y < -10) {
        clearInterval(fallInterval!);
        fallInterval = null
      }
    }, 16);
  }
}

// Create name input modal
const nameModal = document.createElement('div');
nameModal.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
nameModal.innerHTML = `
  <div style="
    background: white;
    padding: 40px;
    border-radius: 10px;
    text-align: center;
  ">
    <h1 style="margin-bottom: 20px;">Enter Your Name</h1>
    <input
      type="text"
      id="player-name"
      placeholder="Your name"
      maxlength="15"
      style="
        padding: 10px;
        font-size: 18px;
        width: 250px;
        margin-bottom: 20px;
        border: 2px solid #ccc;
        border-radius: 5px;
      "
    />
    <br>
    <button id="join-game" style="
      padding: 15px 30px;
      font-size: 18px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    ">Join Game</button>
  </div>
`;
document.body.appendChild(nameModal);

// WebSocket connection
let ws: WebSocket | null = null;
let myPlayerId: string | null = null;
const otherPlayers = new Map<string, THREE.Mesh>();

// Position update throttling
let lastPositionSent = 0;
const POSITION_UPDATE_INTERVAL = 50;

document.getElementById('join-game')?.addEventListener('click', () => {
  const nameInput = document.getElementById('player-name') as HTMLInputElement;
  const playerName = nameInput.value.trim()

  if (playerName) {
    connectToServer(playerName);
    nameModal.remove();
  } else {
    alert('Please enter a name!');
  }
});

document.getElementById('player-name')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('join-game')?.click();
  }
});

function connectToServer(playerName: string) {
  ws = new WebSocket(GAME_CONFIG.SERVER_URL + '/game');

  ws.onopen = () => {
    console.log('WebSocket connection opened');

    ws?.send(JSON.stringify({
      type: 'player:join',
      name: playerName
    }));
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'game:init') {
      myPlayerId = data.yourId;
      console.log('My player ID:', myPlayerId)
      console.log('Current players', data.players)

      // Spawn other players(not yourself)
      data.players.forEach((player: PlayerState) => {
        if (player.id !== myPlayerId) {
          spawnOtherPlayer(player);
        }
      })
    }

    if (data.type === 'player:joined') {
      console.log('Player joined:', data)
      const player = data.player;
      if (player.id !== myPlayerId) {
        console.log('Player joined:', player.name)
        spawnOtherPlayer(player);
      }
    }

    if (data.type === 'player:left') {
      console.log('Player left:', data.id)
      removeOtherPlayer(data.id)
    }

    if (data.type === 'player:update') {
      if (data.id !== myPlayerId) {
        updateOtherPlayer(data.id, data.position, data.rotation)
      }
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
  };
}

function spawnOtherPlayer(player: PlayerState) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const playerCube = new THREE.Mesh(geometry, material);

  playerCube.position.set(
    player.position.x,
    player.position.y,
    player.position.z
  );

  scene.add(playerCube)
  otherPlayers.set(player.id, playerCube);

  console.log('Spawned player:', player.name)
}

function removeOtherPlayer(playerId: string) {
  const playerCube = otherPlayers.get(playerId);
  if (playerCube) {
    scene.remove(playerCube);
    otherPlayers.delete(playerId);
  }
}

function updateOtherPlayer(
  playerId: string,
  position: {
    x: number;
    y: number;
    z: number;
  },
  rotation: number
) {
  const playerCube = otherPlayers.get(playerId);
  if(playerCube) {
    playerCube.position.set(position.x, position.y, position.z);
    playerCube.rotation.y = rotation;
  }
}

// GAME LOOP
function animate() {
  requestAnimationFrame(animate);

  if (!isGameOver) {
    updateMovement();
    // Rotate the cube
    cube.rotation.y += 0.01;
  }

  // Camera follows the cube
  camera.position.x = cube.position.x;
  camera.position.z = cube.position.z + 10;
  camera.lookAt(cube.position);

  renderer.render(scene, camera);
}

animate();

console.log('🎮 Game client initialized');
