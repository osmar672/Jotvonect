const DEFAULTS = Object.freeze({
  SIM_RESOLUTION: 96,
  DYE_RESOLUTION: 720,
  DENSITY_DISSIPATION: 3.5,
  VELOCITY_DISSIPATION: 2,
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 3,
  SPLAT_RADIUS: 0.2,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLOR_UPDATE_SPEED: 10,
  COLOR: '#A855F7',
  RAINBOW_MODE: false,
  TRANSPARENT: true
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function hexToRgb(hex) {
  let value = String(hex || '#A855F7').replace('#', '');
  if (value.length === 3) value = value.split('').map(char => char + char).join('');
  const number = Number.parseInt(value.slice(0, 6), 16);
  if (!Number.isFinite(number)) return { r: 0.65, g: 0.33, b: 0.97 };
  return {
    r: ((number >> 16) & 255) / 255,
    g: ((number >> 8) & 255) / 255,
    b: (number & 255) / 255
  };
}

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return { r: v, g: t, b: p };
    case 1: return { r: q, g: v, b: p };
    case 2: return { r: p, g: v, b: t };
    case 3: return { r: p, g: q, b: v };
    case 4: return { r: t, g: p, b: v };
    default: return { r: v, g: p, b: q };
  }
}

function getResolution(gl, resolution) {
  let aspect = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
  if (aspect < 1) aspect = 1 / aspect;
  const min = Math.round(resolution);
  const max = Math.round(resolution * aspect);
  return gl.drawingBufferWidth > gl.drawingBufferHeight
    ? { width: max, height: min }
    : { width: min, height: max };
}

