/* ─────────────────────────────────────────
   Letter & Light — with cinematic entry
───────────────────────────────────────── */
const {
  gsap: { registerPlugin, set, to, timeline },
  MorphSVGPlugin,
  Draggable
} = window;

registerPlugin(MorphSVGPlugin);

/* ─── Detect cinematic entry from birthday page ─── */
const fromBirthday = sessionStorage.getItem('fromBirthday')
if (fromBirthday) sessionStorage.removeItem('fromBirthday')

let startX, startY;

const AUDIO = {
  CLICK: new Audio("https://assets.codepen.io/605876/click.mp3")
};

/* Start bulb OFF if coming from birthday, ON otherwise */
const STATE = { ON: fromBirthday ? false : true };

document.documentElement.style.setProperty("--on", STATE.ON ? "1" : "0");

const TOGGLE_READY_AT = Date.now() + 7000;

const CORD_DURATION = 0.1;
const PULL_THRESHOLD = 15;

const CORDS      = document.querySelectorAll(".toggle-scene__cord");
const HIT        = document.querySelector(".toggle-scene__hit-spot");
const DUMMY      = document.querySelector(".toggle-scene__dummy-cord");
const DUMMY_CORD = document.querySelector(".toggle-scene__dummy-cord line");
const PROXY      = document.createElement("div");

const ENDX = DUMMY_CORD.getAttribute("x2");
const ENDY = DUMMY_CORD.getAttribute("y2");

const RESET = () => { set(PROXY, { x: ENDX, y: ENDY }); };
RESET();

const CORD_TL = timeline({
  paused: true,
  onStart: () => {
    STATE.ON = !STATE.ON;
    set(document.documentElement, { "--on": STATE.ON ? 1 : 0 });
    set([DUMMY, HIT], { display: "none" });
    set(CORDS[0], { display: "block" });
    AUDIO.CLICK.play();
    /* Instant black the moment cord is pulled OFF */
    if (!STATE.ON) {
      sessionStorage.setItem('fromLetter', '1');
      var bl = document.createElement('div');
      bl.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999999;pointer-events:none;';
      document.body.appendChild(bl);
    }
  },
  onComplete: () => {
    set([DUMMY, HIT], { display: "block" });
    set(CORDS[0], { display: "none" });
    RESET();
    if (!STATE.ON) {
      setTimeout(function () { window.location.href = './lighter.html'; }, 50);
    }
  }
});

for (let i = 1; i < CORDS.length; i++) {
  CORD_TL.add(
    to(CORDS[0], {
      morphSVG: CORDS[i],
      duration: CORD_DURATION,
      repeat: 1,
      yoyo: true
    })
  );
}

Draggable.create(PROXY, {
  trigger: HIT,
  type: "x,y",
  onPress: e => { startX = e.x; startY = e.y; },
  onDrag: function () {
    set(DUMMY_CORD, { attr: { x2: this.x, y2: this.y } });
  },
  onRelease: function (e) {
    const DISTX     = Math.abs(e.x - startX);
    const DISTY     = Math.abs(e.y - startY);
    const TRAVELLED = Math.sqrt(DISTX * DISTX + DISTY * DISTY);
    to(DUMMY_CORD, {
      attr: { x2: ENDX, y2: ENDY },
      duration: CORD_DURATION,
      onComplete: () => {
        if (TRAVELLED > PULL_THRESHOLD && Date.now() >= TOGGLE_READY_AT) {
          CORD_TL.restart();
        } else {
          RESET();
        }
      }
    });
  }
});

/* ─── Show cord hint when timer ends ─── */
setTimeout(() => {
  const hint = document.querySelector(".cord-hint");
  if (hint) hint.classList.add("visible");
}, 7000);

/* ─────────────────────────────────────────
   Envelope & Letter
───────────────────────────────────────── */
const letters          = document.querySelectorAll(".letter");
const lettersContainer = document.querySelector(".letters");
let letterReady        = false;

const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const shuffledLetters = Array.from(letters);
shuffleArray(shuffledLetters);

shuffledLetters.forEach(letter => {
  lettersContainer.appendChild(letter);

  const center =
    document.querySelector(".cssletter").offsetWidth / 2 -
    letter.offsetWidth / 2;
  letter.style.left = `${center}px`;

  const isOverflown = el =>
    el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;

  if (!isOverflown(letter)) {
    letter.classList.add("center");
  }

  letter.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") return;
    if (letter.dataset.out === "true") return;
    if (!letterReady) return;

    letter.dataset.out = "true";

    const envelope = document.querySelector(".envelope");
    const riseBy   = -(envelope.offsetHeight * 0.10);

    to(letter, {
      y: riseBy,
      scale: 1.02,
      zIndex: 20,
      duration: 0.45,
      ease: "back.out(1.4)"
    });
  });
});

document.querySelector("#openEnvelope").addEventListener("click", e => {
  e.stopPropagation();
  document.querySelector(".envelope").classList.add("active");
  setTimeout(() => {
    const envelope = document.querySelector(".envelope");
    const peekY = -(envelope.offsetHeight * 0.05);
    letters.forEach(letter => {
      to(letter, { y: peekY, duration: 0.55, ease: "back.out(1.5)" });
    });
    letterReady = true;
  }, 700);
});

document.querySelectorAll(".closeLetter").forEach(button => {
  button.addEventListener("click", e => {
    e.preventDefault();
    const letter = e.target.closest(".letter");
    if (letter) {
      letter.dataset.out = "false";
      to(letter, {
        y: 0,
        scale: 1,
        zIndex: 1,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => { letter.style.display = "none"; }
      });
    }
  });
});

/* ─── Auto-fit font to fill card ─── */
function fitLetterFont(el) {
  let size = 60;
  el.style.fontSize = size + "px";
  while (el.scrollHeight > el.clientHeight && size > 8) {
    size -= 0.5;
    el.style.fontSize = size + "px";
  }
}

window.addEventListener("load", () => {
  document.querySelectorAll(".letter").forEach(fitLetterFont);
});

window.addEventListener("resize", () => {
  document.querySelectorAll(".letter").forEach(fitLetterFont);
});

/* ─────────────────────────────────────────
   Cinematic entry: bulb flicker reveal
───────────────────────────────────────── */
(function cinematicEntry() {
  const entryOverlay = document.getElementById('entryOverlay')
  if (!entryOverlay) return

  if (fromBirthday) {
    /* Kill body's background transition so it can't bleed colour through the overlay */
    document.body.style.transition = 'none'

    const steps = [
      ['0.5', 55],
      ['0',   45],
      ['0.9', 65],
      ['0',   40],
      ['1',   0]
    ]
    function nextStep() {
      if (!steps.length) {
        STATE.ON = true
        /* Two rAFs: let browser paint the warm background while overlay still covers */
        requestAnimationFrame(() => requestAnimationFrame(() => {
          /* Re-enable the transition for normal cord-pull use */
          document.body.style.transition = ''
          /* Drop the overlay — room is already warm behind it */
          entryOverlay.style.transition = 'opacity 0.18s ease'
          entryOverlay.style.opacity = '0'
          setTimeout(() => entryOverlay.remove(), 200)
        }))
        return
      }
      const [val, delay] = steps.shift()
      document.documentElement.style.setProperty('--on', val)
      if (delay > 0) setTimeout(nextStep, delay)
      else nextStep()
    }
    nextStep()

  } else {
    /* Direct navigation: just fade the overlay away quickly */
    entryOverlay.style.transition = 'opacity 0.35s ease'
    entryOverlay.style.opacity = '0'
    setTimeout(() => entryOverlay.remove(), 380)
  }
})()
