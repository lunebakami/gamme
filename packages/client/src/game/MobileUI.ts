export let joyMove = { x: 0, y: 0 };

export function setupMoveJoystick() {
  const base = document.getElementById("joy-move")!;
  const stick = base.querySelector(".stick")!;

  let active = false;
  let center = { x: 0, y: 0 };

  base.addEventListener("touchstart", e => {
    active = true;
    const t = e.touches[0];
    center = { x: t.clientX, y: t.clientY };
  });

  base.addEventListener("touchmove", e => {
    if (!active) return;

    const t = e.touches[0];
    const dx = t.clientX - center.x;
    const dy = t.clientY - center.y;

    const max = 50;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), max);
    const angle = Math.atan2(dy, dx);

    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;

    stick.style.transform = `translate(${sx}px, ${sy}px)`;

    joyMove.x = sx / max;
    joyMove.y = sy / max;
  });

  base.addEventListener("touchend", () => {
    active = false;
    stick.style.transform = "translate(0px,0px)";
    joyMove.x = 0;
    joyMove.y = 0;
  });
}
