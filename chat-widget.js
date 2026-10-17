/* Social Ad Solutions — AI chat widget (trial).
   Drop-in: <script src="chat-widget.js"></script> before </body>.
   Talks to POST /api/chat (Vercel serverless). If the backend is not
   configured (e.g. GitHub Pages build), it falls back to a WhatsApp CTA. */
(function () {
  "use strict";

  var WHATSAPP_URL = "https://wa.me/923084279032";
  var API_URL = "/api/chat";
  var GOLD = "#d4af37";

  var CSS = [
    "#sas-chat-btn{position:fixed;right:22px;bottom:22px;z-index:99990;width:64px;height:64px;border-radius:50%;",
    "background:#0d1622;border:2px solid " + GOLD + ";cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;overflow:hidden;",
    "box-shadow:0 10px 30px rgba(212,175,55,.35);transition:transform .18s ease}",
    "#sas-chat-btn:hover{transform:scale(1.07)}",
    "#sas-chat-btn img{width:100%;height:100%;object-fit:cover;display:block}",
    "#sas-chat-panel{position:fixed;right:22px;bottom:94px;z-index:99990;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 140px);",
    "background:#0d1622;border:1px solid rgba(255,255,255,.12);border-radius:18px;display:none;flex-direction:column;overflow:hidden;",
    "box-shadow:0 30px 90px rgba(0,0,0,.55);font-family:Manrope,'Source Sans 3',system-ui,sans-serif}",
    "#sas-chat-panel.open{display:flex}",
    "#sas-chat-head{background:linear-gradient(135deg,#121f2e,#0d1622);padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.08)}",
    "#sas-chat-dot{width:10px;height:10px;border-radius:50%;background:#3ddc84;box-shadow:0 0 8px #3ddc84}",
    "#sas-chat-ava{width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid " + GOLD + "}",
    "#sas-chat-title{color:#f7f9fd;font-weight:700;font-size:15px}",
    "#sas-chat-sub{color:#aab9ca;font-size:12px}",
    "#sas-chat-close{margin-left:auto;background:none;border:none;color:#aab9ca;font-size:20px;cursor:pointer;line-height:1}",
    "#sas-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}",
    ".sas-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word}",
    ".sas-msg.bot{background:#192a3e;color:#f7f9fd;align-self:flex-start;border-bottom-left-radius:4px}",
    ".sas-msg.user{background:linear-gradient(135deg,#f4ce58,#d4af37);color:#0a0f16;align-self:flex-end;border-bottom-right-radius:4px;font-weight:500}",
    ".sas-msg a{color:" + GOLD + ";font-weight:700}",
    ".sas-msg.user a{color:#0a0f16}",
    ".sas-typing{align-self:flex-start;background:#192a3e;padding:12px 16px;border-radius:14px;border-bottom-left-radius:4px}",
    ".sas-typing span{display:inline-block;width:7px;height:7px;margin-right:4px;border-radius:50%;background:#aab9ca;animation:sasblink 1.2s infinite}",
    ".sas-typing span:nth-child(2){animation-delay:.2s}.sas-typing span:nth-child(3){animation-delay:.4s}",
    "@keyframes sasblink{0%,80%,100%{opacity:.25}40%{opacity:1}}",
    "#sas-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08);background:#0a111b}",
    "#sas-chat-input{flex:1;background:#121f2e;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#f7f9fd;",
    "padding:10px 12px;font-size:14px;font-family:inherit;outline:none}",
    "#sas-chat-input:focus{border-color:" + GOLD + "}",
    "#sas-chat-send{background:linear-gradient(135deg,#f4ce58,#d4af37);border:none;border-radius:12px;color:#0a0f16;",
    "font-weight:700;padding:0 16px;cursor:pointer;font-size:14px}",
    "#sas-chat-send:disabled{opacity:.5;cursor:default}",
    ".sas-wa-btn{display:inline-block;margin-top:8px;background:#25d366;color:#062b16;font-weight:700;font-size:13px;",
    "padding:9px 14px;border-radius:10px;text-decoration:none}"
  ].join("\n");

  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function linkify(s) {
    return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function init() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var btn = el("button", null, '<img src="chat-avatar.png" alt="Chat with us"/>');
    btn.id = "sas-chat-btn";
    btn.setAttribute("aria-label", "Chat with us");

    var panel = el("div"); panel.id = "sas-chat-panel";
    panel.innerHTML =
      '<div id="sas-chat-head"><img id="sas-chat-ava" src="chat-avatar.png" alt=""/><div id="sas-chat-dot"></div>' +
      '<div><div id="sas-chat-title">Social Ad Solutions</div>' +
      '<div id="sas-chat-sub">AI assistant — typically replies instantly</div></div>' +
      '<button id="sas-chat-close" aria-label="Close chat">&times;</button></div>' +
      '<div id="sas-chat-msgs"></div>' +
      '<form id="sas-chat-form"><input id="sas-chat-input" type="text" placeholder="Ask about our services..." autocomplete="off" maxlength="500"/>' +
      '<button id="sas-chat-send" type="submit">Send</button></form>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var msgs = panel.querySelector("#sas-chat-msgs");
    var form = panel.querySelector("#sas-chat-form");
    var input = panel.querySelector("#sas-chat-input");
    var sendBtn = panel.querySelector("#sas-chat-send");
    var history = [];
    var greeted = false;
    var busy = false;

    function addMsg(text, who) {
      var m = el("div", "sas-msg " + who, linkify(text));
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
      return m;
    }

    function addWhatsAppFallback() {
      var m = el("div", "sas-msg bot");
      m.innerHTML = "I'm not connected yet — but our team replies fast on WhatsApp." +
        '<br><a class="sas-wa-btn" href="' + WHATSAPP_URL + '" target="_blank" rel="noopener">Chat on WhatsApp</a>';
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function setTyping(on) {
      var t = msgs.querySelector(".sas-typing");
      if (on && !t) {
        t = el("div", "sas-typing", "<span></span><span></span><span></span>");
        msgs.appendChild(t);
        msgs.scrollTop = msgs.scrollHeight;
      } else if (!on && t) {
        t.remove();
      }
    }

    function toggle(open) {
      panel.classList.toggle("open", open);
      if (open && !greeted) {
        greeted = true;
        addMsg("Hi! I'm the Social Ad Solutions assistant. Ask me about our ad management, content, or how we help clinics and businesses grow — or tap below to chat on WhatsApp.", "bot");
      }
      if (open) setTimeout(function () { input.focus(); }, 150);
    }

    btn.addEventListener("click", function () { toggle(!panel.classList.contains("open")); });
    panel.querySelector("#sas-chat-close").addEventListener("click", function () { toggle(false); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      busy = true;
      sendBtn.disabled = true;
      addMsg(text, "user");
      history.push({ role: "user", content: text });
      input.value = "";
      setTyping(true);

      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          setTyping(false);
          if (res.ok && res.body.reply) {
            addMsg(res.body.reply, "bot");
            history.push({ role: "assistant", content: res.body.reply });
          } else {
            addWhatsAppFallback();
          }
        })
        .catch(function () {
          setTyping(false);
          addWhatsAppFallback();
        })
        .then(function () {
          busy = false;
          sendBtn.disabled = false;
          input.focus();
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
