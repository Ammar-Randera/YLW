/* ════════════════════════════════════════════════════════
   lighter.js  —  Scene 1: CSS Lighter + Verlet Rope Fuse
   One-Shot Integration:
     • Fires window.onFuseExploded(tipX, tipY) at explosion
     • That hook is handled by director.js
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Rope config ── */
  const N        = 18;
  const ROPE_LEN = Math.min(window.innerHeight * 0.25, 170);
  const GRAVITY  = 0.99;
  const DAMP     = 0.985;
  const ITER     = window.innerWidth <= 640 ? 6 : 12;
  const SEG      = ROPE_LEN / N;

  let anchorX = window.innerWidth * 0.5;
  let anchorY = 0;

  /* ── Audio (Web Audio API, procedural) ── */
  let audioCtx = null;
  function AC() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function makeNoise(dur) {
    const c = AC(), sz = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, sz, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    return { src, c };
  }
  function playSpark() {
    const { src, c } = makeNoise(0.14);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 0.7;
    const g = c.createGain(); g.gain.setValueAtTime(0.7, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  }
  function playFlame() {
    const { src, c } = makeNoise(0.6);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650;
    const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.2, c.currentTime + 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  }
  function playFuseSizzle() {
    const { src, c } = makeNoise(0.2);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.4;
    const g = c.createGain(); g.gain.setValueAtTime(0.22, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  }
  function playBoom() {
    const { src, c } = makeNoise(0.9);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200;
    const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(1.1, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  }

  /* ── Canvas sparks ── */
  let canvasSparks = [];
  const SPARK_COLS = ['#ffee88','#ffcc33','#ff9900','#ff6600','#ffffff'];
  function spawnSparks(ox, oy, count=18, biasY=-30) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI/2 + (Math.random()-0.5) * Math.PI * 1.1;
      const speed = 2.5 + Math.random() * 5.5;
      const col   = SPARK_COLS[Math.floor(Math.random() * SPARK_COLS.length)];
      const life  = 0.55 + Math.random() * 0.55;
      canvasSparks.push({
        x: ox, y: oy,
        vx: Math.cos(angle)*speed + (Math.random()-0.5)*1.5,
        vy: Math.sin(angle)*speed + biasY*0.04,
        gravity: 0.13 + Math.random()*0.08,
        drag: 0.96 + Math.random()*0.02,
        r: 0.9 + Math.random()*1.4,
        col, life, maxLife: life, trail: []
      });
    }
  }
  function drawCanvasSparks() {
    for (let i = canvasSparks.length - 1; i >= 0; i--) {
      const p = canvasSparks[i];
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();
      if (p.trail.length > 1) {
        for (let j = 0; j < p.trail.length - 1; j++) {
          const alpha = (j / p.trail.length) * (p.life / p.maxLife) * 0.7;
          ctx.beginPath();
          ctx.moveTo(p.trail[j].x, p.trail[j].y);
          ctx.lineTo(p.trail[j+1].x, p.trail[j+1].y);
          ctx.strokeStyle = `rgba(255,200,60,${alpha})`;
          ctx.lineWidth = p.r * (p.life / p.maxLife) * 1.2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      const a = Math.min(1, (p.life / p.maxLife) * 1.8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI*2);
      ctx.fillStyle = p.col;
      ctx.globalAlpha = a;
      ctx.fill();
      ctx.globalAlpha = 1;
      p.vx *= p.drag; p.vy *= p.drag; p.vy += p.gravity;
      p.x += p.vx; p.y += p.vy;
      p.life -= 0.022;
      if (p.life <= 0) canvasSparks.splice(i, 1);
    }
  }

  /* ── DOM refs ── */
  const canvas  = document.getElementById('fuse-canvas');
  const ctx     = canvas.getContext('2d');
  const lighter = document.getElementById('lighter');
  const flame   = document.getElementById('flame');
  const hint    = document.getElementById('hint');
  const metal   = lighter.querySelector('.metal');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Rope nodes ── */
  let nodes = [];
  function initNodes() {
    anchorX = window.innerWidth * 0.5;
    nodes = [];
    for (let i = 0; i <= N; i++) {
      nodes.push({
        x: anchorX, y: anchorY + i * SEG,
        px: anchorX + (Math.random()-0.5)*2,
        py: anchorY + i * SEG - 0.1,
        pinned: i === 0
      });
    }
  }
  initNodes();

  let mouseX = -999, mouseY = -999;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  document.addEventListener('touchmove', e => {
    mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY;
  }, { passive: true });

  /* ── Lighter state ── */
  let isLit        = false;
  let fuseActive   = false;
  let fuseStarted  = false;
  let fuseProgress = 0;
  let holdTimer    = null;
  let fuseParticles = [];

  /* ── Smoke ── */
  let smokeParticles = [];
  function spawnSmoke(ex, ey) {
    if (Math.random() > 0.35) return;
    smokeParticles.push({
      x: ex + (Math.random()-0.5)*8, y: ey - 2,
      vx: (Math.random()-0.5)*0.4,
      vy: -(0.5 + Math.random()*0.9),
      r: 3 + Math.random()*5,
      life: 1, decay: 0.008 + Math.random()*0.012,
      drift: (Math.random()-0.5)*0.015
    });
  }
  function drawSmokeParticles() {
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const p = smokeParticles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (2 - p.life), 0, Math.PI*2);
      ctx.fillStyle = `rgba(30,18,8,${p.life * 0.13})`;
      ctx.fill();
      p.x += p.vx + p.drift; p.y += p.vy; p.r += 0.15;
      p.vx += (Math.random()-0.5)*0.05;
      p.life -= p.decay;
      if (p.life <= 0) smokeParticles.splice(i, 1);
    }
  }

  /* ── Ember ── */
  let emberParticles = [];
  let heatPhase = 0, sputterTimer = 0, sputterBurst = false;

  function spawnEmber(ex, ey) {
    const count = sputterBurst ? 5 + Math.floor(Math.random()*6) : 1 + Math.floor(Math.random()*2);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI/2 + (Math.random()-0.5)*2.4;
      const speed = 0.8 + Math.random()*3.5;
      const colorRoll = Math.random();
      const col = colorRoll < 0.15 ? '#ffffff'
                : colorRoll < 0.4  ? '#fff5c0'
                : colorRoll < 0.65 ? '#ffcc22'
                : colorRoll < 0.85 ? '#ff8800' : '#ff4400';
      emberParticles.push({
        x: ex + (Math.random()-0.5)*5, y: ey + (Math.random()-0.5)*3,
        vx: Math.cos(angle)*speed + (Math.random()-0.5)*1.2,
        vy: Math.sin(angle)*speed - Math.random()*1.5,
        r: 0.8 + Math.random()*2.2, col,
        life: 0.7 + Math.random()*0.6, decay: 0.018 + Math.random()*0.028,
        gravity: 0.06 + Math.random()*0.04, trail: []
      });
    }
  }
  function spawnFuseFragment(ex, ey) {
    if (Math.random() > 0.12) return;
    emberParticles.push({
      x: ex + (Math.random()-0.5)*4, y: ey,
      vx: (Math.random()-0.5)*1.5, vy: -(0.3 + Math.random()*1.2),
      r: 2.5 + Math.random()*2, col: '#ff6600',
      life: 0.9, decay: 0.025, gravity: 0.12, trail: [], isFragment: true
    });
  }
  function drawRealisticEmber(ex, ey, t) {
    const outerR = 20 + Math.sin(t*0.07)*3;
    const grd0 = ctx.createRadialGradient(ex, ey, 0, ex, ey, outerR);
    grd0.addColorStop(0, 'rgba(255,140,0,0.18)');
    grd0.addColorStop(0.5, 'rgba(255,80,0,0.08)');
    grd0.addColorStop(1, 'rgba(255,30,0,0)');
    ctx.beginPath(); ctx.arc(ex, ey, outerR, 0, Math.PI*2);
    ctx.fillStyle = grd0; ctx.fill();

    const midR = 9 + Math.sin(t*0.11+1)*1.5;
    const grd1 = ctx.createRadialGradient(ex, ey, 0, ex, ey, midR);
    grd1.addColorStop(0, 'rgba(255,220,80,0.95)');
    grd1.addColorStop(0.35, 'rgba(255,120,0,0.75)');
    grd1.addColorStop(0.7, 'rgba(255,50,0,0.35)');
    grd1.addColorStop(1, 'rgba(200,20,0,0)');
    ctx.beginPath(); ctx.arc(ex, ey, midR, 0, Math.PI*2);
    ctx.fillStyle = grd1; ctx.fill();

    ctx.beginPath(); ctx.arc(ex, ey, 4 + Math.sin(t*0.17)*0.7, 0, Math.PI*2);
    ctx.fillStyle = '#ff8800'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex, ey, sputterBurst ? 3.5 : 2 + Math.sin(t*0.23)*0.5, 0, Math.PI*2);
    ctx.fillStyle = '#fff7d0'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex, ey, 1, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    const flameH = 8 + Math.sin(t*0.09)*3 + (sputterBurst ? 6 : 0);
    const grdF = ctx.createLinearGradient(ex, ey, ex + (Math.random()-0.5)*3, ey - flameH);
    grdF.addColorStop(0, 'rgba(255,200,60,0.9)');
    grdF.addColorStop(0.4, 'rgba(255,100,0,0.6)');
    grdF.addColorStop(0.8, 'rgba(255,40,0,0.2)');
    grdF.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.beginPath();
    ctx.ellipse(ex + Math.sin(t*0.08)*2, ey - flameH/2, (4 + Math.sin(t*0.13)*1.5)/2, flameH/2, 0, 0, Math.PI*2);
    ctx.fillStyle = grdF; ctx.fill();
  }
  function drawEmberParticles() {
    for (let i = emberParticles.length - 1; i >= 0; i--) {
      const p = emberParticles[i];
      p.trail.push({x: p.x, y: p.y});
      if (p.trail.length > 5) p.trail.shift();
      if (p.trail.length > 1) {
        for (let j = 0; j < p.trail.length - 1; j++) {
          const alpha = (j / p.trail.length) * p.life * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.trail[j].x, p.trail[j].y);
          ctx.lineTo(p.trail[j+1].x, p.trail[j+1].y);
          ctx.strokeStyle = p.isFragment ? `rgba(255,100,0,${alpha})` : `rgba(255,180,40,${alpha})`;
          ctx.lineWidth = p.r * 0.6 * p.life; ctx.lineCap = 'round'; ctx.stroke();
        }
      }
      if (p.life >= 0.15) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        glow.addColorStop(0, `rgba(255,200,80,${p.life*0.6})`);
        glow.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r*2.5, 0, Math.PI*2);
        ctx.fillStyle = glow; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r*p.life, 0, Math.PI*2);
      ctx.fillStyle = p.col; ctx.globalAlpha = p.life; ctx.fill();
      ctx.globalAlpha = 1;
      p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy += p.gravity;
      p.life -= p.decay;
      if (p.life <= 0) emberParticles.splice(i, 1);
    }
  }

  /* ── Position helpers ── */
  function getStonePos() {
    const r = lighter.querySelector('.stone').getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }
  function getFlamePos() {
    const r = flame.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top };
  }
  function fuseTipPos() {
    const nd = nodes[N];
    return { x: nd.x, y: nd.y };
  }

  /* ── Fuse catching ── */
  let fuseCatching   = false;
  let fuseCatchTimer = 0;
  let fuseCatchDur   = 0;

  function startFuse() {
    if (fuseStarted) return;
    fuseStarted  = true;
    fuseCatching = true;
    fuseCatchDur   = 22 + Math.floor(Math.random() * 36);
    fuseCatchTimer = 0;
    hint.style.opacity = '0';
  }

  /* ── Ignite / extinguish ── */
  function ignite() {
    playSpark();
    setTimeout(playFlame, 65);
    const so = getStonePos();
    spawnSparks(so.x, so.y);
    isLit = true;
    lighter.classList.add('is-lit');
    document.body.classList.add('lit');
    hint.style.opacity = '0';
    if (!fuseStarted) {
      holdTimer = setTimeout(() => { if (isLit) startFuse(); }, 9000);
    }
  }
  function extinguish() {
    isLit = false;
    lighter.classList.remove('is-lit');
    document.body.classList.remove('lit');
    flame.style.transform = '';
    flame.style.filter = '';
    clearTimeout(holdTimer);
  }

  lighter.addEventListener('mousedown', ignite);
  lighter.addEventListener('touchstart', ignite, { passive: true });
  document.addEventListener('mouseup', extinguish);
  document.addEventListener('touchend', extinguish);

  document.addEventListener('mousemove', e => {
    if (!isLit) return;
    const fo = getFlamePos();
    const dx = e.clientX - fo.x;
    const tilt = Math.max(-28, Math.min(28, dx * 0.09));
    const dist = Math.abs(e.clientY - fo.y);
    flame.style.transform = `scaleY(${dist < 200 ? 1 - dist*0.001 : 1}) skewX(${tilt}deg)`;
    flame.style.filter = `brightness(${1 - Math.abs(tilt)*0.013})`;
    const speed = Math.sqrt((e.movementX||0)**2 + (e.movementY||0)**2);
    if (speed > 40 && dist < 140 && !fuseActive) extinguish();
  });

  /* ── Explosion ── */
  function triggerExplosion() {
    fuseActive = false;
    playBoom();

    const flash = document.createElement('div');
    flash.className = 'exp-flash';
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());

    const tip = fuseTipPos();
    const expEl = document.getElementById('explosion');
    expEl.style.cssText = `display:block;left:${tip.x}px;top:${tip.y}px;`;
    ['#ff9900','#ff6600','#ffdd44','#ff3300','#ffffff88'].forEach((col, i) => {
      const ring = document.createElement('div');
      ring.className = 'exp-ring';
      ring.style.cssText = `border:4px solid ${col};animation-delay:${i*0.07}s;`;
      expEl.appendChild(ring);
    });

    spawnSparks(tip.x, tip.y, 45, -65);
    setTimeout(() => spawnSparks(tip.x, tip.y, 28, -40), 90);
    setTimeout(() => spawnSparks(tip.x, tip.y, 18, -25), 200);

    /* Screen shake */
    let shakes = 0;
    const shk = setInterval(() => {
      document.body.style.transform = `translate(${(Math.random()-.5)*16}px,${(Math.random()-.5)*10}px)`;
      if (++shakes > 20) { clearInterval(shk); document.body.style.transform = ''; }
    }, 45);

    /* 🔑 Fire the one-shot bridge event */
    if (typeof window.onFuseExploded === 'function') {
      window.onFuseExploded(tip.x, tip.y);
    }

    /* Cleanup after transition finishes */
    setTimeout(() => {
      expEl.innerHTML = ''; expEl.style.display = 'none';
      fuseStarted = false; fuseProgress = 0; fuseActive = false;
      fuseCatching = false; fuseCatchTimer = 0; fuseCatchDur = 0;
      smokeParticles = []; emberParticles = []; canvasSparks = []; sputterBurst = false;
    }, 1600);
  }

  /* ── Main loop ── */
  function tick() {
    requestAnimationFrame(tick);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* Track lighter's actual rendered center each frame so CSS
       scaling (mobile scale(0.85), landscape scale(0.6), etc.)
       never shifts the fuse anchor off-centre. */
    const mr = metal.getBoundingClientRect();
    anchorX = mr.left + mr.width * 0.5 - 5;

    /* Verlet physics */
    nodes[0].x = anchorX; nodes[0].y = anchorY;
    for (let i = 1; i <= N; i++) {
      const nd = nodes[i];
      const vx = (nd.x - nd.px) * DAMP;
      const vy = (nd.y - nd.py) * DAMP;
      const dx = nd.x - mouseX, dy = nd.y - mouseY;
      const dist2 = dx*dx + dy*dy;
      const windR = 140;
      let wx = 0, wy = 0;
      if (dist2 < windR*windR && dist2 > 1) {
        const d = Math.sqrt(dist2);
        const strength = (1 - d/windR) * 0.55;
        wx = (dx/d)*strength; wy = (dy/d)*strength*0.3;
      }
      const sway = Math.sin(Date.now()*0.0008 + i*0.4) * 0.04;
      nd.px = nd.x; nd.py = nd.y;
      nd.x += vx + wx + sway; nd.y += vy + GRAVITY;
    }
    for (let iter = 0; iter < ITER; iter++) {
      nodes[0].x = anchorX; nodes[0].y = anchorY;
      for (let i = 0; i < N; i++) {
        const a = nodes[i], b = nodes[i+1];
        const dx = b.x-a.x, dy = b.y-a.y;
        const d = Math.sqrt(dx*dx + dy*dy) || 0.001;
        const diff = (d - SEG) / d * 0.5;
        const ox = dx*diff, oy = dy*diff;
        if (!a.pinned) { a.x += ox; a.y += oy; }
        b.x -= ox; b.y -= oy;
      }
      nodes[0].x = anchorX; nodes[0].y = anchorY;
    }

    /* Draw rope */
    const burnTotal  = fuseActive ? fuseProgress * N : 0;
    const burnedSegs = Math.floor(burnTotal);
    const burnFrac   = burnTotal - burnedSegs;

    function drawSeg(x1, y1, x2, y2, burned) {
      ctx.beginPath(); ctx.moveTo(x1+2, y1+2); ctx.lineTo(x2+2, y2+2);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.stroke();
      if (burned) {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle = '#0a0604'; ctx.lineWidth = 9; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 5; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle = '#7a5208'; ctx.lineWidth = 9; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle = '#a8720f'; ctx.lineWidth = 6; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1-1.5,y1); ctx.lineTo(x2-1.5,y2);
        ctx.strokeStyle = 'rgba(220,170,50,0.5)'; ctx.lineWidth = 2.5; ctx.stroke();
      }
    }

    for (let i = 0; i < N; i++) {
      const a = nodes[i], b = nodes[i+1];
      const sfb = N - 1 - i;
      if (fuseActive && sfb < burnedSegs) {
        drawSeg(a.x, a.y, b.x, b.y, true);
      } else if (fuseActive && sfb === burnedSegs && burnFrac > 0) {
        const mx = b.x + (a.x-b.x)*burnFrac, my = b.y + (a.y-b.y)*burnFrac;
        drawSeg(b.x, b.y, mx, my, true);
        drawSeg(mx, my, a.x, a.y, false);
      } else {
        drawSeg(a.x, a.y, b.x, b.y, false);
      }
    }

    /* Dashed highlight */
    ctx.save(); ctx.setLineDash([6, 10]);
    for (let i = 0; i < N; i++) {
      const a = nodes[i], b = nodes[i+1];
      const sfb = N - 1 - i;
      let ux1 = a.x, uy1 = a.y, ux2 = b.x, uy2 = b.y, draw = true;
      if (fuseActive && sfb < burnedSegs) { draw = false; }
      else if (fuseActive && sfb === burnedSegs && burnFrac > 0) {
        const mx = b.x + (a.x-b.x)*burnFrac, my = b.y + (a.y-b.y)*burnFrac;
        ux1 = mx; uy1 = my; ux2 = a.x; uy2 = a.y;
      }
      if (draw) {
        ctx.beginPath(); ctx.moveTo(ux1,uy1); ctx.lineTo(ux2,uy2);
        ctx.strokeStyle = 'rgba(40,20,2,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.lineDashOffset = 8;
        ctx.beginPath(); ctx.moveTo(ux1,uy1); ctx.lineTo(ux2,uy2);
        ctx.strokeStyle = 'rgba(230,185,70,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.lineDashOffset = 0;
      }
    }
    ctx.restore();

    /* Anchor hook */
    ctx.beginPath(); ctx.arc(anchorX, anchorY + 4, 4, 0, Math.PI*2);
    ctx.fillStyle = '#888'; ctx.fill();
    ctx.beginPath(); ctx.arc(anchorX, anchorY + 4, 3, 0, Math.PI*2);
    ctx.fillStyle = '#ccc'; ctx.fill();

    /* Burn ember / active fuse */
    if (fuseCatching) {
      fuseCatchTimer++;
      const tip = fuseTipPos();
      const tx = tip.x, ty = tip.y;
      const catchGrd = ctx.createRadialGradient(tx, ty, 0, tx, ty, 10 + Math.sin(fuseCatchTimer*0.4)*3);
      catchGrd.addColorStop(0, `rgba(255,160,20,${0.5 + Math.sin(fuseCatchTimer*0.3)*0.25})`);
      catchGrd.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.beginPath(); ctx.arc(tx, ty, 14, 0, Math.PI*2);
      ctx.fillStyle = catchGrd; ctx.fill();
      if (Math.random() < 0.12) spawnSparks(tx, ty, 2, -6);
      if (fuseCatchTimer >= fuseCatchDur) {
        fuseCatching = false;
        fuseActive   = true;
      }
    } else if (fuseActive && fuseProgress < 1) {
      const na = nodes[Math.max(0, N-1-burnedSegs)];
      const nb = nodes[Math.min(N, N-burnedSegs)];
      const ex = nb.x + (na.x-nb.x)*burnFrac;
      const ey = nb.y + (na.y-nb.y)*burnFrac;

      spawnSmoke(ex, ey); drawSmokeParticles();
      heatPhase += 0.07; sputterTimer++;
      if (sputterTimer > 40 + Math.floor(Math.random()*50)) {
        sputterBurst = true; sputterTimer = 0;
        setTimeout(() => { sputterBurst = false; }, 80 + Math.random()*120);
      }
      drawRealisticEmber(ex, ey, heatPhase);
      spawnEmber(ex, ey); spawnFuseFragment(ex, ey); drawEmberParticles();
      drawCanvasSparks();

      const naAbove = nodes[Math.max(0, N-1-burnedSegs)];
      if (naAbove) {
        const glowGrd = ctx.createLinearGradient(ex, ey, naAbove.x, naAbove.y);
        glowGrd.addColorStop(0, 'rgba(255,120,0,0.18)');
        glowGrd.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(naAbove.x,naAbove.y);
        ctx.strokeStyle = glowGrd; ctx.lineWidth = 14; ctx.stroke();
      }

      if (sputterBurst && Math.random() < 0.5) playFuseSizzle();
      if (sputterBurst && Math.random() < 0.3) spawnSparks(ex, ey, 3 + Math.floor(Math.random()*4), -10);
      else if (!sputterBurst && Math.random() < 0.02) { playFuseSizzle(); spawnSparks(ex, ey, 1, -5); }

      fuseProgress = Math.min(fuseProgress + 0.0022, 1);
      if (fuseProgress >= 1) triggerExplosion();

    } else {
      drawSmokeParticles(); drawEmberParticles(); drawCanvasSparks();
    }

    fuseParticles = fuseParticles.filter(p => p.life > 0);
    for (const p of fuseParticles) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r*p.life, 0, Math.PI*2);
      ctx.fillStyle = p.col; ctx.globalAlpha = p.life; ctx.fill();
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.04;
    }
    ctx.globalAlpha = 1;

    /* Auto-light check */
    if (isLit && !fuseStarted) {
      const fp = getFlamePos(), tp = fuseTipPos();
      if (Math.hypot(fp.x-tp.x, fp.y-tp.y) < 38) startFuse();
    }
  }

  tick();

})();
/* ════════════════════════════════════════════════════════
   director.js  —  Scene Orchestrator (One-Shot Bridge)
   Connects lighter.js (Scene 1) → fireworks.js (Scene 2)

   Transition strategy: SMASH CUT hidden inside the white flash.
   The flash peaks at opacity 0.9 the moment it's added to the DOM,
   then fades over 100ms. We wait exactly one rAF (one painted frame)
   so the browser has actually rendered the white flash, then swap
   scenes instantly underneath it. When the flash fades out, the
   fireworks world is already there. No cross-fade, no dimming.
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const lighterScene     = document.getElementById('lighterScene');
  const fireworksSection = document.getElementById('fireworksSection');
  const lighterEl        = document.getElementById('lighter');
  const moonEl           = document.getElementById('moonBackground');

  window.onFuseExploded = function (tipX, tipY) {

    // 1. Boot the fireworks engine immediately — give it as much lead time as possible
    //    so it's initialised by the time the flash clears (~100ms away)
    if (typeof initFireworks === 'function') {
      initFireworks();
    }

    // 2. Pan lighter away
    if (lighterEl) lighterEl.classList.add('pan-away');

    // 3. Wait one rAF — the flash element was just added to the DOM by lighter.js
    //    and needs exactly one paint cycle to appear at full brightness.
    //    Swapping on the very next frame means the screen IS white when the cut happens.
    requestAnimationFrame(function () {

      // Kill CSS transitions so the swap is frame-perfect, not animated
      lighterScene.style.transition     = 'none';
      fireworksSection.style.transition = 'none';

      // Swap scenes instantly — screen is white, cut is invisible
      lighterScene.style.opacity       = '0';
      lighterScene.style.pointerEvents = 'none';
      fireworksSection.style.opacity   = '1';
      fireworksSection.style.zIndex    = '15';
      fireworksSection.style.pointerEvents = 'all';

      // Moon drifts in 4 seconds after fireworks start
      if (moonEl) {
        setTimeout(function () {
        moonEl.style.opacity    = '0';
        moonEl.style.display    = 'block';
        moonEl.style.zIndex     = '20';
        moonEl.style.transition = 'opacity 1.2s ease';
        requestAnimationFrame(function () {
          moonEl.style.opacity = '1';
          moonEl.classList.add('animating');
        });
        }, 4000);

        // Show birthday message once the moon finishes drifting off-screen
        moonEl.addEventListener('animationend', function () {
          var msg = document.createElement('div');
          msg.id = 'birthday-message';
          msg.textContent = 'Happy Birthday Sadiyaaa';
          document.body.appendChild(msg);
          requestAnimationFrame(function () {
            msg.classList.add('visible');
          });
        }, { once: true });
      }

      // Restore transitions on the next frame
      requestAnimationFrame(function () {
        lighterScene.style.transition     = '';
        fireworksSection.style.transition = '';
      });

    });
  };

})();
