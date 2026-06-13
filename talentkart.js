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
// ════════════════════════════════════════════════
(function(){
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, animId;

  function resize(){
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── NODE NETWORK (talent connection metaphor) ──
  const NODE_COUNT = 55;
  const CONN_DIST = 160;
  const nodes = [];

  for(let i=0;i<NODE_COUNT;i++){
    nodes.push({
      x: Math.random()*1600,
      y: Math.random()*900,
      vx:(Math.random()-.5)*.4,
      vy:(Math.random()-.5)*.4,
      r: Math.random()*2.5+1,
      pulse: Math.random()*Math.PI*2,
      pulseSpeed: Math.random()*.02+.008,
      type: Math.floor(Math.random()*3) // 0=blue,1=cyan,2=white
    });
  }

  // ── WAVE RINGS (ripple effect) ──
  const rings = [];
  function spawnRing(){
    rings.push({
      x: Math.random()*1600,
      y: Math.random()*900,
      r: 0,
      maxR: 80+Math.random()*120,
      alpha: 0.35,
      speed: 0.6+Math.random()*0.4
    });
  }
  setInterval(spawnRing, 1800);

  // ── SHOOTING LINES (data flow metaphor) ──
  const shots = [];
  function spawnShot(){
    const angle = Math.random()*Math.PI*2;
    shots.push({
      x: Math.random()*1600,
      y: Math.random()*900,
      angle,
      speed: 2+Math.random()*3,
      len: 60+Math.random()*100,
      alpha: 0.6,
      life: 1
    });
  }
  setInterval(spawnShot, 600);

  let t=0;
  function draw(){
    ctx.clearRect(0,0,W,H);

    // Scale coords to canvas
    const sx = W/1600, sy = H/900;

    // ── Background deep gradient ──
    const bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#050e1c');
    bg.addColorStop(0.5,'#071428');
    bg.addColorStop(1,'#030b18');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    // ── Large radial glow spots ──
    function drawGlow(x,y,r,color){
      const g = ctx.createRadialGradient(x*sx,y*sy,0,x*sx,y*sy,r*Math.min(sx,sy));
      g.addColorStop(0,color);
      g.addColorStop(1,'transparent');
      ctx.fillStyle=g;
      ctx.fillRect(0,0,W,H);
    }
    const pulse1 = Math.sin(t*.008)*0.06;
    const pulse2 = Math.sin(t*.006+1)*0.05;
    drawGlow(400,300,320,`rgba(5,99,201,${0.18+pulse1})`);
    drawGlow(1200,250,280,`rgba(6,196,212,${0.12+pulse2})`);
    drawGlow(800,700,250,`rgba(34,211,238,${0.08+pulse1})`);

    // ── Rings ──
    for(let i=rings.length-1;i>=0;i--){
      const rng=rings[i];
      rng.r+=rng.speed;
      rng.alpha=0.35*(1-rng.r/rng.maxR);
      if(rng.r>rng.maxR){rings.splice(i,1);continue}
      ctx.beginPath();
      ctx.arc(rng.x*sx,rng.y*sy,rng.r*Math.min(sx,sy),0,Math.PI*2);
      ctx.strokeStyle=`rgba(34,211,238,${rng.alpha})`;
      ctx.lineWidth=1;
      ctx.stroke();
    }

    // ── Connections ──
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<CONN_DIST){
          const alpha=(1-dist/CONN_DIST)*0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x*sx,nodes[i].y*sy);
          ctx.lineTo(nodes[j].x*sx,nodes[j].y*sy);
          const colors=['rgba(13,127,232,','rgba(6,196,212,','rgba(34,211,238,'];
          ctx.strokeStyle=colors[nodes[i].type]+alpha+')';
          ctx.lineWidth=0.7;
          ctx.stroke();
        }
      }
    }

    // ── Nodes ──
    for(const n of nodes){
      n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>1600)n.vx*=-1;
      if(n.y<0||n.y>900)n.vy*=-1;
      n.pulse+=n.pulseSpeed;
      const glow=Math.sin(n.pulse)*0.3+0.7;
      const colors=['rgba(13,127,232,','rgba(6,196,212,','rgba(255,255,255,'];
      ctx.beginPath();
      ctx.arc(n.x*sx,n.y*sy,n.r*(0.8+glow*.4),0,Math.PI*2);
      ctx.fillStyle=colors[n.type]+(0.6*glow)+')';
      ctx.fill();
      // Glow ring on larger nodes
      if(n.r>2.5){
        ctx.beginPath();
        ctx.arc(n.x*sx,n.y*sy,n.r*2.5,0,Math.PI*2);
        ctx.fillStyle=colors[n.type]+(0.08*glow)+')';
        ctx.fill();
      }
    }

    // ── Shooting lines ──
    for(let i=shots.length-1;i>=0;i--){
      const s=shots[i];
      s.life-=0.018;
      s.x+=Math.cos(s.angle)*s.speed;
      s.y+=Math.sin(s.angle)*s.speed;
      if(s.life<=0){shots.splice(i,1);continue}
      const tx=s.x-Math.cos(s.angle)*s.len;
      const ty=s.y-Math.sin(s.angle)*s.len;
      const grad=ctx.createLinearGradient(tx*sx,ty*sy,s.x*sx,s.y*sy);
      grad.addColorStop(0,'transparent');
      grad.addColorStop(1,`rgba(34,211,238,${s.alpha*s.life})`);
      ctx.beginPath();
      ctx.moveTo(tx*sx,ty*sy);
      ctx.lineTo(s.x*sx,s.y*sy);
      ctx.strokeStyle=grad;
      ctx.lineWidth=1.2;
      ctx.stroke();
    }

    // ── Horizontal scan line sweep ──
    const scanY = ((t*0.4) % (H+60)) - 30;
    const scanGrad = ctx.createLinearGradient(0,scanY-20,0,scanY+20);
    scanGrad.addColorStop(0,'transparent');
    scanGrad.addColorStop(0.5,'rgba(34,211,238,0.04)');
    scanGrad.addColorStop(1,'transparent');
    ctx.fillStyle=scanGrad;
    ctx.fillRect(0,scanY-20,W,40);

    t++;
    animId=requestAnimationFrame(draw);
  }
  draw();
})();

