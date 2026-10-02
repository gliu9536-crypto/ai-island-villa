/* ====================================================================
 * 线稿风格海岛别墅 - 天空模块：太阳 / 月亮 / 星空 / 流星
 * 移植自 YIBI2333/line-art-style-magic-cabin (MIT)
 * ==================================================================== */

const SKY_STOPS = [
    [0.0, 0x040710], [3.5, 0x0d1322], [4.5, 0x1b2138], [5.3, 0x43355e],
    [6.0, 0x9c5a74], [6.4, 0xe8876a], [6.9, 0xffab7c], [7.5, 0xf7e3c8],
    [9.0, 0xfdfbf6], [15.0, 0xfdfbf6],
    [16.6, 0xfdeada], [17.4, 0xfcd3a0], [18.1, 0xffa268], [18.6, 0xf77452],
    [19.1, 0xc75a6e], [19.6, 0x6e4a78], [20.2, 0x33355e], [21.0, 0x141a30],
    [22.0, 0x080b14], [24.0, 0x040710]
];
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _gray = new THREE.Color(), _sky = new THREE.Color(),
    _white = new THREE.Color(0xffffff), _amb = new THREE.Color(), _nightAmb = new THREE.Color(0x4a5570),
    _warm = new THREE.Color(0xffd9a0), _moonCol = new THREE.Color(0x8090a0);

function skyColorAt(h, out) {
    for (let i = 0; i < SKY_STOPS.length - 1; i++) {
        const [h0, c0] = SKY_STOPS[i]; const [h1, c1] = SKY_STOPS[i + 1];
        if (h >= h0 && h <= h1) {
            const t = (h - h0) / (h1 - h0);
            return out.setHex(c0).lerp(_c2.setHex(c1), t);
        }
    }
    return out.setHex(SKY_STOPS[0][1]);
}

const glowCanvas = document.createElement('canvas'); glowCanvas.width = 64; glowCanvas.height = 64; const gCtx = glowCanvas.getContext('2d');
const gGrad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
gGrad.addColorStop(0, 'rgba(255,255,255,1)');
gGrad.addColorStop(0.3, 'rgba(255,235,205,0.55)');
gGrad.addColorStop(1, 'rgba(255,200,150,0)');
gCtx.fillStyle = gGrad; gCtx.fillRect(0, 0, 64, 64);
const glowTex = new THREE.CanvasTexture(glowCanvas);

/* ============ 太阳（圆盘 + 射线 + 双层光晕） ============ */
const sunGroup = new THREE.Group();
const sunFillMat = new THREE.MeshBasicMaterial({ color: 0xffd75e, transparent: true, fog: false, side: THREE.DoubleSide });
const sunLineMat = new THREE.LineBasicMaterial({ color: 0xc98a2e, transparent: true, fog: false });
{
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.7, 28), sunFillMat);
    sunGroup.add(disc);
    sunGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CircleGeometry(1.7, 28), 15), sunLineMat));
    const rayPts = [];
    for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a);
        rayPts.push(V(c * 2.05, s * 2.05, 0), V(c * 2.9, s * 2.9, 0));
    }
    sunGroup.add(new THREE.LineSegments(geo(rayPts.map(p => [p.x, p.y, p.z])), sunLineMat));
}
const sunGlowMatA = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc8a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const sunGlowMatB = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xff9760, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const sunGlowA = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), sunGlowMatA);
const sunGlowB = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), sunGlowMatB);
sunGlowA.position.z = 0.5; sunGlowB.position.z = 0.4;
sunGroup.add(sunGlowA); sunGroup.add(sunGlowB);
scene.add(sunGroup);

/* ============ 月亮（双圆盘 + 陨石坑） ============ */
const moonGroup = new THREE.Group();
const moonFillMatA = new THREE.MeshBasicMaterial({ color: 0xcdb8f0, transparent: true, fog: false, side: THREE.DoubleSide });
const moonLineMatA = new THREE.LineBasicMaterial({ color: 0x8068a8, transparent: true, fog: false });
const moonFillMatB = new THREE.MeshBasicMaterial({ color: 0xbdd9f2, transparent: true, fog: false, side: THREE.DoubleSide });
const moonLineMatB = new THREE.LineBasicMaterial({ color: 0x6088a8, transparent: true, fog: false });
{
    const mA = new THREE.Group();
    mA.add(new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), moonFillMatA));
    mA.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CircleGeometry(1.3, 32), 15), moonLineMatA));
    for (const [kx, ky, kr] of [[0.38, 0.34, 0.28], [-0.36, -0.22, 0.18], [0.05, -0.5, 0.13]]) {
        const crater = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CircleGeometry(kr, 12), 15), moonLineMatA);
        crater.position.set(kx, ky, 0.02); mA.add(crater);
    }
    mA.position.set(-2.0, 0.2, 0); moonGroup.add(mA);
    const mB = new THREE.Group();
    mB.add(new THREE.Mesh(new THREE.CircleGeometry(0.9, 26), moonFillMatB));
    mB.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CircleGeometry(0.9, 26), 15), moonLineMatB));
    mB.position.set(2.2, -0.15, 0.05);
    moonGroup.add(mB);
}
const moonGlowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0x93a8e8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const moonGlow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), moonGlowMat);
moonGlow.position.z = 0.3; moonGroup.add(moonGlow);
scene.add(moonGroup);

