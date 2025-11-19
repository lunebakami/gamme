import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three-stdlib';
import { createPlayerCharacter } from './Player';
import { connectToServer, myPlayerId, sendHappyBirthday, sendMovement, sendWave } from './Network';
import { createBirthdayBanner } from './Banner';
import { showBubbleForPlayer } from './TextBubble';
import { joyMove, setupMoveJoystick } from './MobileUI';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let labelRenderer: CSS2DRenderer;
let birthdayBanner: THREE.Group | null = null;
let myPlayer: THREE.Group | null = null;
let myLabel: CSS2DObject | null = null;
let myMixer: THREE.AnimationMixer | null = null;
let playerAnimations = new Map<string, THREE.AnimationAction>();
const clock = new THREE.Clock();

// Player State
let isJumping = false;
let isWaving = false;
let saidHappyBirthday = false;
let velocityY = 0;
const gravity = -0.009;   // tweak this
const jumpStrength = 0.18; // tweak this

const otherPlayers = new Map<string, THREE.Group>();
const playerLabels = new Map<string, CSS2DObject>();
const otherPlayerMixers = new Map<string, THREE.AnimationMixer>(); // NEW
const otherPlayerAnimations = new Map<string, Map<string, THREE.AnimationAction>>(); // NEW

// Movement state
const keys: { [key: string]: boolean } = {};
const moveSpeed = 0.1;

export async function initGame(playerData: { name: string; avatar: any }) {
  const chatBtn = document.getElementById("mobile-chat-toggle");
  const chat = document.getElementById("chat-container");

  chatBtn?.addEventListener("click", () => {
    if (!chat) return;

    chat.classList.toggle("open");
  });

  setupScene();
  setupCamera();
  setupRenderer();
  setupLights();
  createGround();
  birthdayBanner = createBirthdayBanner();
  scene.add(birthdayBanner);
  await createMyPlayer(playerData);
  setupControls();
  setupMobileControls();
  initMobileUI();
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

function setupMobileControls() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) return;

  const controls = document.getElementById("mobile-controls");
  if (controls) controls.style.display = "flex";

  document.getElementById("btn-jump")?.addEventListener("click", () => {
    tryJump();
  });

  document.getElementById("btn-wave")?.addEventListener("click", () => {
    tryWave();
  });

  document.getElementById("btn-birthday")?.addEventListener("click", () => {
    tryHappyBirthday();
  });
}


function initMobileUI() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) return;

  document.getElementById("joy-move")!.style.display = "block";

  setupMoveJoystick();
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
  const { object, mixer, animations } = await createPlayerCharacter(playerData.avatar.color, playerData.avatar.body);
  console.log({
    animations
  })
  myPlayer = object;
  myMixer = mixer;

  let idleAction, walkAction, jumpAction, waveAction, duckAction;

  idleAction = myMixer?.clipAction(animations.find(a => a.name === "Idle")!);
  walkAction = myMixer?.clipAction(animations.find(a => a.name === "Run")!);
  jumpAction = myMixer?.clipAction(animations.find(a => a.name === "Jump")!)!;
  jumpAction.setLoop(THREE.LoopOnce, 1);
  jumpAction.clampWhenFinished = true;
  waveAction = myMixer?.clipAction(animations.find(a => a.name === "Wave")!)!;
  waveAction.setLoop(THREE.LoopOnce, 1);
  waveAction.clampWhenFinished = true;
  duckAction = myMixer?.clipAction(animations.find(a => a.name === "Duck")!);

  playerAnimations.set('idle', idleAction!);
  playerAnimations.set('walk', walkAction!);
  playerAnimations.set('jump', jumpAction!);
  playerAnimations.set('wave', waveAction!);
  playerAnimations.set('duck', duckAction!);

  // play first animation if exists
  if (mixer && animations.length > 0) {
    const action = mixer.clipAction(animations[9]!);
    action.play();
  }

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
  label.position.set(0, 4, 0);

  return label;
}

function setupControls() {
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === " " || e.key === "Space") {
      tryJump();
    } else if (e.key === "e") {
      tryWave();
    } else if (e.key === "f") {
      tryHappyBirthday();
    }
  });
}

