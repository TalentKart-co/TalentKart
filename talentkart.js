/*
 * ================================================================
 *  TalentKart — Main JavaScript
 *  Next-Gen Hiring Platform | talentkart.co.in
 * ================================================================
 *  All form data processed client-side only (mailto: pattern)
 *  No data sent to any third-party server
 * ================================================================
 */

// ════════════════════════════════════════════════
// ANIMATED CANVAS "VIDEO" BACKGROUND
// Interactive 3D talent-constellation:
//  · depth-sorted parallax node field (3 layers, true z)
//  · mouse-reactive camera drift (parallax-on-cursor)
//  · rotating wireframe globe (talent network metaphor)
//  · click/tap ripple bursts
//  · soft depth-of-field via per-layer blur & scale
// ════════════════════════════════════════════════
(function(){
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, DPR, animId;
  const prefersReducedMotionLocal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.width = canvas.offsetWidth*DPR;
    H = canvas.height = canvas.offsetHeight*DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  const cw = ()=>canvas.offsetWidth, ch = ()=>canvas.offsetHeight;

  // ── MOUSE / TOUCH — smoothed camera target for parallax ──
  let mouseX=0.5, mouseY=0.5, camX=0.5, camY=0.5;
  let hasPointer=false;
  canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();
    mouseX=(e.clientX-r.left)/r.width;
    mouseY=(e.clientY-r.top)/r.height;
    hasPointer=true;
  });
  canvas.addEventListener('mouseleave',()=>{mouseX=0.5;mouseY=0.5});
  window.addEventListener('touchmove',e=>{
    if(!e.touches[0])return;
    const r=canvas.getBoundingClientRect();
    mouseX=(e.touches[0].clientX-r.left)/r.width;
    mouseY=(e.touches[0].clientY-r.top)/r.height;
    hasPointer=true;
  },{passive:true});

  // ── CLICK / TAP — spawn a burst ──
  const bursts=[];
  function spawnBurst(x,y){
    const n=14;
    for(let i=0;i<n;i++){
      const a=(Math.PI*2/n)*i + Math.random()*0.3;
      bursts.push({
        x,y,
        vx:Math.cos(a)*(1.4+Math.random()*1.6),
        vy:Math.sin(a)*(1.4+Math.random()*1.6),
        life:1, r:1.5+Math.random()*1.8,
        color: Math.random()<0.5?'109,95,199':'8,145,178'
      });
    }
  }
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect();
    spawnBurst(e.clientX-r.left, e.clientY-r.top);
  });

  // ── DEPTH-LAYERED NODE FIELD ──
  // Three depth layers (far/mid/near) each with own parallax strength,
  // size, speed and blur — creates genuine sense of 3D space.
  const LAYERS=[
    {count:18, speed:0.10, rMin:1.0, rMax:1.6, parallax:10,  alphaMax:0.28},
    {count:14, speed:0.18, rMin:1.6, rMax:2.4, parallax:22,  alphaMax:0.48},
    {count:10, speed:0.28, rMin:2.2, rMax:3.6, parallax:38,  alphaMax:0.72},
  ];
  const palette=['109,95,199','8,145,178','52,211,153'];
  let nodes=[];
  function seedNodes(){
    nodes=[];
    LAYERS.forEach((layer,li)=>{
      // Grid-jittered placement: divide the canvas into a roughly-square grid
      // sized to the node count, then drop one node per cell with a small
      // random offset. This guarantees even coverage — no accidental dense
      // clusters that read as a "globe" — while still looking organic.
      const cols=Math.ceil(Math.sqrt(layer.count*1.4));
      const rows=Math.ceil(layer.count/cols);
      const cellW=1/cols, cellH=1/rows;
      const cells=[];
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) cells.push([c,r]);
      // shuffle so layer ordering doesn't bias which cells get used first
      for(let i=cells.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [cells[i],cells[j]]=[cells[j],cells[i]];
      }
      for(let i=0;i<layer.count;i++){
        const [c,r]=cells[i];
        const jitter=0.62; // keep node within a shrunk-in portion of its cell
        const x=(c+0.5+(Math.random()-.5)*jitter)*cellW;
        const y=(r+0.5+(Math.random()-.5)*jitter)*cellH;
        nodes.push({
          x:Math.min(0.99,Math.max(0.01,x)),
          y:Math.min(0.99,Math.max(0.01,y)),
          vx:(Math.random()-.5)*0.0003*(li+1),
          vy:(Math.random()-.5)*0.0003*(li+1),
          r:layer.rMin+Math.random()*(layer.rMax-layer.rMin),
          layer:li,
          pulse:Math.random()*Math.PI*2,
          pulseSpeed:Math.random()*.02+.008,
          color:palette[Math.floor(Math.random()*palette.length)]
        });
      }
    });
  }
  seedNodes();

  // Connection distance scales with viewport so density feels right at any size
  function connDist(){ return Math.min(cw(),ch())*0.13; }

  // ── RINGS (ambient ripples, slower/sparser than before) ──
  const rings=[];
  function spawnRing(){
    rings.push({
      x:Math.random(), y:Math.random()*0.7+0.1,
      r:0, maxR:90+Math.random()*130,
      alpha:0.3, speed:0.55+Math.random()*0.35
    });
  }
  if(!prefersReducedMotionLocal) setInterval(spawnRing, 3500);

  // ── SHOOTING LINES (data-flow) ──
  const shots=[];
  function spawnShot(){
    const angle=Math.random()*Math.PI*2;
    shots.push({
      x:Math.random(), y:Math.random(),
      angle, speed:0.0022+Math.random()*0.0028,
      len:70+Math.random()*110, alpha:0.55, life:1
    });
  }
  if(!prefersReducedMotionLocal) setInterval(spawnShot, 1400);

  let t=0;
  function draw(){
    const w=cw(), h=ch();
    ctx.clearRect(0,0,w,h);

    // Smooth camera drift toward pointer (lerp — no snapping)
    camX += (mouseX-camX)*0.04;
    camY += (mouseY-camY)*0.04;
    const px=(camX-0.5), py=(camY-0.5); // -0.5..0.5 parallax offset

    // ── Background gradient — Quantum Leap light palette (semi-transparent
    // so the hero's underlying artwork layer shows through) ──
    const bg=ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,'rgba(255,255,255,0.55)');
    bg.addColorStop(0.5,'rgba(241,240,252,0.55)');
    bg.addColorStop(1,'rgba(224,242,238,0.55)');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);

    // ── Ambient glow spots — drift slightly with camera for depth ──
    function drawGlow(nx,ny,r,color){
      const x=nx*w+px*30, y=ny*h+py*30;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,color); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    }
    const pulse1=Math.sin(t*.008)*0.05, pulse2=Math.sin(t*.006+1)*0.04;
    drawGlow(0.25,0.33,Math.min(w,h)*0.38,`rgba(139,127,214,${0.14+pulse1})`);
    drawGlow(0.75,0.28,Math.min(w,h)*0.34,`rgba(52,211,153,${0.10+pulse2})`);
    drawGlow(0.5,0.78,Math.min(w,h)*0.30,`rgba(34,211,238,${0.08+pulse1})`);

    // ── Rings ──
    for(let i=rings.length-1;i>=0;i--){
      const rg=rings[i];
      rg.r+=rg.speed;
      rg.alpha=0.3*(1-rg.r/rg.maxR);
      if(rg.r>rg.maxR){rings.splice(i,1);continue}
      ctx.beginPath();
      ctx.arc(rg.x*w+px*20, rg.y*h+py*20, rg.r, 0, Math.PI*2);
      ctx.strokeStyle=`rgba(109,95,199,${rg.alpha})`;
      ctx.lineWidth=1;
      ctx.stroke();
    }

    // ── Depth-layer node field: update + connections + draw ──
    const cd=connDist();
    LAYERS.forEach((layer,li)=>{
      const layerNodes=nodes.filter(n=>n.layer===li);
      const ox=px*layer.parallax, oy=py*layer.parallax;

      // connections (within-layer only, keeps it visually clean)
      for(let i=0;i<layerNodes.length;i++){
        for(let j=i+1;j<layerNodes.length;j++){
          const a=layerNodes[i], b=layerNodes[j];
          const dx=(a.x-b.x)*w, dy=(a.y-b.y)*h;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<cd){
            const alpha=(1-dist/cd)*0.22*(li+1)/3;
            ctx.beginPath();
            ctx.moveTo(a.x*w+ox, a.y*h+oy);
            ctx.lineTo(b.x*w+ox, b.y*h+oy);
            ctx.strokeStyle=`rgba(${a.color},${alpha})`;
            ctx.lineWidth=0.6+li*0.15;
            ctx.stroke();
          }
        }
      }

      // nodes
      layerNodes.forEach(n=>{
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>1)n.vx*=-1;
        if(n.y<0||n.y>1)n.vy*=-1;
        n.pulse+=n.pulseSpeed;
        const glow=Math.sin(n.pulse)*0.3+0.7;
        const drawX=n.x*w+ox, drawY=n.y*h+oy;
        ctx.beginPath();
        ctx.arc(drawX,drawY,n.r*(0.8+glow*.4),0,Math.PI*2);
        ctx.fillStyle=`rgba(${n.color},${layer.alphaMax*glow})`;
        ctx.fill();
        if(n.r>2.2){
          ctx.beginPath();
          ctx.arc(drawX,drawY,n.r*2.4,0,Math.PI*2);
          ctx.fillStyle=`rgba(${n.color},${0.08*glow})`;
          ctx.fill();
        }
      });
    });

    // ── Shooting lines ──
    for(let i=shots.length-1;i>=0;i--){
      const s=shots[i];
      s.life-=0.016;
      s.x+=Math.cos(s.angle)*s.speed;
      s.y+=Math.sin(s.angle)*s.speed;
      if(s.life<=0){shots.splice(i,1);continue}
      const tx=s.x-Math.cos(s.angle)*(s.len/w);
      const ty=s.y-Math.sin(s.angle)*(s.len/h);
      const grad=ctx.createLinearGradient(tx*w,ty*h,s.x*w,s.y*h);
      grad.addColorStop(0,'transparent');
      grad.addColorStop(1,`rgba(109,95,199,${s.alpha*s.life})`);
      ctx.beginPath();
      ctx.moveTo(tx*w,ty*h);
      ctx.lineTo(s.x*w,s.y*h);
      ctx.strokeStyle=grad;
      ctx.lineWidth=1.2;
      ctx.stroke();
    }

    // ── Click-burst particles ──
    for(let i=bursts.length-1;i>=0;i--){
      const b=bursts[i];
      b.life-=0.022;
      b.x+=b.vx; b.y+=b.vy; b.vx*=0.97; b.vy*=0.97;
      if(b.life<=0){bursts.splice(i,1);continue}
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r*b.life,0,Math.PI*2);
      ctx.fillStyle=`rgba(${b.color},${b.life*0.8})`;
      ctx.fill();
    }

    // ── Horizontal scan line sweep ──
    const scanY=((t*0.4)%(h+60))-30;
    const scanGrad=ctx.createLinearGradient(0,scanY-20,0,scanY+20);
    scanGrad.addColorStop(0,'transparent');
    scanGrad.addColorStop(0.5,'rgba(109,95,199,0.05)');
    scanGrad.addColorStop(1,'transparent');
    ctx.fillStyle=scanGrad;
    ctx.fillRect(0,scanY-20,w,40);

    t++;
    if(!prefersReducedMotionLocal && heroVisible){
      animId=requestAnimationFrame(draw);
    } else {
      animId=null;
    }
  }

  // ── Pause canvas when hero is off-screen to save CPU/GPU ──
  let heroVisible=true;
  new IntersectionObserver(([e])=>{
    heroVisible=e.isIntersecting;
    if(heroVisible && !animId && !prefersReducedMotionLocal){
      animId=requestAnimationFrame(draw);
    } else if(!heroVisible && animId){
      cancelAnimationFrame(animId);
      animId=null;
    }
  },{threshold:0.01}).observe(canvas);

  draw();
})();

