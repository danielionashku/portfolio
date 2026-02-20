(() => {
  'use strict';

  const canvas = document.getElementById('cubeBg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  let animationFrameId;
  let progress = 0;

  // --- Age & week calculation from DOB ---
  const DOB = new Date(1992, 3, 18); // April 18, 1992
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const SPENT_WEEKS = Math.floor((now - DOB) / msPerWeek);
  const WEEKS_IN_LIFE = 4160;

  // Calculate current age
  let age = now.getFullYear() - DOB.getFullYear();
  const monthDiff = now.getMonth() - DOB.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < DOB.getDate())) {
    age--;
  }

  // 16x16x16 cube (4,096 nodes)
  const size = 16;
  const spacing = 2.4;
  const offset = (size - 1) * spacing / 2;
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

  // HUD label position (smoothly lerped)
  const labelPos = { x: null, y: null };

  // Load DM Mono font
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    // Shift cube to the right: offset by ~20% of viewport width
    const centerX = width * 0.62;
    const centerY = height * 0.5;

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

      projected[i].px = x2 * scale + centerX;
      projected[i].py = y1 * scale + centerY;
      projected[i].z = z2;
      projected[i].scale = scale;
    }

    // Sort by depth — farthest first
    const sorted = projected.slice(0, animatedLimit).sort((a, b) => b.z - a.z);

    let currentWeekNode = null;

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];

      const depthNormalized = (p.z + offset * 1.5) / (offset * 3);
      const alpha = Math.max(0.05, Math.min(1, 1 - depthNormalized));
      const dotSize = Math.max(0.5, p.scale * 0.8);

      if (p.isSpent) {
        if (p.index === SPENT_WEEKS - 1) {
          currentWeekNode = { px: p.px, py: p.py, alpha: alpha, dotSize: dotSize };
          continue; // Render on top later
        }
        // Spent weeks — warm bone color
        ctx.fillStyle = 'rgba(240, 237, 230, ' + (alpha * 0.7) + ')';
      } else {
        // Future weeks — faint
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.12) + ')';
      }

      ctx.fillRect(p.px - dotSize / 2, p.py - dotSize / 2, dotSize, dotSize);
    }

    // --- Current week node + HUD callout ---
    if (currentWeekNode) {
      const { px, py, alpha, dotSize } = currentWeekNode;
      const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;

      // Draw pulsing red dot
      ctx.save();
      ctx.shadowBlur = 15 + pulse * 8;
      ctx.shadowColor = '#FF2222';
      ctx.fillStyle = 'rgba(255, 60, 60, ' + Math.max(0.9, alpha + 0.8) + ')';
      ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);
      ctx.restore();

      // --- HUD Callout (matching home.jsx style) ---
      // Push label to outer elliptical boundary
      let dx = px - centerX;
      let dy = py - centerY;
      let dist = Math.hypot(dx, dy);
      if (dist < 1) { dx = 1; dy = -1; dist = Math.sqrt(2); }

      const ringRadiusX = Math.min(width * 0.35, 340);
      const ringRadiusY = Math.min(height * 0.35, 280);

      const targetX = centerX + (dx / dist) * ringRadiusX;
      const targetY = centerY + (dy / dist) * ringRadiusY;

      if (labelPos.x === null) {
        labelPos.x = targetX;
        labelPos.y = targetY;
      } else {
        labelPos.x += (targetX - labelPos.x) * 0.08;
        labelPos.y += (targetY - labelPos.y) * 0.08;
      }

      const isRightSide = labelPos.x > centerX;
      const extensionLen = isRightSide ? 80 : -80;

      ctx.save();

      // Leader line from dot to label
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(labelPos.x, labelPos.y);
      ctx.lineTo(labelPos.x + extensionLen, labelPos.y);
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const textX = labelPos.x + (isRightSide ? 4 : -4);
      const textAlign = isRightSide ? 'left' : 'right';

      // "CURRENT WEEK" label
      ctx.fillStyle = 'rgba(255, 80, 80, 1)';
      ctx.font = 'bold 11px "DM Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.textAlign = textAlign;
      ctx.fillText('CURRENT WEEK', textX, labelPos.y - 4);

      // Week progress line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = '10px "DM Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = textAlign;
      ctx.fillText(
        'W: ' + SPENT_WEEKS.toLocaleString() + ' / ' + WEEKS_IN_LIFE.toLocaleString(),
        textX,
        labelPos.y + 4
      );

      // Age indicator
      ctx.fillStyle = 'rgba(201, 169, 110, 0.9)';
      ctx.font = '10px "DM Mono", monospace';
      ctx.fillText('Age ' + age, textX, labelPos.y + 18);

      ctx.restore();
    }

    if (progress < 1) {
      progress += 0.015;
    }

    animationFrameId = requestAnimationFrame(draw);
  };

  setTimeout(draw, 300);

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
  });
})();
