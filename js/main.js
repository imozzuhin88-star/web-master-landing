const contactConfig = {
  phoneDisplay: "+7 999 000-00-00", phoneHref: "+79990000000", email: "hello@example.ru",
  telegramUsername: "your_telegram_username", whatsappPhone: "79990000000",
  bankName: "Ваш банк", cardNumber: "0000 0000 0000 0000", cardHolder: "Иван Иванов", paymentPurpose: "Разработка сайта"
};

const offerConfig = {
  priceFix: "1 500",
  priceLanding: "7 900",
  priceTurnkey: "15 900"
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const storageKey = "web-master-chat-session";
const sessionId = localStorage.getItem(storageKey) || crypto.randomUUID();
localStorage.setItem(storageKey, sessionId);
let selectedChannel = "telegram";
let socket = null;
let messages = [];
let unread = 0;
let chatOpen = false;
let chatTrigger = null;

function formatTime(value) { return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function showToast(text) { const item = document.createElement("div"); item.className = "toast"; item.innerHTML = '<i data-lucide="check-circle-2" aria-hidden="true"></i><span></span>'; $("span", item).textContent = text; $("#toastRegion").append(item); window.lucide?.createIcons({ nodes: [item] }); setTimeout(() => item.remove(), 4200); }
function setText(selector, value) { const item = $(selector); if (item) item.textContent = value; }
function setHref(selector, value) { const item = $(selector); if (item) item.href = value; }

function initializeContacts() {
  const phone = contactConfig.phoneHref.replace(/[^\d+]/g, "");
  setText("#phoneText", contactConfig.phoneDisplay); setText("#telegramText", `@${contactConfig.telegramUsername}`); setText("#whatsappText", contactConfig.phoneDisplay); setText("#emailText", contactConfig.email);
  setText("#bankNameCard", contactConfig.bankName); setText("#paymentRecipientText", contactConfig.cardHolder); setText("#cardNumberText", contactConfig.cardNumber); setText("#cardHolderText", contactConfig.cardHolder); setText("#paymentPurposeText", contactConfig.paymentPurpose);
  setText("#priceFix", offerConfig.priceFix); setText("#priceLanding", offerConfig.priceLanding); setText("#priceTurnkey", offerConfig.priceTurnkey);
  setHref("#phoneLink", `tel:${phone}`); setHref("#telegramLink", `https://t.me/${contactConfig.telegramUsername}`); setHref("#whatsappLink", `https://wa.me/${contactConfig.whatsappPhone}`); setHref("#emailLink", `mailto:${contactConfig.email}`);
}

function buildLeadMessage(data) { return ["Новая заявка на разработку сайта", "", `Имя: ${data.name}`, `Телефон: ${data.phone}`, `Задача: ${data.service}`, `Бюджет: ${data.budget}`, `Детали: ${data.message || "не указаны"}`].join("\n"); }
async function sendLead(data) { try { await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); } catch { /* Static hosting keeps the messenger flow available. */ } }

function setupLeadForm() {
  const form = $("#leadForm"); const status = $("#formStatus");
  $$('[data-channel]', form).forEach((button) => button.addEventListener("click", () => { selectedChannel = button.dataset.channel; }));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form).entries()); const message = encodeURIComponent(buildLeadMessage(data));
    const url = selectedChannel === "whatsapp" ? `https://wa.me/${contactConfig.whatsappPhone}?text=${message}` : `https://t.me/${contactConfig.telegramUsername}?text=${message}`;
    sendLead(data);
    window.open(url, "_blank", "noopener");
    status.textContent = `${data.name}, заявка подготовлена. Отправьте ее в открывшемся мессенджере.`; showToast("Заявка подготовлена"); form.reset();
  });
}

async function copyText(text) { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text); const field = document.createElement("textarea"); field.value = text; field.style.position = "fixed"; field.style.opacity = "0"; document.body.append(field); field.select(); document.execCommand("copy"); field.remove(); }
function setupCopyButtons() { $$('[data-copy]').forEach((button) => button.addEventListener("click", async () => { const details = `Карта: ${contactConfig.cardNumber}\nПолучатель: ${contactConfig.cardHolder}\nБанк: ${contactConfig.bankName}\nНазначение: ${contactConfig.paymentPurpose}`; try { await copyText(button.dataset.copy === "card" ? contactConfig.cardNumber : details); $("#copyStatus").textContent = button.dataset.copy === "card" ? "Номер карты скопирован." : "Реквизиты скопированы."; showToast("Данные скопированы"); } catch { $("#copyStatus").textContent = "Не удалось скопировать. Выделите данные вручную."; } })); }