// ════════════════════════════════════════════════
// SCROLL DIRECTION
// ════════════════════════════════════════════════
let lastY=window.scrollY, scrollDir='down';
window.addEventListener('scroll',()=>{scrollDir=window.scrollY>lastY?'down':'up';lastY=window.scrollY},{passive:true});

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
// SCROLL REVEAL — direction aware
// ════════════════════════════════════════════════
const revEls=document.querySelectorAll('.sd-up,.sd-down,.sd-left,.sd-right,.sd-scale');
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
},{threshold:0.1,rootMargin:'0px 0px -60px 0px'});
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
// 3D TILT (mouse only — NOT on hero content)
// ════════════════════════════════════════════════
function addTilt(sel,max=10,persp=900){
  document.querySelectorAll(sel).forEach(c=>{
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const cx=r.width/2,cy=r.height/2;
      c.style.transform=`perspective(${persp}px) rotateX(${-((y-cy)/cy)*max}deg) rotateY(${((x-cx)/cx)*max}deg) translateZ(8px)`;
      c.style.setProperty('--mx',(x/r.width*100)+'%');
      c.style.setProperty('--my',(y/r.height*100)+'%');
    });
    c.addEventListener('mouseleave',()=>{c.style.transform=''});
  });
}
addTilt('.tilt-card',9,900);
addTilt('.service-card',7,1000);
addTilt('.why-card',9,900);
addTilt('.value-card',7,900);

// ════════════════════════════════════════════════
// MAGNETIC BUTTONS
// ════════════════════════════════════════════════
document.querySelectorAll('.btn-primary,.btn-ghost').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    const x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
    btn.style.transform=`translate(${x*.16}px,${y*.16}px)`;
  });
  btn.addEventListener('mouseleave',()=>btn.style.transform='');
});

// ════════════════════════════════════════════════
// PARTICLES
// ════════════════════════════════════════════════
const pc=document.getElementById('particles');
['rgba(5,99,201,','rgba(6,196,212,','rgba(34,211,238,'].forEach((col,ci)=>{
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
  navLinks.forEach(a=>{a.style.color=a.getAttribute('href')==='#'+cur?'#fff':''});
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
    : 'rgba(5,99,201,.95)';
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
