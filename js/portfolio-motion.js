/* Approved landing motion: no backend dependencies. */
(function setupPortfolioMotion() {

const stage = document.createElement('div'); stage.className = 'motion-stage';
stage.innerHTML = '<div class="motion-browser"><div class="motion-toolbar">● ● ● <span style="float:right">ваш будущий сайт</span></div><div class="motion-body"><div class="motion-piece motion-mini-nav" style="--i:0"><b>YOUR STUDIO</b><span>Проекты / Контакты</span></div><div><div class="motion-piece motion-mini-copy" style="--i:1">Из идеи.<br><em>В настоящий<br>сайт.</em></div><div class="motion-piece motion-lines" style="--i:3"><span></span><span></span></div><span class="motion-piece motion-mini-button" style="--i:4">Обсудить проект</span></div><div class="motion-piece motion-mini-art" style="--i:2"><strong>CREATE</strong></div></div></div><div class="motion-caption"><span>Структура. Дизайн. Запуск.</span></div>';
document.querySelector('.hero-visual').prepend(stage);


const status = stage.querySelector('.motion-caption > span');


// The owner removed the motion switch. Old saved preferences must not disable
// effects when there is no longer a visible control to enable them again.
document.body.dataset.motion = 'on';
document.body.classList.add('motion-ready');

// The original reveals were gated by a separate OS-only setting. Use the site
// presentation here as well, including when the browser reports reduced motion.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -56px' });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
}
let activeAnimations = [];
let generation = 0;
async function playAssembly() {
  const current = ++generation;
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations = [];
  status.textContent = 'Структура. Дизайн. Запуск.';
  stage.dataset.assemblyState = 'running';
  stage.dataset.assemblyRun = String(current);
  stage.querySelectorAll('.motion-piece').forEach((element, index) => {
    element.style.animation = 'none';
    const order = Number(element.style.getPropertyValue('--i')) || index;
    activeAnimations.push(element.animate([
      { opacity:0, transform:'translate3d(0,65px,-150px) rotateX(18deg) scale(.9)', filter:'blur(10px)' },
      { opacity:1, transform:'translate3d(0,0,0) rotateX(0deg) scale(1)', filter:'blur(0)' }
    ], {duration:1100, delay:order*250, easing:'cubic-bezier(.16,1,.3,1)', fill:'both'}));
  });
  await Promise.all(activeAnimations.map(animation => animation.finished.catch(() => {})));
  if (current !== generation) return;
  stage.dataset.assemblyState = 'finished';
  status.textContent = 'Структура. Дизайн. Запуск.';
}
const miniCta = stage.querySelector('.motion-mini-button');
const realLink = document.createElement('a');
realLink.className = miniCta.className;
realLink.style.cssText = miniCta.style.cssText;
realLink.href = '#request';
realLink.textContent = 'Обсудить свой сайт';
miniCta.replaceWith(realLink);
// Start the miniature after the circle entrance, including an early skip.
document.addEventListener('landing-entry-complete', playAssembly, { once: true });
if (document.documentElement.dataset.entryComplete === 'true') playAssembly();

const showcase = document.createElement('div');showcase.className='motion-project-showcase';
showcase.innerHTML='<div class="motion-project-frame"><img src="assets/steam-desktop.webp" width="1280" height="800" alt="Интерфейс Steam 2.0"></div><div class="motion-project-copy"><p class="eyebrow">Проект в движении</p><h3>Один экран.<br>Целая история.</h3><p>При прокрутке превью раскрывается, а детали появляются по очереди.</p><span class="motion-feature">Магазин и подборки игр</span><span class="motion-feature">Библиотека под рукой</span><span class="motion-feature">Компьютер и телефон</span></div>';
document.querySelector('.project-list').before(showcase);
const pathList=document.querySelector('.process-list');pathList.classList.add('motion-path');
let queued=false;
function updateStudy() {
  queued = false;
  const height = innerHeight;
  const rect = showcase.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (height * .88 - rect.top) / (height * .65)));
  const pageProgress = Math.max(0, Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - height)));
  document.body.style.setProperty('--ambient-x', (Math.sin(pageProgress * Math.PI * 2) * 11).toFixed(2) + '%');
  document.body.style.setProperty('--ambient-y', (Math.cos(pageProgress * Math.PI * 2) * 8).toFixed(2) + '%');
  document.body.style.setProperty('--strip-turn', (scrollY * .07).toFixed(1) + 'deg');
  showcase.querySelectorAll('.motion-feature').forEach((element, index) => {
    element.classList.toggle('active', progress > .2 + index * .23);
  });
  const pathRect = pathList.getBoundingClientRect();
  const pathProgress = Math.max(0, Math.min(1, (height * .72 - pathRect.top) / pathRect.height));
  pathList.style.setProperty('--path-progress', pathProgress);
  pathList.querySelectorAll('li').forEach(element => {
    element.classList.toggle('path-active', element.getBoundingClientRect().top < height * .72);
  });
}
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateStudy);}},{passive:true});addEventListener('resize',updateStudy);updateStudy();


