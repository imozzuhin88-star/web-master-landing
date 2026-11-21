/* Approved landing motion: no backend dependencies. */
(function setupPortfolioMotion() {

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = document.createElement('div'); stage.className = 'motion-stage';
stage.innerHTML = '<div class="motion-browser"><div class="motion-toolbar">● ● ● <span style="float:right">ваш будущий сайт</span></div><div class="motion-body"><div class="motion-piece motion-mini-nav" style="--i:0"><b>YOUR STUDIO</b><span>Проекты / Контакты</span></div><div><div class="motion-piece motion-mini-copy" style="--i:1">Из идеи.<br><em>В настоящий<br>сайт.</em></div><div class="motion-piece motion-lines" style="--i:3"><span></span><span></span></div><span class="motion-piece motion-mini-button" style="--i:4">Обсудить проект</span></div><div class="motion-piece motion-mini-art" style="--i:2"><strong>CREATE</strong></div></div></div><div class="motion-caption"><span>Структура. Дизайн. Запуск.</span></div>';
document.querySelector('.hero-visual').prepend(stage);


const status = stage.querySelector('.motion-caption > span');


const control = document.createElement('label');
control.className = 'motion-preference';
control.innerHTML = '<input type="checkbox"> Анимация';
stage.append(control);
const enabled = control.querySelector('input');
let preference;
try { preference = localStorage.getItem('web-master-motion'); } catch {}
enabled.checked = preference ? preference === 'on' : !reduced;
enabled.addEventListener('change', () => {
  try { localStorage.setItem('web-master-motion', enabled.checked ? 'on' : 'off'); } catch {}
  updateStudy();
});
let activeAnimations = [];
let generation = 0;
async function playAssembly() {
  const current = ++generation;
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations = [];
  if (!enabled.checked) {
    stage.dataset.assemblyState = 'skipped';
    status.textContent = 'Структура. Дизайн. Запуск.';
    return;
  }
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
enabled.addEventListener('change', playAssembly);
const miniCta = stage.querySelector('.motion-mini-button');
const realLink = document.createElement('a');
realLink.className = miniCta.className;
realLink.style.cssText = miniCta.style.cssText;
realLink.href = '#request';
realLink.textContent = 'Обсудить свой сайт';
miniCta.replaceWith(realLink);
// Start the miniature after the page entrance, so it is not hidden behind tiles.
document.addEventListener('page-assembly-complete', playAssembly, { once: true });

const showcase = document.createElement('div');showcase.className='motion-project-showcase';
showcase.innerHTML='<div class="motion-project-frame"><img src="assets/steam-desktop.webp" width="1280" height="800" alt="Интерфейс Steam 2.0"></div><div class="motion-project-copy"><p class="eyebrow">Проект в движении</p><h3>Один экран.<br>Целая история.</h3><p>При прокрутке превью раскрывается, а детали появляются по очереди.</p><span class="motion-feature">Магазин и подборки игр</span><span class="motion-feature">Библиотека под рукой</span><span class="motion-feature">Компьютер и телефон</span></div>';
document.querySelector('.project-list').before(showcase);
const pathList=document.querySelector('.process-list');pathList.classList.add('motion-path');
let queued=false;
function updateStudy(){queued=false;const h=innerHeight;const r=showcase.getBoundingClientRect();const p=Math.max(0,Math.min(1,(h*.88-r.top)/(h*.65)));const frame=showcase.querySelector('.motion-project-frame');if(enabled.checked){frame.style.transform='scale('+(.84+p*.16)+') rotate('+(-4+p*4)+'deg)';frame.style.opacity=String(.65+p*.35);}showcase.querySelectorAll('.motion-feature').forEach((el,i)=>el.classList.toggle('active',!enabled.checked||p>.2+i*.23));const pr=pathList.getBoundingClientRect();pathList.style.setProperty('--path-progress',enabled.checked?Math.max(0,Math.min(1,(h*.72-pr.top)/pr.height)):1);pathList.querySelectorAll('li').forEach(el=>el.classList.toggle('path-active',!enabled.checked||el.getBoundingClientRect().top<h*.72));}
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateStudy);}},{passive:true});addEventListener('resize',updateStudy);updateStudy();