function tryJump() {
  if (!myPlayer || isJumping) return;

  isJumping = true;
  velocityY = jumpStrength;

  // Stop all other animations
  playerAnimations.get('walk')?.stop();
  playerAnimations.get('idle')?.stop();

  const jump = playerAnimations.get('jump');
  jump?.reset();  // start from frame 0
  jump?.play();
}

function tryWave() {
  if (!myPlayer || isWaving) return;

  isWaving = true;
  sendWave()

  playerAnimations.get('idle')?.stop();
  const wave = playerAnimations.get('wave');
  wave?.reset();
  wave?.play();
}

function tryHappyBirthday() {
  if (!myPlayerId || !myPlayer || saidHappyBirthday) return;

  saidHappyBirthday = true;
  showBubbleForPlayer(myPlayerId!, 'Feliz Aniversário Joyce!!!', myPlayer);
  sendHappyBirthday();
  tryWave();
}

export function setMyPlayerPosition(position: { x: number; y: number; z: number }) {
  if (myPlayer) {
    myPlayer.position.set(position.x, position.y, position.z);
    console.log('Player position restored:', position);
  }
}

// function updateMovement() {
//   if (!myPlayer) return;

//   let moved = false;
//   const direction = new THREE.Vector3();
//   // ====== MOVIMENTAÇÃO VIA JOYSTICK =======
//   if (joyMove.x !== 0 || joyMove.y !== 0) {
//     const speed = 0.08;

//     // Direção baseada no joystick
//     const moveX = joyMove.x * speed;
//     const moveZ = joyMove.y * speed;

//     myPlayer.position.x += moveX;
//     myPlayer.position.z += moveZ;

//     // Enviar pro servidor
//     sendMovement({
//       x: myPlayer.position.x,
//       y: myPlayer.position.y,
//       z: myPlayer.position.z
//     }, true);
//   }

//   if (keys['w'] || keys['arrowup']) direction.z -= 1;
//   if (keys['s'] || keys['arrowdown']) direction.z += 1;
//   if (keys['a'] || keys['arrowleft']) direction.x -= 1;
//   if (keys['d'] || keys['arrowright']) direction.x += 1;

//   if (direction.lengthSq() > 0) {
//      moved = true;

//      // normalize so diagonal is not faster
//      direction.normalize();

//      // 🟩 rotate to face movement
//      const target = new THREE.Vector3(
//          myPlayer.position.x + direction.x,
//          myPlayer.position.y,
//          myPlayer.position.z + direction.z
//      );

//      const quaternion = new THREE.Quaternion();
//      const currentQuat = myPlayer.quaternion.clone();

//      myPlayer.lookAt(target);               // sets the correct facing rotation
//      quaternion.copy(myPlayer.quaternion);  // save the target rotation
//      myPlayer.quaternion.copy(currentQuat); // restore original
//      myPlayer.quaternion.slerp(quaternion, 0.2); // smooth rotate


//      // 🟦 move forward based on direction
//      myPlayer.position.x += direction.x * moveSpeed;
//      myPlayer.position.z += direction.z * moveSpeed;
//   }

//   if (isJumping) {
//      playerAnimations.get('idle')?.stop();
//      playerAnimations.get('jump')?.play();
//      velocityY += gravity;
//      myPlayer.position.y += velocityY;

//      // Ground check
//      if (myPlayer.position.y <= 0) {
//        myPlayer.position.y = 0;
//        playerAnimations.get('jump')?.stop();
//        isJumping = false;
//        velocityY = 0;
//      }
//   }

//   const isWaveAnimRunning = playerAnimations.get('wave')!.isRunning();
//   if (isWaving && !isWaveAnimRunning) {
//     isWaving = false;
//   }

//   if (moved) {
//     playerAnimations.get('walk')?.play();
//     playerAnimations.get('idle')?.stop();
//   } else {
//     playerAnimations.get('idle')?.play();
//     playerAnimations.get('walk')?.stop();
//   }

//   // Keep player within bounds
//   const maxDistance = 18;
//   const distance = Math.sqrt(myPlayer.position.x ** 2 + myPlayer.position.z ** 2);
//   if (distance > maxDistance) {
//     const angle = Math.atan2(myPlayer.position.z, myPlayer.position.x);
//     myPlayer.position.x = Math.cos(angle) * maxDistance;
//     myPlayer.position.z = Math.sin(angle) * maxDistance;
//   }