// The circle intro owns the page entrance.
(() => {
  const cards = [...document.querySelectorAll('.project-list .project-card')];
  cards.forEach(card => {
    card.classList.add('depth-card');
    const shine = document.createElement('span');
    shine.className = 'depth-shine';
    shine.setAttribute('aria-hidden','true');
    card.append(shine);
    let bounds, frame, timeout, lastX=.5, lastY=.5;
    function paint() {
      frame = 0;
      card.style.setProperty('--depth-x',((.5-lastY)*10).toFixed(2)+'deg');
      card.style.setProperty('--depth-y',((lastX-.5)*12).toFixed(2)+'deg');
      card.style.setProperty('--depth-light-x',(lastX*100).toFixed(1)+'%');
      card.style.setProperty('--depth-light-y',(lastY*100).toFixed(1)+'%');
      card.style.setProperty('--depth-scale','1.012');
      card.style.setProperty('--depth-glow','1');
      card.classList.add('depth-active');
    }
    function move(event) {
      if(event.pointerType==='touch') return;
      bounds ||= card.getBoundingClientRect();
      lastX=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
      lastY=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));
      if(!frame) frame=requestAnimationFrame(paint);
    }
    function reset() {
      clearTimeout(timeout);
      if(frame) cancelAnimationFrame(frame);
      frame=0;bounds=null;
      card.classList.remove('depth-active');
      card.style.setProperty('--depth-x','0deg');
      card.style.setProperty('--depth-y','0deg');
      card.style.setProperty('--depth-scale','1');
      card.style.setProperty('--depth-glow','0');
    }
    card.addEventListener('pointerenter',event=>{bounds=card.getBoundingClientRect();move(event);});
    card.addEventListener('pointermove',move,{passive:true});
    card.addEventListener('pointerleave',reset);
    card.addEventListener('pointercancel',reset);
    card.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='touch')return;
      lastX=.65;lastY=.35;paint();timeout=setTimeout(reset,400);
    },{passive:true});
    card.addEventListener('pointerup',event=>{
      if(event.pointerType==='touch'){clearTimeout(timeout);timeout=setTimeout(reset,180);}
    },{passive:true});
    card.addEventListener('focusin',()=>{lastX=.5;lastY=.4;paint();});
    card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget))reset();});
    addEventListener('blur',reset);
  });
})();


(() => {
  const section=document.querySelector('.motion-project-showcase');
  const frame=section?.querySelector('.motion-project-frame');
  if(!frame)return;
  const area=document.createElement('div');area.className='device-preview';
  frame.before(area);area.append(frame);
  frame.classList.add('device-frame');
  frame.dataset.device='desktop';
  frame.innerHTML='<div class="device-toolbar" aria-hidden="true">● ● ●</div><div class="device-screen"><img data-device="desktop" src="assets/steam-desktop.webp" width="1280" height="800" alt="Steam 2.0 на компьютере"><img hidden data-device="mobile" src="assets/steam-mobile.webp" width="390" height="780" alt="Steam 2.0 на телефоне"></div>';
  const copy=section.querySelector('.motion-project-copy');
  copy.querySelector('h3').innerHTML='Один проект.<br>Разные экраны.';
  copy.querySelector('p:not(.eyebrow)').textContent='Переключите устройство: рамка плавно меняет форму и показывает снимок проекта для выбранного экрана.';
  const controls=document.createElement('div');controls.className='device-options';
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Устройство предпросмотра');
  controls.innerHTML='<button type="button" data-device="desktop" aria-pressed="true">Компьютер</button><button type="button" data-device="mobile" aria-pressed="false">Телефон</button>';
  const state=document.createElement('p');state.className='device-state';state.setAttribute('role','status');state.textContent='Версия для компьютера';
  copy.querySelector('p:not(.eyebrow)').after(controls,state);
  let activeAnimation,sequence=0;
  async function selectDevice(device){
    if(frame.dataset.device===device)return;
    const run=++sequence;
    const before=frame.getBoundingClientRect().width;
    const oldRadius=getComputedStyle(frame).borderRadius;
    activeAnimation?.cancel();
    frame.dataset.device=device;
    frame.dataset.transition='running';
    frame.style.width=device==='mobile'?'min(52%,205px)':'100%';
    frame.style.borderRadius=device==='mobile'?'24px':'8px';
    frame.querySelector('.device-toolbar').textContent=device==='mobile'?'━━━━':'● ● ●';
    frame.querySelectorAll('img').forEach(image=>image.hidden=image.dataset.device!==device);
    controls.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.device===device)));
    state.textContent=device==='mobile'?'Версия для телефона':'Версия для компьютера';
    const after=frame.getBoundingClientRect().width;
      activeAnimation=frame.animate([{width:before+'px',borderRadius:oldRadius},{width:after+'px',borderRadius:device==='mobile'?'24px':'8px'}],{duration:700,easing:'cubic-bezier(.22,.75,.2,1)'});
      frame.querySelector('img[data-device="'+device+'"]').animate([{opacity:.25},{opacity:1}],{duration:500,easing:'ease-out'});
      await activeAnimation.finished.catch(()=>{});
    if(run===sequence)frame.dataset.transition='finished';
  }
  controls.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>selectDevice(button.dataset.device)));
})();

})();