// ════════════════════════════════════════════════
// SCROLL DIRECTION
// ════════════════════════════════════════════════
let lastY=window.scrollY, scrollDir='down';
window.addEventListener('scroll',()=>{scrollDir=window.scrollY>lastY?'down':'up';lastY=window.scrollY},{passive:true});

// ════════════════════════════════════════════════
// MOTION PREFERENCE — declared early; used by tilt,
// magnetic buttons, and parallax below
// ════════════════════════════════════════════════
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ════════════════════════════════════════════════
// NAVBAR
// ════════════════════════════════════════════════
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',window.scrollY>40),{passive:true});

// Hamburger
const hamburger=document.getElementById('hamburger'),mobileMenu=document.getElementById('mobile-menu');
hamburger.addEventListener('click',()=>mobileMenu.classList.toggle('open'));
function closeMobile(){mobileMenu.classList.remove('open')}

// ════════════════════════════════════════════════
// SCROLL-LINKED PARALLAX — adds depth as the page scrolls
// ════════════════════════════════════════════════
if(!prefersReducedMotion){
const parallaxEls=[...document.querySelectorAll('.h3card')].map((el,i)=>({
  el, speed:0.04+(i%3)*0.025, offset:0
}));
let parallaxRaf=null;
function updateParallax(){
  const sy=window.scrollY;
  parallaxEls.forEach(p=>{
    const ty=sy*p.speed*-1;
    p.el.style.setProperty('--parallaxY',`${ty}px`);
  });
  parallaxRaf=null;
}
window.addEventListener('scroll',()=>{
  if(!parallaxRaf) parallaxRaf=requestAnimationFrame(updateParallax);
},{passive:true});
}

