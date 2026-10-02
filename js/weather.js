/* ====================================================================
 * 线稿风格海岛别墅 - 天气模块：云 / 雨 / 雪 / 雾 / 闪电 + 日落定格
 * 移植自 YIBI2333/line-art-style-magic-cabin (MIT)
 * ==================================================================== */

/* ============ 时间定格：黄昏 17:48 / 午夜 00:30 双模式 ============ */
const HOUR_DUSK = 17.8, HOUR_MIDNIGHT = 0.5;
let fixedHour = HOUR_DUSK, targetHour = HOUR_DUSK;
const TRANS_SPEED = 2.4;   // 小时/秒，切换时天空沿 24h 轴平滑推进
function setTimeMode(mode) {
    targetHour = (mode === 'midnight') ? HOUR_MIDNIGHT : HOUR_DUSK;
    if (typeof onTimeModeChanged === 'function') onTimeModeChanged(mode);
}
const clockEl = document.getElementById('clock');

const WX_LIST = ['sunny', 'cloudy', 'fog', 'rain', 'storm', 'snow', 'blizzard'];
const WX_EN = { sunny: 'SUNNY', cloudy: 'CLOUDY', fog: 'FOG', rain: 'RAIN', storm: 'STORM', snow: 'SNOW', blizzard: 'BLIZZARD' };
const WX_NAME = { sunny: '晴', cloudy: '多云', fog: '雾', rain: '雨', storm: '暴雨', snow: '雪', blizzard: '暴雪' };
const WX_CFG = {
    sunny: { clouds: 4, rain: 0, snow: 0, fog: 0, gray: 0, wind: 0.2 },
    cloudy: { clouds: 10, rain: 0, snow: 0, fog: 0.15, gray: 0.25, wind: 0.4 },
    fog: { clouds: 4, rain: 0, snow: 0, fog: 1.0, gray: 0.45, wind: 0.1 },
    rain: { clouds: 6, rain: 240, snow: 0, fog: 0.35, gray: 0.50, wind: 0.6 },
    storm: { clouds: 10, rain: 520, snow: 0, fog: 0.60, gray: 0.65, wind: 1.6 },
    snow: { clouds: 5, rain: 0, snow: 200, fog: 0.35, gray: 0.35, wind: 0.3 },
    blizzard: { clouds: 9, rain: 0, snow: 420, fog: 0.60, gray: 0.55, wind: 1.8 }
};
const wx = { type: 'sunny', random: false, timer: 14, clouds: 2, rain: 0, snow: 0, fog: 0, gray: 0, wind: 0.2 };
const WIND_DIR = { x: 0.86, z: 0.51 };

function setWeather(t) {
    wx.type = t;
    if (typeof chipEls !== 'undefined') chipEls.forEach((el, i) => el.classList.toggle('on', WX_LIST[i] === t));
}
setWeather('sunny');

