const siteConfig = {
  companyName: "СтройДом",
  bankName: "Ваш банк",
  cardNumber: "0000 0000 0000 0000",
  cardHolder: "Получатель не указан",
  paymentPurpose: "Строительные работы"
};

const calculatorConfig = {
  services: {
    "house-shell": { label: "Строительство коробки", rate: 34000 },
    "turnkey-house": { label: "Дом под ключ", rate: 72000 },
    roof: { label: "Кровельные работы", rate: 4800 },
    facade: { label: "Фасадные работы", rate: 3600 },
    renovation: { label: "Внутренняя отделка", rate: 18000 }
  },
  packages: {
    base: { label: "базовая комплектация", factor: 0.85 },
    standard: { label: "стандарт", factor: 1 },
    extended: { label: "расширенная комплектация", factor: 1.35 }
  }
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const storageKey = "web-master-chat-session";
const createUuid = () => crypto.randomUUID?.() || "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => (char ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> char / 4).toString(16));
const sessionId = localStorage.getItem(storageKey) || createUuid();
localStorage.setItem(storageKey, sessionId);

let socket = null;
let messages = [];
let unread = 0;
let chatOpen = false;
let chatTrigger = null;
let currentEstimate = null;

function formatTime(value) {
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatMoney(value) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} ₽`;
}

function showToast(text) {
  const item = document.createElement("div");
  item.className = "toast";
  item.innerHTML = '<i data-lucide="check-circle-2" aria-hidden="true"></i><span></span>';
  $("span", item).textContent = text;
  $("#toastRegion").append(item);
  window.lucide?.createIcons({ nodes: [item] });
  setTimeout(() => item.remove(), 4200);
}

function setText(selector, value) {
  const item = $(selector);
  if (item) item.textContent = value;
}

function initializeSiteConfig() {
  $$('[data-company]').forEach((item) => { item.textContent = siteConfig.companyName; });
  setText("#bankNameCard", siteConfig.bankName);
  setText("#paymentRecipientText", siteConfig.cardHolder);
  setText("#cardNumberText", siteConfig.cardNumber);
  setText("#cardHolderText", siteConfig.cardHolder);
  setText("#paymentPurposeText", siteConfig.paymentPurpose);
}

async function sendLead(data) {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("lead request failed");
  return response.json();
}

function setupLeadForm() {
  const form = $("#leadForm");
  const status = $("#formStatus");
  const submitButton = $('.lead-submit', form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    submitButton.disabled = true;
    status.textContent = "Отправляем заявку...";
    try {
      await sendLead(data);
      status.textContent = `${data.name}, заявка сохранена. Мы свяжемся по указанному телефону.`;
      showToast("Заявка отправлена");
      form.reset();
    } catch {
      status.textContent = "Не удалось отправить заявку. Попробуйте ещё раз или напишите в онлайн-чат.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

function setupCalculator() {
  const service = $("#calcService");
  const packageField = $("#calcPackage");
  const area = $("#calcArea");
  const range = $("#calcAreaRange");

  const render = () => {
    const safeArea = Math.max(10, Math.min(500, Number(area.value) || 10));
    area.value = safeArea;
    range.value = safeArea;
    const serviceItem = calculatorConfig.services[service.value];
    const packageItem = calculatorConfig.packages[packageField.value];
    const total = Math.round((serviceItem.rate * safeArea * packageItem.factor) / 1000) * 1000;
    currentEstimate = { service: serviceItem.label, area: safeArea, packageName: packageItem.label, total };
    setText("#calcTotal", formatMoney(total));
    setText("#calcSummary", `${serviceItem.label} · ${safeArea} м² · ${packageItem.label}`);
  };

  service.addEventListener("change", render);
  packageField.addEventListener("change", render);
  area.addEventListener("input", render);
  range.addEventListener("input", () => { area.value = range.value; render(); });

  $$('[data-service-choice]').forEach((card) => {
    $("button", card).addEventListener("click", () => {
      const match = Object.entries(calculatorConfig.services).find(([, item]) => item.label === card.dataset.serviceChoice);
      if (match) {
        service.value = match[0];
        render();
        $("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        $("#leadService").value = card.dataset.serviceChoice;
        $("#request").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  $("#useEstimate").addEventListener("click", () => {
    render();
    const serviceOption = $$("option", $("#leadService")).find((option) => option.textContent === currentEstimate.service);
    if (serviceOption) $("#leadService").value = currentEstimate.service;
    const estimateText = `Предварительный расчёт: ${currentEstimate.service}, ${currentEstimate.area} м², ${currentEstimate.packageName} — около ${formatMoney(currentEstimate.total)}.`;
    const messageField = $("#leadMessage");
    messageField.value = messageField.value.trim() ? `${messageField.value.trim()}\n${estimateText}` : estimateText;
    $("#request").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("#leadName").focus(), 500);
  });

  render();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

function setupCopyButtons() {
  $$('[data-copy]').forEach((button) => button.addEventListener("click", async () => {
    const details = `Карта: ${siteConfig.cardNumber}\nПолучатель: ${siteConfig.cardHolder}\nБанк: ${siteConfig.bankName}\nНазначение: ${siteConfig.paymentPurpose}`;
    try {
      await copyText(button.dataset.copy === "card" ? siteConfig.cardNumber : details);
      $("#copyStatus").textContent = button.dataset.copy === "card" ? "Номер карты скопирован." : "Реквизиты скопированы.";
      showToast("Данные скопированы");
    } catch {
      $("#copyStatus").textContent = "Не удалось скопировать. Выделите данные вручную.";
    }
  }));
}

function setupGallery() {
  const dialog = $("#galleryDialog");
  const image = $("#galleryDialogImage");
  const caption = $("#galleryDialogTitle");
  let trigger = null;
  $$('[data-gallery-src]').forEach((card) => card.addEventListener("click", () => {
    trigger = card;
    image.src = card.dataset.gallerySrc;
    image.alt = card.dataset.galleryCaption;
    caption.textContent = card.dataset.galleryCaption;
    dialog.showModal();
  }));
  const close = () => {
    dialog.close();
    trigger?.focus();
  };
  $("#galleryClose").addEventListener("click", close);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
}

function setupImages() {
  $$(".media-skeleton img").forEach((image) => {
    const show = () => image.classList.add("is-loaded");
    if (image.complete) show(); else image.addEventListener("load", show, { once: true });
  });
}

function messageMarkup(message) {
  const row = document.createElement("div");
  row.className = `message-row ${message.author === "visitor" ? "mine" : ""}`;
  const bubble = document.createElement("div");
  bubble.className = "message";
  if (message.text) {
    const text = document.createElement("span");
    text.textContent = message.text;
    bubble.append(text);
  }
  if (message.fileUrl) {
    const link = document.createElement("a");
    link.className = "message-file";
    link.href = message.fileUrl;
    link.target = "_blank";
    link.rel = "noopener";
    if (message.fileType?.startsWith("image/")) {
      const image = document.createElement("img");
      image.loading = "lazy";
      image.src = message.fileUrl;
      image.alt = message.fileName || "Прикреплённое изображение";
      link.append(image);
    } else {
      link.innerHTML = '<i data-lucide="file" aria-hidden="true"></i>';
      const name = document.createElement("span");
      name.textContent = message.fileName || "Прикреплённый файл";
      link.append(name);
    }
    bubble.append(link);
  }
  const time = document.createElement("time");
  time.dateTime = message.createdAt;
  time.textContent = formatTime(message.createdAt);
  bubble.append(time);
  row.append(bubble);
  return row;
}

function renderMessages() {
  const root = $("#chatMessages");
  const query = $("#messageSearch").value.trim().toLowerCase();
  root.replaceChildren();
  const filtered = messages.filter((message) => !query || message.text?.toLowerCase().includes(query) || message.fileName?.toLowerCase().includes(query));
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "message-date";
    empty.textContent = query ? "Ничего не найдено" : "Опишите задачу — менеджер ответит в чате.";
    root.append(empty);
  } else {
    filtered.forEach((message) => root.append(messageMarkup(message)));
  }
  window.lucide?.createIcons({ nodes: [root] });
  root.scrollTop = root.scrollHeight;
}

function addMessage(message, persist = true) {
  if (messages.some((item) => item.id === message.id)) return;
  messages.push(message);
  if (persist) localStorage.setItem("web-master-chat-cache", JSON.stringify(messages.slice(-80)));
  renderMessages();
  if (message.author === "seller" && !chatOpen) {
    unread += 1;
    $("#chatUnread").hidden = false;
    $("#chatUnread").textContent = unread;
    showToast("Новое сообщение в чате");
  }
}

function setPresence(online, typing = false) {
  $("#chatPresence").innerHTML = online ? '<i class="online-dot"></i>Онлайн' : "Не в сети";
  $("#typingIndicator").classList.toggle("is-visible", typing);
}

async function loadMessages() {
  try {
    const response = await fetch(`/api/messages?room=${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error("no server");
    messages = await response.json();
    localStorage.setItem("web-master-chat-cache", JSON.stringify(messages.slice(-80)));
  } catch {
    messages = JSON.parse(localStorage.getItem("web-master-chat-cache") || "[]");
  }
  renderMessages();
}