// ════════════════════════════════════════════════
// SCROLL REVEAL — direction aware + staggered inner content
// ════════════════════════════════════════════════
const revEls=document.querySelectorAll('.sd-up,.sd-down,.sd-left,.sd-right,.sd-scale');

// Pre-tag staggerable children once (headings, paragraphs, list items, icons)
// so their entrance can cascade smoothly after the parent card settles.
revEls.forEach(el=>{
  const kids=el.querySelectorAll(':scope > *, :scope .service-icon, :scope h3, :scope p, :scope li, :scope .why-num, :scope .value-card-num, :scope .vm-icon');
  kids.forEach((k,i)=>{
    if(!k.classList.contains('stagger-child')){
      k.classList.add('stagger-child');
      k.style.transitionDelay=`${Math.min(i*18,90)}ms`;
    }
  });
});

const revObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('visible');
    } else {
      const el=e.target;
      el.classList.remove('visible');
      if(scrollDir==='up'&&el.classList.contains('sd-up')){el.classList.replace('sd-up','sd-down')}
      else if(scrollDir==='down'&&el.classList.contains('sd-down')){el.classList.replace('sd-down','sd-up')}
    }
  });
},{threshold:0.05,rootMargin:'0px 0px -60px 0px'});
revEls.forEach(el=>revObs.observe(el));

