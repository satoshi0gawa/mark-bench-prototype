(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = (min, max) => min + Math.random() * (max - min);
  const palette = ['#ffff00', '#ffffff', '#7fb4d9', '#315a9b', '#b85c72'];

  const bindControl = (root, setPaused) => {
    const button = root.querySelector('[data-effect-toggle]');
    if (!button) return;
    if (reduceMotion) {
      button.textContent = 'MOTION OFF';
      button.disabled = true;
      return;
    }
    button.addEventListener('click', () => {
      const paused = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? 'PLAY' : 'PAUSE';
      setPaused(paused);
    });
  };

  const startCanvas = (root, createScene, paint) => {
    const canvas = root.querySelector('canvas');
    const context = canvas.getContext('2d');
    let width = 1;
    let height = 1;
    let scene = [];
    let frame = 0;
    let paused = reduceMotion;
    let visible = true;
    let previous = 0;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      scene = createScene(width, height);
      paint(context, scene, width, height, 0, 0);
    };
    const loop = (time) => {
      frame = 0;
      const delta = Math.min(40, time - previous || 16);
      previous = time;
      if (!paused && visible) paint(context, scene, width, height, time, delta);
      if (!paused && visible) frame = window.requestAnimationFrame(loop);
    };
    const resume = () => {
      if (!paused && visible && !frame) frame = window.requestAnimationFrame(loop);
    };
    bindControl(root, (nextPaused) => {
      paused = nextPaused;
      if (paused) window.cancelAnimationFrame(frame);
      frame = 0;
      resume();
    });
    new ResizeObserver(resize).observe(root);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else resume();
    }, { rootMargin: '120px' }).observe(root);
    resize();
    resume();
  };

  const canvasScenes = {
    particles: {
      create: (width, height) => Array.from({ length: width < 380 ? 22 : 34 }, () => ({ x: random(0, width), y: random(0, height), r: random(1, 3.4), vx: random(-0.012, 0.012), vy: random(-0.018, -0.005) })),
      paint: (ctx, dots, width, height, time, delta) => {
        ctx.clearRect(0, 0, width, height);
        dots.forEach((dot) => { dot.x = (dot.x + dot.vx * delta + width) % width; dot.y = (dot.y + dot.vy * delta + height) % height; ctx.globalAlpha = 0.35 + Math.sin(time * 0.002 + dot.x) * 0.22; ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
      }
    },
    network: {
      create: (width, height) => Array.from({ length: width < 380 ? 16 : 24 }, () => ({ x: random(0, width), y: random(0, height), vx: random(-0.018, 0.018), vy: random(-0.018, 0.018) })),
      paint: (ctx, dots, width, height, time, delta) => {
        ctx.clearRect(0, 0, width, height);
        dots.forEach((dot) => { dot.x += dot.vx * delta; dot.y += dot.vy * delta; if (dot.x < 0 || dot.x > width) dot.vx *= -1; if (dot.y < 0 || dot.y > height) dot.vy *= -1; });
        dots.forEach((a, index) => dots.slice(index + 1).forEach((b) => { const distance = Math.hypot(a.x - b.x, a.y - b.y); if (distance < 86) { ctx.strokeStyle = `rgb(127 180 217 / ${0.42 * (1 - distance / 86)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }));
        ctx.fillStyle = '#ffff00'; dots.forEach((dot) => { ctx.beginPath(); ctx.arc(dot.x, dot.y, 1.8, 0, Math.PI * 2); ctx.fill(); });
      }
    },
    wave: {
      create: () => [],
      paint: (ctx, scene, width, height, time) => {
        ctx.clearRect(0, 0, width, height);
        ['#315a9b', '#536b8c', '#7fb4d9'].forEach((color, index) => { ctx.beginPath(); for (let x = 0; x <= width; x += 4) { const y = height * (0.48 + index * 0.11) + Math.sin(x * 0.025 + time * 0.0012 + index) * (10 + index * 3); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.globalAlpha = 0.42; ctx.fillStyle = color; ctx.fill(); }); ctx.globalAlpha = 1;
      }
    },
    bubbles: {
      create: (width, height) => Array.from({ length: 18 }, () => ({ x: random(0, width), y: random(0, height), r: random(3, 11), speed: random(0.018, 0.05), sway: random(0, Math.PI * 2) })),
      paint: (ctx, bubbles, width, height, time, delta) => { ctx.clearRect(0, 0, width, height); ctx.strokeStyle = 'rgb(255 255 255 / 58%)'; bubbles.forEach((bubble) => { bubble.y -= bubble.speed * delta; if (bubble.y < -bubble.r) { bubble.y = height + bubble.r; bubble.x = random(0, width); } ctx.beginPath(); ctx.arc(bubble.x + Math.sin(time * 0.001 + bubble.sway) * 5, bubble.y, bubble.r, 0, Math.PI * 2); ctx.stroke(); }); }
    },
    snow: {
      create: (width, height) => Array.from({ length: width < 380 ? 24 : 34 }, () => ({ x: random(0, width), y: random(0, height), r: random(1, 3.2), speed: random(0.018, 0.055), phase: random(0, 6) })),
      paint: (ctx, flakes, width, height, time, delta) => { ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#fff'; flakes.forEach((flake) => { flake.y += flake.speed * delta; if (flake.y > height + 4) flake.y = -4; ctx.globalAlpha = 0.45 + flake.r / 7; ctx.beginPath(); ctx.arc(flake.x + Math.sin(time * 0.001 + flake.phase) * 6, flake.y, flake.r, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1; }
    },
    stars: {
      create: (width, height) => Array.from({ length: width < 380 ? 34 : 52 }, () => ({ x: random(0, width), y: random(0, height), r: random(0.6, 2.2), phase: random(0, 6) })),
      paint: (ctx, stars, width, height, time) => { ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#fff'; stars.forEach((star) => { ctx.globalAlpha = 0.25 + (Math.sin(time * 0.002 + star.phase) + 1) * 0.32; ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1; }
    },
    matrix: {
      create: (width) => Array.from({ length: Math.ceil(width / 14) }, (_, index) => ({ x: index * 14, y: random(-120, 0), speed: random(0.05, 0.12) })),
      paint: (ctx, columns, width, height, time, delta) => { ctx.fillStyle = 'rgb(7 17 13 / 16%)'; ctx.fillRect(0, 0, width, height); ctx.font = '11px monospace'; columns.forEach((column) => { column.y += column.speed * delta; if (column.y > height + 40) column.y = random(-100, 0); ctx.fillStyle = Math.random() > 0.88 ? '#ffff00' : '#62b987'; ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 80)), column.x, column.y); }); }
    },
    confetti: {
      create: (width, height) => Array.from({ length: width < 380 ? 30 : 46 }, () => ({ x: random(0, width), y: random(0, height), w: random(3, 7), h: random(6, 12), speed: random(0.025, 0.07), spin: random(0, 6), color: palette[Math.floor(random(0, palette.length))] })),
      paint: (ctx, pieces, width, height, time, delta) => { ctx.clearRect(0, 0, width, height); pieces.forEach((piece) => { piece.y += piece.speed * delta; if (piece.y > height + 10) { piece.y = -10; piece.x = random(0, width); } ctx.save(); ctx.translate(piece.x, piece.y); ctx.rotate(time * 0.002 + piece.spin); ctx.fillStyle = piece.color; ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h); ctx.restore(); }); }
    }
  };

  Object.entries(canvasScenes).forEach(([name, scene]) => {
    document.querySelectorAll(`[data-background-effect="${name}"]`).forEach((root) => startCanvas(root, scene.create, scene.paint));
  });

  document.querySelectorAll('[data-background-effect="pointer"], [data-background-effect="grid"]').forEach((root) => {
    let paused = reduceMotion;
    bindControl(root, (nextPaused) => { paused = nextPaused; });
    root.addEventListener('pointermove', (event) => {
      if (paused) return;
      const rect = root.getBoundingClientRect();
      root.style.setProperty('--effect-x', `${event.clientX - rect.left}px`);
      root.style.setProperty('--effect-y', `${event.clientY - rect.top}px`);
    });
    root.addEventListener('pointerleave', () => { root.style.removeProperty('--effect-x'); root.style.removeProperty('--effect-y'); });
  });

  document.querySelectorAll('[data-background-effect="aurora"]').forEach((root) => {
    const blobs = [...root.querySelectorAll('.c-background-effect__blob')];
    let paused = reduceMotion;
    let frame = 0;
    const draw = (time) => {
      blobs.forEach((blob, index) => { const angle = time * (0.00018 + index * 0.00005) + index * 2; blob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * (42 + index * 12)}px), calc(-50% + ${Math.sin(angle * 1.3) * (25 + index * 7)}px)) rotate(${angle * 30}deg)`; });
      if (!paused) frame = requestAnimationFrame(draw);
    };
    bindControl(root, (nextPaused) => { paused = nextPaused; cancelAnimationFrame(frame); if (!paused) frame = requestAnimationFrame(draw); });
    draw(0);
  });

  document.querySelectorAll('[data-background-effect="sky"]').forEach((root) => {
    const times = ['morning', 'day', 'evening', 'night'];
    const hour = new Date().getHours();
    let index = hour < 5 || hour >= 19 ? 3 : hour < 10 ? 0 : hour < 16 ? 1 : 2;
    const apply = () => { root.dataset.time = times[index]; root.querySelector('[data-sky-label]').textContent = times[index].toUpperCase(); };
    root.querySelector('[data-sky-cycle]').addEventListener('click', () => { index = (index + 1) % times.length; apply(); });
    apply();
  });
})();
