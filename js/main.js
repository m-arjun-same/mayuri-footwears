/* ============ MAYURI FOOTWEARS v3 — main.js (own code) ============
   Grammar: Stacked Kinetic Deck. Commerce core carried from v2 (data list,
   bag/wishlist in localStorage); every motion system below is new. */
(function(){
'use strict';
var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var inr = function(n){ return '₹' + n.toLocaleString('en-IN'); };
var PRODUCTS = window.MAYURI_PRODUCTS || [];
var byId = {}; PRODUCTS.forEach(function(p){ byId[p.id]=p; });
var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= BRAND MARK — typographic only (v4) =================
   Header/footer marks are plain Anton "M" tiles in the HTML. No device,
   no drawn emblem — the wordmark is the brand. */

/* ================= LIVE SHOP STATUS (Asia/Kolkata, 10:30–21:30) =================
   QA override: ?time=HH:MM forces the IST clock for testing both states. */
function istMinutes(){
  var q = /[?&]time=(\d{1,2}):(\d{2})/.exec(location.search);
  if(q) return (+q[1])*60 + (+q[2]);
  try{
    var parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
    var h=0,m=0;
    parts.forEach(function(p){ if(p.type==='hour') h=+p.value%24; if(p.type==='minute') m=+p.value; });
    return h*60+m;
  }catch(e){
    var d=new Date(); return d.getHours()*60+d.getMinutes();
  }
}
function paintStatus(){
  var mins = istMinutes(), OPEN=630, CLOSE=1290;
  var open = mins>=OPEN && mins<CLOSE;
  $$('[data-status-dot]').forEach(function(d){ d.classList.toggle('is-open',open); d.classList.toggle('is-closed',!open); });
  $$('[data-status-text]').forEach(function(t){ t.textContent = open ? 'Open Now' : 'Closed'; });
  $$('[data-status-sub]').forEach(function(t){ t.textContent = open ? 'Closes 9:30 PM today' : (mins<OPEN ? 'Opens 10:30 AM today' : 'Opens 10:30 AM tomorrow'); });
  return open;
}
paintStatus(); setInterval(paintStatus, 60000);
window.__mayuriStatus = paintStatus;

/* ================= BRAND WALL (from the one brand list) ================= */
(function(){
  var g=$('#bwGrid'); if(!g) return;
  g.innerHTML = (window.MAYURI_BRANDS||[]).map(function(b,i){
    return '<div class="bw-cell"><span class="bw-no">'+String(i+1).padStart(2,'0')+'</span><span class="bw-name">'+b+'</span></div>';
  }).join('');
})();

/* ================= STORE (localStorage) ================= */
var store = {
  get:function(k,d){ try{ var v = localStorage.getItem('mayuri.'+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set:function(k,v){ try{ localStorage.setItem('mayuri.'+k, JSON.stringify(v)); }catch(e){} }
};
var bag  = store.get('bag', []);
var wish = store.get('wish', []);
function saveAll(){ store.set('bag',bag); store.set('wish',wish); syncBadges(); renderPops(); }
function bagQty(){ return bag.reduce(function(a,l){ return a+l.qty; },0); }
function bagTotal(){ return bag.reduce(function(a,l){ return a + (byId[l.id]?byId[l.id].price*l.qty:0); },0); }
function syncBadges(){
  var b=$('#bagCount'), w=$('#wishCount');
  b.textContent = bagQty(); w.textContent = wish.length;
  b.classList.toggle('on', bagQty()>0); w.classList.toggle('on', wish.length>0);
}
function toast(msg){
  var t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(function(){ t.classList.remove('show'); },2600);
}
function addToBag(id,size,color,qty){
  var key=null;
  bag.forEach(function(l){ if(l.id===id && l.size===String(size) && l.color===color) key=l; });
  if(key) key.qty += (qty||1);
  else bag.push({id:id,size:String(size),color:color,qty:qty||1});
  saveAll();
  var p=byId[id]; toast(p.name+' · '+p.sizeType+' '+size+' added to your bag');
  pulse($('#bagBtn'));
}
function toggleWish(id){
  var i=wish.indexOf(id);
  if(i>-1){ wish.splice(i,1); toast(byId[id].name+' removed from wishlist'); }
  else { wish.push(id); toast(byId[id].name+' saved to your wishlist'); pulse($('#wishBtn')); }
  saveAll();
  $$('.pwish[data-id="'+id+'"]').forEach(function(b){ b.classList.toggle('on', wish.indexOf(id)>-1); b.textContent = wish.indexOf(id)>-1 ? '♥':'♡'; });
}
function pulse(el){ if(window.gsap) gsap.fromTo(el,{scale:1},{scale:1.2,duration:.14,yoyo:true,repeat:1,ease:'power2.out'}); }

/* ================= POPOVERS ================= */
function renderPops(){
  var bi=$('#bagItems'), be=$('#bagEmpty'), bf=$('#bagFoot');
  bi.innerHTML='';
  if(!bag.length){ be.style.display=''; bf.hidden=true; }
  else{
    be.style.display='none'; bf.hidden=false; $('#bagTotal').textContent=inr(bagTotal());
    bag.forEach(function(l,idx){
      var p=byId[l.id]; if(!p) return;
      var row=document.createElement('div'); row.className='pop-item';
      row.innerHTML='<img src="'+p.img+'" alt=""><div><div class="pi-name">'+p.name+'</div><div class="pi-meta">'+p.sizeType+' '+l.size+(l.color?' · '+l.color:'')+' · ×'+l.qty+' · '+inr(p.price*l.qty)+'</div></div><button class="pi-rm" aria-label="Remove">×</button>';
      row.querySelector('.pi-rm').addEventListener('click',function(){ bag.splice(idx,1); saveAll(); });
      bi.appendChild(row);
    });
  }
  var wi=$('#wishItems'), we=$('#wishEmpty');
  wi.innerHTML='';
  if(!wish.length){ we.style.display=''; }
  else{
    we.style.display='none';
    wish.forEach(function(id){
      var p=byId[id]; if(!p) return;
      var row=document.createElement('div'); row.className='pop-item';
      row.innerHTML='<img src="'+p.img+'" alt=""><div><div class="pi-name">'+p.name+'</div><div class="pi-meta">'+inr(p.price)+'</div></div><button class="pi-rm" aria-label="Remove">×</button>';
      row.querySelector('.pi-rm').addEventListener('click',function(){ toggleWish(id); });
      wi.appendChild(row);
    });
  }
}
function wirePop(btnId,popId){
  var btn=$(btnId), pop=$(popId);
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    var open=pop.classList.contains('open');
    $$('.pop').forEach(function(p){ p.classList.remove('open'); });
    $$('.util').forEach(function(u){ u.setAttribute('aria-expanded','false'); });
    if(!open){ pop.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  });
  pop.addEventListener('click',function(e){ e.stopPropagation(); });
}
wirePop('#bagBtn','#bagPop'); wirePop('#wishBtn','#wishPop');
document.addEventListener('click',function(){ $$('.pop').forEach(function(p){ p.classList.remove('open'); }); });

/* ================= PRODUCT CARDS (gallery-label schema) ================= */
function offPct(p){ return Math.round((1-p.price/p.mrp)*100); }
function cardHTML(p,idx){
  var dots='';
  if(p.variants){
    dots='<div class="dots">'+p.variants.map(function(v,i){
      return '<button class="dot-btn'+(i===0?' sel':'')+'" data-img="'+v.img+'" style="background:'+v.hex+'" aria-label="'+v.label+'" title="'+v.label+'"></button>';
    }).join('')+'</div>';
  }
  var tag = p.tags.indexOf('new')>-1 ? '<span class="ptag">New</span>' : (p.tags.indexOf('best')>-1 ? '<span class="ptag">Best Seller</span>':'');
  var won = wish.indexOf(p.id)>-1;
  return '<article class="pcard" data-id="'+p.id+'">'+
    '<div class="pcard-media" data-qv="'+p.id+'" data-cursor="VIEW">'+tag+
      '<button class="pwish'+(won?' on':'')+'" data-id="'+p.id+'" aria-label="Toggle wishlist">'+(won?'♥':'♡')+'</button>'+
      '<img src="'+p.img+'" alt="'+p.name+'" loading="lazy"><span class="pidx">No. '+String(idx+1).padStart(2,'0')+'</span></div>'+
    '<div class="pcard-info"><p class="pcard-cat">'+p.catLabel+'</p>'+
      '<h3 class="pcard-name">'+p.name+'</h3>'+
      '<p class="pcard-price">'+inr(p.price)+'<s>'+inr(p.mrp)+'</s><span class="off">'+offPct(p)+'% off</span></p>'+
      dots+
      '<div class="pcard-actions"><button class="pbtn pbtn-add" data-add="'+p.id+'">Add to Bag</button>'+
      '<button class="pbtn pbtn-qv" data-qv="'+p.id+'">Quick View</button></div>'+
    '</div></article>';
}
function mountCards(sel,list){ var el=$(sel); if(el) el.innerHTML = list.map(function(p,i){ return cardHTML(p,i); }).join(''); }
function mountIds(sel,ids){ mountCards(sel, ids.map(function(id){ return byId[id]; }).filter(Boolean)); }
mountIds('#gridSchool', ['kidsflex','school']);
mountIds('#gridOffice', ['oxford','brogue','loafer','court']);
mountCards('#gridCare', PRODUCTS.filter(function(p){ return p.tags.indexOf('care')>-1; }));
mountIds('#gridRun', ['runner','court','aeroglide']);
mountIds('#gridEvening',['goldheels','heels','sandals']);
mountCards('#railNew',  PRODUCTS.filter(function(p){ return p.tags.indexOf('new')>-1; }));
mountCards('#railBest', PRODUCTS.filter(function(p){ return p.tags.indexOf('best')>-1; }));

document.addEventListener('click',function(e){
  var add=e.target.closest('[data-add]');
  if(add){ var p=byId[add.getAttribute('data-add')]; addToBag(p.id, p.def, p.variants?p.variants[0].label:'', 1); return; }
  var w=e.target.closest('.pwish');
  if(w){ toggleWish(w.getAttribute('data-id')); return; }
  var d=e.target.closest('.dot-btn');
  if(d && !e.target.closest('#qv')){
    var card=d.closest('.pcard'); var img=card.querySelector('.pcard-media img');
    img.src=d.getAttribute('data-img');
    $$('.dot-btn',card).forEach(function(x){ x.classList.remove('sel'); }); d.classList.add('sel');
    if(window.gsap) gsap.fromTo(img,{opacity:.3,scale:1.07},{opacity:1,scale:1,duration:.5,ease:'power2.out'});
    return;
  }
  var q=e.target.closest('[data-qv]');
  if(q && !e.target.closest('.pwish')){ openQV(q.getAttribute('data-qv')); }
});

/* ================= QUICK VIEW ================= */
var qvP=null, qvSize=null, qvColor='';
function openQV(id){
  var p=byId[id]; if(!p) return;
  qvP=p; qvSize=p.def; qvColor=p.variants?p.variants[0].label:'';
  $('#qvImg').src=p.img; $('#qvImg').alt=p.name;
  $('#qvCat').textContent=p.catLabel;
  $('#qvName').textContent=p.name;
  $('#qvPrice').textContent=inr(p.price);
  $('#qvMrp').textContent=inr(p.mrp);
  $('#qvOff').textContent=offPct(p)+'% off in store display';
  $('#qvDesc').textContent=p.desc;
  $('#qvSizeType').textContent=p.sizeType;
  var dots=$('#qvDots'); dots.innerHTML='';
  $('#qvColourBlock').style.display = p.variants ? '' : 'none';
  if(p.variants){
    p.variants.forEach(function(v,i){
      var b=document.createElement('button');
      b.className='dot-btn'+(i===0?' sel':''); b.style.background=v.hex; b.title=v.label; b.setAttribute('aria-label',v.label);
      b.addEventListener('click',function(){
        qvColor=v.label; $('#qvImg').src=v.img;
        $$('#qvDots .dot-btn').forEach(function(x){ x.classList.remove('sel'); }); b.classList.add('sel');
        if(window.gsap) gsap.fromTo('#qvImg',{opacity:.3},{opacity:1,duration:.45});
      });
      dots.appendChild(b);
    });
  }
  var sz=$('#qvSizes'); sz.innerHTML='';
  p.sizes.forEach(function(s){
    var b=document.createElement('button');
    b.className='size-btn'+(String(s)===String(p.def)?' sel':''); b.textContent=s;
    b.addEventListener('click',function(){ qvSize=s; $$('#qvSizes .size-btn').forEach(function(x){ x.classList.remove('sel'); }); b.classList.add('sel'); });
    sz.appendChild(b);
  });
  syncQvWish();
  $('#qv').classList.add('open'); $('#qv').setAttribute('aria-hidden','false');
  if(window.__lenis) window.__lenis.stop();
}
function closeQV(){
  $('#qv').classList.remove('open'); $('#qv').setAttribute('aria-hidden','true');
  if(window.__lenis) window.__lenis.start();
}
function syncQvWish(){
  if(!qvP) return;
  $('#qvWish').querySelector('span').textContent = wish.indexOf(qvP.id)>-1 ? '♥ In Wishlist' : '♡ Wishlist';
}
$('#qvAdd').addEventListener('click',function(){ if(qvP){ addToBag(qvP.id,qvSize,qvColor,1); closeQV(); } });
$('#qvWish').addEventListener('click',function(){ if(qvP){ toggleWish(qvP.id); syncQvWish(); } });
$$('#qv [data-close]').forEach(function(el){ el.addEventListener('click',closeQV); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeQV(); $('#mobileNav').classList.remove('open'); } });

/* ================= MOBILE NAV ================= */
var menuBtn=$('#menuBtn'), mNav=$('#mobileNav');
menuBtn.addEventListener('click',function(){
  var open=mNav.classList.toggle('open'); menuBtn.classList.toggle('x',open);
  menuBtn.setAttribute('aria-expanded',String(open));
});
$$('#mobileNav a').forEach(function(a){ a.addEventListener('click',function(){ mNav.classList.remove('open'); menuBtn.classList.remove('x'); }); });

/* ================= CUSTOM CURSOR (desktop only) ================= */
var cursorAPI = { setLabel:function(){} };
if(fine && !reduced && window.gsap){
  document.body.classList.add('has-cursor');
  var cur=$('#cursor'), lab=$('#cursorLabel');
  var cx=gsap.quickTo(cur,'x',{duration:.32,ease:'power3'}), cy=gsap.quickTo(cur,'y',{duration:.32,ease:'power3'});
  var fx=gsap.quickTo(cur,'x',{duration:.08,ease:'power1'}), fy=gsap.quickTo(cur,'y',{duration:.08,ease:'power1'});
  document.addEventListener('pointermove',function(e){ fx(e.clientX); fy(e.clientY); cx(e.clientX); cy(e.clientY); });
  document.addEventListener('pointerover',function(e){
    var labelled=e.target.closest ? e.target.closest('[data-cursor]') : null;
    if(labelled){ cur.classList.add('labelled'); cur.classList.remove('grow'); lab.textContent=labelled.getAttribute('data-cursor'); return; }
    cur.classList.remove('labelled');
    if(e.target.closest && e.target.closest('a,button,.dot-btn,.size-btn')) cur.classList.add('grow'); else cur.classList.remove('grow');
  });
  document.addEventListener('pointerleave',function(){ cur.classList.remove('grow','labelled'); });
}

/* ================= WEBGL STAGES ================= */
var GL = { hero:null, stride:null };
try{ if(window.MayuriGL) GL = window.MayuriGL.init() || GL; }catch(e){}

/* (v4: hero is a full-bleed photographic stage — no GL hero stage) */

/* ================= KINETIC TYPE: char splitter ================= */
function splitChars(el){
  if(!el || el._split) return;
  el._split = true;
  var words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map(function(w){
    return '<span class="w" style="display:inline-block;white-space:nowrap" aria-hidden="true">' +
      w.split('').map(function(c){ return '<span class="ch">'+c+'</span>'; }).join('') + '</span>';
  }).join(' ');
}
$$('[data-split]').forEach(splitChars);

/* ================= VELOCITY-REACTIVE MARQUEES ================= */
var marquees = [];
function buildMarquee(el, items){
  var seq = items.map(function(t){ return '<span>'+t+'</span><b>✦</b>'; }).join('');
  var track = el.querySelector('.mq-track');
  track.innerHTML = '<div class="mq-seq">'+seq+'</div><div class="mq-seq" aria-hidden="true">'+seq+'</div>';
  var st = { el:el, track:track, x:0, w:0, base: el.getAttribute('data-mq')==='brands' ? 0.55 : 0.9 };
  requestAnimationFrame(function(){ st.w = track.children[0].offsetWidth || 1; });
  marquees.push(st);
}
buildMarquee($('.band .mq'), ['Step into comfort','Walk in style','Step into comfort','Walk in style']);

/* ================= VELOCITY HUB =================
   One signed velocity value feeds: marquee speed, image skew/stretch,
   WebGL surge, grade energy. Decays in the ticker. */
var vel = { s:0, a:0, m:0 };
function feedVelocity(v){ // px/s, signed
  var n = Math.max(-1, Math.min(1, v/2400));
  vel.s = n; vel.a = Math.abs(n);
  if(Math.abs(n) > vel.m) vel.m = Math.abs(n); // marquee energy: peaks fast, drains slow
}

/* ================= SCROLL SYSTEM ================= */
syncBadges(); renderPops();
var seenIntro=false;
try{ seenIntro = !!sessionStorage.getItem('mayuri.intro'); }catch(e){}
function markSeen(){ try{ sessionStorage.setItem('mayuri.intro','1'); }catch(e){} }
function finalStates(){
  document.body.classList.remove('is-loading');
  var w=$('#intro'); if(w) w.style.display='none';
}

function initScrollFX(){
  if(!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if(window.__lenis) window.__lenis.on('scroll', function(e){ if(e && typeof e.velocity==='number') feedVelocity(e.velocity * 60); });

  gsap.to('#progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});
  ScrollTrigger.create({ start:0, end:'max', onUpdate:function(st){ feedVelocity(st.getVelocity()); } });

  /* ambient day-grade: one tint film, dawn -> noon -> gold -> dusk -> night */
  gsap.timeline({ scrollTrigger:{ trigger:'#top', start:'top top', end:'bottom bottom', scrub:.6 } })
    .to('#grade',{backgroundColor:'rgba(255,145,40,0.15)',duration:1,ease:'none'},0)
    .to('#grade',{backgroundColor:'rgba(90,160,255,0.10)',duration:1,ease:'none'},1)
    .to('#grade',{backgroundColor:'rgba(255,170,30,0.14)',duration:1,ease:'none'},2)
    .to('#grade',{backgroundColor:'rgba(255,77,18,0.13)',duration:1,ease:'none'},3)
    .to('#grade',{backgroundColor:'rgba(90,40,120,0.15)',duration:1,ease:'none'},4)
    .to('#grade',{backgroundColor:'rgba(8,8,30,0.22)',duration:1,ease:'none'},5);

  /* hero photographic stage drifts slower than the page (cinematic depth) */
  gsap.fromTo('.hero-bg',{yPercent:-6},{yPercent:6,ease:'none',
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:.5}});
  gsap.fromTo('.hero-inner',{yPercent:0,opacity:1},{yPercent:-10,opacity:.25,ease:'none',
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:.5}});

  /* ---- DEPARTMENTS: each card its own signature (wipe/mask/block/slide/flip/diag) ---- */
  $$('.dept-card').forEach(function(card){
    var sig=card.getAttribute('data-sig'), media=card.querySelector('.dept-media'), body=card.querySelector('.dept-body');
    var st={trigger:card,start:'top 82%',toggleActions:'play none none reverse'};
    if(sig==='wipe'){
      gsap.fromTo(media,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1.1,ease:'power4.inOut',scrollTrigger:st});
      gsap.fromTo(body,{y:40,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:st});
    } else if(sig==='mask'){
      gsap.fromTo(media,{clipPath:'circle(8% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)',duration:1.15,ease:'power3.inOut',scrollTrigger:st});
      gsap.fromTo(body,{y:40,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:st});
    } else if(sig==='block'){
      var cov=document.createElement('div'); cov.className='dept-cover'; media.appendChild(cov);
      var tl=gsap.timeline({scrollTrigger:st});
      tl.to(cov,{scaleX:1,duration:.45,ease:'power4.in'})
        .fromTo(media.querySelector('img'),{opacity:0},{opacity:1,duration:.08})
        .set(cov,{transformOrigin:'100% 50%'})
        .to(cov,{scaleX:0,duration:.55,ease:'power4.out'})
        .fromTo(body,{y:40,opacity:0},{y:0,opacity:1,duration:.6,ease:'power3.out'},'-=.3');
      gsap.set(media.querySelector('img'),{opacity:0});
    } else if(sig==='slide'){
      gsap.fromTo(card,{x:120,opacity:0},{x:0,opacity:1,duration:.9,ease:'power4.out',scrollTrigger:st});
    } else if(sig==='flip'){
      gsap.fromTo(card,{rotateX:-64,y:60,opacity:0,transformPerspective:900},{rotateX:0,y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:st});
    } else if(sig==='diag'){
      gsap.fromTo(media,{clipPath:'polygon(0 0, 52% 0, 36% 100%, 0 100%)'},{clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)',duration:1,ease:'power3.inOut',scrollTrigger:st});
      gsap.fromTo(body,{y:40,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:st});
    }
  });

  /* ---- BRAND WALL: cells stagger in, numerals first ---- */
  gsap.fromTo('.bw-cell',{y:44,opacity:0},{y:0,opacity:1,duration:.65,ease:'power3.out',stagger:.055,
    scrollTrigger:{trigger:'#brandwall',start:'top 76%',toggleActions:'play none none reverse'}});

  /* ---- kinetic headlines: chars rotate up, per section ---- */
  $$('.sec-title[data-split]').forEach(function(t){
    gsap.fromTo(t.querySelectorAll('.ch'),{rotateX:96,yPercent:55,opacity:0},
      {rotateX:0,yPercent:0,opacity:1,duration:.8,ease:'power4.out',stagger:.022,
       scrollTrigger:{trigger:t,start:'top 84%',toggleActions:'play none none reverse'}});
  });

  /* ---- giant outlined numerals travel at their own speed ---- */
  $$('.stop-time').forEach(function(n){
    gsap.fromTo(n,{xPercent:9},{xPercent:-9,ease:'none',
      scrollTrigger:{trigger:n.closest('.scard'),start:'top bottom',end:'bottom top',scrub:.6}});
  });

  /* ---- THE DECK: each card scales down as the next covers it ---- */
  var cards=$$('.scard');
  cards.forEach(function(c){ gsap.set(c,{transformOrigin:'50% 0%'}); });
  for(var i=0;i<cards.length-1;i++){
    (function(card,next){
      ScrollTrigger.create({ trigger:next, start:'top bottom', end:'top top+='+(76), scrub:true,
        onUpdate:function(st){ gsap.set(card,{scale:1-.07*st.progress, filter:'brightness('+(1-.22*st.progress)+')'}); },
        onLeaveBack:function(){ gsap.set(card,{scale:1,filter:'brightness(1)'}); } });
    })(cards[i], cards[i+1]);
  }

  /* ---- per-stop transition signatures (no two adjacent alike) ---- */
  var T = 'top 78%', TA='play none none reverse';
  // SCHOOL: clip-path wipe down over the media + cards drop through a mask
  gsap.fromTo('#school .wipe-media',{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1.15,ease:'power4.inOut',
    scrollTrigger:{trigger:'#school',start:T,toggleActions:TA}});
  gsap.fromTo('#school .wipe-media img',{scale:1.28},{scale:1,duration:1.15,ease:'power4.inOut',
    scrollTrigger:{trigger:'#school',start:T,toggleActions:TA}});
  gsap.fromTo('#gridSchool .pcard',{y:56,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',stagger:.1,
    scrollTrigger:{trigger:'#gridSchool',start:T,toggleActions:TA}});
  // OFFICE: split-flap clock flips + media opens through a circular mask
  var flaps=$$('#office .flap:not(.colon)');
  gsap.fromTo(flaps,{rotateX:-94},{rotateX:0,duration:.7,ease:'back.out(1.6)',stagger:.09,
    scrollTrigger:{trigger:'#office',start:T,toggleActions:TA,
      onEnter:function(){
        flaps.forEach(function(f,i){
          var fin=f.textContent, n=0;
          var iv=setInterval(function(){ f.textContent = Math.floor(Math.random()*10); if(++n>5+i){ f.textContent=fin; clearInterval(iv); } },55);
        });
      }}});
  gsap.fromTo('#office .mask-media',{clipPath:'circle(10% at 50% 50%)'},{clipPath:'circle(78% at 50% 50%)',ease:'none',
    scrollTrigger:{trigger:'#office',start:'top 92%',end:'top 34%',scrub:.5}});
  gsap.fromTo('#gridOffice .pcard',{y:56,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',stagger:.08,
    scrollTrigger:{trigger:'#gridOffice',start:T,toggleActions:TA}});
  // CARE: a volt block sweeps the card; content is uncovered behind it
  var careCover=document.createElement('div');
  careCover.style.cssText='position:absolute;inset:0;background:var(--volt);transform:scaleX(0);transform-origin:0 50%;z-index:5;pointer-events:none';
  $('#care .scard-inner').appendChild(careCover);
  var careTl=gsap.timeline({scrollTrigger:{trigger:'#care',start:'top 72%',toggleActions:TA}});
  careTl.to(careCover,{scaleX:1,duration:.5,ease:'power4.in'})
        .fromTo('#care .sec-head, #care .stop-split',{opacity:0},{opacity:1,duration:.1},.5)
        .set(careCover,{transformOrigin:'100% 50%'})
        .to(careCover,{scaleX:0,duration:.6,ease:'power4.out'},.55);
  gsap.set('#care .sec-head, #care .stop-split',{opacity:0});
  // RUN: lateral slide stack — cards arrive from the right, rotated, and settle
  gsap.fromTo('#gridRun .pcard',{x:170,rotate:6,opacity:0},{x:0,rotate:0,opacity:1,duration:.85,ease:'power4.out',stagger:.11,
    scrollTrigger:{trigger:'#gridRun',start:T,toggleActions:TA}});
  // EVENING: 3D flip-up cards + best band slides in laterally
  gsap.fromTo('#gridEvening .pcard',{rotateX:-72,y:70,opacity:0,transformPerspective:900},{rotateX:0,y:0,opacity:1,duration:.85,ease:'power3.out',stagger:.1,
    scrollTrigger:{trigger:'#gridEvening',start:T,toggleActions:TA}});
  gsap.fromTo('#evening .best-band',{x:-90,opacity:0},{x:0,opacity:1,duration:.9,ease:'power3.out',
    scrollTrigger:{trigger:'#evening .best-band',start:'top 88%',toggleActions:TA}});
  // CLOSE: why points slide from the left edge; visit cards counter-slide
  gsap.fromTo('.why-point',{x:-56,opacity:0},{x:0,opacity:1,duration:.75,ease:'power3.out',stagger:.12,
    scrollTrigger:{trigger:'#why',start:'top 72%',toggleActions:TA}});
  gsap.fromTo('#visit .visit-card',{y:64,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',stagger:.14,
    scrollTrigger:{trigger:'#visit',start:'top 78%',toggleActions:TA}});

  /* velocity skew/stretch on staged images */
  var skewEls=$$('.vskew');
  var skewSetter = skewEls.length ? gsap.quickSetter(skewEls,'skewY','deg') : null;
  var scaleSetter = skewEls.length ? gsap.quickSetter(skewEls,'scaleY') : null;

  /* ---- THE RUNWAY: pinned horizontal (desktop), native slide (mobile) ---- */
  var mm=gsap.matchMedia();
  mm.add('(min-width: 861px)', function(){
    var track=$('#rwTrack'), view=$('.rw-view');
    function dist(){ return Math.max(0, track.scrollWidth - view.clientWidth + window.innerWidth*0.052); }
    gsap.to(track,{x:function(){ return -dist(); },ease:'none',
      scrollTrigger:{ trigger:'#runway', start:'top top', end:function(){ return '+='+dist(); },
        scrub:.5, pin:true, anticipatePin:1, invalidateOnRefresh:true,
        onUpdate:function(st){
          gsap.set('#rwBar',{scaleX:st.progress});
          var pct=$('#rwPct'); if(pct) pct.textContent=Math.round(st.progress*100)+'%';
        } }});
    return function(){ gsap.set(track,{x:0}); };
  });

  /* ---- THE STRIDE: pinned WebGL dissolve (desktop), scroll-scrubbed (mobile) ---- */
  function setStride(p){
    gsap.set('#stBar',{scaleX:p});
    var beat=Math.min(3, Math.floor(p*3)+1);
    $('#rwNow').textContent='Stride '+beat;
    if(GL.stride && GL.stride.isLive()){ GL.stride.setMix(p*2); }
    else {
      var idx=Math.min(2, Math.floor(p*3));
      $$('.st-fb').forEach(function(im,i){ im.classList.toggle('is-on', i===idx); im.style.opacity = i===idx ? 1 : 0; });
    }
    var stage=$('#glStride');
    if(stage) gsap.set(stage,{y: -Math.abs(Math.sin(p*Math.PI*3))*12});
  }
  setStride(0);
  mm.add('(min-width: 861px)', function(){
    ScrollTrigger.create({ trigger:'#stride', start:'top top', end:'+=150%', scrub:.5, pin:true, anticipatePin:1,
      onUpdate:function(st){ setStride(st.progress); } });
    return function(){};
  });
  mm.add('(max-width: 860px)', function(){
    ScrollTrigger.create({ trigger:'#stride', start:'top bottom', end:'bottom top', scrub:.5,
      onUpdate:function(st){ setStride(st.progress); } });
    return function(){};
  });

  /* ---- master ticker: marquees + velocity decay + skew + GL surge ---- */
  var last = performance.now();
  gsap.ticker.add(function(){
    var now=performance.now(), dt=Math.min(50, now-last); last=now;
    var boost = 1 + vel.m * 14;
    marquees.forEach(function(m){
      if(!m.w) m.w = m.track.children[0] ? m.track.children[0].offsetWidth : 0;
      if(!m.w) return;
      m.x -= m.base * boost * (dt/16.7) * (vel.s < -0.02 ? -0.4 : 1);
      if(m.x <= -m.w) m.x += m.w;
      if(m.x > 0) m.x -= m.w;
      m.track.style.transform='translate3d('+m.x+'px,0,0)';
    });
    if(skewSetter){
      var sk = Math.max(-3.2, Math.min(3.2, vel.s * -3.2));
      skewSetter(sk);
      if(scaleSetter) scaleSetter(1 + Math.abs(vel.s)*0.035);
    }
    if(GL.hero) GL.hero.addVelocity(vel.a * 0.12);
    if(GL.stride) GL.stride.addVelocity(vel.a * 0.1);
    vel.s *= 0.90; vel.a *= 0.90; vel.m *= 0.965;
  });

  addEventListener('load',function(){ ScrollTrigger.refresh(); });
}

/* ================= LENIS ================= */
function initLenis(){
  if(!window.Lenis || reduced) return;
  var lenis=new Lenis({ lerp:.09, wheelMultiplier:1 });
  window.__lenis=lenis;
  if(window.ScrollTrigger) lenis.on('scroll',ScrollTrigger.update);
  function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');
      if(id.length>1 && $(id)){ e.preventDefault(); lenis.scrollTo(id,{offset:-70,duration:1.4}); }
    });
  });
}

