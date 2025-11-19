import * as THREE from "three";
import { CSS2DObject } from "three-stdlib";

export function showBubbleForPlayer(playerId: string, message: string, playerModel: THREE.Object3D) {
  if (!playerModel) return;

  // Criar HTML
  const div = document.createElement("div");
  div.className = "bubble";
  div.textContent = message;
  div.style.padding = "6px 10px";
  div.style.background = "white";
  div.style.borderRadius = "12px";
  div.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
  div.style.fontSize = "12px";
  div.style.whiteSpace = "nowrap";

  // Transformar em CSS2DObject
  const bubble = new CSS2DObject(div);

  // Ajustar posição acima da cabeça
  bubble.position.set(0, 5.2, 0); // ajuste dependendo da altura do boneco

  // Adicionar como filho do modelo
  playerModel.add(bubble);

  // Remover após 3 segundos
  setTimeout(() => {
    bubble.removeFromParent();
    div.remove();
  }, 3000);
}