/* ============ 星空 + 银河 ============ */
function capDir(yMin) {
    const y = yMin + Math.random() * (1 - yMin);
    const t = Math.sqrt(Math.max(0, 1 - y * y));
    const th = Math.random() * Math.PI * 2;
    return { x: t * Math.cos(th), y: y, z: t * Math.sin(th) };
}
const mwN = V(0.58, 0.72, 0.38).normalize();
const mwU = V(1, 0, 0).addScaledVector(mwN, -mwN.x).normalize();
const mwV = new THREE.Vector3().crossVectors(mwN, mwU);
function mwDir(yMin) {
    for (let k = 0; k < 40; k++) {
        const a = Math.random() * Math.PI * 2;
        const g = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * 0.30;
        const ca = Math.cos(a), sa = Math.sin(a);
        const dx = mwU.x * ca + mwV.x * sa + mwN.x * g;
        const dy = mwU.y * ca + mwV.y * sa + mwN.y * g;
        const dz = mwU.z * ca + mwV.z * sa + mwN.z * g;
        const dl = Math.hypot(dx, dy, dz);
        if (dy / dl >= yMin) return { x: dx / dl, y: dy / dl, z: dz / dl };
    }
    return capDir(yMin);
}

const STAR_COUNT = 750;
const MW_COUNT = 1650;
const TOTAL_STARS = STAR_COUNT + MW_COUNT;
const starPos = new Float32Array(TOTAL_STARS * 3);
const starTwinkle = new Float32Array(TOTAL_STARS);
const starSpeed = new Float32Array(TOTAL_STARS);
const starColorMix = new Float32Array(TOTAL_STARS);
const starSize = new Float32Array(TOTAL_STARS);
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('aTwinkle', new THREE.BufferAttribute(starTwinkle, 1));
starGeo.setAttribute('aSpeed', new THREE.BufferAttribute(starSpeed, 1));
starGeo.setAttribute('aColorMix', new THREE.BufferAttribute(starColorMix, 1));
starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
for (let i = 0; i < STAR_COUNT; i++) {
    const d = capDir(0.055); const r = 95;
    starPos[i * 3] = d.x * r; starPos[i * 3 + 1] = d.y * r; starPos[i * 3 + 2] = d.z * r;
    starTwinkle[i] = Math.random() * Math.PI * 2;
    starSpeed[i] = 0.45 + Math.random() * 1.55;
    starColorMix[i] = (Math.random() + Math.random()) * 0.5;
    starSize[i] = Math.random() < 0.07 ? 6.4 + Math.random() * 2.8 : 2.9 + Math.random() * 2.3;
}
{
    let wi = STAR_COUNT;
    while (wi < TOTAL_STARS) {
        const d = mwDir(0.075); const r = 95;
        starPos[wi * 3] = d.x * r; starPos[wi * 3 + 1] = d.y * r; starPos[wi * 3 + 2] = d.z * r;
        starTwinkle[wi] = Math.random() * Math.PI * 2;
        starSpeed[wi] = 0.2 + Math.random() * 0.85;
        starColorMix[wi] = Math.random() < 0.82 ? Math.random() * 0.32 : Math.random();
        starSize[wi] = Math.random() < 0.05 ? 2.3 + Math.random() * 1.3 : 0.9 + Math.random() * 1.3;
        wi++;
    }
}
starGeo.attributes.position.needsUpdate = true;
const starUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
const starMat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: `
    attribute float aTwinkle; attribute float aSpeed; attribute float aColorMix; attribute float aSize;
    varying float vTwinkle; varying float vColorMix;
    uniform float uTime;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float twinkle = 0.45 + 0.55 * abs(sin(uTime * aSpeed * 0.5 + aTwinkle));
      gl_PointSize = aSize * (0.75 + 0.55 * twinkle) * (200.0 / -mvPosition.z);
      vTwinkle = twinkle; vColorMix = aColorMix;
    }`,
    fragmentShader: `
    varying float vTwinkle; varying float vColorMix;
    uniform float uOpacity;
    void main() {
      vec2 c = gl_PointCoord - vec2(0.5);
      float d = length(c);
      if (d > 0.5) discard;
      float e = 1.0 - d * 2.0;
      float alpha = e * e * vTwinkle * uOpacity;
      float m = clamp(vColorMix, 0.0, 1.0);
      vec3 colA = vec3(0.66, 0.76, 1.00);
      vec3 colB = vec3(0.90, 0.94, 1.00);
      vec3 colC = vec3(1.00, 0.97, 0.88);
      vec3 colD = vec3(1.00, 0.78, 0.56);
      vec3 colE = vec3(1.00, 0.60, 0.48);
      vec3 starColor;
      if (m < 0.25)      starColor = mix(colA, colB, m / 0.25);
      else if (m < 0.55) starColor = mix(colB, colC, (m - 0.25) / 0.30);
      else if (m < 0.82) starColor = mix(colC, colD, (m - 0.55) / 0.27);
      else               starColor = mix(colD, colE, (m - 0.82) / 0.18);
      starColor *= 1.42;
      gl_FragColor = vec4(starColor, min(alpha, 1.0));
    }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
});
const stars = new THREE.Points(starGeo, starMat);
stars.frustumCulled = false;
scene.add(stars);

/* ============ 流星 ============ */
const METEOR_N = 3, METEOR_PTS = 20;
const meteorList = [];
for (let i = 0; i < METEOR_N; i++) {
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(METEOR_PTS * 3), 3));
    mg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(METEOR_PTS * 3), 3));
    const mm = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const ml = new THREE.Line(mg, mm); ml.frustumCulled = false; scene.add(ml);
    meteorList.push({ geom: mg, mat: mm, active: false, t: 0, life: 1, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0 });
}
let meteorTimer = 5;
function spawnMeteor(m) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(0.25 + Math.random() * 0.65);
    const r = 78;
    m.px = r * Math.sin(ph) * Math.cos(th);
    m.py = r * Math.cos(ph) + 10;
    m.pz = r * Math.sin(ph) * Math.sin(th);
    const ang = Math.random() * Math.PI * 2;
    const sp = 55 + Math.random() * 30;
    m.vx = Math.cos(ang) * sp * 0.85;
    m.vz = Math.sin(ang) * sp * 0.85;
    m.vy = -(18 + Math.random() * 26);
    m.life = 0.75 + Math.random() * 0.5;
    m.t = 0; m.active = true;
}
function updateMeteors(dt, skyVis) {
    meteorTimer -= dt;
    if (meteorTimer <= 0) {
        if (skyVis > 0.25) { const m = meteorList.find(x => !x.active); if (m) spawnMeteor(m); }
        meteorTimer = 0.8 + Math.random() * 4 + (1 - skyVis) * 14;
    }
    for (const m of meteorList) {
        if (!m.active) { if (m.mat.opacity !== 0) m.mat.opacity = 0; continue; }
        m.t += dt;
        if (m.t >= m.life) { m.active = false; m.mat.opacity = 0; continue; }
        const fade = Math.sin(Math.PI * m.t / m.life);
        m.mat.opacity = fade * Math.min(1, skyVis * 1.6);
        const hx = m.px + m.vx * m.t, hy = m.py + m.vy * m.t, hz = m.pz + m.vz * m.t;
        const vlen = Math.hypot(m.vx, m.vy, m.vz);
        const L = 9 + vlen * 0.14;
        const pos = m.geom.attributes.position.array;
        const col = m.geom.attributes.color.array;
        for (let k = 0; k < METEOR_PTS; k++) {
            const d = k / (METEOR_PTS - 1);
            pos[k * 3] = hx - m.vx / vlen * L * d;
            pos[k * 3 + 1] = hy - m.vy / vlen * L * d;
            pos[k * 3 + 2] = hz - m.vz / vlen * L * d;
            const b = Math.pow(1 - d, 2.1);
            col[k * 3] = b; col[k * 3 + 1] = b * 0.97; col[k * 3 + 2] = b * 0.9;
        }
        m.geom.attributes.position.needsUpdate = true;
        m.geom.attributes.color.needsUpdate = true;
    }
}
