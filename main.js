/* Social Ad Solutions — interactions: header, menu, reveals, Three.js hero,
   tilt, magnetic buttons, learn-more, counters, contact form -> WhatsApp */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) document.documentElement.classList.add("no-anim");

  /* ---------- header state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector(".menu-btn");
  var menu = document.querySelector(".mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- scroll reveals (GSAP if present, else IntersectionObserver) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!reduced && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    revealEls.forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        delay: parseFloat(el.getAttribute("data-delay") || 0),
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
  } else if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          el.style.transitionDelay = (el.getAttribute("data-delay") || 0) + "s";
          el.classList.add("in"); io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- animated counters (verified structural facts only) ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.getAttribute("data-count"), 10), t0 = null;
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1100, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick); cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- 3D tilt on stage card ---------- */
  var stage = document.querySelector(".stage-card");
  if (stage && !reduced && window.matchMedia("(pointer: fine)").matches) {
    var wrap = stage.closest(".stage");
    wrap.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = "rotateY(" + (x * 7) + "deg) rotateX(" + (-y * 7) + "deg)";
    });
    wrap.addEventListener("mouseleave", function () { stage.style.transform = ""; });
  }

  /* ---------- magnetic CTA buttons ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * 0.18 + "px," + y * 0.28 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- learn more toggles ---------- */
  document.querySelectorAll(".learn-more").forEach(function (b) {
    b.addEventListener("click", function () {
      var panel = document.getElementById(b.getAttribute("aria-controls"));
      if (!panel) return;
      var open = panel.classList.toggle("open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.querySelector(".lm-label").textContent = open ? "Show Less" : "Learn More";
    });
  });

  /* ---------- Three.js hero scene: particles + wireframe geometry ---------- */
  var canvas = document.getElementById("webgl");
  if (canvas && window.THREE && !reduced) {
    try {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.z = 9;

      // particle field
      var N = 420, pos = new Float32Array(N * 3);
      for (var i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 22;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      var pgeo = new THREE.BufferGeometry();
      pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var points = new THREE.Points(pgeo, new THREE.PointsMaterial({
        color: 0x4FA8FF, size: 0.045, transparent: true, opacity: 0.75
      }));
      scene.add(points);

      var ico = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.5, 0),
        new THREE.MeshBasicMaterial({ color: 0x1E90FF, wireframe: true, transparent: true, opacity: 0.4 })
      );
      ico.position.set(4.6, 0.6, 0); scene.add(ico);

      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.035, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.65 })
      );
      ring.position.set(4.6, 0.6, 0); ring.rotation.x = 1.1; scene.add(ring);

      var ico2 = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8, 0),
        new THREE.MeshBasicMaterial({ color: 0x00D4FF, wireframe: true, transparent: true, opacity: 0.35 })
      );
      ico2.position.set(-5.4, -1.6, 0); scene.add(ico2);

      var mx = 0, my = 0;
      window.addEventListener("mousemove", function (e) {
        mx = (e.clientX / window.innerWidth - 0.5);
        my = (e.clientY / window.innerHeight - 0.5);
      }, { passive: true });

      function resize() {
        var w = canvas.clientWidth || canvas.parentElement.clientWidth;
        var h = canvas.clientHeight || canvas.parentElement.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      }
      window.addEventListener("resize", resize); resize();

      var visible = true;
      document.addEventListener("visibilitychange", function () { visible = !document.hidden; });
      (function animate() {
        requestAnimationFrame(animate);
        if (!visible) return;
        var t = Date.now() * 0.0004;
        points.rotation.y = t * 0.35;
        ico.rotation.y = t * 1.4; ico.rotation.x = t * 0.7;
        ico.position.y = 0.6 + Math.sin(t * 2.2) * 0.22;
        ring.rotation.z = t * 1.8; ring.position.y = ico.position.y;
        ico2.rotation.y = -t * 1.1; ico2.position.y = -1.6 + Math.cos(t * 1.8) * 0.18;
        camera.position.x += (mx * 1.2 - camera.position.x) * 0.04;
        camera.position.y += (-my * 0.8 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      })();
    } catch (e) { /* WebGL unavailable: CSS ambience still carries the design */ }
  }

  /* ---------- contact form -> WhatsApp ---------- */
  var form = document.getElementById("lead-form");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var svc = params.get("service");
    var select = form.querySelector("#f-service");
    if (svc && select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === svc) { select.selectedIndex = i; break; }
      }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      function v(id) { var n = form.querySelector(id); return n ? n.value.trim() : ""; }
      var lines = [
        "New enquiry — Social Ad Solutions website",
        "Name: " + v("#f-name"),
        "Business: " + v("#f-business"),
        "Email: " + v("#f-email"),
        "WhatsApp: " + v("#f-phone"),
        "Service: " + (select ? select.value : ""),
        "Project details: " + v("#f-details")
      ];
      window.open("https://wa.me/923084279032?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
      var note = document.getElementById("form-note");
      if (note) note.textContent = "Opening WhatsApp with your enquiry ready to send. You can review it before sending.";
    });
  }

  /* ---------- cursor glow (desktop only) ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    var glow = document.createElement("div");
    glow.id = "cursor-glow"; glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var gx = window.innerWidth / 2, gy = window.innerHeight / 3, tx = gx, ty = gy;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      gx += (tx - gx) * 0.06; gy += (ty - gy) * 0.06;
      glow.style.left = gx + "px"; glow.style.top = gy + "px";
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