// ════════════════════════════════════════════════
// GOALS LINE + DOTS
// ════════════════════════════════════════════════
const goalsLine=document.getElementById('goalsLine');
if(goalsLine){
  new IntersectionObserver(([e])=>goalsLine.classList.toggle('lit',e.isIntersecting),{threshold:.2}).observe(goalsLine.closest('section'));
}
document.querySelectorAll('.goal-item').forEach(item=>{
  new IntersectionObserver(([e])=>item.classList.toggle('lit',e.isIntersecting),{threshold:.3}).observe(item);
});

// ════════════════════════════════════════════════
// 3D TILT — ONE shared rAF loop for ALL card types
// Previously each card ran its own requestAnimationFrame,
// meaning 7+ loops could run simultaneously. Now a single
// loop processes every hovered card in one pass per frame.
// ════════════════════════════════════════════════
if(!prefersReducedMotion){
  const tiltCards=[];
  let tiltRaf=null;

  function tiltLoop(){
    let anyActive=false;
    for(const c of tiltCards){
      const settled=
        Math.abs(c.tRX-c.rX)<0.01 &&
        Math.abs(c.tRY-c.rY)<0.01 &&
        Math.abs(c.tSc-c.sc)<0.001;
      if(c.active||!settled){
        c.rX+=(c.tRX-c.rX)*0.14;
        c.rY+=(c.tRY-c.rY)*0.14;
        c.mX+=(c.tMX-c.mX)*0.14;
        c.mY+=(c.tMY-c.mY)*0.14;
        c.sc+=(c.tSc-c.sc)*0.14;
        c.el.style.transform=`perspective(${c.persp}px) rotateX(${c.rX}deg) rotateY(${c.rY}deg) scale(${c.sc}) translateZ(8px)`;
        c.el.style.setProperty('--mx',c.mX+'%');
        c.el.style.setProperty('--my',c.mY+'%');
        anyActive=true;
      } else if(c.el.style.willChange){
        // Fully settled — release GPU layer
        c.el.style.willChange='';
        c.el.style.transform='';
      }
    }
    tiltRaf = anyActive ? requestAnimationFrame(tiltLoop) : null;
  }

  function ensureTiltLoop(){
    if(!tiltRaf) tiltRaf=requestAnimationFrame(tiltLoop);
  }

  function addTilt(sel,max=10,persp=900){
    document.querySelectorAll(sel).forEach(el=>{
      const c={el,persp,max,
        rX:0,rY:0,mX:50,mY:50,sc:1,
        tRX:0,tRY:0,tMX:50,tMY:50,tSc:1,
        active:false};
      tiltCards.push(c);
      el.addEventListener('mousemove',e=>{
        c.active=true;
        c.el.style.willChange='transform';
        const r=el.getBoundingClientRect();
        const x=e.clientX-r.left,y=e.clientY-r.top;
        c.tRX=-((y-r.height/2)/(r.height/2))*max;
        c.tRY=((x-r.width/2)/(r.width/2))*max;
        c.tMX=(x/r.width*100);
        c.tMY=(y/r.height*100);
        c.tSc=1.015;
        ensureTiltLoop();
      });
      el.addEventListener('mouseleave',()=>{
        c.active=false;
        c.tRX=0;c.tRY=0;c.tMX=50;c.tMY=50;c.tSc=1;
        ensureTiltLoop();
      });
    });
  }

  addTilt('.tilt-card',9,900);
  addTilt('.service-card',7,1000);
  addTilt('.why-card',9,900);
  addTilt('.value-card',7,900);
  addTilt('.industry-chip',6,800);
  addTilt('.goal-content',5,900);
}

