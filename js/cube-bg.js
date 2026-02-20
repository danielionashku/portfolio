(() => {
  'use strict';

  const canvas = document.getElementById('cubeBg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  let animationFrameId;
  let progress = 0;

  // 16x16x16 cube (4,096 nodes)
  const size = 16;
  const spacing = 2.4;
  const offset = (size - 1) * spacing / 2;
  const SPENT_WEEKS = 32 * 52; // ~32 years
  const nodes = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        nodes.push({
          x: x * spacing - offset,
          y: y * spacing - offset,
          z: z * spacing - offset,
          index: nodes.length,
          isSpent: nodes.length < SPENT_WEEKS
        });
      }
    }
  }

  // Pre-allocate projection array
  const projected = new Array(nodes.length);
  for (let i = 0; i < nodes.length; i++) {
    projected[i] = { px: 0, py: 0, z: 0, scale: 0, index: i, isSpent: nodes[i].isSpent };
  }

  let angleX = -0.4;
  let angleY = Math.PI / 4;

  const BG = '#0a0a0b';

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  };

  window.addEventListener('resize', resize);
  resize();

  const draw = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);

    // Slow rotation
    angleY += 0.002;
    angleX += 0.0001;

    const fov = Math.min(width, height) * 0.9;
    const cameraZ = size * spacing * 1.8;
    const animatedLimit = Math.floor(progress * nodes.length);

    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Rotate X
      const y1 = node.y * cosX - node.z * sinX;
      const z1 = node.y * sinX + node.z * cosX;

      // Rotate Y
      const x2 = node.x * cosY - z1 * sinY;
      const z2 = node.x * sinY + z1 * cosY;

      const z3 = z2 + cameraZ;
      const scale = fov / z3;

      projected[i].px = x2 * scale + width / 2;
      projected[i].py = y1 * scale + height / 2;
      projected[i].z = z2;
      projected[i].scale = scale;
    }

    // Sort by depth — farthest first
    const sorted = projected.slice(0, animatedLimit).sort((a, b) => b.z - a.z);

    let currentNode = null;

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];

      const depthNormalized = (p.z + offset * 1.5) / (offset * 3);
      const alpha = Math.max(0.05, Math.min(1, 1 - depthNormalized));
      const dotSize = Math.max(0.5, p.scale * 0.8);

      if (p.isSpent) {
        if (p.index === SPENT_WEEKS - 1) {
          currentNode = { px: p.px, py: p.py, alpha: alpha, dotSize: dotSize };
          continue;
        }
        // Spent weeks — warm bone/gold tone
        ctx.fillStyle = 'rgba(201, 169, 110, ' + (alpha * 0.6) + ')';
      } else {
        // Future weeks — faint
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.1) + ')';
      }

      ctx.fillRect(p.px - dotSize / 2, p.py - dotSize / 2, dotSize, dotSize);
    }

    // Current week — accent glow
    if (currentNode) {
      const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
      ctx.save();
      ctx.shadowBlur = 12 + pulse * 6;
      ctx.shadowColor = '#c9a96e';
      ctx.fillStyle = 'rgba(201, 169, 110, ' + Math.max(0.9, currentNode.alpha + 0.8) + ')';
      ctx.fillRect(
        currentNode.px - currentNode.dotSize / 2,
        currentNode.py - currentNode.dotSize / 2,
        currentNode.dotSize,
        currentNode.dotSize
      );
      ctx.restore();
    }

    if (progress < 1) {
      progress += 0.015;
    }

    animationFrameId = requestAnimationFrame(draw);
  };

  // Slight delay before starting
  setTimeout(draw, 300);

  // Cleanup not needed for a static page, but good practice
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
  });
})();
