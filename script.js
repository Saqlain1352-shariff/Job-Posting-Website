/**
 * script.js — Projkeez Group Internship 2025
 * ─────────────────────────────────────────────
 * Sections:
 *  1. Custom Cursor
 *  2. Background Particle Canvas
 *  3. Navigation (scroll shrink + mobile menu)
 *  4. Scroll Reveal (IntersectionObserver)
 *  5. Smooth Scroll for anchor links
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   1. CUSTOM CURSOR
   ════════════════════════════════════════════════════════════ */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const dot    = document.getElementById('cursor-dot');

  if (!cursor || !dot) return;

  // Skip on touch-only devices
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  /** Linear interpolation helper */
  const lerp = (a, b, t) => a + (b - a) * t;

  // Dot tracks mouse exactly
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Ring follows with smooth lag
  function animateCursor() {
    cursorX = lerp(cursorX, mouseX, 0.12);
    cursorY = lerp(cursorY, mouseY, 0.12);
    cursor.style.left = cursorX + 'px';
    cursor.style.top  = cursorY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Expand cursor on interactive elements
  const hoverTargets = document.querySelectorAll('a, button, .role-card, .benefit-card');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });
})();


/* ════════════════════════════════════════════════════════════
   2. BACKGROUND PARTICLE CANVAS
   ════════════════════════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const PARTICLE_COUNT  = 45;
  const CONNECTION_DIST = 150;
  const ACCENT_RGB      = '123,47,190';

  let particles = [];

  /** Resize canvas to viewport */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /** Create particles */
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 2 + 0.5,
      dx:      (Math.random() - 0.5) * 0.4,
      dy:      (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.1,
    });
  }

  /** Animation loop */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw & move each particle
    particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;

      // Wrap around edges
      if (p.x < 0)             p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0)             p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT_RGB},${p.opacity})`;
      ctx.fill();
    });

    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const alpha = 0.06 * (1 - dist / CONNECTION_DIST);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${ACCENT_RGB},${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();


/* ════════════════════════════════════════════════════════════
   3. NAVIGATION
   ════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav           = document.querySelector('.nav');
  const mobileBtn     = document.querySelector('.mobile-menu-btn');
  const mobileOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileLinks   = document.querySelectorAll('.mobile-nav-links a');

  if (!nav) return;

  // ── Scroll-shrink effect ──
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // ── Mobile menu toggle ──
  if (mobileBtn && mobileOverlay) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mobileBtn.classList.toggle('open');
      mobileOverlay.classList.toggle('open', isOpen);
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
      mobileOverlay.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close overlay when a link is tapped
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileBtn.classList.remove('open');
        mobileOverlay.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileBtn.classList.contains('open')) {
        mobileBtn.classList.remove('open');
        mobileOverlay.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }
})();


/* ════════════════════════════════════════════════════════════
   4. SCROLL REVEAL  (IntersectionObserver)
   ════════════════════════════════════════════════════════════ */
(function initScrollReveal() {
  // Respect reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observerConfig = {
    threshold:  0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // fire once
      }
    });
  }, observerConfig);

  const targets = document.querySelectorAll(
    '.benefit-card, .role-card, .detail-box, .diff-card, .about-feature'
  );

  targets.forEach((el) => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
})();


/* ════════════════════════════════════════════════════════════
   5. SMOOTH SCROLL FOR ANCHOR LINKS
   ════════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      // Account for fixed nav height
      const navHeight = document.querySelector('.nav')?.offsetHeight ?? 80;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();