/* ============ 云：三层高度 + 云底暗面（厚度与层次） ============ */
const CLOUD_POOL = 16;
const cloudList = [];
const CLOUD_LAYERS = [
    { yMin: 11.5, yMax: 14.5, scale: 0.7, opacity: 0.82, spd: 1.5 },   // 低层碎云
    { yMin: 17.5, yMax: 23.0, scale: 1.1, opacity: 0.94, spd: 1.0 },   // 中层主云
    { yMin: 23.5, yMax: 29.0, scale: 1.55, opacity: 0.68, spd: 0.55 },  // 高层薄云
];
for (const L of CLOUD_LAYERS) {
    L.topMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: L.opacity, depthWrite: false, fog: false });
    L.baseMat = new THREE.MeshBasicMaterial({ color: 0xd8d8e0, transparent: true, opacity: L.opacity - 0.06, depthWrite: false, fog: false });
}
function makeCloud(layer, px, pz) {
    const L = CLOUD_LAYERS[layer];
    const g = new THREE.Group();
    const n = 5 + Math.floor(Math.random() * 4);
    let cx = 0;
    for (let i = 0; i < n; i++) {   /* 顶部亮面云团 */
        const w = 1.8 + Math.random() * 2.4, h = 1.5 + Math.random() * 1.7, d = 1.8 + Math.random() * 2.2;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), L.topMat);
        mesh.scale.set(w / 2, h / 2, d / 2);
        mesh.position.set(cx, (Math.random() - 0.2) * 0.28, (Math.random() - 0.5) * 1.3);
        g.add(mesh);
        cx += w * 0.32;
    }
    let bx = 0.5;
    const bn = Math.max(2, Math.floor(n * 0.6));
    for (let i = 0; i < bn; i++) {  /* 底部暗面云团（厚度感） */
        const w = 1.7 + Math.random() * 2.1, h = 0.8 + Math.random() * 0.7;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), L.baseMat);
        mesh.scale.set(w / 2, h / 2, (1.7 + Math.random()) / 2);
        mesh.position.set(bx, -0.55 - Math.random() * 0.3, (Math.random() - 0.5) * 1.1);
        g.add(mesh);
        bx += w * 0.3;
    }
    g.position.set(px, L.yMin + Math.random() * (L.yMax - L.yMin), pz);
    g.visible = false;
    const c = { grp: g, op: 0, spd: (0.7 + Math.random() * 0.6) * L.spd, layer, floatPh: Math.random() * 6.28, bs: L.scale * (0.8 + Math.random() * 0.5) };
    cloudList.push(c); scene.add(g); return c;
}
/* 手工布置的云锚点：覆盖默认机位的天空带，太阳方位放金边云 */
const CLOUD_ANCHORS = [
    [1, -18, -12], [2, -42, -6], [1, -60, -20], [0, -32, -30], [2, -8, -26],
    [0, -70, 4], [1, -50, -34], [2, -25, 8], [2, -75, -36], [0, -36, 18],
    [1, -30, -44], [0, -12, 2]
];
for (const [ly, ax, az2] of CLOUD_ANCHORS) makeCloud(ly, ax, az2);
for (let i = 0; i < 4; i++) makeCloud(i % 3, -90 + Math.random() * 115, -70 + Math.random() * 95);
const _cloudCol = new THREE.Color(), _cloudBase = new THREE.Color();

/* ============ 雨 ============ */
const RAIN_MAX = 560, rainPos = new Float32Array(RAIN_MAX * 6), rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0x7d93a8, transparent: true, opacity: 0.55, depthWrite: false });
const rainLines = new THREE.LineSegments(rainGeo, rainMat); rainLines.frustumCulled = false; scene.add(rainLines);
const rainDrops = [];
for (let i = 0; i < RAIN_MAX; i++) rainDrops.push({ x: (Math.random() - 0.5) * 56, y: Math.random() * 16, z: (Math.random() - 0.5) * 56, v: 9 + Math.random() * 4 });

/* ============ 雪（六芒雪花线 + 光点球） ============ */
const SNOW_MAX = 440, snowPos = new Float32Array(SNOW_MAX * 18), snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.LineBasicMaterial({ color: 0xa8c0dc, transparent: true, opacity: 0.85, depthWrite: false });
const snowLines = new THREE.LineSegments(snowGeo, snowMat); snowLines.frustumCulled = false; scene.add(snowLines);
const snowFlakes = [];
for (let i = 0; i < SNOW_MAX; i++) {
    const phi = Math.acos(Math.random() * 0.6 + 0.2);
    const theta = Math.random() * Math.PI * 2;
    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.cos(phi);
    const nz = Math.sin(phi) * Math.sin(theta);
    let ux, uy, uz, vx, vy, vz;
    if (Math.abs(ny) < 0.99) {
        ux = nz; uy = 0; uz = -nx;
        const ul = Math.hypot(ux, uy, uz);
        ux /= ul; uy /= ul; uz /= ul;
        vx = ny * uz - nz * uy;
        vy = nz * ux - nx * uz;
        vz = nx * uy - ny * ux;
    } else {
        ux = 1; uy = 0; uz = 0;
        vx = 0; vy = 0; vz = 1;
    }
    snowFlakes.push({ x: (Math.random() - 0.5) * 56, y: Math.random() * 16, z: (Math.random() - 0.5) * 56, v: 0.6 + Math.random() * 0.5, ph: Math.random() * 6.28, amp: 0.35 + Math.random() * 0.4, fq: 0.5 + Math.random() * 0.7, rot: Math.random() * 6.28, rotV: (Math.random() - 0.5) * 2, ux, uy, uz, vx, vy, vz });
}
const SNOW_BALL_MAX = 150; const snowBallPos = new Float32Array(SNOW_BALL_MAX * 3); const snowBallGeo = new THREE.BufferGeometry();
snowBallGeo.setAttribute('position', new THREE.BufferAttribute(snowBallPos, 3));
const snowBallCanvas = document.createElement('canvas'); snowBallCanvas.width = 32; snowBallCanvas.height = 32; const sbCtx = snowBallCanvas.getContext('2d');
const grad = sbCtx.createRadialGradient(16, 16, 0, 16, 16, 16); grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.6)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
sbCtx.fillStyle = grad; sbCtx.fillRect(0, 0, 32, 32);
const snowBallMat = new THREE.PointsMaterial({ size: 0.15, map: new THREE.CanvasTexture(snowBallCanvas), transparent: true, depthWrite: false, opacity: 0.85, sizeAttenuation: true });
const snowBalls = new THREE.Points(snowBallGeo, snowBallMat); snowBalls.frustumCulled = false; scene.add(snowBalls);
const snowBallFlakes = [];
for (let i = 0; i < SNOW_BALL_MAX; i++) snowBallFlakes.push({ x: (Math.random() - 0.5) * 56, y: Math.random() * 16, z: (Math.random() - 0.5) * 56, v: 0.5 + Math.random() * 0.4, ph: Math.random() * 6.28, amp: 0.2 + Math.random() * 0.3, fq: 0.6 + Math.random() * 0.5 });