function messageMarkup(message) {
  const row = document.createElement("div"); row.className = `message-row ${message.author === "visitor" ? "mine" : ""}`;
  const bubble = document.createElement("div"); bubble.className = "message";
  if (message.text) { const text = document.createElement("span"); text.textContent = message.text; bubble.append(text); }
  if (message.fileUrl) { const link = document.createElement("a"); link.className = "message-file"; link.href = message.fileUrl; link.target = "_blank"; link.rel = "noopener"; if (message.fileType?.startsWith("image/")) { const image = document.createElement("img"); image.loading = "lazy"; image.src = message.fileUrl; image.alt = message.fileName || "Прикрепленное изображение"; link.append(image); } else { link.innerHTML = '<i data-lucide="file" aria-hidden="true"></i>'; const name = document.createElement("span"); name.textContent = message.fileName || "Прикрепленный файл"; link.append(name); } bubble.append(link); }
  const time = document.createElement("time"); time.dateTime = message.createdAt; time.textContent = formatTime(message.createdAt); bubble.append(time); row.append(bubble); return row;
}
function renderMessages() { const root = $("#chatMessages"); const query = $("#messageSearch").value.trim().toLowerCase(); root.replaceChildren(); const filtered = messages.filter((message) => !query || message.text?.toLowerCase().includes(query) || message.fileName?.toLowerCase().includes(query)); if (!filtered.length) { const empty = document.createElement("p"); empty.className = "message-date"; empty.textContent = query ? "Ничего не найдено" : "Начните диалог - отвечу в ближайшее время."; root.append(empty); } else { filtered.forEach((message) => root.append(messageMarkup(message))); } window.lucide?.createIcons({ nodes: [root] }); root.scrollTop = root.scrollHeight; }
function addMessage(message, persist = true) { if (messages.some((item) => item.id === message.id)) return; messages.push(message); if (persist) localStorage.setItem("web-master-chat-cache", JSON.stringify(messages.slice(-80))); renderMessages(); if (message.author === "seller" && !chatOpen) { unread += 1; $("#chatUnread").hidden = false; $("#chatUnread").textContent = unread; showToast("Новое сообщение в чате"); } }
function setPresence(online, typing = false) { $("#chatPresence").innerHTML = online ? '<i class="online-dot"></i>Онлайн' : "Не в сети"; $("#typingIndicator").classList.toggle("is-visible", typing); }

