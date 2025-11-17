import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

const gltfLoader = new GLTFLoader();

const loadGLTFModel = (modelPath: string) => {
  const obj3d = new THREE.Object3D();
  gltfLoader.load(modelPath, (gltf) => {
      console.log("Animations:", gltf.animations);
    const model = gltf.scene;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    obj3d.add(model);
    return model
  }, undefined, console.error);

  return obj3d
}

export async function createPlayerCharacter(color: string, bodyType: string): Promise<THREE.Group> {
  const character = new THREE.Group();

  if (bodyType === 'cube') {
    const cube = createCubeCharacter(parseInt(color.replace('#', '0x')));
    character.add(cube);
    return character;
  }

  try {
    const modelPath = `/src/assets/${bodyType}.gltf`;
    const model = loadGLTFModel(modelPath);
    character.add(model);
  } catch (error) {
    console.error(`Failed to load model ${bodyType}:`, error);
    // Fallback to cube if model fails to load
    const fallback = createCubeCharacter(parseInt(color.replace('#', '0x')));
    character.add(fallback);
  }

  character.castShadow = true;
  character.receiveShadow = true;

  return character;
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
