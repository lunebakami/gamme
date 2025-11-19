import * as THREE from 'three';

function createPixelText(text: string, color: number): THREE.Group {
  const group = new THREE.Group();
  const pixelSize = 0.15; // REDUZIDO de 0.3 para 0.15
  const spacing = 0.05;   // REDUZIDO de 0.1 para 0.05

  // Definir fonte pixel art (matriz 5x5 para cada letra)
  const font: { [key: string]: number[][] } = {
    'H': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'A': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'P': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    'Y': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    'B': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ],
    'I': [
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [1,1,1,1,1],
    ],
    'R': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
    ],
    'T': [
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    'D': [
      [1,1,1,0,0],
      [1,0,0,1,0],
      [1,0,0,0,1],
      [1,0,0,1,0],
      [1,1,1,0,0],
    ],
    'J': [
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'O': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'S': [
      [0,1,1,1,1],
      [1,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [1,1,1,1,0],
    ],
    'E': [
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,1,1,1,1],
    ],
    ' ': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
  };

  const chars = text.toUpperCase().split('');
  let currentX = 0;

  chars.forEach((char) => {
    const matrix = font[char];
    if (!matrix) return;

    // Criar pixels para cada letra
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (matrix[row][col] === 1) {
          const geometry = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
          const material = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
          });
          const pixel = new THREE.Mesh(geometry, material);

          pixel.position.x = currentX + (col * (pixelSize + spacing));
          pixel.position.y = -(row * (pixelSize + spacing));
          pixel.position.z = 0;

          pixel.castShadow = true;
          group.add(pixel);
        }
      }
    }

    // Espaçamento entre letras - AUMENTADO
    currentX += 6 * (pixelSize + spacing) + 0.15; // Adicionado 0.15 de espaço extra
  });

  return group;
}

export function createBirthdayBanner(): THREE.Group {
  const banner = new THREE.Group();

  // Criar estrutura do banner (placa de fundo)
  const bannerWidth = 18;
  const bannerHeight = 6;
  const bannerDepth = 0.3;

  const bannerGeometry = new THREE.BoxGeometry(bannerWidth, bannerHeight, bannerDepth);
  const bannerMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.7,
  });
  const bannerBoard = new THREE.Mesh(bannerGeometry, bannerMaterial);
  bannerBoard.castShadow = true;
  bannerBoard.receiveShadow = true;
  banner.add(bannerBoard);

  // Borda decorativa
  const borderGeometry = new THREE.BoxGeometry(bannerWidth + 0.4, bannerHeight + 0.4, bannerDepth - 0.1);
  const borderMaterial = new THREE.MeshStandardMaterial({
    color: 0xf39c12,
    roughness: 0.5,
  });
  const border = new THREE.Mesh(borderGeometry, borderMaterial);
  border.position.z = -0.2;
  border.castShadow = true;
  banner.add(border);

  // Criar textos - POSIÇÕES AJUSTADAS
  const happyText = createPixelText('HAPPY', 0xff6b6b);
  happyText.position.set(-3.5, 1.8, 0.2); // Ajustado
  banner.add(happyText);

  const birthdayText = createPixelText('BIRTHDAY', 0x4ecdc4);
  birthdayText.position.set(-5, 0.5, 0.2); // Ajustado
  banner.add(birthdayText);

  const joiserText = createPixelText('JOISER', 0xffe66d);
  joiserText.position.set(-3.5, -1, 0.2); // Ajustado
  banner.add(joiserText);

  // Adicionar confetes/decoração
  for (let i = 0; i < 20; i++) {
    const confettiGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const confettiColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3];
    const confettiMaterial = new THREE.MeshStandardMaterial({
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      emissive: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      emissiveIntensity: 0.5,
    });
    const confetti = new THREE.Mesh(confettiGeometry, confettiMaterial);

    confetti.position.x = (Math.random() - 0.5) * bannerWidth * 0.9;
    confetti.position.y = (Math.random() - 0.5) * bannerHeight * 0.9;
    confetti.position.z = 0.3;
    confetti.rotation.z = Math.random() * Math.PI;

    banner.add(confetti);
  }

  // Posicionar o banner no cenário
  banner.position.set(0, 5, -15);
  banner.rotation.y = 0;

  return banner;
}