//   // CHANGE: Always send position updates (even when stopped)
//   // This way other players know when you stop moving
//   sendMovement({
//     x: myPlayer.position.x,
//     y: myPlayer.position.y,
//     z: myPlayer.position.z,
//   }, moved); // Pass the 'moved' state
// }

function updateMovement() {
  if (!myPlayer) return;

  const direction = new THREE.Vector3();

  // ====== DIREÇÃO VIA TECLADO ======
  if (keys['w'] || keys['arrowup']) direction.z -= 1;
  if (keys['s'] || keys['arrowdown']) direction.z += 1;
  if (keys['a'] || keys['arrowleft']) direction.x -= 1;
  if (keys['d'] || keys['arrowright']) direction.x += 1;

  // ====== DIREÇÃO VIA JOYSTICK ======
  if (joyMove.x !== 0) direction.x += joyMove.x;
  if (joyMove.y !== 0) direction.z += joyMove.y;

  // Determina se houve movimento
  const moved = direction.lengthSq() > 0;

  if (moved) {
    // Normaliza para que a diagonal não seja mais rápida
    direction.normalize();

    // Rotação suave para direção do movimento
    const target = new THREE.Vector3(
      myPlayer.position.x + direction.x,
      myPlayer.position.y,
      myPlayer.position.z + direction.z
    );

    const quaternion = new THREE.Quaternion();
    const currentQuat = myPlayer.quaternion.clone();

    myPlayer.lookAt(target);              // Define direção
    quaternion.copy(myPlayer.quaternion); // Salva alvo
    myPlayer.quaternion.copy(currentQuat);
    myPlayer.quaternion.slerp(quaternion, 0.2);

    // Move o player
    const moveSpeedFinal = moveSpeed; // Você pode ajustar separadamente se quiser
    myPlayer.position.x += direction.x * moveSpeedFinal;
    myPlayer.position.z += direction.z * moveSpeedFinal;
  }

  // ====== ANIMAÇÕES ======
  if (isJumping) {
    playerAnimations.get('idle')?.stop();
    playerAnimations.get('jump')?.play();
    velocityY += gravity;
    myPlayer.position.y += velocityY;

    if (myPlayer.position.y <= 0) {
      myPlayer.position.y = 0;
      playerAnimations.get('jump')?.stop();
      isJumping = false;
      velocityY = 0;
    }
  }

  const isWaveAnimRunning = playerAnimations.get('wave')!.isRunning();
  if (isWaving && !isWaveAnimRunning) {
    isWaving = false;
  }

  // Atualiza animação de walk/idle
  if (moved) {
    playerAnimations.get('walk')?.play();
    playerAnimations.get('idle')?.stop();
  } else if (!isJumping && !isWaving) {
    playerAnimations.get('walk')?.stop();
    playerAnimations.get('idle')?.play();
  }

  // Limita o player dentro do círculo
  const maxDistance = 18;
  const distance = Math.sqrt(myPlayer.position.x ** 2 + myPlayer.position.z ** 2);
  if (distance > maxDistance) {
    const angle = Math.atan2(myPlayer.position.z, myPlayer.position.x);
    myPlayer.position.x = Math.cos(angle) * maxDistance;
    myPlayer.position.z = Math.sin(angle) * maxDistance;
  }

  // Envia posição pro servidor
  sendMovement({
    x: myPlayer.position.x,
    y: myPlayer.position.y,
    z: myPlayer.position.z
  }, moved);
}

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  // Update my player's mixer
  if (myMixer) myMixer.update(dt);

  // Update all other players' mixers
  otherPlayerMixers.forEach((mixer) => {
    mixer.update(dt);
  });

  updateMovement();

  if (birthdayBanner) {
      birthdayBanner.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
      birthdayBanner.position.y = 5 + Math.sin(Date.now() * 0.001) * 0.3;
    }

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
  console.log('spawnOtherPlayer called with:', player);

  const color = player.avatar?.color || '#0000ff';
  const body = player.avatar?.body || 'cube';

  console.log('Creating player with color:', color, 'body:', body);

  const { object, mixer, animations } = await createPlayerCharacter(color, body);

  const playerModel = object;

  playerModel.position.set(
    player.position.x,
    player.position.y,
    player.position.z
  );

  scene.add(playerModel);
  otherPlayers.set(player.id, playerModel);

  // Setup animations for other player
  if (mixer && animations.length > 0) {
    otherPlayerMixers.set(player.id, mixer);

    const animMap = new Map<string, THREE.AnimationAction>();

    const idleAnim = animations.find(a => a.name === "Idle");
    const walkAnim = animations.find(a => a.name === "Run");
    const jumpAnim = animations.find(a => a.name === "Jump");
    const waveAnim = animations.find(a => a.name === "Wave");
    const duckAnim = animations.find(a => a.name === "Duck");

    if (idleAnim) animMap.set('idle', mixer.clipAction(idleAnim));
    if (walkAnim) animMap.set('walk', mixer.clipAction(walkAnim));
    if (jumpAnim) {
      const action = mixer.clipAction(jumpAnim);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      animMap.set('jump', action);
    }
    if (waveAnim) {
      const action = mixer.clipAction(waveAnim);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      animMap.set('wave', action);
    }
    if (duckAnim) animMap.set('duck', mixer.clipAction(duckAnim));

    otherPlayerAnimations.set(player.id, animMap);

    // Play idle animation by default
    animMap.get('idle')?.play();
  }

  const label = createNameLabel(player.name, player.score || 0);
  playerModel.add(label);
  playerLabels.set(player.id, label);

  console.log('Spawned player:', player.name, 'with body type:', body, scene);
}

