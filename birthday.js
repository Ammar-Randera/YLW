// ── BIRTHDAY SCRIPT — Version 2: Shatter Into Stars ──
  const star        = document.getElementById("star")
  const sky         = document.getElementById("sky")
  const birthday    = document.getElementById("birthdayMessage")
  const cake        = document.getElementById("cake")
  const blowBtn     = document.getElementById("blowBtn")
  const bdaySection = document.getElementById("birthdaySection")

  const MSG_START      = 5000
  const MSG_WRITE_TIME = 20000
  const MSG_ADMIRE     = 4000
  const MSG_TOTAL      = MSG_WRITE_TIME + MSG_ADMIRE

  star.onclick = () => {
    sky.classList.add("show")
    setTimeout(createStars,    2200)
    setTimeout(createShooting, 3800)
    setTimeout(() => {
      birthday.classList.add("show")
      drawHandwriting()
    }, MSG_START)
    setTimeout(() => {
      shatterIntoStars(birthday, () => {
        cake.classList.add("show")
        enableBlowCandle()
        blowBtn.classList.add("show")
      })
    }, MSG_START + MSG_TOTAL)
  }

  // ── SHATTER INTO STARS EXIT ───────────────────────────────────────────────
  function shatterIntoStars(container, onDone) {
    const rect    = container.getBoundingClientRect()
    const COLORS  = ["#fff7c2", "#ffd700", "#ffaa00", "#ffffff", "#ffe066", "#ffc0cb"]
    const STAR_PATH = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
    const PARTICLE_COUNT = 90

    container.style.transition = "filter 0.15s ease, opacity 0.15s ease"
    container.style.filter     = "brightness(6) blur(2px)"
    container.style.opacity    = "1"

    setTimeout(() => {
      container.style.transition = "opacity 0.08s ease"
      container.style.opacity    = "0"

      const particles = []
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const size  = 4 + Math.random() * 9
        const color = COLORS[Math.floor(Math.random() * COLORS.length)]

        const spawnX = rect.left + Math.random() * rect.width
        const spawnY = rect.top  + Math.random() * rect.height

        const angle  = Math.random() * Math.PI * 2
        const speed  = 2.5 + Math.random() * 6.5
        const vx     = Math.cos(angle) * speed
        const vy     = Math.sin(angle) * speed - 1.5

        const el = document.createElement("div")
        el.style.cssText = [
          "position:fixed",
          `left:${spawnX}px`,
          `top:${spawnY}px`,
          `width:${size}px`,
          `height:${size}px`,
          `background:${color}`,
          `clip-path:${STAR_PATH}`,
          `box-shadow:0 0 ${size * 1.8}px ${color}, 0 0 ${size * 3.5}px ${color}`,
          "pointer-events:none",
          "z-index:200",
          "will-change:transform,opacity"
        ].join(";")
        document.body.appendChild(el)

        particles.push({
          el, x: spawnX, y: spawnY,
          startX: spawnX, startY: spawnY,
          vx, vy,
          gravity: 0.04 + Math.random() * 0.06,
          drag:    0.97,
          rot:     Math.random() * 360,
          rotSpeed:(Math.random() - 0.5) * 10,
          opacity: 1,
          life:    0,
          fadeStart: 800 + Math.random() * 1200,
          fadeDur:   600 + Math.random() * 800
        })
      }

      const launched = Date.now()

      function animateParticles() {
        const elapsed = Date.now() - launched
        let alive = false

        for (const p of particles) {
          if (!p.el.parentNode) continue

          p.vx *= p.drag
          p.vy += p.gravity
          p.x  += p.vx
          p.y  += p.vy
          p.rot += p.rotSpeed

          if (elapsed > p.fadeStart) {
            p.opacity = Math.max(0, 1 - (elapsed - p.fadeStart) / p.fadeDur)
          }

          if (p.opacity <= 0) {
            p.el.remove()
            continue
          }

          alive = true
          const dx = p.x - p.startX
          const dy = p.y - p.startY
          p.el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${p.rot}deg)`
          p.el.style.opacity   = p.opacity
        }

        if (alive) {
          requestAnimationFrame(animateParticles)
        } else {
          onDone()
        }
      }

      requestAnimationFrame(animateParticles)
    }, 180)
  }

  // ── HANDWRITING ───────────────────────────────────────────────────────────
  let handwritingStarted = false

  function drawHandwriting() {
    if (handwritingStarted) return
    handwritingStarted = true
    if (typeof Vara !== "function") return

    const isMobile = window.innerWidth <= 480
    const size = isMobile ? 36 : 56

    new Vara(
      "#bdayHandwriting",
      "https://cdn.jsdelivr.net/gh/akzhy/Vara@master/fonts/Parisienne/Parisienne.json",
      [
        { text: "Jahan Ara,",               fontSize: size, duration: 2500, delay: 0,   textAlign: "center", color: "#fff7c2", id: "line1" },
        { text: "aaP ko dil se",            fontSize: size, duration: 3500, delay: 800, textAlign: "center", color: "#fff7c2", id: "line2" },
        { text: "Youm-E-Pedaish ki",        fontSize: size, duration: 4500, delay: 800, textAlign: "center", color: "#fff7c2", id: "line3" },
        { text: "Pur-khuloos Mubarakbaad!", fontSize: size, duration: 6000, delay: 800, textAlign: "center", color: "#fff7c2", id: "line4" }
      ],
      { strokeWidth: 1.3, autoAnimation: true, letterSpacing: -1 }
    )
  }

  // ── STARS ─────────────────────────────────────────────────────────────────
  function createStars() {
    for (let i = 0; i < 120; i++) {
      setTimeout(() => {
        const s = document.createElement("div")
        s.className  = "starSmall"
        s.style.left = Math.random() * 100 + "%"
        s.style.top  = Math.random() * 100 + "%"
        s.style.animationDuration = (1.5 + Math.random() * 2) + "s"
        sky.appendChild(s)
      }, i * 12)
    }
  }

  let shootingActive = false
  function createShooting() {
    shootingActive = true
    function spawnWave() {
      if (!shootingActive) return
      const p = Math.random()
      let topPos, leftPos
      if (p < 0.5) {
        const t = p * 2
        topPos  = -120 - (t * 80)
        leftPos = -120 + (t * (window.innerWidth / 2 + 120))
      } else {
        const t = (p - 0.5) * 2
        leftPos = window.innerWidth / 2 + (t * (window.innerWidth / 2 + 120))
        topPos  = -200 + (t * 80)
      }
      const meteor = document.createElement("div")
      meteor.className = "shooting fromLeft"
      meteor.style.top             = topPos + "px"
      meteor.style.left            = leftPos + "px"
      meteor.style.transform       = "rotate(45deg)"
      meteor.style.width           = 80 + Math.random() * 120 + "px"
      meteor.style.animationDuration = 3 + Math.random() * 4 + "s"
      meteor.style.opacity         = 0.6 + Math.random() * 0.4
      sky.appendChild(meteor)
      setTimeout(() => meteor.remove(), 7000)
      setTimeout(spawnWave, 3500)
    }
    spawnWave()
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { shootingActive = false }
    else { shootingActive = false; setTimeout(createShooting, 50) }
  })

  // ── CANDLE ────────────────────────────────────────────────────────────────
  function enableBlowCandle() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const ctx      = new AudioContext()
        const mic      = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        mic.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        function detectBlow() {
          analyser.getByteFrequencyData(data)
          if (data.reduce((a, b) => a + b) / data.length > 60) blowOutCandle()
          requestAnimationFrame(detectBlow)
        }
        detectBlow()
      })
      .catch(() => {})
  }

  blowBtn.onclick = () => blowOutCandle()
  let candleBlown = false

  function blowOutCandle() {
    if (candleBlown) return
    candleBlown = true
    document.querySelector(".cake-flame").classList.add("out")
    blowBtn.classList.remove("show")
    const candle          = document.querySelector(".cake-candle")
    const bdaySectionRect = bdaySection.getBoundingClientRect()
    const candleRect      = candle.getBoundingClientRect()
    const originX = candleRect.left + candleRect.width / 2 - bdaySectionRect.left
    const originY = candleRect.top - bdaySectionRect.top
    const smokeContainer = document.createElement("div")
    smokeContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:300;overflow:hidden;"
    bdaySection.appendChild(smokeContainer)
    const smokeTimers = []
    for (let i = 0; i < 2; i++) {
      smokeTimers.push(setTimeout(() => {
        const puff   = document.createElement("div")
        const size   = 14 + Math.random() * 28
        const driftX = (Math.random() - 0.5) * 160
        const riseY  = 80 + Math.random() * 140
        const delay  = Math.random() * 0.3
        const dur    = 2.8 + Math.random() * 2.2
        puff.style.cssText = [`position:absolute`,`width:${size}px`,`height:${size}px`,`left:${originX-size/2+(Math.random()-0.5)*10}px`,`top:${originY-size/2}px`,`border-radius:50%`,`background:rgba(210,210,220,0.75)`,`filter:blur(${4+Math.random()*6}px)`,`z-index:300`,`pointer-events:none`,`--dx:${driftX}px`,`--dy:-${riseY}px`,`--scale:${2.5+Math.random()*2}`,`animation:smokePuff ${dur}s ${delay}s ease-out forwards`].join(";")
        smokeContainer.appendChild(puff)
        setTimeout(() => puff.remove(), (dur + delay + 0.5) * 1000)
      }, i * 90))
    }
    setTimeout(() => {
      smokeTimers.forEach(t => clearTimeout(t))
      playConfettiSound()
      launchConfetti(bdaySection, cake, sky, birthday)
    }, 2000)
  }

  function playConfettiSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc     = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12)
      oscGain.gain.setValueAtTime(1.2, ctx.currentTime)
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
      const bufSize = Math.floor(ctx.sampleRate * 0.55)
      const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data    = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const noise     = ctx.createBufferSource()
      noise.buffer    = buf
      const hipass    = ctx.createBiquadFilter()
      hipass.type     = "highpass"
      hipass.frequency.value = 600
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.55, ctx.currentTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      noise.connect(hipass)
      hipass.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start()
    } catch (e) {}
  }

  function launchConfetti(bdaySection, cake, sky, birthday) {
    const colors = [
      "#ffd700", "#ff69b4", "#ff4444", "#ffffff",
      "#c084fc", "#67e8f9", "#86efac", "#fbbf24",
      "#f472b6", "#a78bfa", "#fb923c", "#34d399"
    ]
    const W = window.innerWidth
    const H = window.innerHeight
    const overlay = document.createElement("div")
    overlay.style.cssText = [
      "position:fixed", "top:0", "left:0",
      "width:100%", "height:100%",
      "background:#060d1f",
      "pointer-events:none",
      "z-index:550",
      "opacity:0",
      "transition:opacity 0.25s ease"
    ].join(";")
    document.body.appendChild(overlay)
    setTimeout(() => { overlay.style.opacity = "1" }, 50)
    setTimeout(() => { bdaySection.style.display = "none" }, 400)
    const container = document.createElement("div")
    container.style.cssText = [
      "position:fixed", "top:0", "left:0",
      "width:100%", "height:100%",
      "pointer-events:none",
      "z-index:600"
    ].join(";")
    document.body.appendChild(container)
    const cannons = [
      { x: 0,  y: H, minDeg: 30, maxDeg: 80  },
      { x: W,  y: H, minDeg: 100, maxDeg: 150 }
    ]
    const pieces     = []
    const PER_CANNON = 100
    const confettiFrag = document.createDocumentFragment()
    for (const cannon of cannons) {
      for (let i = 0; i < PER_CANNON; i++) {
        const el    = document.createElement("div")
        const type  = Math.random()
        let   w, h, radius
        if (type < 0.33) {
          w = h = 8 + Math.random() * 10
          radius = "50%"
        } else if (type < 0.66) {
          w = 9 + Math.random() * 10
          h = 9 + Math.random() * 10
          radius = "2px"
        } else {
          w = 4 + Math.random() * 4
          h = 18 + Math.random() * 20
          radius = "1px"
        }
        const color = colors[Math.floor(Math.random() * colors.length)]
        el.style.cssText = [
          "position:absolute",
          "left:0", "top:0",
          `width:${w}px`,
          `height:${h}px`,
          `background:${color}`,
          `border-radius:${radius}`,
          "will-change:transform,opacity"
        ].join(";")
        confettiFrag.appendChild(el)
        const deg   = cannon.minDeg + Math.random() * (cannon.maxDeg - cannon.minDeg)
        const rad   = deg * Math.PI / 180
        const speed = 16 + Math.random() * 22
        pieces.push({
          el,
          x:        cannon.x,
          y:        cannon.y,
          vx:       Math.cos(rad) * speed,
          vy:       -Math.sin(rad) * speed,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 16,
          gravity:  0.32 + Math.random() * 0.14,
          drag:     0.99,
          opacity:  1,
          delay:    i * 5
        })
      }
    }
    container.appendChild(confettiFrag)
    const launched = Date.now()
    function animate() {
      const elapsed = Date.now() - launched
      let   alive   = false
      for (const p of pieces) {
        if (!p.el.parentNode) continue
        if (elapsed < p.delay) { alive = true; continue }
        p.vx       *= p.drag
        p.vy       += p.gravity
        p.x        += p.vx
        p.y        += p.vy
        p.rotation += p.rotSpeed
        if (elapsed > 1400) {
          p.opacity = Math.max(0, 1 - (elapsed - 1400) / 700)
        }
        if (p.y > H + 80 || p.x < -80 || p.x > W + 80 || p.opacity <= 0) {
          p.el.remove()
          continue
        }
        alive = true
        p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rotation}deg)`
        p.el.style.opacity   = p.opacity
      }
      if (alive) {
        requestAnimationFrame(animate)
      } else {
        container.remove()
        sessionStorage.setItem('fromBirthday', '1')
        window.location.href = './letter.html'
      }
    }
    requestAnimationFrame(animate)
  }
