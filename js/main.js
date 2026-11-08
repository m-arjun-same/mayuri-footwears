/* ============ MAYURI FOOTWEARS — main.js (own code) ============ */
(function(){
'use strict';
var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var inr = function(n){ return '₹' + n.toLocaleString('en-IN'); };
var PRODUCTS = window.MAYURI_PRODUCTS || [];
var byId = {}; PRODUCTS.forEach(function(p){ byId[p.id]=p; });
var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= EMBLEM (own drawing: footprint + M in a ring) ================= */
function emblemSVG(cls){
  return ''+
  '<svg class="'+(cls||'')+'" viewBox="0 0 200 200" role="img" aria-label="Mayuri Footwears emblem">'+
    '<defs><linearGradient id="gld-'+cls+'" x1="0" y1="0" x2="1" y2="1">'+
      '<stop offset="0" stop-color="#8a6420"/><stop offset=".5" stop-color="#eccf8b"/><stop offset="1" stop-color="#c9a35f"/>'+
    '</linearGradient></defs>'+
    '<circle class="em-ring" cx="100" cy="100" r="88" fill="none" stroke="url(#gld-'+cls+')" stroke-width="2.5"/>'+
    '<circle class="em-ring2" cx="100" cy="100" r="79" fill="none" stroke="url(#gld-'+cls+')" stroke-width=".8" opacity=".65"/>'+
    '<path class="em-dia" d="M100 4 L106 12 L100 20 L94 12 Z" fill="url(#gld-'+cls+')"/>'+
    '<path class="em-dia" d="M100 180 L106 188 L100 196 L94 188 Z" fill="url(#gld-'+cls+')"/>'+
    '<g class="em-foot" fill="none" stroke="url(#gld-'+cls+')" stroke-width="3" stroke-linejoin="round">'+
      '<path class="em-sole" d="M100 34 C111 36 117 48 115.5 60 C114.2 71 108.5 79 100 79 C91.5 79 85.8 71 84.5 60 C83 48 89 36 100 34 Z"/>'+
      '<circle class="em-toe" cx="82" cy="30" r="3.6"/><circle class="em-toe" cx="91.5" cy="24.5" r="4.2"/>'+
      '<circle class="em-toe" cx="102" cy="23.5" r="4.4"/><circle class="em-toe" cx="112" cy="26" r="4"/>'+
      '<circle class="em-toe" cx="119.5" cy="32.5" r="3.4"/>'+
    '</g>'+
    '<path class="em-m" d="M58 152 L58 104 L84 132 L100 110 L116 132 L142 104 L142 152" fill="none" stroke="url(#gld-'+cls+')" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'+
  '</svg>';
}
$('#brandEmblem').innerHTML = emblemSVG('hd');
$('#footEmblem').innerHTML  = emblemSVG('ft');

/* filled footprint glyph — the Step Cinema unit (steps, trail) */
function footprintSVG(){
  return '<svg viewBox="0 0 60 92" aria-hidden="true"><g fill="currentColor">'+
  '<ellipse cx="15" cy="17" rx="4.6" ry="6" transform="rotate(-18 15 17)"/>'+
  '<ellipse cx="24.5" cy="9.5" rx="5" ry="6.8" transform="rotate(-6 24.5 9.5)"/>'+
  '<ellipse cx="34.5" cy="8" rx="5.2" ry="7"/>'+
  '<ellipse cx="44" cy="10.5" rx="4.8" ry="6.4" transform="rotate(8 44 10.5)"/>'+
  '<ellipse cx="51.5" cy="17" rx="4.2" ry="5.6" transform="rotate(20 51.5 17)"/>'+
  '<path d="M30 24 C40 26 45.5 37 44.3 48 C43.2 58.5 37.5 66 30 66 C22.5 66 16.8 58.5 15.7 48 C14.5 37 20 24 30 24 Z"/>'+
  '<ellipse cx="30" cy="79" rx="9.5" ry="10.5"/>'+
  '</g></svg>';
}
/* scroll progress = a trail of footprints lighting up */
(function(){
  var t=$('#trail'); if(!t) return;
  for(var i=0;i<12;i++){ var s=document.createElement('span'); s.className='tstep'; s.innerHTML=footprintSVG(); s.style.color='#c9a35f'; t.appendChild(s); }
})();
/* the opening walk path — an S of steps rising to the wordmark */
var WALK_STEPS=[{x:47,y:6,w:15,r:-7},{x:53,y:15,w:19,r:6},{x:45,y:25,w:24,r:-6},{x:54,y:36,w:30,r:6},{x:44,y:48,w:38,r:-5},{x:55,y:60,w:47,r:5}];
(function(){
  var tr=$('#walkTrail'); if(!tr) return;
  WALK_STEPS.forEach(function(st,i){
    var d=document.createElement('div'); d.className='step';
    d.style.left=st.x+'%'; d.style.top=st.y+'%'; d.style.width=st.w+'px';
    d.style.transform='rotate('+st.r+'deg) scaleX('+(i%2? -1:1)+')';
    d.style.color='#d9b96a'; d.innerHTML=footprintSVG();
    tr.appendChild(d);
  });
})();

/* ================= STORE (localStorage) ================= */
var store = {
  get:function(k,d){ try{ var v = localStorage.getItem('mayuri.'+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set:function(k,v){ try{ localStorage.setItem('mayuri.'+k, JSON.stringify(v)); }catch(e){} }
};
var bag  = store.get('bag', []);    // {id,size,color,qty}
var wish = store.get('wish', []);   // [id]
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
function pulse(el){ if(window.gsap) gsap.fromTo(el,{scale:1},{scale:1.18,duration:.14,yoyo:true,repeat:1,ease:'power2.out'}); }

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

/* ================= PRODUCT CARDS ================= */
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
    '<div class="pcard-media tilt" data-qv="'+p.id+'">'+tag+
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
function mountCards(sel,list){
  var el=$(sel); if(!el) return;
  el.innerHTML = list.map(function(p,i){ return cardHTML(p,i); }).join('');
}
function mountIds(sel,ids){ mountCards(sel, ids.map(function(id){ return byId[id]; }).filter(Boolean)); }
mountIds('#gridSchool', ['kidsflex','school']);
mountIds('#gridOffice', ['oxford','brogue','loafer']);
mountCards('#gridCare', PRODUCTS.filter(function(p){ return p.tags.indexOf('care')>-1; }));
mountCards('#railNew',  PRODUCTS.filter(function(p){ return p.tags.indexOf('new')>-1; }));
mountIds('#gridEvening',['goldheels','heels','sandals']);
mountCards('#railBest', PRODUCTS.filter(function(p){ return p.tags.indexOf('best')>-1; }));

document.addEventListener('click',function(e){
  var add=e.target.closest('[data-add]');
  if(add){ var p=byId[add.getAttribute('data-add')]; addToBag(p.id, p.def, p.variants?p.variants[0].label:'', 1); return; }
  var w=e.target.closest('.pwish');
  if(w){ toggleWish(w.getAttribute('data-id')); return; }
  var d=e.target.closest('.dot-btn');
  if(d){
    var card=d.closest('.pcard'); var img=card.querySelector('.pcard-media img');
    img.src=d.getAttribute('data-img');
    $$('.dot-btn',card).forEach(function(x){ x.classList.remove('sel'); }); d.classList.add('sel');
    if(window.gsap) gsap.fromTo(img,{opacity:.35,scale:1.06},{opacity:1,scale:1,duration:.55,ease:'power2.out'});
    return;
  }
  var q=e.target.closest('[data-qv]');
  if(q && !e.target.closest('.pwish')){ openQV(q.getAttribute('data-qv')); }
});

/* rail arrows */
$('#railPrev').addEventListener('click',function(){ $('#railNew').scrollBy({left:-340,behavior:'smooth'}); });
$('#railNext').addEventListener('click',function(){ $('#railNew').scrollBy({left: 340,behavior:'smooth'}); });

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
        if(window.gsap) gsap.fromTo('#qvImg',{opacity:.35},{opacity:1,duration:.5});
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

/* stride footprints under the featured shoe */
(function(){
  var box=$('#strideSteps'); if(!box) return;
  for(var i=0;i<6;i++){ var sp=document.createElement('span'); sp.className='sstep'; sp.innerHTML=footprintSVG(); sp.style.transform='rotate(90deg) scaleX('+(i%2?-1:1)+')'; box.appendChild(sp); }
})();

/* ================= BRAND MARQUEE ================= */
(function(){
  var seq = window.MAYURI_BRANDS.map(function(b){ return '<span>'+b+'</span><b>✦</b>'; }).join('');
  $('#brandTrack').innerHTML = '<div style="display:flex;align-items:center">'+seq+'</div><div style="display:flex;align-items:center" aria-hidden="true">'+seq+'</div>';
})();

/* ================= MOBILE NAV ================= */
var menuBtn=$('#menuBtn'), mNav=$('#mobileNav');
menuBtn.addEventListener('click',function(){
  var open=mNav.classList.toggle('open'); menuBtn.classList.toggle('x',open);
  menuBtn.setAttribute('aria-expanded',open);
});
$$('#mobileNav a').forEach(function(a){ a.addEventListener('click',function(){ mNav.classList.remove('open'); menuBtn.classList.remove('x'); }); });

/* ================= 3D TILT (desktop only) ================= */
if(fine && !reduced){
  document.addEventListener('pointermove',function(e){
    var t=e.target.closest('.tilt'); 
    $$('.tilt').forEach(function(el){ if(el!==t && el._tilt){ el.style.transform=''; el._tilt=false; } });
    if(!t) return;
    var r=t.getBoundingClientRect();
    var x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    t._tilt=true;
    t.style.transform='perspective(800px) rotateY('+(x*10)+'deg) rotateX('+(-y*10)+'deg)';
  });
  document.addEventListener('pointerout',function(e){
    var t=e.target.closest && e.target.closest('.tilt');
    if(t && !t.contains(e.relatedTarget)){ t.style.transform=''; t._tilt=false; }
  });
}

/* ================= MAGNETIC CTA (desktop only) ================= */
if(fine && !reduced && window.gsap){
  $$('.magnetic').forEach(function(el){
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect();
      gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.28, y:(e.clientY-r.top-r.height/2)*.34, duration:.4, ease:'power3.out'});
    });
    el.addEventListener('pointerleave',function(){ gsap.to(el,{x:0,y:0,duration:.6,ease:'elastic.out(1,.45)'}); });
  });
}

/* ================= STEP CINEMA + SCROLL SYSTEM ================= */
syncBadges(); renderPops();
var seenIntro=false;
try{ seenIntro = !!sessionStorage.getItem('mayuri.intro'); }catch(e){}

function finalStates(){
  document.body.classList.remove('is-loading');
  var w=$('#walk'); if(w) w.style.display='none';
  $$('.hero-title .line').forEach(function(l){ l.style.transform='none'; });
}
function markSeen(){ try{ sessionStorage.setItem('mayuri.intro','1'); }catch(e){} }

function initScrollFX(){
  if(!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  /* progress + header */
  gsap.to('#progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});
  ScrollTrigger.create({ start:80, onToggle:function(st){ $('#header').classList.toggle('solid',st.isActive); } });
  /* footprint trail lights as the walk progresses */
  var tsteps=$$('#trail .tstep');
  ScrollTrigger.create({ start:0, end:'max', onUpdate:function(st){
    var lit=Math.round(st.progress*tsteps.length);
    tsteps.forEach(function(s,i){ s.classList.toggle('lit', i<lit); });
  }});
  /* reveals */
  $$('.reveal').forEach(function(el){
    if(el.closest('#hero')) return;
    gsap.fromTo(el,{y:44,opacity:0},{y:0,opacity:1,duration:1.05,ease:'power3.out',
      scrollTrigger:{trigger:el,start:'top 86%'}});
  });
  /* room parallax */
  $$('.room-bg .parallax').forEach(function(img){
    gsap.fromTo(img,{yPercent:-8},{yPercent:8,ease:'none',
      scrollTrigger:{trigger:img.closest('.room'),start:'top bottom',end:'bottom top',scrub:.7}});
  });
  $$('.parallax-sm').forEach(function(img){
    gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',
      scrollTrigger:{trigger:img,start:'top bottom',end:'bottom top',scrub:.8}});
  });
  /* THE STRIDE — pinned: scrolling scrubs one full stride (desktop; mobile shows pose one) */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', function(){
    var imgs = $$('.st-img'), shoe = $('#strideShoe'), ssteps = $$('#strideSteps .sstep');
    gsap.set(imgs,{autoAlpha:0}); gsap.set(imgs[0],{autoAlpha:1});
    gsap.set(shoe,{xPercent:-7, rotation:-5});
    var stTl = gsap.timeline({
      scrollTrigger:{ trigger:'#stride', start:'top top', end:'+=160%', scrub:.55, pin:true, anticipatePin:1,
        onUpdate:function(st){
          gsap.set('#rwBar',{scaleX:st.progress});
          var beat = Math.min(3, Math.floor(st.progress*3)+1);
          $('#rwNow').textContent = 'Stride '+beat;
          ssteps.forEach(function(sp,i){ sp.classList.toggle('lit', i < beat*2); });
        } }
    });
    /* beat 1 -> 2: shoe swings through, next colourway lands */
    stTl.to(shoe,{xPercent:0, rotation:2, duration:1, ease:'power1.inOut'}, 0)
        .to(shoe,{y:-16, duration:.5, ease:'power2.out'}, .5)
        .to(shoe,{y:0, duration:.5, ease:'power2.in'}, 1)
        .to(imgs[0],{autoAlpha:0, duration:.3}, .85)
        .to(imgs[1],{autoAlpha:1, duration:.3}, .85)
    /* beat 2 -> 3 */
        .to(shoe,{xPercent:7, rotation:-2, duration:1, ease:'power1.inOut'}, 1.6)
        .to(shoe,{y:-16, duration:.5, ease:'power2.out'}, 2.1)
        .to(shoe,{y:0, duration:.5, ease:'power2.in'}, 2.6)
        .to(imgs[1],{autoAlpha:0, duration:.3}, 2.45)
        .to(imgs[2],{autoAlpha:1, duration:.3}, 2.45)
        .to(shoe,{xPercent:9, rotation:0, duration:.5, ease:'power2.out'}, 3.1)
        .to({},{duration:.4});
    return function(){};
  });
  /* THE ROUTE — an SVG line down the page that draws itself as you walk */
  buildRoute();
  function buildRoute(){
    var svg=$('#route'), path=$('#routePath'), main=$('#top');
    if(!svg || !path || !main) return;
    var H = main.offsetHeight; if(H<800) return;
    svg.setAttribute('viewBox','0 0 60 '+H); svg.style.height=H+'px';
    var d='M30 -10', y=-10, left=true;
    while(y < H){ y+=620; d+=' C '+(left?4:56)+' '+(y-380)+', '+(left?56:4)+' '+(y-240)+', 30 '+y; left=!left; }
    path.setAttribute('d',d);
    var L=path.getTotalLength();
    path.style.strokeDasharray=L; path.style.strokeDashoffset=L;
    gsap.to(path,{strokeDashoffset:0, ease:'none',
      scrollTrigger:{trigger:main, start:'top top', end:'bottom bottom', scrub:.4}});
  }
  addEventListener('load',function(){ ScrollTrigger.refresh(); });
}

