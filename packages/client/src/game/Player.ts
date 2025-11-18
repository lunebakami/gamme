import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

const gltfLoader = new GLTFLoader();

export function loadGLTFModel(modelPath: string): Promise<{ model: THREE.Group, animations: THREE.AnimationClip[] }> {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      modelPath,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        resolve({
          model: gltf.scene,
          animations: gltf.animations
        });
      },
      undefined,
      (error) => reject(error)
    );
  });
}

export async function createPlayerCharacter(color: string, bodyType: string) {
  const character = new THREE.Group();

  if (bodyType === 'cube') {
    const cube = createCubeCharacter(parseInt(color.replace('#', '0x')));
    character.add(cube);
    return {
      object: character,
      mixer: null,
      animations: []
    };
  }

  try {
    const modelPath = `/assets/${bodyType}.gltf`;
    const { model, animations } = await loadGLTFModel(modelPath);
    const mixer = new THREE.AnimationMixer(model);
    character.add(model);
    character.castShadow = true;
    character.receiveShadow = true;
    return {
      object: character,
      mixer,
      animations
    };
  } catch (error) {
    console.error(`Failed to load model ${bodyType}:`, error);
    // Fallback to cube if model fails to load
    const fallback = createCubeCharacter(parseInt(color.replace('#', '0x')));
    character.add(fallback);
  }

  return { object: character, mixer: null, animations: [] };
}

function createCubeCharacter(color: number): THREE.Group {
  const group = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.6);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.25;
  head.castShadow = true;
  group.add(head);

  // Eyes
  addEyes(group, 1.3, 0.3);

  return group;
}

function addEyes(group: THREE.Group, height: number, offset: number) {
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, height, offset);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, height, offset);
  group.add(rightEye);
}
