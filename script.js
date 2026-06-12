/* ======================================================
   DALA'S BIRTHDAY — CINEMATIC TRIBUTE
   Three.js scenes + UI interactions
   ====================================================== */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const PALETTE = {
    gold: 0xd4af6a,
    goldBright: 0xf4d99b,
    orange: 0xff8c42,
    deepBlue: 0x0f2440,
    white: 0xf5f3ee
  };

  /* ---------------------------------------------------
     CUSTOM CURSOR
  --------------------------------------------------- */
  function initCursor() {
    if (isTouch) return;
    const cursor = document.getElementById('cursor');
    const dot = document.getElementById('cursorDot');
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let dx = cx, dy = cy;

    window.addEventListener('mousemove', (e) => {
      cx = e.clientX; cy = e.clientY;
      dot.style.left = cx + 'px';
      dot.style.top = cy + 'px';
    });

    function loop() {
      dx += (cx - dx) * 0.18;
      dy += (cy - dy) * 0.18;
      cursor.style.left = dx + 'px';
      cursor.style.top = dy + 'px';
      requestAnimationFrame(loop);
    }
    loop();

    const hoverables = 'a, button, .timeline-card, .poster, .reel-frame, .galaxy-quote-box';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add('hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove('hover');
    });
  }

  /* ---------------------------------------------------
     LOADER
  --------------------------------------------------- */
  function initLoader(onDone) {
    const loader = document.getElementById('loader');
    const pct = document.getElementById('loaderPct');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        pct.textContent = `LOADING — 100%`;
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('hidden');
          onDone();
        }, 350);
        return;
      }
      pct.textContent = `LOADING — ${Math.floor(p)}%`;
    }, 160);
  }

  /* ---------------------------------------------------
     INTRO -> MAIN TRANSITION
  --------------------------------------------------- */
  function initIntro() {
    const intro = document.getElementById('intro');
    const app = document.getElementById('app');

    // Lightweight particle field for intro
    let scene, camera, renderer, particles;
    const canvas = document.getElementById('intro-canvas');
    if (window.THREE && canvas) {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const count = isTouch ? 600 : 1400;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: PALETTE.gold, size: 0.5, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      particles = new THREE.Points(geo, mat);
      scene.add(particles);

      let raf;
      function animate() {
        raf = requestAnimationFrame(animate);
        particles.rotation.y += 0.0006;
        particles.rotation.x += 0.0002;
        renderer.render(scene, camera);
      }
      if (!reduceMotion) animate();
      else renderer.render(scene, camera);

      window.addEventListener('resize', () => {
        if (!renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // store cleanup
      window.__introCleanup = () => {
        cancelAnimationFrame(raf);
        renderer.dispose();
      };
    }

    setTimeout(() => {
      intro.classList.add('hidden');
      app.classList.add('visible');
      if (window.__introCleanup) setTimeout(window.__introCleanup, 1500);
      startTypewriters();
      revealOnScroll();
    }, 3000);
  }

  /* ---------------------------------------------------
     HERO 3D SCENE
  --------------------------------------------------- */
  function initHeroScene() {
    const canvas = document.getElementById('hero-canvas');
    if (!window.THREE || !canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.012);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 26);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting — warm golden cinematic
    const ambient = new THREE.AmbientLight(0x10203a, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(PALETTE.orange, 2.2, 100);
    keyLight.position.set(15, 10, 15);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(PALETTE.gold, 1.6, 100);
    rimLight.position.set(-15, -5, 10);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x6699ff, 0.6, 100);
    fillLight.position.set(0, -10, -10);
    scene.add(fillLight);

    // Starfield background
    const starGeo = new THREE.BufferGeometry();
    const starCount = isTouch ? 500 : 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 160;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 160;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 160 - 30;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: PALETTE.white, size: 0.25, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---- Helper: simple group object factory ----
    const objects = [];

    function addObject(group, opts) {
      group.userData.float = {
        speed: opts.speed || 0.4,
        amp: opts.amp || 1.5,
        offset: Math.random() * Math.PI * 2,
        rotSpeed: opts.rotSpeed || 0.005
      };
      group.position.set(opts.x, opts.y, opts.z);
      group.scale.setScalar(opts.scale || 1);
      scene.add(group);
      objects.push(group);
      return group;
    }

    // --- Coffee Cup ---
    function makeCoffeeCup() {
      const g = new THREE.Group();
      const cupMat = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.35, metalness: 0.1 });
      const liquidMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.3 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.4, 24), cupMat);
      g.add(body);
      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.15, 24), liquidMat);
      liquid.position.y = 0.65;
      g.add(liquid);
      const handleGeo = new THREE.TorusGeometry(0.5, 0.12, 8, 24, Math.PI * 1.4);
      const handle = new THREE.Mesh(handleGeo, cupMat);
      handle.position.set(1.0, 0, 0);
      handle.rotation.z = Math.PI / 2;
      handle.rotation.y = Math.PI/2;
      g.add(handle);
      // steam
      for (let i = 0; i < 3; i++) {
        const steam = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.04, 6, 12, Math.PI * 1.5),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
        );
        steam.position.set((i - 1) * 0.25, 1.1 + i * 0.35, 0);
        steam.rotation.x = Math.PI / 2;
        g.add(steam);
      }
      return g;
    }

    // --- Tea Glass ---
    function makeTeaGlass() {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.85, transparent: true, opacity: 0.35, thickness: 0.3 });
      const teaMat = new THREE.MeshStandardMaterial({ color: 0xc77b3b, roughness: 0.2, emissive: 0x4a2a0a, emissiveIntensity: 0.3 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.6, 20, 1, true), glassMat);
      g.add(body);
      const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 1.1, 20), teaMat);
      tea.position.y = -0.15;
      g.add(tea);
      return g;
    }

    // --- Coca-Cola Bottle ---
    function makeColaBottle() {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x2b0a0a, roughness: 0.15, transmission: 0.4, transparent: true, opacity: 0.85, emissive: 0x3a0d0d, emissiveIntensity: 0.2 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.8, 16), glassMat);
      g.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 0.7, 16), glassMat);
      neck.position.y = 1.25;
      g.add(neck);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), new THREE.MeshStandardMaterial({ color: PALETTE.gold, metalness: 0.7, roughness: 0.3 }));
      cap.position.y = 1.65;
      g.add(cap);
      const labelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.6, 16, 1, true), labelMat);
      label.material.transparent = true; label.material.opacity = 0.9;
      label.position.y = -0.1;
      g.add(label);
      return g;
    }

    // --- Film Reel ---
    function makeFilmReel() {
      const g = new THREE.Group();
      const reelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 });
      const goldMat = new THREE.MeshStandardMaterial({ color: PALETTE.gold, metalness: 0.7, roughness: 0.25, emissive: PALETTE.gold, emissiveIntensity: 0.15 });
      const outer = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 12, 36), goldMat);
      g.add(outer);
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16), goldMat);
      center.rotation.x = Math.PI / 2;
      g.add(center);
      // spokes
      for (let i = 0; i < 3; i++) {
        const spoke = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 8, 6, Math.PI * 0.5), reelMat);
        spoke.rotation.z = (i / 3) * Math.PI * 2;
        g.add(spoke);
        const hole = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), reelMat);
        const ang = (i / 3) * Math.PI * 2;
        hole.position.set(Math.cos(ang) * 0.85, Math.sin(ang) * 0.85, 0);
        g.add(hole);
      }
      return g;
    }

    // --- Movie Clapperboard ---
    function makeClapperboard() {
      const g = new THREE.Group();
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
      const stripeMat = new THREE.MeshStandardMaterial({ color: PALETTE.goldBright, roughness: 0.4, emissive: PALETTE.gold, emissiveIntensity: 0.1 });
      const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.7, 0.15), blackMat);
      g.add(board);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.18), blackMat);
      top.position.set(0, 0.95, 0.05);
      top.rotation.z = -0.18;
      g.add(top);
      // stripes on the clapper bar
      for (let i = -2; i <= 2; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), i % 2 === 0 ? stripeMat : blackMat);
        stripe.position.set(i * 0.45, 0.95, 0.06);
        stripe.rotation.z = -0.18;
        g.add(stripe);
      }
      return g;
    }

    // --- Floating Star ---
    function makeStar() {
      const starShape = new THREE.Shape();
      const points = 5, outerR = 0.6, innerR = 0.25;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
        if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
      }
      starShape.closePath();
      const geo = new THREE.ExtrudeGeometry(starShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
      const mat = new THREE.MeshStandardMaterial({ color: PALETTE.goldBright, emissive: PALETTE.gold, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 });
      return new THREE.Mesh(geo, mat);
    }

    // Populate scene
    const isMobile = window.innerWidth < 760;
    const spread = isMobile ? 9 : 16;

    addObject(makeCoffeeCup(), { x: -spread, y: 4, z: -2, scale: 1.1, speed: 0.4, amp: 1.2 });
    addObject(makeTeaGlass(), { x: spread * 0.8, y: -3, z: -4, scale: 1.2, speed: 0.5, amp: 1.6 });
    addObject(makeColaBottle(), { x: -spread * 0.7, y: -5, z: 2, scale: 1, speed: 0.35, amp: 1.4 });
    addObject(makeFilmReel(), { x: spread, y: 5, z: -6, scale: 1.3, speed: 0.3, amp: 1.0, rotSpeed: 0.01 });
    addObject(makeClapperboard(), { x: 0, y: -7, z: -8, scale: 1.1, speed: 0.45, amp: 1.3 });

    const starCount2 = isMobile ? 6 : 10;
    for (let i = 0; i < starCount2; i++) {
      const s = makeStar();
      const ang = (i / starCount2) * Math.PI * 2;
      addObject(s, {
        x: Math.cos(ang) * (spread + 4) * (0.5 + Math.random() * 0.6),
        y: Math.sin(ang) * (spread * 0.6) * (0.5 + Math.random() * 0.6) + (Math.random() - 0.5) * 4,
        z: -10 - Math.random() * 10,
        scale: 0.5 + Math.random() * 0.7,
        speed: 0.3 + Math.random() * 0.4,
        amp: 0.8 + Math.random() * 1,
        rotSpeed: 0.01 + Math.random() * 0.02
      });
    }

    // Mouse parallax
    let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    const clock = new THREE.Clock();
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      objects.forEach((obj) => {
        const f = obj.userData.float;
        obj.position.y += Math.sin(t * f.speed + f.offset) * 0.003 * f.amp;
        obj.rotation.y += f.rotSpeed;
        obj.rotation.x += f.rotSpeed * 0.4;
      });

      stars.rotation.y += 0.0002;

      targetRotX += (mouseY * 0.15 - targetRotX) * 0.04;
      targetRotY += (mouseX * 0.15 - targetRotY) * 0.04;
      camera.position.x = targetRotY * 4;
      camera.position.y = -targetRotX * 4;
      camera.lookAt(0, 0, 0);

      keyLight.intensity = 2.0 + Math.sin(t * 1.2) * 0.4;

      renderer.render(scene, camera);
    }
    if (!reduceMotion) animate(); else renderer.render(scene, camera);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ---------------------------------------------------
     TYPEWRITER MESSAGE
  --------------------------------------------------- */
  function startTypewriters() {
    const lines = [
      { el: document.getElementById('msgLine1'), text: 'Dala, thanks for the happiest days you gave me when my world is darker every day.' },
      { el: document.getElementById('msgLine2'), text: 'You were there in the laughter, in the tea breaks, in the movie discussions, in the random conversations, and in the moments when life felt heavy.' },
      { el: document.getElementById('msgLine3'), text: 'Some friendships are temporary, but ours became a part of my story.' }
    ];

    let triggered = false;
    function trigger() {
      if (triggered) return;
      const rect = lines[0].el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8) {
        triggered = true;
        runSequential(0);
      }
    }

    function runSequential(idx) {
      if (idx >= lines.length) return;
      const { el, text } = lines[idx];
      const cursorSpan = document.createElement('span');
      cursorSpan.className = 'typed-cursor';
      let i = 0;
      el.textContent = '';
      el.appendChild(cursorSpan);

      if (reduceMotion) {
        el.textContent = text;
        runSequential(idx + 1);
        return;
      }

      function typeChar() {
        if (i < text.length) {
          el.textContent = text.slice(0, i + 1);
          el.appendChild(cursorSpan);
          i++;
          setTimeout(typeChar, 22 + Math.random() * 18);
        } else {
          setTimeout(() => {
            cursorSpan.remove();
            runSequential(idx + 1);
          }, 500);
        }
      }
      typeChar();
    }

    window.addEventListener('scroll', trigger, { passive: true });
    trigger();
  }

  /* ---------------------------------------------------
     SCROLL REVEAL (timeline cards, section labels, final lines)
  --------------------------------------------------- */
  function revealOnScroll() {
    const targets = document.querySelectorAll('.timeline-card, .section-label, .final-line, .final-title, .final-signature');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => entry.target.classList.add('in-view'), delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    targets.forEach((el, i) => {
      if (el.classList.contains('final-line')) el.dataset.delay = (i % 5) * 150;
      obs.observe(el);
    });
  }

  /* ---------------------------------------------------
     FILM STRIP SCROLL PARALLAX
  --------------------------------------------------- */
  function initFilmstrip() {
    const strips = document.querySelectorAll('.filmstrip');
    if (!strips.length || reduceMotion) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      strips.forEach((s, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        s.style.transform = `translateX(${(y * 0.15 * dir) % 1000}px)`;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------
     MEMORY GALAXY (interactive starfield)
  --------------------------------------------------- */
  function initGalaxy() {
    const canvas = document.getElementById('galaxy-canvas');
    if (!window.THREE || !canvas) return;
    const section = document.getElementById('galaxy');
    const quoteBox = document.getElementById('galaxyQuoteBox');
    const quoteText = document.getElementById('galaxyQuoteText');

    const quotes = [
      "Good friends make ordinary days unforgettable.",
      "Some people become family without sharing blood.",
      "The best stories are lived, not watched.",
      "A great friendship needs no occasion to feel like a celebration.",
      "Distance means nothing when someone means everything.",
      "Here's to the nights that turned into stories, and the friend who was in all of them."
    ];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Background dust
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = isTouch ? 400 : 900;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 100;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.12, transparent: true, opacity: 0.4 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Interactive bright stars
    const interactiveStars = [];
    const starGeo = new THREE.SphereGeometry(0.35, 12, 12);
    for (let i = 0; i < quotes.length; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: PALETTE.goldBright });
      const star = new THREE.Mesh(starGeo, mat);
      const ang = (i / quotes.length) * Math.PI * 2;
      const r = 8 + Math.random() * 6;
      star.position.set(Math.cos(ang) * r, Math.sin(ang) * r * 0.6 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6);
      star.userData.quote = quotes[i];
      star.userData.baseScale = 1;
      // glow halo
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 12, 12),
        new THREE.MeshBasicMaterial({ color: PALETTE.gold, transparent: true, opacity: 0.18 })
      );
      star.add(glow);
      scene.add(star);
      interactiveStars.push(star);
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveStars);
      if (hits.length) {
        showQuote(hits[0].object.userData.quote);
      }
    }

    canvas.addEventListener('click', (e) => onPointer(e.clientX, e.clientY));
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    let hideTimeout;
    function showQuote(text) {
      quoteText.textContent = `"${text}"`;
      quoteBox.classList.add('show');
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => quoteBox.classList.remove('show'), 4500);
    }
    quoteBox.addEventListener('click', () => quoteBox.classList.remove('show'));

    const clock = new THREE.Clock();
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      dust.rotation.y += 0.0003;
      interactiveStars.forEach((s, i) => {
        const pulse = 1 + Math.sin(t * 1.5 + i) * 0.25;
        s.scale.setScalar(pulse);
      });
      renderer.render(scene, camera);
    }
    if (!reduceMotion) animate(); else renderer.render(scene, camera);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ---------------------------------------------------
     BIRTHDAY CAKE SCENE
  --------------------------------------------------- */
  function initCake() {
    const canvas = document.getElementById('cake-canvas');
    if (!window.THREE || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 11);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambient = new THREE.AmbientLight(0x303050, 1);
    scene.add(ambient);
    const top = new THREE.PointLight(0xffd9a0, 1.5, 50);
    top.position.set(0, 8, 5);
    scene.add(top);

    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // Tiers
    const tierMats = [
      new THREE.MeshStandardMaterial({ color: 0x2c1f3d, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0x3d2a55, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0xf4d99b, roughness: 0.4 })
    ];
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 1.2, 32), tierMats[0]);
    tier1.position.y = -1.6;
    cakeGroup.add(tier1);
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 1.1, 32), tierMats[1]);
    tier2.position.y = -0.4;
    cakeGroup.add(tier2);
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.9, 32), tierMats[2]);
    tier3.position.y = 0.55;
    cakeGroup.add(tier3);

    // Drip icing rings
    const dripMat = new THREE.MeshStandardMaterial({ color: PALETTE.goldBright, roughness: 0.3, emissive: PALETTE.gold, emissiveIntensity: 0.1 });
    [tier1, tier2].forEach((tier, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(tier.geometry.parameters.radiusTop + 0.05, 0.12, 8, 32), dripMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = tier.position.y + tier.geometry.parameters.height / 2;
      cakeGroup.add(ring);
    });

    // Candles
    const candles = [];
    const candleCount = 5;
    const candleColors = [0xff6b6b, 0xf4d99b, 0x6bb3ff, 0xa78bfa, 0xff8c42];
    for (let i = 0; i < candleCount; i++) {
      const cg = new THREE.Group();
      const ang = (i / candleCount) * Math.PI * 2;
      const r = 0.85;
      cg.position.set(Math.cos(ang) * r, 1.0, Math.sin(ang) * r);

      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: candleColors[i], roughness: 0.4 })
      );
      cg.add(stick);

      const flameGroup = new THREE.Group();
      flameGroup.position.y = 0.42;
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.28, 8),
        new THREE.MeshBasicMaterial({ color: 0xffcc66 })
      );
      flame.position.y = 0.14;
      flameGroup.add(flame);
      const flameLight = new THREE.PointLight(0xffaa44, 0.8, 4);
      flameLight.position.y = 0.14;
      flameGroup.add(flameLight);
      cg.add(flameGroup);

      cg.userData = { lit: true, flameGroup, flame, flameLight, baseY: flameGroup.position.y };
      cakeGroup.add(cg);
      candles.push(cg);
    }

    // raycaster for candle clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function blowCandle(candleGroup) {
      if (!candleGroup.userData.lit) return;
      candleGroup.userData.lit = false;
      candleGroup.userData.flameGroup.visible = false;

      const allOut = candles.every((c) => !c.userData.lit);
      if (allOut) {
        triggerConfetti();
        triggerFireworks();
      }
    }

    function onPointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const flames = candles.filter(c => c.userData.lit).map(c => c.userData.flame);
      const hits = raycaster.intersectObjects(flames);
      if (hits.length) {
        const hitFlame = hits[0].object;
        const candle = candles.find(c => c.userData.flame === hitFlame);
        if (candle) blowCandle(candle);
      }
    }

    canvas.addEventListener('click', (e) => onPointer(e.clientX, e.clientY));
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      cakeGroup.rotation.y = Math.sin(t * 0.2) * 0.3;
      candles.forEach((c, i) => {
        if (c.userData.lit) {
          const flicker = 1 + Math.sin(t * 12 + i * 3) * 0.15 + Math.sin(t * 27 + i) * 0.08;
          c.userData.flame.scale.set(flicker, flicker * (1 + Math.sin(t*8+i)*0.1), flicker);
          c.userData.flameLight.intensity = 0.7 + Math.sin(t * 10 + i) * 0.3;
        }
      });
      renderer.render(scene, camera);
    }
    if (!reduceMotion) animate(); else renderer.render(scene, camera);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ---------------------------------------------------
     FINAL SECTION — slow drifting stars
  --------------------------------------------------- */
  function initFinalScene() {
    const canvas = document.getElementById('final-canvas');
    if (!window.THREE || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geo = new THREE.BufferGeometry();
    const count = isTouch ? 600 : 1500;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      sizes[i] = Math.random();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: PALETTE.goldBright, size: 0.18, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    function animate() {
      requestAnimationFrame(animate);
      stars.rotation.y += 0.0004;
      stars.rotation.x += 0.0001;
      renderer.render(scene, camera);
    }
    if (!reduceMotion) animate(); else renderer.render(scene, camera);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ---------------------------------------------------
     CONFETTI + FIREWORKS (2D canvas overlay)
  --------------------------------------------------- */
  let confettiCtx, confettiCanvas, confettiParticles = [];
  function setupConfettiCanvas() {
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    function resize() {
      confettiCanvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
      confettiCanvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
      confettiCanvas.style.width = window.innerWidth + 'px';
      confettiCanvas.style.height = window.innerHeight + 'px';
      confettiCtx.setTransform(Math.min(window.devicePixelRatio,2),0,0,Math.min(window.devicePixelRatio,2),0,0);
    }
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      requestAnimationFrame(loop);
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confettiParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vr;
        p.life -= 1;
        if (p.type === 'firework') {
          p.alpha = Math.max(0, p.life / p.maxLife);
        }
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rotation);
        confettiCtx.globalAlpha = p.alpha !== undefined ? p.alpha : 1;
        confettiCtx.fillStyle = p.color;
        if (p.shape === 'circle') {
          confettiCtx.beginPath();
          confettiCtx.arc(0, 0, p.size, 0, Math.PI * 2);
          confettiCtx.fill();
        } else {
          confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        }
        confettiCtx.restore();
      });
      confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < window.innerHeight + 50);
    }
    loop();
  }

  function triggerConfetti() {
    const colors = ['#d4af6a', '#f4d99b', '#ff8c42', '#f5f3ee', '#6bb3ff', '#ff6b6b'];
    const count = isTouch ? 120 : 220;
    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 1,
        gravity: 0.05 + Math.random() * 0.05,
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
        life: 600
      });
    }
  }

  function triggerFireworks() {
    const colors = ['#d4af6a', '#f4d99b', '#ff8c42', '#ff6b6b', '#6bb3ff', '#a78bfa'];
    const bursts = isTouch ? 3 : 5;
    for (let b = 0; b < bursts; b++) {
      setTimeout(() => {
        const cx = window.innerWidth * (0.2 + Math.random() * 0.6);
        const cy = window.innerHeight * (0.15 + Math.random() * 0.35);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particles = isTouch ? 40 : 70;
        for (let i = 0; i < particles; i++) {
          const ang = (i / particles) * Math.PI * 2;
          const speed = 2 + Math.random() * 3;
          confettiParticles.push({
            x: cx, y: cy,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            gravity: 0.03,
            rotation: 0, vr: 0,
            size: 3 + Math.random() * 2,
            color, shape: 'circle',
            type: 'firework',
            life: 70, maxLife: 70
          });
        }
      }, b * 350);
    }
  }

  /* ---------------------------------------------------
     BALLOONS
  --------------------------------------------------- */
  function spawnBalloons() {
    const layer = document.getElementById('balloonLayer');
    const colors = ['#ff8c42', '#d4af6a', '#f4d99b', '#6bb3ff', '#ff6b6b', '#a78bfa'];
    const count = isTouch ? 6 : 10;
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      b.className = 'balloon';
      const color = colors[i % colors.length];
      b.style.background = `radial-gradient(circle at 35% 30%, ${color}, ${color}cc 60%, ${color}66)`;
      b.style.left = Math.random() * 100 + 'vw';
      b.style.animationDuration = (14 + Math.random() * 10) + 's';
      b.style.animationDelay = (Math.random() * -20) + 's';
      b.style.opacity = (0.5 + Math.random() * 0.4).toString();
      const scale = 0.6 + Math.random() * 0.8;
      b.style.transform = `scale(${scale})`;
      layer.appendChild(b);
    }
  }

  /* ---------------------------------------------------
     MEMORY REEL — gallery frames
  --------------------------------------------------- */
  function buildReel() {
    const track = document.getElementById('reelTrack');
    const captions = [
      'First Movie Discussion',
      'Tea Break Talks',
      'Coca-Cola Sessions',
      'Late Night Laughs',
      'Random Adventures',
      'College Days',
      'Coffee & Conversations',
      'Birthday Memories',
      'Inside Jokes Forever',
      'Brotherhood Forever'
    ];
    captions.forEach((cap, i) => {
      const frame = document.createElement('div');
      frame.className = 'reel-frame';
      frame.innerHTML = `
        <div class="reel-sprocket left"></div>
        <div class="reel-placeholder">
          <span class="icon">🎞️</span>
          <p>Add Photo ${i + 1}</p>
        </div>
        <div class="reel-caption">${cap}</div>
        <div class="reel-sprocket right"></div>
      `;
      track.appendChild(frame);
    });
  }

  /* ---------------------------------------------------
     SOUND TOGGLE (no actual audio file bundled — UI only,
     ready for user to plug in their own track)
  --------------------------------------------------- */
  function initSoundToggle() {
    const btn = document.getElementById('soundBtn');
    const label = document.getElementById('soundLabel');
    document.body.classList.add('muted');

    const audio = document.getElementById('bgAudio');
    if (audio) {
      audio.loop = true;
      audio.volume = 0.4;
    }

    btn.addEventListener('click', () => {
      const muted = document.body.classList.toggle('muted');
      label.textContent = muted ? 'Score: Off' : 'Score: On';
      if (audio) {
        if (muted) {
          audio.pause();
        } else {
          audio.play().catch(() => {});
        }
      }
    });
  }

  /* ---------------------------------------------------
     INIT
  --------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    setupConfettiCanvas();
    spawnBalloons();
    buildReel();
    initSoundToggle();
    initFilmstrip();

    initLoader(() => {
      initIntro();
      initHeroScene();
      initGalaxy();
      initCake();
      initFinalScene();
    });
  });

})();