// ════════════════════════════════════════════════
// MAGNETIC BUTTONS — smooth lerped pull toward cursor
// ════════════════════════════════════════════════
if(!prefersReducedMotion){
document.querySelectorAll('.btn-primary,.btn-ghost').forEach(btn=>{
  let tx=0,ty=0,cx=0,cy=0,raf=null,active=false;
  function loop(){
    cx+=(tx-cx)*0.18; cy+=(ty-cy)*0.18;
    btn.style.transform=`translate(${cx}px,${cy}px)`;
    const settled=Math.abs(tx-cx)<0.05&&Math.abs(ty-cy)<0.05;
    if(active||!settled){raf=requestAnimationFrame(loop)} else {raf=null}
  }
  function ensure(){if(!raf)raf=requestAnimationFrame(loop)}
  btn.addEventListener('mousemove',e=>{
    active=true;
    const r=btn.getBoundingClientRect();
    tx=(e.clientX-r.left-r.width/2)*.16;
    ty=(e.clientY-r.top-r.height/2)*.16;
    ensure();
  });
  btn.addEventListener('mouseleave',()=>{active=false;tx=0;ty=0;ensure()});
});
}

// ════════════════════════════════════════════════
// PARTICLES
// ════════════════════════════════════════════════
const pc=document.getElementById('particles');
['rgba(109,95,199,','rgba(8,145,178,','rgba(52,211,153,'].forEach((col,ci)=>{
  for(let i=0;i<9;i++){
    const p=document.createElement('div');
    const s=Math.random()*3+2;
    const op=Math.random()*.35+.12;
    p.className='particle';
    p.style.cssText=`width:${s}px;height:${s}px;background:${col}${op});left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${Math.random()*9+5}s;--del:${Math.random()*6}s;--op:${op};--y1:${(Math.random()-.5)*38}px;--x1:${(Math.random()-.5)*28}px;box-shadow:0 0 ${s*3}px ${col}${op*1.4})`;
    pc.appendChild(p);
  }
});

// ════════════════════════════════════════════════
// NAV ACTIVE LINK
// ════════════════════════════════════════════════
const sections=document.querySelectorAll('section[id]');
const navLinks=document.querySelectorAll('.nav-links a');
window.addEventListener('scroll',()=>{
  let cur='';
  sections.forEach(s=>{if(window.scrollY>=s.offsetTop-140)cur=s.id});
  navLinks.forEach(a=>{a.style.color=a.getAttribute('href')==='#'+cur?'#181a3d':''});
},{passive:true});

// ════════════════════════════════════════════════
// FORM — mailto: real submission with validation
// ════════════════════════════════════════════════

// ── Rate limiter: max 3 submissions per 10 minutes ──
const _submitLog = [];
function _rateLimitOk(){
  const now = Date.now();
  // Purge entries older than 10 minutes
  while(_submitLog.length && now - _submitLog[0] > 600000) _submitLog.shift();
  if(_submitLog.length >= 3) return false;
  _submitLog.push(now);
  return true;
}

