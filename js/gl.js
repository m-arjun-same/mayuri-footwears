/* ============ MAYURI — WebGL image treatment (own shader, three.js vendored) ============
   One ShaderMaterial recipe, two stages:
   - hero:   single texture, displacement + RGB split driven by mouse + scroll velocity
   - stride: three textures, scroll progress dissolves A->B->C through a noise field
   Any failure (no WebGL, texture error) leaves the fallback <img> visible. */
(function(){
'use strict';
var VERT = [
  'varying vec2 vUv;',
  'uniform float uBend;',
  'void main(){',
  '  vUv = uv;',
  '  vec3 p = position;',
  '  float d = distance(uv, vec2(0.5));',
  '  p.z += uBend * (0.5 - d) * 0.14;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '}'
].join('\n');

var FRAG = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uTexA;',
  'uniform sampler2D uTexB;',
  'uniform sampler2D uTexC;',
  'uniform float uMode;',        // 0 = hero (A only), 1 = stride (A/B/C mix)
  'uniform float uMix;',         // stride: 0..2 continuous beat position
  'uniform float uTime;',
  'uniform float uVel;',         // scroll velocity energy 0..1
  'uniform vec2  uMouse;',       // -0.5..0.5
  'uniform float uMouseAmp;',    // eases up while the mouse moves
  'uniform vec2  uRes;',         // canvas px
  'uniform vec2  uImg;',         // texture px
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
  'float noise(vec2 p){',
  '  vec2 i = floor(p), f = fract(p);',
  '  vec2 u = f * f * (3.0 - 2.0 * f);',
  '  return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),',
  '             mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);',
  '}',
  'float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }',
  'vec2 coverUv(vec2 uv){',
  '  float ca = uRes.x / uRes.y; float ia = uImg.x / uImg.y;',
  '  vec2 s = vec2(1.0);',
  '  if(ca > ia){ s = vec2(1.0, ia/ca); } else { s = vec2(ca/ia, 1.0); }',
  '  return (uv - 0.5) * s + 0.5;',
  '}',
  'vec3 sampleRGB(sampler2D t, vec2 uv, vec2 shift){',
  '  float r = texture2D(t, uv + shift).r;',
  '  float g = texture2D(t, uv).g;',
  '  float b = texture2D(t, uv - shift).b;',
  '  return vec3(r, g, b);',
  '}',
  'void main(){',
  '  vec2 uv = coverUv(vUv);',
  // displacement field: slow fbm drift + mouse pull + velocity surge
  '  float amp = 0.012 + uVel * 0.05 + uMouseAmp * 0.028;',
  '  vec2 flow = vec2(fbm(uv * 3.0 + uTime * 0.05), fbm(uv * 3.0 - uTime * 0.04 + 7.3)) - 0.5;',
  '  vec2 disp = flow * amp + uMouse * (0.012 + uMouseAmp * 0.03);',
  '  vec2 duv = uv + disp;',
  '  vec2 split = (flow * 0.6 + uMouse * 0.4) * (0.002 + uVel * 0.012 + uMouseAmp * 0.006);',
  '  vec3 col;',
  '  if(uMode < 0.5){',
  '    col = sampleRGB(uTexA, duv, split);',
  '  } else {',
  // stride: dissolve between textures through the same noise field
  '    float m = clamp(uMix, 0.0, 2.0);',
  '    float stage = floor(m);',
  '    float f = fract(m);',
  '    float n = fbm(uv * 4.0 + uTime * 0.03);',
  '    float edge = smoothstep(f - 0.25, f + 0.25, n + (f - 0.5) * 0.6);',
  '    vec3 cA = sampleRGB(uTexA, duv, split);',
  '    vec3 cB = sampleRGB(uTexB, duv, split);',
  '    vec3 cC = sampleRGB(uTexC, duv, split);',
  '    vec3 first  = (stage < 0.5) ? cA : cB;',
  '    vec3 second = (stage < 0.5) ? cB : cC;',
  '    float k = (f <= 0.001) ? 0.0 : mix(1.0, edge, step(0.001, f));',
  '    col = (f <= 0.001) ? first : mix(second, first, k);',
  '    if(f > 0.001){ col += vec3(1.0, 0.30, 0.07) * (1.0 - abs(k - 0.5) * 2.0) * 0.12; }', // volt seam glow mid-dissolve
  '  }',
  // gentle vignette so the plane sits in the page, not on it
  '  float vig = smoothstep(1.25, 0.45, distance(vUv, vec2(0.5)));',
  '  col *= mix(0.86, 1.0, vig);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

function webglOK(){
  try{
    var c=document.createElement('canvas');
    var g=c.getContext('webgl',{failIfMajorPerformanceCaveat:false}) || c.getContext('experimental-webgl');
    if(!g) return false;
    var lose=g.getExtension('WEBGL_lose_context'); if(lose) lose.loseContext();
    return true;
  }catch(e){ return false; }
}
function makeStage(root, opts){
  var canvas = root.querySelector('.gl-canvas');
  if(!canvas || !window.THREE || !webglOK()) return null;
  var renderer;
  try{
    renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
  }catch(e){ return null; }
  if(!renderer || !renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  var scene = new THREE.Scene();
  var cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
  cam.position.z = 1;

  var uniforms = {
    uTexA:{ value:null }, uTexB:{ value:null }, uTexC:{ value:null },
    uMode:{ value: opts.mode }, uMix:{ value:0 },
    uTime:{ value:0 }, uVel:{ value:0 },
    uMouse:{ value:new THREE.Vector2(0,0) }, uMouseAmp:{ value:0 },
    uRes:{ value:new THREE.Vector2(1,1) }, uImg:{ value:new THREE.Vector2(1,1) },
    uBend:{ value:0 }
  };
  var mat = new THREE.ShaderMaterial({ uniforms:uniforms, vertexShader:VERT, fragmentShader:FRAG });
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 24), mat);
  scene.add(mesh);

  var loader = new THREE.TextureLoader();
  var loaded = 0, failed = false;
  opts.textures.forEach(function(src, i){
    loader.load(src, function(tex){
      tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      uniforms['uTex' + 'ABC'[i]].value = tex;
      if(i === 0 && tex.image){ uniforms.uImg.value.set(tex.image.width, tex.image.height); }
      loaded++;
      if(loaded === opts.textures.length && !failed){ root.classList.add('gl-on'); start(); }
    }, undefined, function(){ failed = true; root.classList.remove('gl-on'); });
  });

  var running = false, raf = 0, t0 = performance.now();
  var mouseTX = 0, mouseTY = 0, velT = 0;
  function resize(){
    var w = root.clientWidth, h = root.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  }
  function frame(){
    if(!running) return;
    raf = requestAnimationFrame(frame);
    var t = (performance.now() - t0) / 1000;
    uniforms.uTime.value = t;
    uniforms.uMouse.value.x += (mouseTX - uniforms.uMouse.value.x) * 0.06;
    uniforms.uMouse.value.y += (mouseTY - uniforms.uMouse.value.y) * 0.06;
    uniforms.uMouseAmp.value *= 0.94;
    uniforms.uVel.value += (velT - uniforms.uVel.value) * 0.08;
    velT *= 0.92;
    uniforms.uBend.value = uniforms.uVel.value;
    try{ renderer.render(scene, cam); }
    catch(e){ failed = true; root.classList.remove('gl-on'); stop(); }
  }
  function start(){ if(running) return; running = true; resize(); frame(); }
  function stop(){ running = false; cancelAnimationFrame(raf); }
  // render one still frame even before start, so reduced-motion still gets the treatment
  function still(){ resize(); try{ renderer.render(scene, cam); }catch(e){ failed = true; root.classList.remove('gl-on'); } }

  var io = new IntersectionObserver(function(en){
    if(loaded !== opts.textures.length || failed) return;
    if(en[0].isIntersecting) start(); else stop();
  }, { rootMargin:'80px' });
  io.observe(root);
  addEventListener('resize', function(){ resize(); if(!running && loaded === opts.textures.length) still(); });

  return {
    root: root,
    setMouse:function(x, y){ mouseTX = x; mouseTY = y; uniforms.uMouseAmp.value = Math.min(1, uniforms.uMouseAmp.value + 0.25); },
    addVelocity:function(v){ velT = Math.min(1, velT + Math.abs(v)); },
    setMix:function(m){ uniforms.uMix.value = m; if(!running) still(); },
    isLive:function(){ return loaded === opts.textures.length && !failed; }
  };
}

window.MayuriGL = {
  init:function(){
    var out = {};
    var hero = document.getElementById('glHero');
    if(hero) out.hero = makeStage(hero, { mode:0, textures:['assets/p-runner-orange.jpg'] });
    var stride = document.getElementById('glStride');
    if(stride) out.stride = makeStage(stride, { mode:1, textures:['assets/p-runner.jpg','assets/p-runner-orange.jpg','assets/p-runner-blue.jpg'] });
    return out;
  }
};
})();