/* ================= OPENING v4: a clean brand wipe (no devices) ================= */
function playIntro(){
  if(!window.gsap || reduced || seenIntro){ finalStates(); initLenis(); initScrollFX(); heroIn(true); return; }
  gsap.set('.hero-mark .ch',{rotateX:96,yPercent:55,opacity:0});
  var done=false;
  function finish(){ if(done) return; done=true; markSeen(); finalStates(); initLenis(); initScrollFX(); }
  var tl=gsap.timeline({ defaults:{ease:'power3.out'}, onComplete:finish });
  tl.fromTo('.intro-word',{opacity:0,scale:1.24,letterSpacing:'.3em'},{opacity:1,scale:1,letterSpacing:'.06em',duration:.75,ease:'power4.out'},.15)
    .to('.intro-sub',{opacity:1,duration:.45},.8)
    .to('#intro',{clipPath:'inset(0 0 100% 0)',duration:.85,ease:'power4.inOut'},1.55)
    .add(function(){ heroIn(false); },1.8);
  $('#intro').addEventListener('click',function(){ tl.progress(1); });
  setTimeout(function(){ if(document.body.classList.contains('is-loading')){ tl.kill(); heroIn(true); finish(); } },7000);
}
function heroIn(instant){
  if(!window.gsap) return;
  var chars=$$('.hero-mark .ch');
  if(instant){ gsap.set(chars,{rotateX:0,yPercent:0,opacity:1}); return; }
  gsap.to(chars,{rotateX:0,yPercent:0,opacity:1,duration:.85,ease:'power4.out',stagger:.035});
}

if(document.readyState==='complete') playIntro();
else addEventListener('load',function(){ setTimeout(playIntro,60); });
setTimeout(function(){ if(document.body.classList.contains('is-loading') && !window.gsap){ finalStates(); } },5000);
})();