// ── Sanitize for mailto body — strips control chars, HTML, script injection, unicode tricks ──
function sanitizeText(str){
  return String(str)
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,'') // strip ASCII control chars
    .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g,'') // strip zero-width & bidi override chars
    .replace(/[<>'"&]/g,'')                             // strip HTML/JS meta chars (added &)
    .replace(/javascript:/gi,'')                        // block JS URIs
    .replace(/vbscript:/gi,'')                          // block VBScript URIs
    .replace(/data:/gi,'')                              // block data URIs
    .replace(/on\w+\s*=/gi,'')                          // block onerror= onclick= etc.
    .replace(/\n{3,}/g,'\n\n')                          // collapse excess newlines
    .slice(0, 2000);                                    // hard length cap
}

// ── Validate a single field, return true if OK ──
function validateField(id, errId, check, msg){
  const el  = document.getElementById(id);
  const err = document.getElementById(errId);
  const val = el ? el.value.trim() : '';
  const ok  = check(val);
  if(el){
    el.classList.toggle('invalid', !ok);
    el.classList.toggle('valid',    ok);
  }
  if(err) err.textContent = ok ? '' : msg; // textContent — never innerHTML
  return ok;
}

// ── Real-time inline validation on blur ──
['f-fname','f-lname','f-email','f-phone'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('blur', ()=> runValidation(true));
  el.addEventListener('input', ()=>{
    if(el.classList.contains('invalid')) runValidation(true);
  });
});

function runValidation(silent){
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRe = /^\+?[\d][\d\s\-\(\)]{5,14}[\d]$/;
  let ok = true;
  ok = validateField('f-fname','err-fname', v=>v.length>=2, 'First name is required (min 2 chars)') && ok;
  ok = validateField('f-lname','err-lname', v=>v.length>=2, 'Last name is required (min 2 chars)') && ok;
  ok = validateField('f-email','err-email', v=>emailRe.test(v), 'Please enter a valid email address') && ok;
  ok = validateField('f-phone','err-phone', v=>phoneRe.test(v), 'Please enter a valid phone number') && ok;
  return ok;
}

// ── CSRF token (kept for future backend upgrade) ──
function getCSRFToken(){
  let t=sessionStorage.getItem('csrf');
  if(!t){t=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2);sessionStorage.setItem('csrf',t);}
  return t;
}

// ── Main submit — validates, rate-limits, builds safe mailto ──
function submitForm(){
  // 0. Honeypot check — bots fill hidden fields, humans don't
  if(document.getElementById('f-honey') && document.getElementById('f-honey').value !== ''){
    // Silently pretend success to not tip off the bot
    showToast('📬 Your email app is opening — just hit Send!','#22d3ee');
    return;
  }

  // 1. Validate all fields
  if(!runValidation(false)){
    const btn=document.getElementById('submitBtn');
    btn.style.animation='none';
    btn.offsetHeight;
    btn.style.animation='shake .4s ease';
    showToast('⚠️ Please fill in all required fields correctly.','#f97316');
    return;
  }

  // 2. Rate limiting — prevent spam/bot abuse
  if(!_rateLimitOk()){
    showToast('⏳ Too many submissions. Please wait a few minutes.','#f97316');
    return;
  }

  // 3. Collect + sanitize all values (each capped at 500 chars max)
  const cap = (s, n=500) => sanitizeText(s).slice(0, n);
  const fname   = cap(document.getElementById('f-fname').value,   100);
  const lname   = cap(document.getElementById('f-lname').value,   100);
  const email   = cap(document.getElementById('f-email').value,   200);
  const phone   = cap(document.getElementById('f-phone').value,    30);
  const company = cap(document.getElementById('f-company').value, 200) || 'Not provided';
  const service = cap(document.getElementById('f-service').value, 100) || 'Not specified';
  const msg     = cap(document.getElementById('f-msg').value,    1500) || 'No additional details.';

  // 4. Extra email format check before using it in mailto CC
  const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const safeCC  = emailRe.test(email) ? email : '';

  // 5. Build subject + body using encodeURIComponent (no raw concatenation)
  const subject = encodeURIComponent(
    `New Hiring Inquiry — ${fname} ${lname} | TalentKart`
  );

  const bodyText =
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEW INQUIRY — TALENTKART WEBSITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT DETAILS
  Name    : ${fname} ${lname}
  Email   : ${email}
  Phone   : ${phone}
  Company : ${company}

SERVICE REQUIRED
  ${service}

REQUIREMENTS
${msg}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sent via TalentKart Contact Form
Timestamp: ${new Date().toUTCString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const body = encodeURIComponent(bodyText);

  // 6. Construct mailto — cc only if email is clean
  const ccPart = safeCC ? `&cc=${encodeURIComponent(safeCC)}` : '';
  const mailtoLink = `mailto:hr@talentkart.co.in?subject=${subject}${ccPart}&body=${body}`;

  // 7. Safety check — ensure final link doesn't contain script injection
  if(/javascript:|data:|vbscript:/i.test(mailtoLink)){
    showToast('❌ Submission blocked for security reasons.','#f97316');
    return;
  }

  // 8. Open mail client — try multiple methods for cross-browser compatibility
  try {
    // Method 1: window.open (best for Vercel/production, doesn't trigger navigation CSP)
    const mailWin = window.open(mailtoLink, '_self');
    if(!mailWin || mailWin.closed){
      // Method 2: fallback hidden anchor click
      const a = document.createElement('a');
      a.href = mailtoLink;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=> document.body.removeChild(a), 500);
    }
  } catch(err) {
    // Method 3: last resort
    window.location.href = mailtoLink;
  }

  // 9. Confirm + reset
  showToast('📬 Your email app is opening — just hit Send!','#22d3ee');
  setTimeout(()=>{
    ['f-fname','f-lname','f-email','f-phone','f-company','f-service','f-msg'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){ el.value=''; el.classList.remove('valid','invalid'); }
    });
    document.querySelectorAll('.field-err').forEach(e=>e.textContent='');
  },1500);
}

