/* Social Ad Solutions — interactive 3D logo (Three.js).
   The ORIGINAL logo (sas-logo.png) rendered as a pure extruded 3D object —
   no slab, no box — that follows the cursor / touch with rotation, lighting
   and glow. Brand text animates in letter by letter. Falls back to the
   static logo image when WebGL/Three.js is unavailable or reduced motion
   is preferred. */
(function () {
  var section = document.getElementById("brand-3d");
  if (!section) return;

  /* ---------- brand text animations (run even without WebGL) ---------- */
  var nameEl = section.querySelector(".logo3d-name");
  if (nameEl && !nameEl.querySelector(".lt")) {
    var text = nameEl.textContent;
    nameEl.classList.add("split");
    nameEl.textContent = "";
    text.split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "lt";
      s.style.setProperty("--i", i);
      s.textContent = ch === " " ? "\u00A0" : ch;
      nameEl.appendChild(s);
    });
  }
  var tagEl = section.querySelector(".logo3d-tag");
  if (tagEl && !tagEl.querySelector(".wd")) {
    var words = tagEl.textContent.trim().split(/\s+/);
    tagEl.textContent = "";
    words.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "wd";
      s.style.setProperty("--i", i);
      s.textContent = w;
      tagEl.appendChild(s);
      tagEl.appendChild(document.createTextNode(" "));
    });
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { section.classList.add("inview"); obs.disconnect(); }
    }, { threshold: 0.25 }).observe(section);
  } else {
    section.classList.add("inview");
  }

  /* ---------- 3D logo ---------- */
  var canvas = document.getElementById("logo3d-canvas");
  if (!canvas) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !window.THREE) return; // static fallback stays

  var stage = canvas.parentElement;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  scene.add(new THREE.AmbientLight(0xbfd6ff, 0.8));
  var key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(3, 4, 6);
  scene.add(key);
  var cyanLight = new THREE.PointLight(0x00d4ff, 1.4, 30);
  cyanLight.position.set(0, 0, 3.5);
  scene.add(cyanLight);
  var blueLight = new THREE.PointLight(0x176bff, 1.0, 30);
  blueLight.position.set(-4.5, 2.5, 2.5);
  scene.add(blueLight);
  var violetLight = new THREE.PointLight(0x754bff, 0.7, 30);
  violetLight.position.set(4.5, -2.5, 1.5);
  scene.add(violetLight);

  var group = new THREE.Group();
  scene.add(group);

  /* soft glow halo behind the logo (light, not a box) */
  function glowTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(0,212,255,0.55)");
    g.addColorStop(0.45, "rgba(23,107,255,0.28)");
    g.addColorStop(1, "rgba(23,107,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  var halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.set(7.2, 7.2, 1);
  halo.position.z = -1.3;
  group.add(halo);

  /* the logo itself: an extruded stack of the original artwork — nothing else */
  var SIZE = 3.1, DEPTH = 0.55, LAYERS = 18;
  new THREE.TextureLoader().load("/sas-logo.png", function (tex) {
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    for (var i = 0; i < LAYERS; i++) {
      var front = i === LAYERS - 1;
      var mat = front
        ? new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.02, roughness: 0.15, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.12 })
        : new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.08, roughness: 0.45, metalness: 0.35 });
      var p = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), mat);
      p.position.z = -DEPTH / 2 + (DEPTH * i) / (LAYERS - 1);
      group.add(p);
    }
    var back = new THREE.Mesh(
      new THREE.PlaneGeometry(SIZE, SIZE),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.08, roughness: 0.5, metalness: 0.3 })
    );
    back.position.z = -DEPTH / 2 - 0.002;
    back.rotation.y = Math.PI;
    group.add(back);
    section.classList.add("live");
  });

  function ring(radius, color, opacity, tilt) {
    var m = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.014, 12, 140),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity })
    );
    m.rotation.x = tilt;
    m.rotation.y = 0.35;
    group.add(m);
    return m;
  }
  var ring1 = ring(2.6, 0x00d4ff, 0.5, 1.25);
  var ring2 = ring(3.1, 0x754bff, 0.32, 1.05);

  var pCount = 220, pos = new Float32Array(pCount * 3), col = new Float32Array(pCount * 3);
  var palette = [new THREE.Color(0x176bff), new THREE.Color(0x00d4ff), new THREE.Color(0x754bff)];
  for (var i = 0; i < pCount; i++) {
    var r = 3.1 + Math.random() * 2.6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
    pos[i * 3 + 2] = r * Math.cos(ph) - 0.6;
    var cc = palette[i % 3];
    col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.045, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(particles);

  /* ---------- interaction: cursor anywhere in the section + drag on the logo ---------- */
  var tX = 0, tY = 0, cX = 0, cY = 0;
  function setTarget(clientX, clientY) {
    var r = stage.getBoundingClientRect();
    var nx = ((clientX - (r.left + r.width / 2)) / (r.width / 2));
    var ny = ((clientY - (r.top + r.height / 2)) / (r.height / 2));
    tX = Math.max(-1, Math.min(1, nx));
    tY = Math.max(-1, Math.min(1, ny));
    section.style.setProperty("--mx", ((tX + 1) / 2 * 100).toFixed(1) + "%");
    section.style.setProperty("--my", ((tY + 1) / 2 * 100).toFixed(1) + "%");
    section.style.setProperty("--ry", tX.toFixed(3));
    section.style.setProperty("--rx", (-tY).toFixed(3));
  }
  section.addEventListener("pointermove", function (e) { setTarget(e.clientX, e.clientY); }, { passive: true });
  section.addEventListener("pointerdown", function (e) { setTarget(e.clientX, e.clientY); }, { passive: true });
  section.addEventListener("pointerleave", function () { tX = 0; tY = 0; });

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.05 }).observe(section);
  }
  var clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    var t = clock.getElapsedTime();
    cX += (tX - cX) * 0.085;
    cY += (tY - cY) * 0.085;
    /* cursor rotation + a constant gentle sway so the 3D depth is always visible */
    group.rotation.y = cX * 0.85 + Math.sin(t * 0.55) * 0.07;
    group.rotation.x = -cY * 0.5 + Math.sin(t * 0.7) * 0.03;
    group.position.x = cX * 0.22;
    group.position.y = -cY * 0.14 + Math.sin(t * 0.9) * 0.05;
    cyanLight.position.x = cX * 5.5;
    cyanLight.position.y = -cY * 4;
    cyanLight.intensity = 1.25 + Math.abs(cX) * 0.6;
    halo.material.opacity = 0.75 + Math.abs(cX) * 0.25;
    ring1.rotation.z = t * 0.12;
    ring2.rotation.z = -t * 0.08;
    particles.rotation.y = t * 0.03;
    renderer.render(scene, camera);
  })();
})();
