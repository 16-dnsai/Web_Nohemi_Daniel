/* ═══════════════════════════════════════════════════
   DANIEL & NOHEMI — interacciones
   ═══════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* Modo de previsualización estática: index.html?static */
  if (new URLSearchParams(window.location.search).has('static')) {
    document.documentElement.classList.add('static');
  }

  /* ───────── Fotos: si falta el archivo, se muestra el marco vacío ───────── */
  document.querySelectorAll('.frame img').forEach((img) => {
    const frame = img.closest('.frame');
    if (!frame) return;

    const markEmpty = () => frame.classList.add('is-empty');
    const markReady = () => frame.classList.remove('is-empty');

    img.addEventListener('load', markReady);
    img.addEventListener('error', markEmpty);

    if (img.complete) {
      if (img.naturalWidth > 0) markReady();
      else markEmpty();
    }
  });

  /* ───────── Reveals al hacer scroll ───────── */
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealItems.forEach((el, i) => {
      // pequeño escalonado dentro de una misma sección
      el.style.transitionDelay = `${(i % 4) * 0.08}s`;
      io.observe(el);
    });

    // lo que ya está en pantalla al cargar
    requestAnimationFrame(() => {
      revealItems.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) el.classList.add('is-in');
      });
    });
  } else {
    revealItems.forEach((el) => el.classList.add('is-in'));
  }

  /* ───────── Días desde el 17 de julio de 2026 ───────── */
  const daysEl = document.querySelector('[data-days]');
  if (daysEl) {
    const start = new Date(2026, 6, 17, 0, 0, 0); // 17 · 07 · 2026
    const today = new Date();
    const diff = Math.floor((today.setHours(0, 0, 0, 0) - start) / 86400000);
    daysEl.textContent = Math.max(0, diff).toLocaleString('es-ES');
  }

  /* ───────── Ecualizador decorativo ───────── */
  const eq = document.querySelector('[data-eq]');
  if (eq) {
    const bars = 34;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < bars; i++) {
      const bar = document.createElement('span');
      const wave = Math.abs(Math.sin(i * 0.55)) * 66 + 24;
      bar.style.setProperty('--h', wave.toFixed(0));
      bar.style.setProperty('--d', `${((i * 97) % 700) / 1000}s`);
      frag.appendChild(bar);
    }
    eq.appendChild(frag);
  }

  /* ───────── Música de fondo ───────── */
  const audio = document.getElementById('bgmusic');
  const toggles = document.querySelectorAll('[data-music-toggle]');
  const note = document.querySelector('[data-audio-note]');
  const progress = document.querySelector('[data-progress]');
  const TARGET_VOLUME = 0.45;

  let musicOn = false;
  let videoPausedMusic = false;
  let volumeTimer = null;

  const setMusicUI = (on) => {
    musicOn = on;
    document.body.classList.toggle('is-playing', on);
    toggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Pausar música de fondo' : 'Reproducir música de fondo');
    });
  };

  const fadeVolume = (to) => {
    if (!audio) return;
    clearInterval(volumeTimer);
    const step = 0.04;
    volumeTimer = setInterval(() => {
      const next = audio.volume + (to > audio.volume ? step : -step);
      if ((to > audio.volume && next >= to) || (to < audio.volume && next <= to)) {
        audio.volume = to;
        clearInterval(volumeTimer);
      } else {
        audio.volume = Math.min(1, Math.max(0, next));
      }
    }, 60);
  };

  const showAudioNote = () => {
    if (note) note.hidden = false;
    setMusicUI(false);
  };

  const playMusic = () => {
    if (!audio) return;
    audio.volume = 0;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        setMusicUI(true);
        fadeVolume(TARGET_VOLUME);
        if (note) note.hidden = true;
      }).catch(() => {
        setMusicUI(false);
      });
    }
  };

  const pauseMusic = () => {
    if (!audio) return;
    fadeVolume(0);
    setTimeout(() => audio.pause(), 220);
    setMusicUI(false);
  };

  if (audio) {
    audio.addEventListener('error', showAudioNote);
    audio.addEventListener('timeupdate', () => {
      if (!progress) return;
      const d = audio.duration;
      if (d && isFinite(d)) {
        progress.style.transform = `scaleX(${Math.min(1, audio.currentTime / d)})`;
      }
    });
  }

  toggles.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (musicOn) pauseMusic();
      else playMusic();
    });
  });

  /* Intento de autoplay; si el navegador lo bloquea, arranca con el primer toque */
  playMusic();
  const startOnGesture = () => {
    if (!musicOn) playMusic();
    window.removeEventListener('pointerdown', startOnGesture);
  };
  window.addEventListener('pointerdown', startOnGesture);

  /* ───────── Videos ───────── */
  const videoWraps = document.querySelectorAll('[data-media="video"]');

  videoWraps.forEach((wrap) => {
    const video = wrap.querySelector('video');
    const btn = wrap.querySelector('.video-play');
    if (!video) return;

    let ready = false;

    const markReady = () => {
      if (ready) return;
      ready = true;
      wrap.classList.add('has-media');
    };

    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('loadeddata', markReady);
    video.addEventListener('canplay', markReady);
    video.addEventListener('error', () => {
      ready = false;
      wrap.classList.remove('has-media');
    });

    if (video.readyState >= 1) markReady();

    const startVideo = () => {
      if (!ready) return;
      if (musicOn) {
        videoPausedMusic = true;
        pauseMusic();
      }
      video.muted = false;
      video.play().catch(() => {});
    };

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      startVideo();
    });

    wrap.addEventListener('click', () => {
      if (!ready) return;
      if (video.paused) startVideo();
      else video.pause();
    });

    video.addEventListener('play', () => wrap.classList.add('is-playing'));
    video.addEventListener('pause', () => {
      wrap.classList.remove('is-playing');
      if (videoPausedMusic && !document.querySelector('.video-wrap.is-playing')) {
        videoPausedMusic = false;
        playMusic();
      }
    });
    video.addEventListener('ended', () => wrap.classList.remove('is-playing'));
  });
})();