export function removeOtherPlayer(playerId: string) {
  const playerModel = otherPlayers.get(playerId);
  if (playerModel) {
    const label = playerLabels.get(playerId);
    if (label) {
      playerModel.remove(label);
      if (label.parent) {
        label.parent.remove(label);
      }
      playerLabels.delete(playerId);
    }
    scene.remove(playerModel);
    otherPlayers.delete(playerId);
  }

  // Clean up mixer and animations
  otherPlayerMixers.delete(playerId);
  otherPlayerAnimations.delete(playerId);
}
// Track previous positions for movement detection
const otherPlayerPrevPositions = new Map<string, THREE.Vector3>();

export function updateOtherPlayer(playerId: string, position: any, isMoving: boolean = false) {
  const playerModel = otherPlayers.get(playerId);
  if (!playerModel) return;

  // Get previous position
  const prevPos = otherPlayerPrevPositions.get(playerId) || playerModel.position.clone();

  // Calculate movement
  const newPos = new THREE.Vector3(position.x, position.y, position.z);
  const movement = newPos.clone().sub(prevPos);

  // Smooth interpolation
  playerModel.position.lerp(newPos, 0.3);

  // Rotate to face movement direction (only if moving)
  if (isMoving && (movement.x !== 0 || movement.z !== 0)) {
    const target = new THREE.Vector3(
      playerModel.position.x + movement.x,
      playerModel.position.y,
      playerModel.position.z + movement.z
    );

    const quaternion = new THREE.Quaternion();
    const currentQuat = playerModel.quaternion.clone();

    playerModel.lookAt(target);
    quaternion.copy(playerModel.quaternion);
    playerModel.quaternion.copy(currentQuat);
    playerModel.quaternion.slerp(quaternion, 0.2);
  }

  // Handle animations using the isMoving flag from server
  const animMap = otherPlayerAnimations.get(playerId);
  if (animMap) {
    if (isMoving) {
      animMap.get('idle')?.stop();
      animMap.get('walk')?.play();
    } else {
      animMap.get('walk')?.stop();
      animMap.get('idle')?.play();
    }
  }

  // Store current position for next frame
  otherPlayerPrevPositions.set(playerId, playerModel.position.clone());
}

export function otherPlayerWaves(playerId:string) {
  const animMap = otherPlayerAnimations.get(playerId);
  if (animMap) {
      animMap.get('wave')?.reset();
      animMap.get('wave')?.play();
  }
}

export function otherPlayerWishesBirthday(playerId: string) {
  const playerModel = otherPlayers.get(playerId);
  if (!playerModel) return;

  showBubbleForPlayer(playerId, 'Feliz Aniversário Joyce!!!', playerModel);
}

export function resetBirthday() {
  saidHappyBirthday = false;
}
