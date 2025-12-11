
/*
 Ultra-Neon PRO engine (balanced): WebGL shader + canvas fallback
 - No external deps. Detects WebGL2, creates simple particle shader with additive blending.
 - If WebGL unavailable, falls back to canvas particle renderer from engine.js
*/
function createGLCanvas(){
  const c = document.createElement('canvas');
  c.id = 'omega-gl-canvas';
  c.style.position = 'fixed';
  c.style.left = '0';
  c.style.top = '0';
  c.style.width = '100%';
  c.style.height = '100%';
  c.style.pointerEvents = 'none';
  c.style.zIndex = 6;
  document.body.appendChild(c);
  return c;
}

function supportsWebGL2(){
  try{
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2'));
  }catch(e){ return false; }
}

export default function initUltraFX(opts = {}){
  if(supportsWebGL2()){
    try{ return initWebGLFX(opts); }catch(e){ console.warn('WebGL init failed, fallback', e); return initCanvasFallback(opts); }
  } else {
    return initCanvasFallback(opts);
  }
}

function initCanvasFallback(opts){
  // reuse existing engine if present
  const enginePath = '/src/fx/engine.js';
  try{
    // dynamic import may not work in this bundle; implement a simple canvas lightweight here
  }catch(e){}
  // simple canvas particles (subtle neon trails)
  let canvas = document.getElementById('omega-fx-canvas');
  if(!canvas){
    canvas = document.createElement('canvas');
    canvas.id = 'omega-fx-canvas';
    canvas.style.position='fixed';
    canvas.style.left='0';
    canvas.style.top='0';
    canvas.style.width='100%';
    canvas.style.height='100%';
    canvas.style.pointerEvents='none';
    canvas.style.zIndex=5;
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth * devicePixelRatio;
  let h = canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  const parts = [];
  for(let i=0;i<120;i++){
    parts.push({x: Math.random()*innerWidth, y: Math.random()*innerHeight, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6, r:1+Math.random()*3, a:0.05+Math.random()*0.6});
  }
  function frame(t){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    // motion blur
    ctx.fillStyle = 'rgba(4,2,12,0.25)';
    ctx.fillRect(0,0,innerWidth,innerHeight);
    for(const p of parts){
      p.x += p.vx; p.y += p.vy;
      if(p.x<-50) p.x = innerWidth+50; if(p.x>innerWidth+50) p.x=-50;
      if(p.y<-50) p.y = innerHeight+50; if(p.y>innerHeight+50) p.y=-50;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(211,124,255,'+p.a+')';
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { stop(){ } };
}

function initWebGLFX(opts){
  const canvas = createGLCanvas();
  const gl = canvas.getContext('webgl2', {alpha:true, antialias:true});
  if(!gl) throw new Error('no gl2');
  // Resize helper
  function resize(){ canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; gl.viewport(0,0,canvas.width,canvas.height); }
  window.addEventListener('resize', resize); resize();
  // Simple shader: renders moving particles as points with additive blending
  const vs = `#version 300 es
  precision highp float;
  in vec2 a_pos;
  in float a_size;
  in vec3 a_color;
  uniform float u_time;
  uniform vec2 u_resolution;
  out vec3 v_color;
  void main(){
    vec2 pos = a_pos + vec2(sin(u_time*0.3 + a_pos.x*0.001)*20.0, cos(u_time*0.2 + a_pos.y*0.001)*20.0);
    vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = a_size;
    v_color = a_color;
  }`;
  const fs = `#version 300 es
  precision highp float;
  in vec3 v_color;
  out vec4 outColor;
  void main(){
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d);
    outColor = vec4(v_color, alpha);
  }`;
  function compile(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog); if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  // generate particle buffer
  const COUNT = 300;
  const pos = new Float32Array(COUNT*2);
  const size = new Float32Array(COUNT);
  const color = new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    pos[i*2] = Math.random()*canvas.width; pos[i*2+1] = Math.random()*canvas.height;
    size[i] = 1.0 + Math.random()*6.0;
    color[i*3] = 0.52; color[i*3+1] = 0.16; color[i*3+2] = 0.87;
  }
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  function createAttrib(buffer, loc, sizeN){ const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW); const locIdx = gl.getAttribLocation(prog, loc); gl.enableVertexAttribArray(locIdx); gl.vertexAttribPointer(locIdx, sizeN, gl.FLOAT, false, 0, 0); }
  createAttrib(pos, 'a_pos', 2); createAttrib(size, 'a_size', 1); createAttrib(color, 'a_color', 3);
  const u_time = gl.getUniformLocation(prog, 'u_time'); const u_resolution = gl.getUniformLocation(prog, 'u_resolution');
  let start = performance.now();
  function render(t){
    const time = (t - start) / 1000;
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u_time, time); gl.uniform2f(u_resolution, canvas.width, canvas.height);
    // update positions slightly for motion
    for(let i=0;i<COUNT;i++){
      pos[i*2] = (pos[i*2] + (Math.sin(time*0.1+i)*0.5)) % canvas.width;
      pos[i*2+1] = (pos[i*2+1] + (Math.cos(time*0.08+i)*0.3)) % canvas.height;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // upload pos buffer
    const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    const sizeBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf); gl.bufferData(gl.ARRAY_BUFFER, size, gl.DYNAMIC_DRAW);
    const colorBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf); gl.bufferData(gl.ARRAY_BUFFER, color, gl.DYNAMIC_DRAW);
    createAttrib(pos, 'a_pos', 2); createAttrib(size, 'a_size', 1); createAttrib(color, 'a_color', 3);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  return { stop(){ } };
}
