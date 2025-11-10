import * as THREE from 'three';
import { GAME_CONFIG } from '@gamme/shared';

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
const groundBoundary = groundSize/2;
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
    },dashCooldownTime)
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