async function loadMessages() { try { const response = await fetch(`/api/messages?room=${encodeURIComponent(sessionId)}`); if (!response.ok) throw new Error("no server"); const saved = await response.json(); messages = saved; localStorage.setItem("web-master-chat-cache", JSON.stringify(messages.slice(-80))); } catch { messages = JSON.parse(localStorage.getItem("web-master-chat-cache") || "[]"); } renderMessages(); }
function connectChat() { if (!window.io) return; socket = window.io({ transports: ["websocket", "polling"] }); socket.on("connect", () => { socket.emit("join", { room: sessionId, name: "Гость" }); setPresence(true); }); socket.on("presence", ({ online }) => setPresence(online)); socket.on("typing", ({ active }) => setPresence(true, active)); socket.on("message", (message) => addMessage(message)); socket.on("connect_error", () => setPresence(false)); }
function openChat(event) { chatTrigger = event?.currentTarget || document.activeElement; chatOpen = true; unread = 0; $("#chatUnread").hidden = true; $("#chatWidget").classList.add("is-open"); $("#chatWidget").setAttribute("aria-hidden", "false"); $("#chatFab").classList.add("is-hidden"); document.body.classList.add("chat-open"); renderMessages(); setTimeout(() => $("#chatInput").focus(), 250); }
function closeChat() { chatOpen = false; $("#chatWidget").classList.remove("is-open"); $("#chatWidget").setAttribute("aria-hidden", "true"); $("#chatFab").classList.remove("is-hidden"); document.body.classList.remove("chat-open"); chatTrigger?.focus?.(); }
function setupChat() {
  $$('[data-open-chat]').forEach((button) => button.addEventListener("click", openChat)); $("#chatClose").addEventListener("click", closeChat);
  $("#chatSearchToggle").addEventListener("click", () => { $("#chatSearch").classList.toggle("is-visible"); if ($("#chatSearch").classList.contains("is-visible")) $("#messageSearch").focus(); });
  $("#messageSearch").addEventListener("input", renderMessages); $("#clearSearch").addEventListener("click", () => { $("#messageSearch").value = ""; renderMessages(); });
  $$("#quickReplies button").forEach((button) => button.addEventListener("click", () => { $("#chatInput").value = button.textContent; $("#chatInput").focus(); }));
  const input = $("#chatInput"); let typingTimer;
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 90)}px`; if (socket?.connected) { socket.emit("typing", { room: sessionId, active: true }); clearTimeout(typingTimer); typingTimer = setTimeout(() => socket.emit("typing", { room: sessionId, active: false }), 900); } });
  $("#chatForm").addEventListener("submit", async (event) => { event.preventDefault(); const text = input.value.trim(); const file = $("#chatFile").files[0]; if (!text && !file) return; let attachment = {}; if (file) { if (file.size > 5 * 1024 * 1024) { showToast("Файл больше 5 МБ. Выберите другой."); return; } try { const body = new FormData(); body.append("file", file); body.append("room", sessionId); const response = await fetch("/api/uploads", { method: "POST", body }); if (!response.ok) throw new Error("upload"); attachment = await response.json(); } catch { showToast("Сервер недоступен: файл не отправлен."); return; } }
    const message = { id: crypto.randomUUID(), room: sessionId, author: "visitor", text, ...attachment, createdAt: new Date().toISOString() }; if (socket?.connected) socket.emit("message", message); else addMessage(message); input.value = ""; input.style.height = "auto"; $("#chatFile").value = ""; socket?.emit("typing", { room: sessionId, active: false }); });
  loadMessages(); connectChat();
}

function setupMotion() {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .14 }); $$(".reveal").forEach((element) => { element.style.setProperty("--delay", `${element.dataset.delay || 0}ms`); observer.observe(element); });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) $$("[data-tilt]").forEach((card) => { card.addEventListener("pointermove", (event) => { const box = card.getBoundingClientRect(); card.style.transform = `perspective(900px) rotateX(${((event.clientY - box.top) / box.height - .5) * -2}deg) rotateY(${((event.clientX - box.left) / box.width - .5) * 2}deg) translateY(-2px)`; }); card.addEventListener("pointerleave", () => { card.style.transform = ""; }); });
}
function setupNavigation() {
  const header = $(".site-header");
  const back = $("#backToTop");
  const links = $$(".site-nav a");
  const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
  const requestSection = $("#request");

  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", scrollY > 10);
    back.classList.toggle("visible", scrollY > 550);
    let current = "";
    sections.forEach((section) => { if (scrollY >= section.offsetTop - 115) current = `#${section.id}`; });
    if (current === "#prices" && scrollY >= requestSection.offsetTop - 115) current = "";
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === current));
  }, { passive: true });

  back.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  $(".menu-toggle").addEventListener("click", (event) => {
    const menu = $(".site-nav");
    const opened = menu.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", opened);
  });
  links.forEach((link) => link.addEventListener("click", () => {
    $(".site-nav").classList.remove("open");
    $(".menu-toggle").setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (chatOpen) closeChat();
    $(".site-nav").classList.remove("open");
    $(".menu-toggle").setAttribute("aria-expanded", "false");
  });
  const initialAnchor = location.hash ? $(location.hash) : null;
  if (initialAnchor) requestAnimationFrame(() => initialAnchor.scrollIntoView({ block: "start" }));
}

window.addEventListener("load", () => { initializeContacts(); setupLeadForm(); setupCopyButtons(); setupChat(); setupMotion(); setupNavigation(); setText("#currentYear", new Date().getFullYear()); window.lucide?.createIcons(); setTimeout(() => $("#pageLoader").classList.add("is-hidden"), 280); });
