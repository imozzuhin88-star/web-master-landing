(() => {
  const overlay = document.querySelector('#circleIntro');
  if (!overlay) return;

  const rings = [...overlay.querySelectorAll('.intro-ring')];
  const dots = [...overlay.querySelectorAll('.intro-dot')];
  const core = overlay.querySelector('.intro-core');
  const label = overlay.querySelector('.intro-caption');
  const radii = [62, 112, 178, 252, 340, 440];
  const maskedReveal = CSS.supports('mask-image', 'radial-gradient(black, transparent)') ||
    CSS.supports('-webkit-mask-image', 'radial-gradient(black, transparent)');
  let frame;
  let started;
  let openingStart;
  let hiddenAt;
  let safetyTimer;
  let finished = false;
  let running = false;
  const inertTargets = new Map();
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => 1 - Math.pow(1 - value, 3);
  const smooth = value => value * value * (3 - 2 * value);

  function finish(skipped = false) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    clearTimeout(safetyTimer);
    overlay.hidden = true;
    overlay.dataset.phase = skipped ? 'skipped' : 'complete';
    document.documentElement.classList.remove('circle-intro-active');
    document.documentElement.dataset.entryComplete = 'true';
    inertTargets.forEach((wasInert, element) => { element.inert = wasInert; });
    document.querySelector('#pageLoader')?.classList.add('is-hidden');
    if (overlay.contains(document.activeElement)) {
      document.querySelector('.brand')?.focus({ preventScroll: true });
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('keydown', onKeyDown);
    document.dispatchEvent(new Event('landing-entry-complete'));
  }

  function draw(now) {
    if (finished) return;
    started ??= now;
    const time = now - started;
    overlay.dataset.phase = time < 1250 ? 'expand' : time < 2250 ? 'merge' : 'ready';
    const expansion = ease(clamp(time / 1250));
    const merger = smooth(clamp((time - 1250) / 1000));
    rings.forEach((ring, index) => {
      const radius = radii[index] * expansion * (1 - merger) + 158 * merger;
      ring.setAttribute('r', radius.toFixed(2));
      ring.style.opacity = String((.24 + index * .1) * (1 - merger) + .78 * merger);
      const direction = index % 2 ? -.00047 : .00036;
      const angle = (index * 1.24 + time * direction) * (1 - merger) +
        (-Math.PI / 2 + index * .035) * merger;
      dots[index].setAttribute('cx', (500 + Math.cos(angle) * radius).toFixed(2));
      dots[index].setAttribute('cy', (500 + Math.sin(angle) * radius).toFixed(2));
      dots[index].style.opacity = String(time < 200 ? time / 200 : 1 - merger * .4);
    });
    core.style.opacity = String(clamp((time - 1050) / 600));
    core.style.transform = `translate(-50%,-50%) scale(${.96 + merger * .04})`;

    if (time >= 2250) {
      const ready = document.readyState === 'complete' || time > 7000;
      label.textContent = ready ? 'WEB MASTER' : 'ЗАГРУЖАЕМ СТРАНИЦУ';
      if (ready) openingStart ??= now;
      if (openingStart !== undefined) {
        overlay.dataset.phase = 'reveal';
        const progress = smooth(clamp((now - openingStart) / 950));
        if (maskedReveal) {
          const radius = progress * Math.hypot(innerWidth, innerHeight) * .6;
          const mask = `radial-gradient(circle at 50% 50%,transparent ${radius.toFixed(2)}px,#000 ${(radius + 1.5).toFixed(2)}px)`;
          overlay.style.maskImage = mask;
          overlay.style.webkitMaskImage = mask;
        } else {
          overlay.style.opacity = String(1 - progress);
        }
        if (progress >= 1) { finish(); return; }
      }
    }
    frame = requestAnimationFrame(draw);
  }

  function onVisibilityChange() {
    if (finished) return;
    if (document.hidden) {
      hiddenAt = performance.now();
      cancelAnimationFrame(frame);
      clearTimeout(safetyTimer);
      running = false;
      return;
    }
    if (running) return;
    if (hiddenAt !== undefined && started !== undefined) {
      const pause = performance.now() - hiddenAt;
      started += pause;
      if (openingStart !== undefined) openingStart += pause;
    }
    hiddenAt = undefined;
    running = true;
    // External fonts or icon scripts must never trap a visitor behind the intro.
    safetyTimer = setTimeout(() => finish(), 10000);
    frame = requestAnimationFrame(draw);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') finish(true);
  }

  // Keep keyboard focus in the visible intro until the page has been revealed.
  [...document.body.children].forEach(element => {
    if (element === overlay || ['SCRIPT', 'STYLE'].includes(element.tagName)) return;
    inertTargets.set(element, element.inert);
    element.inert = true;
  });
  overlay.hidden = false;
  document.documentElement.classList.add('circle-intro-active');
  overlay.querySelector('button').addEventListener('click', () => finish(true));
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisibilityChange);
  onVisibilityChange();
})();