/* hero mouse parallax + light sweep (desktop) */
if(fine && !reduced){
  var hero=$('#hero');
  hero.addEventListener('pointermove',function(e){
    var r=hero.getBoundingClientRect();
    hero.style.setProperty('--mx', ((e.clientX-r.left)/r.width-.5).toFixed(3));
    hero.style.setProperty('--my', ((e.clientY-r.top)/r.height-.5).toFixed(3));
  });
  hero.addEventListener('pointerleave',function(){ hero.style.setProperty('--mx',0); hero.style.setProperty('--my',0); });
}

function initLenis(){
  if(!window.Lenis || reduced) return;
  var lenis=new Lenis({ lerp:.09, wheelMultiplier:1 });
  window.__lenis=lenis;
  if(window.ScrollTrigger){ lenis.on('scroll',ScrollTrigger.update); }
  function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  /* anchor links through lenis */
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');
      if(id.length>1 && $(id)){ e.preventDefault(); lenis.scrollTo(id,{offset:-70,duration:1.4}); }
    });
  });
}

function playWalk(){
  if(!window.gsap || reduced || seenIntro){ finalStates(); initLenis(); initScrollFX(); return; }
  gsap.registerPlugin(CustomEase);
  CustomEase.create('luxIO','M0,0 C0.62,0 0.16,1 1,1');
  CustomEase.create('luxOut','M0,0 C0.16,0.68 0.26,0.94 1,1');
  CustomEase.create('stepPress','M0,0 C0.3,1.6 0.55,1 1,1');
  gsap.ticker.lagSmoothing(0);
  gsap.set('.hero-title .line',{yPercent:110});
  var done=false;
  function finish(){ if(done) return; done=true; markSeen(); gsap.set('.hero-title .line, #hero .room-bg img',{clearProps:'transform'}); finalStates(); initLenis(); initScrollFX(); }
  var tl=gsap.timeline({ defaults:{ease:'power2.out'}, onComplete:finish });
  /* street-level darkness; pools of warm light wake up */
  tl.to('.pool-b',{opacity:1,duration:1.2,ease:'power1.inOut'},0)
    .to('.pool-a',{opacity:1,duration:1.4,ease:'power1.inOut'},.2)
    .to('.walk-skip',{opacity:1,duration:.6},.9)
  /* footprints stamp in, walking toward you — far and small, near and large */
    .fromTo('.walk-trail .step',{opacity:0,scale:1.35},{opacity:.94,scale:1,duration:.34,ease:'stepPress',stagger:.27},.45)
  /* the hero shoe steps into the light pool */
    .fromTo('#walkShoe',{opacity:0,y:84,scale:.84,rotation:-6},{opacity:1,y:0,scale:1,rotation:-2,duration:.85,ease:'stepPress'},2.15)
  /* a shoelace pulls tight */
    .add(function(){
       var lp=$('#lacePath'); if(!lp) return;
       var L=lp.getTotalLength(); lp.style.strokeDasharray=L; lp.style.strokeDashoffset=L;
       gsap.to(lp,{strokeDashoffset:0,duration:.95,ease:'power2.inOut'});
       gsap.to('#laceKnot',{opacity:1,duration:.3,delay:.8});
     },2.95)
  /* the name rises — camera-feel */
    .to('.walk-script',{opacity:1,duration:.7,ease:'luxOut'},3.35)
    .fromTo('.walk-name',{opacity:0,y:34},{opacity:1,y:0,duration:.9,ease:'luxOut'},3.55)
    .to('.walk-sub',{opacity:1,duration:.7},4.0)
  /* rise into the hero */
    .to('#walk',{yPercent:-100,duration:1.05,ease:'luxIO'},4.75)
    .fromTo('#hero .room-bg img',{scale:1.12},{scale:1.04,duration:1.6,ease:'power2.out'},4.75)
    .to('.hero-title .line',{yPercent:0,duration:1.1,ease:'luxOut',stagger:.12},5.15)
    .fromTo('#hero .script, #hero .hero-sub, #hero .hero-ctas, #hero .hero-meta',{y:36,opacity:0},{y:0,opacity:1,duration:.9,ease:'luxOut',stagger:.1},5.4);
  /* tap to skip */
  $('#walk').addEventListener('click',function(){ tl.progress(1); });
  /* failsafe <=7s */
  setTimeout(function(){ if(document.body.classList.contains('is-loading')){ tl.kill(); finish(); } },7000);
}

if(document.readyState==='complete') playWalk();
else addEventListener('load',function(){ setTimeout(playWalk,60); });
/* absolute failsafe even if load stalls */
setTimeout(function(){ if(document.body.classList.contains('is-loading') && !window.gsap){ finalStates(); } },5000);
})();