function connectChat() {
  if (!window.io) return;
  socket = window.io({ transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    socket.emit("join", { room: sessionId, name: "Гость" });
    setPresence(true);
  });
  socket.on("presence", ({ online }) => setPresence(online));
  socket.on("typing", ({ active }) => setPresence(true, active));
  socket.on("message", (message) => addMessage(message));
  socket.on("connect_error", () => setPresence(false));
}

function openChat(event) {
  chatTrigger = event?.currentTarget || document.activeElement;
  chatOpen = true;
  unread = 0;
  $("#chatUnread").hidden = true;
  $("#chatWidget").classList.add("is-open");
  $("#chatWidget").setAttribute("aria-hidden", "false");
  $("#chatFab").classList.add("is-hidden");
  document.body.classList.add("chat-open");
  renderMessages();
  setTimeout(() => $("#chatInput").focus(), 250);
}

function closeChat() {
  chatOpen = false;
  $("#chatWidget").classList.remove("is-open");
  $("#chatWidget").setAttribute("aria-hidden", "true");
  $("#chatFab").classList.remove("is-hidden");
  document.body.classList.remove("chat-open");
  chatTrigger?.focus?.();
}

function setupChat() {
  $$('[data-open-chat]').forEach((button) => button.addEventListener("click", openChat));
  $("#chatClose").addEventListener("click", closeChat);
  $("#chatSearchToggle").addEventListener("click", () => {
    $("#chatSearch").classList.toggle("is-visible");
    if ($("#chatSearch").classList.contains("is-visible")) $("#messageSearch").focus();
  });
  $("#messageSearch").addEventListener("input", renderMessages);
  $("#clearSearch").addEventListener("click", () => { $("#messageSearch").value = ""; renderMessages(); });
  $$("#quickReplies button").forEach((button) => button.addEventListener("click", () => { $("#chatInput").value = button.textContent; $("#chatInput").focus(); }));

  const input = $("#chatInput");
  let typingTimer;
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 90)}px`;
    if (socket?.connected) {
      socket.emit("typing", { room: sessionId, active: true });
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => socket.emit("typing", { room: sessionId, active: false }), 900);
    }
  });

  $("#chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    const file = $("#chatFile").files[0];
    if (!text && !file) return;
    let attachment = {};
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Файл больше 5 МБ. Выберите другой.");
        return;
      }
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("room", sessionId);
        const response = await fetch("/api/uploads", { method: "POST", body });
        if (!response.ok) throw new Error("upload");
        attachment = await response.json();
      } catch {
        showToast("Сервер недоступен: файл не отправлен.");
        return;
      }
    }
    const message = { id: createUuid(), room: sessionId, author: "visitor", text, ...attachment, createdAt: new Date().toISOString() };
    if (socket?.connected) socket.emit("message", message); else addMessage(message);
    input.value = "";
    input.style.height = "auto";
    $("#chatFile").value = "";
    socket?.emit("typing", { room: sessionId, active: false });
  });

  loadMessages();
  connectChat();
}

function setupMotion() {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    $$(".reveal").forEach((element) => {
      element.style.setProperty("--delay", `${element.dataset.delay || 0}ms`);
      observer.observe(element);
    });
  } else {
    $$(".reveal").forEach((element) => element.classList.add("is-visible"));
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const box = card.getBoundingClientRect();
        const rotateX = ((event.clientY - box.top) / box.height - .5) * -2;
        const rotateY = ((event.clientX - box.left) / box.width - .5) * 2;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }
}

function setupNavigation() {
  const header = $(".site-header");
  const back = $("#backToTop");
  const links = $$(".site-nav a");
  const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);

  const updateNavigation = () => {
    header.classList.toggle("is-scrolled", scrollY > 10);
    back.classList.toggle("visible", scrollY > 550);
    let current = "";
    sections.forEach((section) => { if (scrollY >= section.offsetTop - 120) current = `#${section.id}`; });
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === current));
  };

  window.addEventListener("scroll", updateNavigation, { passive: true });
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
  updateNavigation();
}

window.addEventListener("load", () => {
  initializeSiteConfig();
  setupLeadForm();
  setupCalculator();
  setupCopyButtons();
  setupGallery();
  setupImages();
  setupChat();
  setupMotion();
  setupNavigation();
  setText("#currentYear", new Date().getFullYear());
  window.lucide?.createIcons();
  setTimeout(() => $("#pageLoader").classList.add("is-hidden"), 260);
});