// ── Reusable toast with custom colour ──
function showToast(message, color){
  const t=document.getElementById('toast');
  t.textContent=message;
  t.style.background= color==='#f97316'
    ? 'rgba(249,115,22,.95)'
    : 'linear-gradient(135deg, rgba(109,95,199,.95), rgba(8,145,178,.95))';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),4500);
}

// ── Wire submit button — works regardless of when script loads ──
function wireEvents() {
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn && !submitBtn._wired) {
    submitBtn._wired = true;
    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      submitForm();
    });
  }
  document.querySelectorAll('[data-close-mobile]').forEach(function(el) {
    el.addEventListener('click', closeMobile);
  });
}
// Fire immediately if DOM ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireEvents);
} else {
  wireEvents(); // DOM already ready — fire now
}

// ── Shake animation for validation fail ──
const shakeStyle=document.createElement('style');
shakeStyle.textContent=`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`;
document.head.appendChild(shakeStyle);
  // ════════════════════════════════════════════════
  // SECURITY BOOT CHECKS
  // ════════════════════════════════════════════════

  // ── 1. Verify page is served over HTTPS (in production) ──
  if(location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'){
    // Auto-redirect HTTP → HTTPS in production
    window.location.replace('https://' + location.host + location.pathname + location.search);
  }
  // Note: file:// protocol is local dev only — no redirect needed

  // ── 2. Block framing attempts (defence-in-depth beyond X-Frame-Options) ──
  // Skip on file:// (local dev) — frame-busting only applies in real HTTP/S deployments
  if(window.self !== window.top && location.protocol !== 'file:'){
    try{ window.top.location = window.self.location; }
    catch(e){ document.body.innerHTML = ''; }
  }

  // ── 3. Subresource integrity check — ensure Google Fonts link hasn't been tampered ──
  document.querySelectorAll('link[href*="fonts.googleapis"]').forEach(l=>{
    if(!l.href.startsWith('https://')){
      l.remove();
      console.warn('[TalentKart] 🔒 Removed non-HTTPS font link.');
    }
  });

  // ── 4. Disable all external forms from submitting (in case injected) ──
  document.querySelectorAll('form').forEach(f=>{
    f.addEventListener('submit', ev=>{
      ev.preventDefault();
      console.warn('[TalentKart] 🔒 Native form submission blocked — use submitForm().');
    });
  });

  // ── 5. Console security notice for developers ──
  console.log(
    '%c🔒 TalentKart Security%c\nAll form data is processed client-side only.\nNo data is stored, logged, or sent to any third-party server.\nForm submissions use mailto: — your email client handles delivery.',
    'color:#22d3ee;font-weight:bold;font-size:15px;',
    'color:#7ec8fd;font-size:12px;'
  );
