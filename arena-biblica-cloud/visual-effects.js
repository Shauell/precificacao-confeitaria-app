(() => {
  'use strict';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const starsHost = document.getElementById('bgstars');
  const canvas = document.getElementById('confetti');
  const app = document.getElementById('app');

  function createAtmosphere() {
    if (!starsHost || reduced) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 64; i += 1) {
      const star = document.createElement('i');
      const size = Math.random() * 2.4 + 0.7;
      star.className = 'star';
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty('--d', `${Math.random() * 3.8 + 1.5}s`);
      star.style.animationDelay = `${Math.random() * -5}s`;
      fragment.appendChild(star);
    }
    starsHost.appendChild(fragment);

    for (let i = 0; i < 14; i += 1) {
      const mote = document.createElement('i');
      const size = Math.random() * 4 + 2;
      mote.className = 'mote';
      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.left = `${Math.random() * 100}%`;
      mote.style.opacity = `${Math.random() * 0.45 + 0.18}`;
      mote.style.animationDuration = `${Math.random() * 13 + 10}s`;
      mote.style.animationDelay = `${Math.random() * -18}s`;
      mote.style.setProperty('--drift', `${Math.random() * 100 - 50}px`);
      document.body.appendChild(mote);
    }
  }

  let ctx = null;
  let pieces = [];
  let running = false;

  function resizeCanvas() {
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burst(amount = 120) {
    if (!ctx || reduced) return;
    const colors = ['#f6c453', '#ffd977', '#ff6b5e', '#4fd1c5', '#ffffff', '#7bd88f', '#c792ea'];
    for (let i = 0; i < amount; i += 1) {
      pieces.push({
        x: Math.random() * innerWidth,
        y: -20 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 4.5,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.28,
        w: Math.random() * 8 + 5,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(confettiLoop);
    }
  }

  function confettiLoop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(piece => piece.y < innerHeight + 35);
    pieces.forEach(piece => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.055;
      piece.rot += piece.vr;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    });
    if (pieces.length) {
      requestAnimationFrame(confettiLoop);
    } else {
      running = false;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  let lastCelebration = '';
  function inspectScreen() {
    if (!app) return;
    const result = app.querySelector('.result');
    if (result) {
      const signature = result.textContent.trim().slice(0, 160);
      if (signature && signature !== lastCelebration) {
        lastCelebration = signature;
        burst(150);
        setTimeout(() => burst(80), 650);
      }
    }
  }

  createAtmosphere();
  resizeCanvas();
  addEventListener('resize', resizeCanvas, { passive: true });

  if (app) {
    const observer = new MutationObserver(inspectScreen);
    observer.observe(app, { childList: true, subtree: true, characterData: true });
    inspectScreen();
  }

  window.ArenaVisualEffects = { burst };
})();