/* ============ 闪电 ============ */
const boltMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false });
let boltLine = new THREE.Line(new THREE.BufferGeometry(), boltMat); boltLine.frustumCulled = false; boltLine.visible = false; scene.add(boltLine);
let boltT = 0, nextBolt = 6 + Math.random() * 12;
function spawnBolt() {
    const pts = []; let bx = -30 + Math.random() * 60, bz = -34 + Math.random() * 30, by = 15;
    pts.push(V(bx, by, bz));
    while (by > 0.5) { by -= 1.5 + Math.random() * 1.5; bx += (Math.random() - 0.5) * 2.6; bz += (Math.random() - 0.5) * 1.2; pts.push(V(bx, Math.max(by, 0), bz)); }
    boltLine.geometry.dispose();
    boltLine.geometry = geo(pts.map(p => [p.x, p.y, p.z]));
    boltLine.visible = true;
}

/* ============ 主更新 ============ */
let clockTick = 0;
function updateWeatherSystem(dt, time) {
    const cfg = WX_CFG[wx.type]; const k = 1 - Math.exp(-dt * 0.55);
    wx.clouds += (cfg.clouds - wx.clouds) * k; wx.rain += (cfg.rain - wx.rain) * k; wx.snow += (cfg.snow - wx.snow) * k;
    wx.fog += (cfg.fog - wx.fog) * k; wx.gray += (cfg.gray - wx.gray) * k; wx.wind += (cfg.wind - wx.wind) * k;
    if (wx.random) { wx.timer -= dt; if (wx.timer <= 0) { const others = WX_LIST.filter(t => t !== wx.type); setWeather(others[Math.floor(Math.random() * others.length)]); wx.timer = 16 + Math.random() * 18; } }

    /* 时间向目标时刻平滑推进（自动取最短方向，切换时掠过晨昏） */
    fixedHour = ((fixedHour % 24) + 24) % 24;
    let dh = ((targetHour - fixedHour) % 24 + 24) % 24;
    if (dh > 12) dh -= 24;
    if (Math.abs(dh) > 0.002) fixedHour = ((fixedHour + Math.sign(dh) * Math.min(Math.abs(dh), TRANS_SPEED * dt)) % 24 + 24) % 24;
    const hour = fixedHour;
    skyColorAt(hour, _sky);
    if (wx.gray > 0.005) { const L = _sky.r * 0.3 + _sky.g * 0.59 + _sky.b * 0.11; _gray.setScalar(L * 0.9 + 0.08); _sky.lerp(_gray, Math.min(1, wx.gray) * 0.75); }
    if (boltT > 0) { const flick = Math.max(0, Math.sin(boltT * 34)) * (boltT / 0.45); _sky.lerp(_white, flick * 0.4); boltMat.opacity = flick; boltT -= dt; if (boltT <= 0) boltLine.visible = false; }
    scene.background.copy(_sky); scene.fog.color.copy(_sky);
    scene.fog.near = 40 + (3 - 40) * wx.fog; scene.fog.far = 110 + (26 - 110) * wx.fog;

    let night = 0;
    if (hour < 5 || hour > 19) night = 1; else if (hour < 7) night = (7 - hour) / 2; else if (hour > 17) night = (hour - 17) / 2;
    let dayFactor = 1 - night;

    const twilight = (hour > 16.5 && hour < 19) ? Math.sin((hour - 16.5) / 2.5 * Math.PI) : (hour > 5 && hour < 7.5) ? Math.sin((hour - 5) / 2.5 * Math.PI) : 0;

    let mh = hour - 18; if (mh < 0) mh += 24; const moonA = (mh / 12) * Math.PI;
    moonGroup.position.set(Math.cos(moonA) * 40, Math.sin(moonA) * 40, -28); moonGroup.lookAt(0, 2, 0);
    const moonFade = Math.max(0, Math.min(1, moonGroup.position.y / 4));

    let moonStrength = 0;
    if (wx.type === 'sunny') moonStrength = 0.5;
    else if (wx.type === 'cloudy') moonStrength = 0.3;
    else if (wx.type === 'snow') moonStrength = 0.7;
    else if (wx.type === 'blizzard') moonStrength = 0.1;
    const moonlit = night * Math.max(0, moonFade) * moonStrength;

    _amb.copy(_white).lerp(_nightAmb, night * 0.8);
    _amb.lerp(_moonCol, moonlit);
    _amb.lerp(_warm, twilight * 0.38);
    _amb.lerp(_c1.setHex(0xff9e7e), twilight * 0.15);
    _amb.lerp(_gray, wx.gray * 0.4);
    const brightness = 1.0 - night * 0.32 - wx.gray * 0.3 + moonlit * 0.4;
    _amb.multiplyScalar(brightness);

    FILL.uniforms.uColor.value.copy(_amb);

    /* 玻璃在暮色下的暖色反光 */
    WIN_GLASS.color.setHex(0xffffff);
    if (twilight > 0.03) WIN_GLASS.color.lerp(_warm, twilight * 0.3);

    const sunA = ((hour - 6) / 12) * Math.PI;
    sunGroup.position.set(Math.cos(sunA) * 44, Math.sin(sunA) * 44, -30); sunGroup.lookAt(0, 2, 0);
    const sunFade = Math.max(0, Math.min(1, sunGroup.position.y / 4)); const cover = Math.min(1, wx.clouds / 10);
    const sunOp = Math.max(0, 1 - cover * 1.2) * sunFade; sunFillMat.opacity = sunOp; sunLineMat.opacity = sunOp;
    let sunVis = 0;
    {
        const sunEl = sunGroup.position.y / 44;
        let hf = Math.max(0, Math.min(1, (sunEl + 0.02) / 0.12));
        const horizonFade = hf * hf * (3 - 2 * hf);
        const gauss = Math.exp(-Math.pow((sunEl - 0.06) / 0.16, 2));
        sunVis = Math.max(0, 1 - cover * 0.85) * horizonFade;
        const horizonMix = Math.min(1, gauss * 1.3);
        sunGlowMatA.color.setRGB(1.0, 0.80 + 0.10 * (1 - horizonMix), 0.58 + 0.24 * (1 - horizonMix));
        sunGlowMatA.opacity = (0.10 + 0.45 * gauss) * sunVis;
        sunGlowMatB.opacity = (0.05 + 0.22 * gauss) * sunVis;
        sunGlowA.scale.setScalar(1 + 0.55 * gauss);
        sunGlowB.scale.setScalar((1 + 0.35 * gauss) * 0.78);
    }

    const moonOp = Math.max(0, 1 - cover * 1.2) * moonFade;
    moonFillMatA.opacity = moonOp; moonLineMatA.opacity = moonOp * 0.9;
    moonFillMatB.opacity = moonOp; moonLineMatB.opacity = moonOp * 0.9;
    moonGlowMat.opacity = (0.20 + 0.05 * Math.sin(time * 0.6)) * moonOp;

    let starVis = 0;
    if (wx.type === 'sunny' || wx.type === 'cloudy') { starVis = Math.max(0, night - cover * 0.5); }
    starUniforms.uOpacity.value += (starVis * 1.25 - starUniforms.uOpacity.value) * Math.min(1, dt * 2.0);
    starUniforms.uTime.value = time;
    stars.rotation.y += 0.004 * dt;
    updateMeteors(dt, starVis);

    const want = Math.min(cloudList.length, Math.round(wx.clouds * 3.2)); const cloudSpeed = (0.3 + wx.wind * 0.45) * 1.4;
    _cloudCol.setHex(0xffffff);
    if (twilight > 0.02) {
        const duskMix = Math.min(1, Math.max(0, (hour - 16.5) / 2.6));
        _c1.setHex(0xffd2a0).lerp(_c2.setHex(0xe08ba0), duskMix);
        _cloudCol.lerp(_c1, twilight * 0.8);
    }
    _cloudCol.lerp(_gray.setHex(0x5a6470), Math.min(1, wx.gray * 1.15));
    _cloudCol.lerp(_c1.setHex(0x1f2740), night * 0.88);
    /* 云底：更暗并带一层紫调，被夕阳映出层次 */
    _cloudBase.copy(_cloudCol).multiplyScalar(0.88);
    _cloudBase.lerp(_c2.setHex(0xa8789a), twilight * 0.16);
    _cloudBase.lerp(_c1.setHex(0xffbd94), twilight * 0.25);
    for (let li = 0; li < CLOUD_LAYERS.length; li++) {
        const L = CLOUD_LAYERS[li];
        L.topMat.color.copy(_cloudCol);
        L.baseMat.color.copy(_cloudBase);
        L.topMat.opacity = L.opacity - night * 0.28;
        L.baseMat.opacity = L.opacity - night * 0.18;
    }
    for (let i = 0; i < cloudList.length; i++) {
        const c = cloudList[i]; const target = i < want ? 1 : 0; c.op += (target - c.op) * Math.min(1, dt * 0.9);
        c.grp.visible = c.op > 0.02;
        if (c.grp.visible) {
            c.grp.scale.set(c.op * c.bs, c.op * c.bs, c.op * c.bs);
            c.grp.position.x += WIND_DIR.x * cloudSpeed * c.spd * dt; c.grp.position.z += WIND_DIR.z * cloudSpeed * c.spd * dt;
            if (c.grp.position.x > 45) { c.grp.position.x = -80 - Math.random() * 15; c.grp.position.z = -70 + Math.random() * 95; }
            else if (c.grp.position.x < -100) { c.grp.position.x = 30; }
            if (c.grp.position.z > 80) c.grp.position.z = -80; else if (c.grp.position.z < -80) c.grp.position.z = 80;
            c.grp.position.y += Math.sin(time * 0.5 + c.floatPh) * 0.004;
        }
    }

    const rainN = Math.min(RAIN_MAX, Math.round(wx.rain)); rainLines.visible = rainN > 0;
    if (rainLines.visible) {
        rainGeo.setDrawRange(0, rainN * 2); const wSpeedUp = 1 + wx.wind * 0.35, wDrift = wx.wind * 5.5, wLen = 0.42 + wx.wind * 0.28; let idx = 0;
        for (let i = 0; i < rainN; i++) {
            const d = rainDrops[i];
            d.y -= d.v * wSpeedUp * dt; d.x += WIND_DIR.x * wDrift * dt; d.z += WIND_DIR.z * wDrift * dt;
            const vx = WIND_DIR.x * wDrift, vz = WIND_DIR.z * wDrift, vy = -d.v * wSpeedUp;
            const m = wLen / Math.hypot(vx, vy, vz);
            const tX = d.x + vx * m, tY = d.y + vy * m, tZ = d.z + vz * m;
            if (d.y < topSurfaceAt(d.x, d.z) || tY < topSurfaceAt(tX, tZ) || d.y < 0) {
                d.y = 13 + Math.random() * 4; d.x = (Math.random() - 0.5) * 56; d.z = (Math.random() - 0.5) * 56;
            }
            rainPos[idx++] = d.x; rainPos[idx++] = d.y; rainPos[idx++] = d.z;
            rainPos[idx++] = d.x + vx * m; rainPos[idx++] = d.y + vy * m; rainPos[idx++] = d.z + vz * m;
        }
        rainGeo.attributes.position.needsUpdate = true; rainMat.opacity = 0.35 + 0.25 * Math.min(1, wx.rain / 300);
    }

    const snowN = Math.min(SNOW_MAX, Math.round(wx.snow)); const snowBN = Math.min(SNOW_BALL_MAX, Math.round(wx.snow * 0.35));
    snowLines.visible = snowN > 0; snowBalls.visible = snowBN > 0;
    if (snowLines.visible) {
        snowGeo.setDrawRange(0, snowN * 6); const arm = 0.085, sDrift = wx.wind * 3.2; let idx = 0;
        for (let i = 0; i < snowN; i++) {
            const f = snowFlakes[i]; f.y -= f.v * (1 + wx.wind * 1.3) * dt; f.x += (Math.sin(time * f.fq + f.ph) * f.amp + WIND_DIR.x * sDrift) * dt; f.z += (Math.cos(time * f.fq * 0.8 + f.ph) * f.amp * 0.6 + WIND_DIR.z * sDrift) * dt; f.rot += f.rotV * dt;
            if (f.y < topSurfaceAt(f.x, f.z) + arm || f.y < 0) { f.y = 13 + Math.random() * 4; f.x = (Math.random() - 0.5) * 56; f.z = (Math.random() - 0.5) * 56; }
            const cosR = Math.cos(f.rot), sinR = Math.sin(f.rot);
            for (let kk = 0; kk < 3; kk++) {
                const a = kk * Math.PI / 3;
                const px = Math.cos(a) * cosR - Math.sin(a) * sinR;
                const py = Math.sin(a) * cosR + Math.cos(a) * sinR;
                const dx = f.ux * px + f.vx * py;
                const dy = f.uy * px + f.vy * py;
                const dz = f.uz * px + f.vz * py;
                snowPos[idx++] = f.x - dx * arm; snowPos[idx++] = f.y - dy * arm; snowPos[idx++] = f.z - dz * arm;
                snowPos[idx++] = f.x + dx * arm; snowPos[idx++] = f.y + dy * arm; snowPos[idx++] = f.z + dz * arm;
            }
        }
        snowGeo.attributes.position.needsUpdate = true;
    }
    if (snowBalls.visible) {
        snowBallGeo.setDrawRange(0, snowBN); const sDrift = wx.wind * 3.2; let idx = 0;
        for (let i = 0; i < snowBN; i++) {
            const f = snowBallFlakes[i]; f.y -= f.v * (1 + wx.wind * 1.3) * dt; f.x += (Math.sin(time * f.fq + f.ph) * f.amp + WIND_DIR.x * sDrift) * dt; f.z += (Math.cos(time * f.fq * 0.8 + f.ph) * f.amp * 0.6 + WIND_DIR.z * sDrift) * dt;
            if (f.y < topSurfaceAt(f.x, f.z) + 0.08 || f.y < 0) { f.y = 13 + Math.random() * 4; f.x = (Math.random() - 0.5) * 56; f.z = (Math.random() - 0.5) * 56; }
            snowBallPos[idx++] = f.x; snowBallPos[idx++] = f.y; snowBallPos[idx++] = f.z;
        }
        snowBallGeo.attributes.position.needsUpdate = true;
    }

    if (typeof setNightFactor === 'function') setNightFactor(night);
    if (typeof setSeaMoonlight === 'function') setSeaMoonlight(Math.max(sunVis, moonlit * 0.8));

    if (wx.type === 'storm' && wx.rain > 260) { nextBolt -= dt; if (nextBolt <= 0) { spawnBolt(); boltT = 0.45; nextBolt = 6 + Math.random() * 14; } }

    clockTick -= dt;
    if (clockTick <= 0) {
        clockTick = 0.25;
        const hh = String(Math.floor(hour)).padStart(2, '0'); const mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
        clockEl.innerHTML = '<b>' + hh + ':' + mm + '</b><span>' + WX_EN[wx.type] + ' · ' + WX_NAME[wx.type] + '</span>';
    }
}
