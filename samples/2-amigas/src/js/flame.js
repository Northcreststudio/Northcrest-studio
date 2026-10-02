/**
 * Real-time flame (raw WebGL fragment shader, no libraries).
 * Layered fractal noise scrolls upward through a teardrop mask and a
 * black-body colour ramp: deep red → orange → yellow → white core.
 * `setHeat(0..1)` makes it taller and wilder.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uHeat;
float hash(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
  float h = uHeat;
  float t = uTime * (1.1 + h * 1.2);
  float n  = fbm(vec2(p.x * 3.2, p.y * 2.6 - t * 1.4));
  float n2 = fbm(vec2(p.x * 7.0 + 4.0, p.y * 6.0 - t * 2.6));
  // several tongues of flame across the width
  float tongues = 0.55 + 0.45 * sin(p.x * (9.0 + h * 4.0) + n * 4.0 - t * 0.6);
  float width = 0.42 + 0.3 * h;
  float body = 1.0 - smoothstep(0.0, width, abs(p.x) * (1.0 + p.y * 0.8));
  float height = 0.22 + 0.72 * h;
  float f = body * (1.0 - smoothstep(0.0, height * (0.65 + tongues * 0.5), uv.y + (n - 0.5) * 0.32));
  f = clamp(f * (0.65 + n2 * 1.1), 0.0, 1.0);
  f *= smoothstep(0.0, 0.08, uv.y);
  vec3 col = mix(vec3(0.22, 0.02, 0.0), vec3(0.93, 0.28, 0.03), smoothstep(0.08, 0.42, f));
  col = mix(col, vec3(1.0, 0.68, 0.18), smoothstep(0.42, 0.72, f));
  col = mix(col, vec3(1.0, 0.95, 0.8), smoothstep(0.82, 1.0, f));
  float a = smoothstep(0.03, 0.5, f);
  gl_FragColor = vec4(col * a, a);
}`;

export function createFlame(canvas, { dpr = 1 } = {}) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uHeat = gl.getUniformLocation(prog, 'uHeat');

  let heat = 0.2;
  let target = 0.2;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr * 0.6)); // flames are soft; render below native res
    canvas.height = Math.max(1, Math.round(r.height * dpr * 0.6));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  return {
    setHeat(v) {
      target = v;
    },
    /** Draw one frame. dt in seconds. */
    draw(time, dt) {
      heat += (target - heat) * (1 - Math.exp(-dt * 2.5));
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uHeat, heat);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
