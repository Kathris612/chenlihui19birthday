/* =========================================================
   陈立晖 · Nineteen
   Ambient light, candle wish, fireworks and a tiny music box
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const TAU = Math.PI * 2;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { context, width, height, dpr };
  }

  /* -------------------------------------------------------
     Quiet star field behind the whole page
     ------------------------------------------------------- */

  const ambientCanvas = $("#ambient");
  let ambient = null;
  let stars = [];
  let dust = [];
  let ambientFrameId = null;
  let lastAmbientTime = 0;

  function buildAmbient() {
    const fitted = fitCanvas(ambientCanvas);
    ambient = fitted;

    const area = fitted.width * fitted.height;
    const starCount = clamp(Math.floor(area / 15000), 55, 150);
    const dustCount = clamp(Math.floor(area / 56000), 10, 26);
    const warmPalette = ["236, 217, 188", "214, 179, 122", "247, 237, 225"];
    const coolPalette = ["192, 207, 230", "207, 218, 238", "229, 234, 243"];

    stars = Array.from({ length: starCount }, () => ({
      x: rand(0, fitted.width),
      y: rand(0, fitted.height),
      radius: rand(0.35, 1.45),
      alpha: rand(0.15, 0.72),
      phase: rand(0, TAU),
      speed: rand(0.15, 0.6),
      color: pick(Math.random() > 0.68 ? coolPalette : warmPalette),
    }));

    dust = Array.from({ length: dustCount }, () => ({
      x: rand(0, fitted.width),
      y: rand(0, fitted.height),
      radius: rand(0.7, 2.2),
      alpha: rand(0.12, 0.42),
      speed: rand(6, 18),
      drift: rand(4, 14),
      phase: rand(0, TAU),
      color: pick(warmPalette),
    }));
  }

  function paintAmbient(now, delta = 0) {
    if (!ambient) return;

    const { context, width, height } = ambient;
    const seconds = now * 0.001;

    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";

    for (const star of stars) {
      const twinkle = 0.58 + Math.sin(seconds * star.speed + star.phase) * 0.42;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, TAU);
      context.fillStyle = `rgba(${star.color}, ${star.alpha * twinkle})`;
      context.fill();
    }

    for (const mote of dust) {
      if (delta) {
        mote.y -= mote.speed * delta;
        mote.x += Math.sin(seconds * 0.24 + mote.phase) * mote.drift * delta - 1.4 * delta;
        mote.alpha += Math.sin(seconds * 1.2 + mote.phase) * 0.0007;

        if (mote.y < -12) {
          mote.y = height + 12;
          mote.x = rand(0, width);
        }
        if (mote.x < -12) mote.x = width + 12;
      }

      context.beginPath();
      context.arc(mote.x, mote.y, mote.radius, 0, TAU);
      context.fillStyle = `rgba(${mote.color}, ${clamp(mote.alpha, 0.05, 0.48)})`;
      context.shadowColor = "rgba(221, 180, 120, .7)";
      context.shadowBlur = mote.radius > 1.4 ? 9 : 4;
      context.fill();
    }

    context.shadowBlur = 0;
    context.globalCompositeOperation = "source-over";
  }

  function ambientLoop(now) {
    const delta = lastAmbientTime ? Math.min((now - lastAmbientTime) / 1000, 0.05) : 0;
    lastAmbientTime = now;
    paintAmbient(now, delta);

    if (!document.hidden) {
      ambientFrameId = requestAnimationFrame(ambientLoop);
    } else {
      ambientFrameId = null;
    }
  }

  function startAmbient() {
    if (ambientFrameId !== null) cancelAnimationFrame(ambientFrameId);
    lastAmbientTime = 0;
    if (reduceMotion.matches) {
      paintAmbient(performance.now(), 0);
      ambientFrameId = null;
      return;
    }
    ambientFrameId = requestAnimationFrame(ambientLoop);
  }

  /* -------------------------------------------------------
     Foreground fireworks, confetti and little sparks
     ------------------------------------------------------- */

  const fxCanvas = $("#fx");
  let fx = null;
  let particles = [];
  let fxFrameId = null;
  let lastFxTime = 0;
  let celebrationTimers = [];

  const fireworkPalette = [
    "246, 219, 168",
    "226, 178, 110",
    "247, 235, 217",
    "229, 177, 167",
    "203, 143, 135",
    "255, 244, 222",
  ];

  function resizeFx() {
    fx = fitCanvas(fxCanvas);
  }

  function addBurst(x, y, options = {}) {
    const {
      count = 42,
      speed = 300,
      gravity = 250,
      life = [0.8, 1.7],
      colors = fireworkPalette,
      shape = "spark",
      size = [1, 2.7],
    } = options;

    for (let index = 0; index < count; index += 1) {
      const angle = rand(0, TAU);
      const velocity = rand(speed * 0.18, speed);
      const particleLife = rand(life[0], life[1]);

      particles.push({
        x,
        y,
        previousX: x,
        previousY: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        gravity,
        drag: rand(0.973, 0.992),
        size: rand(size[0], size[1]),
        life: particleLife,
        maxLife: particleLife,
        color: pick(colors),
        shape,
        rotation: rand(0, TAU),
        spin: rand(-7, 7),
      });
    }

    ensureFxLoop();
  }

  function addConfetti() {
    if (!fx) return;

    const colors = ["236, 197, 149", "223, 167, 158", "248, 238, 221", "173, 188, 169", "214, 172, 105"];
    const count = window.innerWidth < 700 ? 32 : 58;

    for (let index = 0; index < count; index += 1) {
      const particleLife = rand(2.7, 4.6);

      particles.push({
        x: rand(fx.width * 0.08, fx.width * 0.92),
        y: rand(-fx.height * 0.22, -20),
        previousX: 0,
        previousY: 0,
        vx: rand(-25, 25),
        vy: rand(60, 145),
        gravity: rand(22, 44),
        drag: 0.998,
        size: rand(4, 8),
        life: particleLife,
        maxLife: particleLife,
        color: pick(colors),
        shape: "confetti",
        rotation: rand(0, TAU),
        spin: rand(-8, 8),
      });
    }

    ensureFxLoop();
  }

  function paintFx(now) {
    if (!fx) return;

    const { context, width, height } = fx;
    const delta = lastFxTime ? Math.min((now - lastFxTime) / 1000, 0.04) : 0.016;
    lastFxTime = now;

    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= delta;

      if (particle.life <= 0 || particle.y > height + 60) {
        particles.splice(index, 1);
        continue;
      }

      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.vy += particle.gravity * delta;
      particle.vx *= particle.drag;
      particle.vy *= particle.drag;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.spin * delta;

      const progress = particle.life / particle.maxLife;
      const alpha = clamp(progress < 0.14 ? progress / 0.14 : progress, 0, 1);

      if (particle.shape === "confetti") {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.globalAlpha = alpha * 0.9;
        context.fillStyle = `rgb(${particle.color})`;
        context.fillRect(-particle.size * 0.42, -particle.size * 0.75, particle.size * 0.84, particle.size * 1.5);
        context.restore();
      } else {
        context.beginPath();
        context.moveTo(particle.previousX, particle.previousY);
        context.lineTo(particle.x, particle.y);
        context.strokeStyle = `rgba(${particle.color}, ${alpha})`;
        context.lineWidth = particle.size * 0.8;
        context.lineCap = "round";
        context.stroke();

        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * 0.44, 0, TAU);
        context.fillStyle = `rgba(${particle.color}, ${alpha})`;
        context.fill();
      }
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";

    if (particles.length > 0) {
      fxFrameId = requestAnimationFrame(paintFx);
    } else {
      fxFrameId = null;
      lastFxTime = 0;
    }
  }

  function ensureFxLoop() {
    if (fxFrameId === null) {
      lastFxTime = 0;
      fxFrameId = requestAnimationFrame(paintFx);
    }
  }

  function launchCelebration() {
    if (reduceMotion.matches) return;

    const scene = $(".cake-scene");
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.36;

    addBurst(centerX - rect.width * 0.22, centerY + rect.height * 0.02, {
      count: window.innerWidth < 700 ? 34 : 52,
      speed: window.innerWidth < 700 ? 210 : 285,
      life: [0.8, 1.6],
    });

    celebrationTimers.push(
      window.setTimeout(() => {
        addBurst(centerX + rect.width * 0.2, centerY - rect.height * 0.02, {
          count: window.innerWidth < 700 ? 30 : 48,
          speed: window.innerWidth < 700 ? 200 : 270,
          life: [0.8, 1.55],
        });
      }, 280)
    );

    celebrationTimers.push(
      window.setTimeout(() => {
        addBurst(centerX, centerY - rect.height * 0.12, {
          count: window.innerWidth < 700 ? 38 : 58,
          speed: window.innerWidth < 700 ? 230 : 315,
          life: [0.9, 1.7],
          colors: ["247, 235, 217", "243, 219, 169", "229, 177, 167", "255, 250, 239"],
        });
        addConfetti();
      }, 620)
    );
  }

  function clearCelebrationTimers() {
    celebrationTimers.forEach((timer) => window.clearTimeout(timer));
    celebrationTimers = [];
  }

  /* -------------------------------------------------------
     A small, imperfect music box
     ------------------------------------------------------- */

  const AudioEngine = (() => {
    const STEP = 0.62;
    const LOOKAHEAD = 0.36;
    const note = {
      D4: 293.66,
      E4: 329.63,
      Fs4: 369.99,
      G4: 392.0,
      A4: 440.0,
      B4: 493.88,
      Cs5: 554.37,
      D5: 587.33,
      E5: 659.25,
      Fs5: 739.99,
      A5: 880.0,
      B5: 987.77,
    };

    const melody = [
      note.D5, note.A4, note.Fs5, note.E5, note.D5, note.B4, note.A4, note.Fs4,
      note.G4, note.B4, note.D5, note.Fs5, note.E5, note.Cs5, note.A4, note.E4,
      note.Fs5, note.D5, note.A4, note.Fs4, note.B4, note.D5, note.E5, note.Fs5,
      note.A5, note.Fs5, note.E5, note.Cs5, note.B4, note.A4, note.Fs4, note.D4,
    ];

    const roots = [146.83, 123.47, 98.0, 110.0];

    let context = null;
    let master = null;
    let noteBus = null;
    let timer = null;
    let suspendTimer = null;
    let nextNoteTime = 0;
    let step = 0;
    let playing = false;

    function createImpulse() {
      const duration = 2.8;
      const length = Math.floor(context.sampleRate * duration);
      const buffer = context.createBuffer(2, length, context.sampleRate);

      for (let channel = 0; channel < 2; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < length; i += 1) {
          const decay = Math.pow(1 - i / length, 2.8);
          data[i] = (Math.random() * 2 - 1) * decay * 0.72;
        }
      }

      return buffer;
    }

    function init() {
      if (context) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is unavailable.");

      context = new AudioContextClass();

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.4;

      master = context.createGain();
      master.gain.value = 0.0001;
      master.connect(compressor);
      compressor.connect(context.destination);

      const reverb = context.createConvolver();
      reverb.buffer = createImpulse();

      const reverbGain = context.createGain();
      reverbGain.gain.value = 0.32;
      reverb.connect(reverbGain);
      reverbGain.connect(master);

      const dryGain = context.createGain();
      dryGain.gain.value = 0.74;
      dryGain.connect(master);

      const delay = context.createDelay(1.2);
      delay.delayTime.value = 0.46;
      const feedback = context.createGain();
      feedback.gain.value = 0.25;
      const delayGain = context.createGain();
      delayGain.gain.value = 0.16;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(master);

      noteBus = context.createGain();
      noteBus.gain.value = 0.84;
      noteBus.connect(dryGain);
      noteBus.connect(reverb);
      noteBus.connect(delay);
    }

    function playNote(frequency, when, duration = 1.9, volume = 0.055) {
      if (!context || !noteBus) return;

      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.linearRampToValueAtTime(volume, when + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(4200, when);
      filter.Q.value = 0.7;

      const partials = [
        { ratio: 1, gain: 1 },
        { ratio: 2.005, gain: 0.16 },
        { ratio: 2.76, gain: 0.045 },
      ];

      partials.forEach((partial) => {
        const oscillator = context.createOscillator();
        const partialGain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency * partial.ratio, when);
        partialGain.gain.value = partial.gain;
        oscillator.connect(partialGain);
        partialGain.connect(filter);
        oscillator.start(when);
        oscillator.stop(when + duration + 0.08);
      });

      filter.connect(envelope);
      envelope.connect(noteBus);
    }

    function playPad(frequency, when, duration = 5) {
      if (!context || !noteBus) return;

      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.linearRampToValueAtTime(0.014, when + 1.1);
      envelope.gain.setValueAtTime(0.014, when + duration * 0.55);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 520;
      filter.Q.value = 0.4;

      [0.996, 1.004].forEach((detuneRatio) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency * detuneRatio;
        oscillator.connect(filter);
        oscillator.start(when);
        oscillator.stop(when + duration + 0.1);
      });

      filter.connect(envelope);
      envelope.connect(noteBus);
    }

    function scheduler() {
      if (!context || !playing) return;

      while (nextNoteTime < context.currentTime + LOOKAHEAD) {
        const noteIndex = step % melody.length;

        playNote(melody[noteIndex], nextNoteTime, rand(1.7, 2.2), rand(0.042, 0.06));

        if (step % 8 === 0) {
          playPad(roots[Math.floor(step / 8) % roots.length], nextNoteTime, 4.8);
        }

        if (step % 8 === 3) {
          playNote(melody[noteIndex] * 2, nextNoteTime + STEP * 0.48, 1.8, 0.016);
        }

        nextNoteTime += STEP;
        step += 1;
      }
    }

    async function start() {
      init();

      if (suspendTimer) {
        window.clearTimeout(suspendTimer);
        suspendTimer = null;
      }

      if (context.state === "suspended") {
        await context.resume();
      }

      playing = true;
      nextNoteTime = context.currentTime + 0.14;
      step = 0;

      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.55, now + 1.3);

      window.clearInterval(timer);
      timer = window.setInterval(scheduler, 130);
      scheduler();
    }

    function stop() {
      playing = false;
      window.clearInterval(timer);
      timer = null;

      if (context && master) {
        const now = context.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        suspendTimer = window.setTimeout(() => {
          if (context && !playing) context.suspend();
          suspendTimer = null;
        }, 950);
      }
    }

    async function toggle() {
      if (playing) {
        stop();
        return false;
      }

      await start();
      return true;
    }

    function chime() {
      if (!context || !playing) return;

      const now = context.currentTime + 0.03;
      [587.33, 739.99, 880.0, 1174.66].forEach((frequency, index) => {
        playNote(frequency, now + index * 0.095, 2.35, 0.034);
      });
    }

    return {
      toggle,
      chime,
      isPlaying: () => playing,
    };
  })();

  /* -------------------------------------------------------
     Interface
     ------------------------------------------------------- */

  const cakeScene = $(".cake-scene");
  const cakeSvg = $(".cake-svg");
  const cakeParallax = $(".cake-parallax");
  const wishCard = $(".wish-card");
  const wishButton = $("#wish-btn");
  const wishLabel = $(".wish-btn__label");
  const wishSecret = $("#wish-secret");
  const wishHint = $("#wish-hint");
  const soundToggle = $("#sound-toggle");
  const soundLabel = $(".sound-toggle__label");
  const secretMarkup = wishSecret ? wishSecret.innerHTML : "";
  const originalHint = wishHint ? wishHint.textContent : "";
  let isBlown = false;
  let pointerFrame = null;
  let pointerX = 0;
  let pointerY = 0;

  if (wishSecret) wishSecret.innerHTML = "";

  function setSoundUI(isPlaying) {
    if (!soundToggle) return;
    soundToggle.classList.toggle("is-playing", isPlaying);
    soundToggle.setAttribute("aria-pressed", String(isPlaying));
    soundToggle.setAttribute("aria-label", isPlaying ? "关闭背景音乐" : "开启背景音乐");

    if (soundLabel) {
      soundLabel.textContent = isPlaying ? "静音" : "音乐";
    }
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", async () => {
      soundToggle.setAttribute("aria-busy", "true");

      try {
        const isPlaying = await AudioEngine.toggle();
        setSoundUI(isPlaying);
      } catch (error) {
        soundToggle.setAttribute("aria-label", "背景音乐暂时不可用");
        if (soundLabel) soundLabel.textContent = "音乐";
      } finally {
        soundToggle.removeAttribute("aria-busy");
      }
    });
  }

  function blowOutCandles() {
    if (!cakeSvg || !wishButton) return;

    isBlown = true;
    clearCelebrationTimers();

    cakeSvg.classList.add("is-blown");
    cakeScene.classList.add("is-wished");
    wishCard.classList.add("is-wished");

    if (wishLabel) wishLabel.textContent = "再许一次 · 重新点亮";
    wishButton.setAttribute("aria-label", "重新点亮蜡烛，再许一次愿");

    if (wishSecret) wishSecret.innerHTML = secretMarkup;
    if (wishHint) wishHint.textContent = "愿望已经收好，再点一次让烛光重新亮起";

    AudioEngine.chime();

    const buttonRect = wishButton.getBoundingClientRect();
    addBurst(buttonRect.left + buttonRect.width / 2, buttonRect.top + buttonRect.height / 2, {
      count: 22,
      speed: 120,
      gravity: 90,
      life: [0.55, 1.1],
      size: [0.8, 2],
    });

    celebrationTimers.push(window.setTimeout(launchCelebration, 360));
  }

  function relightCandles() {
    if (!cakeSvg || !wishButton) return;

    isBlown = false;
    clearCelebrationTimers();

    cakeSvg.classList.remove("is-blown");
    cakeScene.classList.remove("is-wished");
    wishCard.classList.remove("is-wished");

    if (wishLabel) wishLabel.textContent = "许个愿 · 吹蜡烛";
    wishButton.setAttribute("aria-label", "吹灭蜡烛，许一个生日愿望");

    if (wishSecret) wishSecret.innerHTML = "";
    if (wishHint) wishHint.textContent = originalHint;
  }

  if (wishButton) {
    wishButton.addEventListener("click", () => {
      if (isBlown) {
        relightCandles();
      } else {
        blowOutCandles();
      }
    });
  }

  if (cakeSvg) {
    cakeSvg.addEventListener("click", (event) => {
      if (reduceMotion.matches) return;

      addBurst(event.clientX, event.clientY, {
        count: 16,
        speed: 125,
        gravity: 120,
        life: [0.5, 1.05],
        size: [0.7, 1.8],
        colors: ["246, 220, 170", "247, 237, 225", "226, 178, 110"],
      });
    });
  }

  /* gentle pointer parallax, only where a real cursor exists */
  const finePointer = window.matchMedia("(pointer: fine)");

  if (cakeParallax && finePointer.matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (pointerFrame !== null) return;

        pointerFrame = requestAnimationFrame(() => {
          const x = (pointerX / window.innerWidth - 0.5) * 18;
          const y = (pointerY / window.innerHeight - 0.5) * 12;
          cakeParallax.style.setProperty("--parallax-x", `${x.toFixed(2)}px`);
          cakeParallax.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
          pointerFrame = null;
        });
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => {
      cakeParallax.style.setProperty("--parallax-x", "0px");
      cakeParallax.style.setProperty("--parallax-y", "0px");
    });
  }

  /* pause the ambient animation while the tab is hidden */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && ambientFrameId === null && !reduceMotion.matches) {
      lastAmbientTime = 0;
      ambientFrameId = requestAnimationFrame(ambientLoop);
    }
  });

  reduceMotion.addEventListener("change", () => {
    startAmbient();
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      buildAmbient();
      resizeFx();
      if (reduceMotion.matches) {
        paintAmbient(performance.now(), 0);
      }
    }, 180);
  });

  /* -------------------------------------------------------
     Start
     ------------------------------------------------------- */

  resizeFx();
  buildAmbient();
  startAmbient();
})();