function createFluidCanvas(canvas, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  }) || canvas.getContext('webgl', {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  });

  if (!gl) return () => {};

  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  const halfFloatExt = isWebGL2 ? null : gl.getExtension('OES_texture_half_float');
  const linearExt = gl.getExtension('OES_texture_float_linear') || gl.getExtension('OES_texture_half_float_linear');
  if (isWebGL2) gl.getExtension('EXT_color_buffer_float');

  const halfFloat = isWebGL2 ? gl.HALF_FLOAT : halfFloatExt?.HALF_FLOAT_OES;
  if (!halfFloat) return () => {};

  const formatRGBA = isWebGL2
    ? { internalFormat: gl.RGBA16F, format: gl.RGBA }
    : { internalFormat: gl.RGBA, format: gl.RGBA };
  const formatRG = isWebGL2
    ? { internalFormat: gl.RG16F, format: gl.RG }
    : formatRGBA;
  const formatR = isWebGL2
    ? { internalFormat: gl.R16F, format: gl.RED }
    : formatRGBA;

  const vertex = compile(gl, gl.VERTEX_SHADER, `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main(){
      vUv=aPosition*.5+.5;
      vL=vUv-vec2(texelSize.x,0.0);
      vR=vUv+vec2(texelSize.x,0.0);
      vT=vUv+vec2(0.0,texelSize.y);
      vB=vUv-vec2(0.0,texelSize.y);
      gl_Position=vec4(aPosition,0.0,1.0);
    }
  `);

  const copy = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    void main(){ gl_FragColor=texture2D(uTexture,vUv); }
  `);
  const clear = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }
  `);
  const splatProgram = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main(){
      vec2 p=vUv-point;
      p.x*=aspectRatio;
      vec3 splat=exp(-dot(p,p)/radius)*color;
      vec3 base=texture2D(uTarget,vUv).xyz;
      gl_FragColor=vec4(base+splat,1.0);
    }
  `);
  const advection = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main(){
      vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;
      vec4 result=texture2D(uSource,coord);
      float decay=1.0+dissipation*dt;
      gl_FragColor=result/decay;
    }
  `);
  const divergence = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv,vL,vR,vT,vB;
    uniform sampler2D uVelocity;
    void main(){
      float L=texture2D(uVelocity,vL).x;
      float R=texture2D(uVelocity,vR).x;
      float T=texture2D(uVelocity,vT).y;
      float B=texture2D(uVelocity,vB).y;
      vec2 C=texture2D(uVelocity,vUv).xy;
      if(vL.x<0.0)L=-C.x; if(vR.x>1.0)R=-C.x;
      if(vT.y>1.0)T=-C.y; if(vB.y<0.0)B=-C.y;
      gl_FragColor=vec4(.5*(R-L+T-B),0.0,0.0,1.0);
    }
  `);
  const curl = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vL,vR,vT,vB;
    uniform sampler2D uVelocity;
    void main(){
      float L=texture2D(uVelocity,vL).y;
      float R=texture2D(uVelocity,vR).y;
      float T=texture2D(uVelocity,vT).x;
      float B=texture2D(uVelocity,vB).x;
      gl_FragColor=vec4(.5*(R-L-T+B),0.0,0.0,1.0);
    }
  `);
  const vorticity = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv,vL,vR,vT,vB;
    uniform sampler2D uVelocity,uCurl;
    uniform float curl,dt;
    void main(){
      float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x;
      float T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x;
      float C=texture2D(uCurl,vUv).x;
      vec2 force=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));
      force/=length(force)+.0001;
      force*=curl*C; force.y*=-1.0;
      vec2 velocity=texture2D(uVelocity,vUv).xy;
      velocity+=force*dt;
      velocity=clamp(velocity,-1000.0,1000.0);
      gl_FragColor=vec4(velocity,0.0,1.0);
    }
  `);
  const pressure = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vL,vR,vT,vB,vUv;
    uniform sampler2D uPressure,uDivergence;
    void main(){
      float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x;
      float T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;
      float D=texture2D(uDivergence,vUv).x;
      gl_FragColor=vec4((L+R+B+T-D)*.25,0.0,0.0,1.0);
    }
  `);
  const gradient = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vL,vR,vT,vB,vUv;
    uniform sampler2D uPressure,uVelocity;
    void main(){
      float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x;
      float T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;
      vec2 velocity=texture2D(uVelocity,vUv).xy;
      velocity-=vec2(R-L,T-B);
      gl_FragColor=vec4(velocity,0.0,1.0);
    }
  `);
  const display = program(gl, vertex, gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv,vL,vR,vT,vB;
    uniform sampler2D uTexture;
    uniform vec2 texelSize;
    void main(){
      vec3 c=texture2D(uTexture,vUv).rgb;
      ${config.SHADING ? `
      vec3 lc=texture2D(uTexture,vL).rgb,rc=texture2D(uTexture,vR).rgb;
      vec3 tc=texture2D(uTexture,vT).rgb,bc=texture2D(uTexture,vB).rgb;
      float dx=length(rc)-length(lc),dy=length(tc)-length(bc);
      vec3 n=normalize(vec3(dx,dy,length(texelSize)));
      c*=clamp(dot(n,vec3(0.0,0.0,1.0))+.7,.7,1.0);` : ''}
      float a=max(c.r,max(c.g,c.b));
      gl_FragColor=vec4(c,a);
    }
  `);

  const quad = gl.createBuffer();
  const indices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);

  function createFbo(width, height, format, filtering) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, format.internalFormat, width, height, 0, format.format, halfFloat, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return { texture, fbo, width, height, texelSizeX: 1 / width, texelSizeY: 1 / height };
  }

  function createDoubleFbo(width, height, format, filtering) {
    let a = createFbo(width, height, format, filtering);
    let b = createFbo(width, height, format, filtering);
    return {
      width, height, get read() { return a; }, set read(v) { a = v; },
      get write() { return b; }, set write(v) { b = v; },
      get texelSizeX() { return a.texelSizeX; }, get texelSizeY() { return a.texelSizeY; },
      swap() { const temp = a; a = b; b = temp; }
    };
  }

  function use(programRef) {
    gl.useProgram(programRef);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const position = gl.getAttribLocation(programRef, 'aPosition');
    if (position >= 0) {
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(position);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  }

  function uniform(ref, name, type, ...values) {
    const location = gl.getUniformLocation(ref, name);
    if (location) gl[type](location, ...values);
  }

  function draw(target = null, clear = false) {
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if (clear) gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  function attach(target, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    return unit;
  }

  let dye;
  let velocity;
  let divergenceFbo;
  let curlFbo;
  let pressureFbo;
  let lastWidth = 0;
  let lastHeight = 0;

  function initFramebuffers() {
    const sim = getResolution(gl, config.SIM_RESOLUTION);
    const dyeRes = getResolution(gl, config.DYE_RESOLUTION);
    const filtering = linearExt ? gl.LINEAR : gl.NEAREST;
    dye = createDoubleFbo(dyeRes.width, dyeRes.height, formatRGBA, filtering);
    velocity = createDoubleFbo(sim.width, sim.height, formatRG, filtering);
    divergenceFbo = createFbo(sim.width, sim.height, formatR, gl.NEAREST);
    curlFbo = createFbo(sim.width, sim.height, formatR, gl.NEAREST);
    pressureFbo = createDoubleFbo(sim.width, sim.height, formatR, gl.NEAREST);
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (width === lastWidth && height === lastHeight) return;
    canvas.width = width;
    canvas.height = height;
    lastWidth = width;
    lastHeight = height;
    initFramebuffers();
  }

  function splat(x, y, dx, dy, color) {
    use(splatProgram);
    uniform(splatProgram, 'uTarget', 'uniform1i', attach(velocity.read, 0));
    uniform(splatProgram, 'aspectRatio', 'uniform1f', canvas.width / canvas.height);
    uniform(splatProgram, 'point', 'uniform2f', x, y);
    uniform(splatProgram, 'color', 'uniform3f', dx, dy, 0);
    uniform(splatProgram, 'radius', 'uniform1f', correctRadius(config.SPLAT_RADIUS / 100));
    draw(velocity.write); velocity.swap();
    uniform(splatProgram, 'uTarget', 'uniform1i', attach(dye.read, 0));
    uniform(splatProgram, 'color', 'uniform3f', color.r, color.g, color.b);
    draw(dye.write); dye.swap();
  }

  function correctRadius(radius) {
    const aspect = canvas.width / Math.max(1, canvas.height);
    return aspect > 1 ? radius * aspect : radius;
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    use(curl);
    uniform(curl, 'texelSize', 'uniform2f', velocity.texelSizeX, velocity.texelSizeY);
    uniform(curl, 'uVelocity', 'uniform1i', attach(velocity.read, 0));
    draw(curlFbo);

    use(vorticity);
    uniform(vorticity, 'texelSize', 'uniform2f', velocity.texelSizeX, velocity.texelSizeY);
    uniform(vorticity, 'uVelocity', 'uniform1i', attach(velocity.read, 0));
    uniform(vorticity, 'uCurl', 'uniform1i', attach(curlFbo, 1));
    uniform(vorticity, 'curl', 'uniform1f', config.CURL);
    uniform(vorticity, 'dt', 'uniform1f', dt);
    draw(velocity.write); velocity.swap();

    use(divergence);
    uniform(divergence, 'texelSize', 'uniform2f', velocity.texelSizeX, velocity.texelSizeY);
    uniform(divergence, 'uVelocity', 'uniform1i', attach(velocity.read, 0));
    draw(divergenceFbo);

    use(clear);
    uniform(clear, 'uTexture', 'uniform1i', attach(pressureFbo.read, 0));
    uniform(clear, 'value', 'uniform1f', config.PRESSURE);
    draw(pressureFbo.write); pressureFbo.swap();

    use(pressure);
    uniform(pressure, 'texelSize', 'uniform2f', velocity.texelSizeX, velocity.texelSizeY);
    uniform(pressure, 'uDivergence', 'uniform1i', attach(divergenceFbo, 0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i += 1) {
      uniform(pressure, 'uPressure', 'uniform1i', attach(pressureFbo.read, 1));
      draw(pressureFbo.write); pressureFbo.swap();
    }

    use(gradient);
    uniform(gradient, 'texelSize', 'uniform2f', velocity.texelSizeX, velocity.texelSizeY);
    uniform(gradient, 'uPressure', 'uniform1i', attach(pressureFbo.read, 0));
    uniform(gradient, 'uVelocity', 'uniform1i', attach(velocity.read, 1));
    draw(velocity.write); velocity.swap();

    use(advection);
    uniform(advection, 'texelSize', 'uniform2f', velocity.texelSizeX, velocity.texelSizeY);
    uniform(advection, 'uVelocity', 'uniform1i', attach(velocity.read, 0));
    uniform(advection, 'uSource', 'uniform1i', attach(velocity.read, 0));
    uniform(advection, 'dt', 'uniform1f', dt);
    uniform(advection, 'dissipation', 'uniform1f', config.VELOCITY_DISSIPATION);
    draw(velocity.write); velocity.swap();

    uniform(advection, 'uVelocity', 'uniform1i', attach(velocity.read, 0));
    uniform(advection, 'uSource', 'uniform1i', attach(dye.read, 1));
    uniform(advection, 'dissipation', 'uniform1f', config.DENSITY_DISSIPATION);
    draw(dye.write); dye.swap();
  }

  function render() {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    use(display);
    uniform(display, 'texelSize', 'uniform2f', 1 / canvas.width, 1 / canvas.height);
    uniform(display, 'uTexture', 'uniform1i', attach(dye.read, 0));
    draw(null);
  }

  const pointer = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, moved: false, down: false };
  let hue = 0.78;
  let colorTimer = 0;
  let active = true;
  let frame = 0;
  let last = performance.now();
  let initializedPointer = false;

  function color() {
    if (config.RAINBOW_MODE) return hsvToRgb(hue, 1, 1);
    const rgb = hexToRgb(config.COLOR);
    return { r: rgb.r * 0.15, g: rgb.g * 0.15, b: rgb.b * 0.15 };
  }

  function move(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    if (!initializedPointer) {
      pointer.prevX = x; pointer.prevY = y; initializedPointer = true;
    }
    pointer.x = x; pointer.y = y;
    const dx = x - pointer.prevX;
    const dy = y - pointer.prevY;
    pointer.prevX = x; pointer.prevY = y;
    pointer.dx = Math.abs(dx) > 0.00001 ? dx : 0;
    pointer.dy = Math.abs(dy) > 0.00001 ? dy : 0;
    pointer.moved = Boolean(pointer.dx || pointer.dy);
  }

  function onMove(event) { move(event.clientX, event.clientY); }
  function onDown(event) { move(event.clientX, event.clientY); pointer.down = true; splat(pointer.x, pointer.y, (Math.random() - .5) * 10, (Math.random() - .5) * 30, color()); }
  function onUp() { pointer.down = false; }
  function onTouchMove(event) { const touch = event.touches[0]; if (touch) move(touch.clientX, touch.clientY); }
  function onTouchStart(event) { const touch = event.touches[0]; if (touch) { move(touch.clientX, touch.clientY); pointer.down = true; } }
  function onTouchEnd() { pointer.down = false; }

  function loop(now) {
    if (!active) return;
    resize();
    const dt = Math.min((now - last) / 1000, 0.016666);
    last = now;
    colorTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorTimer >= 1) { colorTimer %= 1; hue = (hue + 0.08) % 1; }
    if (pointer.moved) {
      const aspect = canvas.width / Math.max(1, canvas.height);
      let dx = pointer.dx * config.SPLAT_FORCE;
      let dy = pointer.dy * config.SPLAT_FORCE;
      if (aspect < 1) dx *= aspect;
      if (aspect > 1) dy /= aspect;
      splat(pointer.x, pointer.y, dx, dy, color());
      pointer.moved = false;
    }
    step(dt);
    render();
    frame = requestAnimationFrame(loop);
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mousedown', onDown, { passive: true });
  window.addEventListener('mouseup', onUp, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  resize();
  frame = requestAnimationFrame(loop);

  return () => {
    active = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
    for (const ref of [copy, clear, splatProgram, advection, divergence, curl, vorticity, pressure, gradient, display]) gl.deleteProgram(ref);
    gl.deleteShader(vertex);
    gl.deleteBuffer(quad);
    gl.deleteBuffer(indices);
  };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('SplashCursor shader error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function program(gl, vertexShader, fragmentType, fragmentSource) {
  const fragmentShader = compile(gl, fragmentType, fragmentSource);
  const ref = gl.createProgram();
  gl.attachShader(ref, vertexShader);
  gl.attachShader(ref, fragmentShader);
  gl.linkProgram(ref);
  if (!gl.getProgramParameter(ref, gl.LINK_STATUS)) {
    console.warn('SplashCursor program error:', gl.getProgramInfoLog(ref));
  }
  return ref;
}

export function createSplashCursor(options = {}) {
  const canvas = document.createElement('canvas');
  const indicator = document.createElement('div');
  canvas.className = 'splash-cursor';
  indicator.className = 'cursor-state';
  indicator.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
    'display:block', 'pointer-events:none', 'z-index:50', 'opacity:1'
  ].join(';');
  document.body.appendChild(canvas);
  document.body.appendChild(indicator);

  if (document.documentElement.classList.contains('low-performance') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    canvas.remove();
    indicator.remove();
    return () => {};
  }

  const moveIndicator = event => {
    indicator.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
    const target = event.target?.closest?.('[data-cursor]');
    indicator.textContent = target?.dataset?.cursor || '';
    indicator.classList.toggle('is-active', Boolean(target));
    canvas.classList.toggle('is-over-control', Boolean(target));
    canvas.classList.toggle('is-hidden', Boolean(event.target?.closest?.('input,textarea,select')));
  };
  document.addEventListener('pointermove', moveIndicator, { passive: true });

  const destroyFluid = createFluidCanvas(canvas, options);
  return () => {
    document.removeEventListener('pointermove', moveIndicator);
    destroyFluid();
    canvas.remove();
    indicator.remove();
  };
}
