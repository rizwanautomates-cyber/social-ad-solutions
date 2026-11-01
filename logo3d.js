/* Social Ad Solutions — interactive 3D logo (Three.js).
   Renders the ORIGINAL logo (sas-logo.png) as a layered, extruded 3D object
   on a metallic slab, with cursor/touch-reactive rotation, lighting and glow.
   Falls back to the static logo image when WebGL/Three.js is unavailable
   or the visitor prefers reduced motion. */
(function () {
  var section = document.getElementById("brand-3d");
  var canvas = document.getElementById("logo3d-canvas");
  if (!section || !canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !window.THREE) return; // static fallback stays

  var stage = canvas.parentElement;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    return; // static fallback stays
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xbfd6ff, 0.75));
  var key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(3, 4, 6);
  scene.add(key);
  var cyanLight = new THREE.PointLight(0x00d4ff, 1.35, 30);
  cyanLight.position.set(0, 0, 3.5);
  scene.add(cyanLight);
  var blueLight = new THREE.PointLight(0x176bff, 1.0, 30);
  blueLight.position.set(-4.5, 2.5, 2.5);
  scene.add(blueLight);
  var violetLight = new THREE.PointLight(0x754bff, 0.65, 30);
  violetLight.position.set(4.5, -2.5, 1.5);
  scene.add(violetLight);

  var group = new THREE.Group();
  scene.add(group);

  /* ---------- glow halo behind the logo ---------- */
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
  halo.scale.set(7.4, 7.4, 1);
  halo.position.z = -1.4;
  group.add(halo);

  /* ---------- the logo: metallic slab + extruded texture stack ---------- */
  var SIZE = 3.0, DEPTH = 0.34;
  var slab = new THREE.Mesh(
    new THREE.BoxGeometry(SIZE + 0.1, SIZE + 0.1, DEPTH),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a2463, metalness: 0.85, roughness: 0.28,
      clearcoat: 0.7, clearcoatRoughness: 0.25
    })
  );
  group.add(slab);

  new THREE.TextureLoader().load("/sas-logo.png", function (tex) {
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    var LAYERS = 14;
    for (var i = 0; i < LAYERS; i++) {
      var front = i === LAYERS - 1;
      var mat = front
        ? new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.02, roughness: 0.15, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.12 })
        : new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.08, roughness: 0.45, metalness: 0.35 });
      var p = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), mat);
      p.position.z = -DEPTH / 2 + (DEPTH * i) / (LAYERS - 1) + 0.001 * i;
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

  /* ---------- glowing rings ---------- */
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
  var ring1 = ring(2.55, 0x00d4ff, 0.55, 1.25);
  var ring2 = ring(3.05, 0x754bff, 0.35, 1.05);

  /* ---------- floating particles ---------- */
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

  /* ---------- interaction ---------- */
  var tX = 0, tY = 0, cX = 0, cY = 0, lastPointer = -10;
  function setFromEvent(clientX, clientY) {
    var r = section.getBoundingClientRect();
    var nx = ((clientX - r.left) / r.width) * 2 - 1;
    var ny = ((clientY - r.top) / r.height) * 2 - 1;
    tX = Math.max(-1, Math.min(1, nx));
    tY = Math.max(-1, Math.min(1, ny));
    lastPointer = performance.now() / 1000;
    section.style.setProperty("--mx", ((tX + 1) / 2 * 100).toFixed(1) + "%");
    section.style.setProperty("--my", ((tY + 1) / 2 * 100).toFixed(1) + "%");
  }
  section.addEventListener("pointermove", function (e) { setFromEvent(e.clientX, e.clientY); }, { passive: true });
  section.addEventListener("pointerdown", function (e) { setFromEvent(e.clientX, e.clientY); }, { passive: true });
  section.addEventListener("pointerleave", function () { tX = 0; tY = 0; });

  /* ---------- sizing ---------- */
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- render only while visible ---------- */
  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.05 }).observe(section);
  }
  var clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    var t = clock.getElapsedTime();
    cX += (tX - cX) * 0.055;
    cY += (tY - cY) * 0.055;
    var idle = (performance.now() / 1000 - lastPointer > 2.5) ? Math.sin(t * 0.35) * 0.14 : 0;
    group.rotation.y = cX * 0.6 + idle;
    group.rotation.x = -cY * 0.38 + Math.sin(t * 0.6) * 0.02;
    group.position.x = cX * 0.16;
    group.position.y = -cY * 0.1 + Math.sin(t * 0.9) * 0.045;
    cyanLight.position.x = cX * 5;
    cyanLight.position.y = -cY * 3.5;
    cyanLight.intensity = 1.2 + Math.abs(cX) * 0.5;
    halo.material.opacity = 0.75 + Math.abs(cX) * 0.25;
    ring1.rotation.z = t * 0.12;
    ring2.rotation.z = -t * 0.08;
    particles.rotation.y = t * 0.03;
    renderer.render(scene, camera);
  })();
})();