(() => {
  const root = document.createElement('div');
  root.className = 'page-assembly';
  root.setAttribute('aria-hidden','true');
  document.body.append(root);
  let animations = [];
  let sequence = 0;
  let autoplayDone = false;
  function stop() {
    sequence++;
    animations.forEach(a=>a.cancel());
    animations=[];
    root.replaceChildren();
    root.hidden=true;
    document.body.classList.remove('page-is-assembling');
  }
  async function assemble() {
    stop();
    const run = sequence;
    const setting = document.querySelector('.motion-preference input');
    if (setting && !setting.checked) {
      root.hidden = true;
      root.dataset.state = 'skipped';
      document.dispatchEvent(new Event('page-assembly-complete'));
      return;
    }
    root.hidden=false;
    root.dataset.state='running';
    root.dataset.run=String(run);
    document.body.classList.add('page-is-assembling');
    const columns=Math.max(5,Math.min(13,Math.ceil(innerWidth/105)));
    const rows=Math.ceil(innerHeight/(innerWidth/columns));
    root.style.setProperty('--tile-columns',columns);
    root.style.setProperty('--tile-rows',rows);
    const fragment=document.createDocumentFragment();
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const tile=document.createElement('span');
      tile.className='page-assembly-tile';
      tile.style.setProperty('--tile-hue',String(270+(x+y)%4*8));
      tile.dataset.x=x;tile.dataset.y=y;
      fragment.append(tile);
    }
    root.append(fragment);
    const tiles=[...root.children];
    tiles.forEach(tile=>{
      const x=Number(tile.dataset.x),y=Number(tile.dataset.y);
      const distance=Math.hypot((x-columns*.48)*.9,(y-rows*.38)*1.15);
      const delay=180+distance*95+((x*7+y*11)%5)*28;
      animations.push(tile.animate([
        {opacity:1,transform:'perspective(700px) translate3d(0,0,0) rotateX(0deg) scale(1.025)',offset:0,background:'#100d18'},
        {opacity:1,transform:'perspective(700px) translate3d(0,0,0) rotateX(0deg) scale(.94)',offset:.22,background:'#55336f'},
        {opacity:.65,transform:'perspective(700px) translate3d(0,-9px,20px) rotateX(24deg) scale(.65)',offset:.56,background:'#392347'},
        {opacity:0,transform:'perspective(700px) translate3d(0,-24px,70px) rotateX(65deg) scale(.12)',background:'#100d18'}
      ],{duration:950,delay,easing:'cubic-bezier(.2,.65,.25,1)',fill:'both'}));
    });
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    if(run!==sequence)return;
    root.dataset.state='finished';
    root.replaceChildren();
    root.hidden=true;
    document.body.classList.remove('page-is-assembling');
    document.dispatchEvent(new Event('page-assembly-complete'));
  }
  document.querySelector('.motion-preference input')?.addEventListener('change',event=>{
    if(!event.target.checked)stop();
  });
  function tryAutoplay(){
    const loader=document.querySelector('#pageLoader');
    if(autoplayDone||document.visibilityState!=='visible'||(loader&&!loader.classList.contains('is-hidden')))return;
    autoplayDone=true;
    observer?.disconnect();
    document.removeEventListener('visibilitychange',tryAutoplay);
    requestAnimationFrame(()=>requestAnimationFrame(assemble));
  }
  const loader=document.querySelector('#pageLoader');
  const observer=loader?new MutationObserver(tryAutoplay):null;
  observer?.observe(loader,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',tryAutoplay);
  tryAutoplay();
  // Never leave an opaque transition over an unusable page.
  setTimeout(()=>{if(!autoplayDone){root.hidden=true;}},7000);
})();


(() => {
  const cards = [...document.querySelectorAll('.project-list .project-card')];
  const setting = document.querySelector('.motion-preference input');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => setting ? setting.checked : !reduced.matches;
  cards.forEach(card => {
    card.classList.add('depth-card');
    const shine = document.createElement('span');
    shine.className = 'depth-shine';
    shine.setAttribute('aria-hidden','true');
    card.append(shine);
    let bounds, frame, timeout, lastX=.5, lastY=.5;
    function paint() {
      frame = 0;
      if(!allowed()) return reset();
      card.style.setProperty('--depth-x',((.5-lastY)*10).toFixed(2)+'deg');
      card.style.setProperty('--depth-y',((lastX-.5)*12).toFixed(2)+'deg');
      card.style.setProperty('--depth-light-x',(lastX*100).toFixed(1)+'%');
      card.style.setProperty('--depth-light-y',(lastY*100).toFixed(1)+'%');
      card.style.setProperty('--depth-scale','1.012');
      card.style.setProperty('--depth-glow','1');
      card.classList.add('depth-active');
    }
    function move(event) {
      if(!allowed() || event.pointerType==='touch') return;
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
      if(event.pointerType!=='touch'||!allowed())return;
      lastX=.65;lastY=.35;paint();timeout=setTimeout(reset,400);
    },{passive:true});
    card.addEventListener('pointerup',event=>{
      if(event.pointerType==='touch'){clearTimeout(timeout);timeout=setTimeout(reset,180);}
    },{passive:true});
    card.addEventListener('focusin',()=>{if(allowed()){lastX=.5;lastY=.4;paint();}});
    card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget))reset();});
    setting?.addEventListener('change',reset);
    reduced.addEventListener('change',reset);
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
    const motion=document.querySelector('.motion-preference input');
    const enabled=motion?motion.checked:!matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(enabled){
      activeAnimation=frame.animate([{width:before+'px',borderRadius:oldRadius},{width:after+'px',borderRadius:device==='mobile'?'24px':'8px'}],{duration:700,easing:'cubic-bezier(.22,.75,.2,1)'});
      frame.querySelector('img[data-device="'+device+'"]').animate([{opacity:.25},{opacity:1}],{duration:500,easing:'ease-out'});
      await activeAnimation.finished.catch(()=>{});
    }
    if(run===sequence)frame.dataset.transition='finished';
  }
  controls.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>selectDevice(button.dataset.device)));
})();

})();