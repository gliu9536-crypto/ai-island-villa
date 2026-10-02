/* ====================================================================
 * 线稿风格海岛别墅 - 海岛模块：海水 / 沙滩 / 草坪 / 棕榈 / 礁石 / 码头
 * ==================================================================== */

/* ============ 海水 ============ */
const SEA_Y = -0.14;
const seaMat = LITMAT(0xc6e4ee);
put(new THREE.Mesh(new THREE.PlaneGeometry(340, 340), seaMat), 0, SEA_Y, 0, -Math.PI / 2, 0, 0);

/* 远景海浪线：横贯海面的长波浪线，随时间轻轻漂移 */
const SEA_ROWS = 26, SEA_PTS = 90;
const seaWaveGeo = new THREE.BufferGeometry();
seaWaveGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEA_ROWS * SEA_PTS * 3), 3));
const seaWaveMat = new THREE.LineBasicMaterial({ color: 0x58829a, transparent: true, opacity: 0.58 });
const seaWaves = new THREE.LineSegments(seaWaveGeo, seaWaveMat);
seaWaves.frustumCulled = false;
scene.add(seaWaves);
const seaRowZ = [];
for (let i = 0; i < SEA_ROWS; i++) seaRowZ.push(-54 + i * (108 / (SEA_ROWS - 1)));
let seaNight = 0, seaMoon = 0;
function setNightFactor(n) { seaNight = n; }
function setSeaMoonlight(v) { seaMoon = v; }
function updateSeaWaves(time) {
    const arr = seaWaveGeo.attributes.position.array;
    let idx = 0;
    for (let r = 0; r < SEA_ROWS; r++) {
        const z = seaRowZ[r];
        const ph = r * 1.7;
        for (let i = 0; i < SEA_PTS - 1; i++) {
            const x0 = -70 + (140 / (SEA_PTS - 1)) * i, x1 = -70 + (140 / (SEA_PTS - 1)) * (i + 1);
            const y0 = SEA_Y + 0.03 + (Math.sin(x0 * 0.12 + time * 0.9 + ph) * 0.5 + 0.5) * 0.085 + Math.sin(x0 * 0.045 - time * 0.5) * 0.035;
            const y1 = SEA_Y + 0.03 + (Math.sin(x1 * 0.12 + time * 0.9 + ph) * 0.5 + 0.5) * 0.085 + Math.sin(x1 * 0.045 - time * 0.5) * 0.035;
            arr[idx++] = x0; arr[idx++] = y0; arr[idx++] = z;
            arr[idx++] = x1; arr[idx++] = y1; arr[idx++] = z;
        }
    }
    seaWaveGeo.attributes.position.needsUpdate = true;
    seaWaveMat.opacity = 0.58 * (1 - seaNight * 0.45);
}

/* 岛屿边缘白色浪花圈：贴合岛屿轮廓的波浪环，微微呼吸 */
const foamRings = [];
{
    const RING_N = 3;
    for (let k = 0; k < RING_N; k++) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(121 * 3), 3));
        const m = new THREE.LineBasicMaterial({ color: 0xf2f8f5, transparent: true, opacity: 0.6 - k * 0.16 });
        const l = new THREE.Line(g, m);
        l.frustumCulled = false;
        scene.add(l);
        foamRings.push({ line: l, off: 0.25 + k * 0.42, ph: k * 2.1 });
    }
}
function updateFoamRings(time) {
    for (const f of foamRings) {
        const arr = f.line.geometry.attributes.position.array;
        for (let i = 0; i <= 120; i++) {
            const t = i / 120 * Math.PI * 2;
            const breathe = Math.sin(time * 0.7 + f.ph) * 0.05;
            const rr = islandRadiusAt(t) + f.off + breathe;
            arr[i * 3] = Math.sin(t) * rr;
            arr[i * 3 + 1] = SEA_Y + 0.02;
            arr[i * 3 + 2] = Math.cos(t) * rr;
        }
        f.line.geometry.attributes.position.needsUpdate = true;
    }
    for (const f of foamRings) f.line.material.opacity = (0.6 - f.off * 0.3) * (1 - seaNight * 0.5);
}

/* 海浪高光线：主浪线旁的浅色一笔，让波浪更有笔触感 */
const seaWaveHiGeo = new THREE.BufferGeometry();
seaWaveHiGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEA_ROWS * SEA_PTS * 3), 3));
const seaWaveHiMat = new THREE.LineBasicMaterial({ color: 0xa9cbd6, transparent: true, opacity: 0.34 });
const seaWaveHi = new THREE.LineSegments(seaWaveHiGeo, seaWaveHiMat);
seaWaveHi.frustumCulled = false;
scene.add(seaWaveHi);
function updateSeaWaveHi(time) {
    const arr = seaWaveHiGeo.attributes.position.array;
    let idx = 0;
    for (let r = 0; r < SEA_ROWS; r++) {
        const z = seaRowZ[r] + 0.45;
        const ph = r * 1.7 + 2.3;
        for (let i = 0; i < SEA_PTS - 1; i++) {
            const x0 = -70 + (140 / (SEA_PTS - 1)) * i, x1 = -70 + (140 / (SEA_PTS - 1)) * (i + 1);
            const y0 = SEA_Y + 0.024 + (Math.sin(x0 * 0.1 + time * 0.7 + ph) * 0.5 + 0.5) * 0.06;
            const y1 = SEA_Y + 0.024 + (Math.sin(x1 * 0.1 + time * 0.7 + ph) * 0.5 + 0.5) * 0.06;
            arr[idx++] = x0; arr[idx++] = y0; arr[idx++] = z;
            arr[idx++] = x1; arr[idx++] = y1; arr[idx++] = z;
        }
    }
    seaWaveHiGeo.attributes.position.needsUpdate = true;
}

/* ===== 落日海面光路：沿太阳方位的碎金波光 ===== */
const SUN_AZ = Math.atan2(-43.9, -30);
const GLITTER_N = 120;
const glitterGeo = new THREE.BufferGeometry();
glitterGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(GLITTER_N * 6), 3));
glitterGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(GLITTER_N * 6), 3));
const glitterMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const glitter = new THREE.LineSegments(glitterGeo, glitterMat);
glitter.frustumCulled = false;
scene.add(glitter);
const glitterSeeds = [];
for (let i = 0; i < GLITTER_N; i++) {
    const t = Math.random();
    const r = 12.5 + t * 58;
    const spread = 1.1 + t * 10;
    const off = (Math.random() - 0.5) * 2 * spread * (0.3 + 0.7 * Math.random());
    glitterSeeds.push({ a: SUN_AZ + off / r, r, len: 0.35 + Math.random() * 0.95, ph: Math.random() * 6.28, sp: 1.2 + Math.random() * 3 });
}
function updateGlitter(time) {
    glitter.visible = seaMoon > 0.02;
    glitterMat.color.setRGB(1, 1, 1).lerp(new THREE.Color(0x9db8e8), Math.min(1, seaMoon * 0.9));
    glitterMat.opacity = 0.9 * Math.min(1, seaMoon + 0.05);
    const pos = glitterGeo.attributes.position.array;
    const col = glitterGeo.attributes.color.array;
    for (let i = 0; i < GLITTER_N; i++) {
        const s = glitterSeeds[i];
        const rr = s.r + Math.sin(time * 0.4 + s.ph) * 0.7;
        const x = Math.sin(s.a) * rr, z = Math.cos(s.a) * rr;
        const dx = Math.cos(s.a) * s.len / 2, dz = -Math.sin(s.a) * s.len / 2;
        pos[i * 6] = x - dx; pos[i * 6 + 1] = SEA_Y + 0.03; pos[i * 6 + 2] = z - dz;
        pos[i * 6 + 3] = x + dx; pos[i * 6 + 4] = SEA_Y + 0.03; pos[i * 6 + 5] = z + dz;
        const tw = Math.max(0, Math.sin(time * s.sp + s.ph));
        const b = 0.18 + 0.82 * tw * tw;
        col[i * 6] = b; col[i * 6 + 1] = b * 0.8; col[i * 6 + 2] = b * 0.55;
        col[i * 6 + 3] = b; col[i * 6 + 4] = b * 0.8; col[i * 6 + 5] = b * 0.55;
    }
    glitterGeo.attributes.position.needsUpdate = true;
    glitterGeo.attributes.color.needsUpdate = true;
}

/* 海平线暖色光晕：太阳方向的海面泛起一片橙金 */
const horizonGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(95, 30),
    new THREE.MeshBasicMaterial({ map: glowTex, color: 0xff8850, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
);
horizonGlow.geometry.rotateX(-Math.PI / 2);
horizonGlow.rotation.y = SUN_AZ - Math.PI / 2;
horizonGlow.position.set(Math.sin(SUN_AZ) * 40, SEA_Y + 0.012, Math.cos(SUN_AZ) * 40);
scene.add(horizonGlow);

/* ============ 岛体（沙色） ============ */
const SAND = LITMAT(0xf3e9d2, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
{
    const shape = new THREE.Shape();
    const N = 120;
    for (let i = 0; i <= N; i++) {
        const t = i / N * Math.PI * 2;
        const rr = islandRadiusAt(t);
        const x = Math.sin(t) * rr, z = Math.cos(t) * rr;
        if (i === 0) shape.moveTo(x, -z); else shape.lineTo(x, -z);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, SAND);
    m.position.y = -0.53;
    scene.add(m);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(g, 12), MAT);
    outline.position.y = -0.53;
    scene.add(outline);
}

/* ============ 草坪（椭圆形淡绿补丁，呼应原作的月亮地毯配色） ============ */
const LAWN = LITMAT(0xc9e2a8, { polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 3 });
function ellipsePatch(rx, rz, mat, y) {
    const grp = new THREE.Group();
    const cg = new THREE.CircleGeometry(1, 56);
    const mesh = new THREE.Mesh(cg, mat);
    mesh.rotation.x = -Math.PI / 2;
    const ring = new THREE.LineSegments(new THREE.EdgesGeometry(cg, 15), MAT);
    ring.rotation.x = -Math.PI / 2;
    grp.add(mesh); grp.add(ring);
    grp.scale.set(rx, 1, rz);
    grp.position.y = y;
    scene.add(grp);
    return grp;
}
ellipsePatch(11.3, 8.8, LAWN, 0.045).position.set(0.4, 0.045, -0.3);

/* ============ 石板小路：从别墅正门通向沙滩 ============ */
const STEP_STONE = LITMAT(0xd8d2c0, { polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4 });
{
    for (let i = 0; i < 11; i++) {
        const z = 3.5 + i * 0.82;
        const x = -1.65 + Math.sin(i * 2.1) * 0.24;
        const st = boxT(0.62 - i * 0.015, 0.05, 0.44, STEP_STONE);
        put(st, x, 0.045, z, 0, Math.sin(i * 1.3) * 0.15, 0);
    }
}

/* ============ 棕榈树 ============ */
const PALM_TRUNK = LITMAT(0xdcc9a4, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const PALM_LEAF = LITMAT(0xd7e6bd, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const COCO = LITMAT(0xb09468);
const palmCrowns = [];
function makePalm(x, z, scale, bendAng, ph) {
    const g = new THREE.Group();
    const bend = V(Math.sin(bendAng), 0, Math.cos(bendAng));
    let px = 0, pz = 0, py = 0;
    const SEG = 7, SEG_H = 0.46;
    for (let i = 0; i < SEG; i++) {
        const k = i / (SEG - 1);
        const off = k * k * 0.7;
        const seg = cylT(0.085 - k * 0.02, 0.105 - k * 0.02, SEG_H + 0.06, 6, PALM_TRUNK);
        const cx = px + bend.x * off, cz = pz + bend.z * off;
        seg.position.set(cx, py + SEG_H / 2, cz);
        seg.rotation.z = -bend.x * off * 0.22;
        seg.rotation.x = bend.z * off * 0.22;
        g.add(seg);
        py += SEG_H;
        px = cx; pz = cz;
    }
    const crown = new THREE.Group();
    crown.position.set(px + bend.x * 0.55, py + 0.1, pz + bend.z * 0.55);
    const tiers = [[2.02, 1.6, 4], [2.26, 2.0, 5], [2.46, 2.3, 4]];
    let fi = 0;
    for (const [tilt, len, cnt] of tiers) {
        for (let i = 0; i < cnt; i++) {
            const a = fi / 13 * Math.PI * 2 + ph + fi * 0.35;
            fi++;
            const arm = new THREE.Group();
            arm.rotation.y = a;
            /* 叶片：根部宽、叶尖细，顶点级弯曲下垂 */
            const fg = new THREE.ConeGeometry(0.17, len, 4, 6);
            fg.rotateX(Math.PI);
            fg.translate(0, -len / 2, 0);
            const fp = fg.attributes.position;
            for (let vi = 0; vi < fp.count; vi++) {
                const d = Math.min(-fp.getY(vi) / len, 1);
                const phi = -1.2 * Math.pow(d, 1.25);
                const yy = fp.getY(vi), zz = fp.getZ(vi);
                fp.setY(vi, yy * Math.cos(phi) - zz * Math.sin(phi));
                fp.setZ(vi, yy * Math.sin(phi) + zz * Math.cos(phi));
            }
            fg.computeVertexNormals();
            const frond = new THREE.Group();
            frond.add(new THREE.Mesh(fg, PALM_LEAF));
            frond.add(new THREE.LineSegments(new THREE.EdgesGeometry(fg, 25), MAT));
            frond.rotation.x = tilt;
            arm.add(frond);
            crown.add(arm);
        }
    }
    for (let i = 0; i < 3; i++) {
        const c = edgeTinted(new THREE.SphereGeometry(0.09, 6, 5), COCO);
        const ca = ph + i * 2.3;
        c.position.set(Math.cos(ca) * 0.14, -0.08, Math.sin(ca) * 0.14);
        crown.add(c);
    }
    g.add(crown);
    crown.userData.ph = ph;
    palmCrowns.push(crown);
    g.scale.setScalar(scale);
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
}
function updatePalmCrowns(time) {
    for (const c of palmCrowns) c.rotation.z = Math.sin(time * 0.8 + c.userData.ph) * 0.035;
}
makePalm(2.4, 8.9, 1.05, 0.5, 1.0);
makePalm(9.4, 2.6, 1.15, 2.6, 2.2);
makePalm(5.9, -6.9, 0.95, 3.6, 3.1);
makePalm(-4.2, -8.7, 1.1, 5.0, 4.0);
makePalm(-8.9, -0.8, 1.0, 1.6, 5.2);
makePalm(-6.3, 7.4, 1.2, 4.2, 0.3);
/* 海岸带补充棕榈：避开小路 / 泳池 / 楼梯 / 码头 */
{
    const taken = [[2.4, 8.9], [9.4, 2.6], [5.9, -6.9], [-4.2, -8.7], [-8.9, -0.8], [-6.3, 7.4]];
    const blocked = (x, z) => {
        if (Math.hypot(x + 1.65, z - 6) < 2.4) return true;
        if (x > 4.0 && x < 9.0 && z > -2.8 && z < 1.9) return true;
        if (x > -6.4 && x < -4.4 && z > 4.6 && z < 8.9) return true;
        if (Math.hypot(x + 8.1, z - 11.2) < 3.4) return true;
        for (const [px, pz] of taken) if (Math.hypot(x - px, z - pz) < 3.4) return true;
        return false;
    };
    let placed = 0, guard = 0;
    while (placed < 6 && guard++ < 400) {
        const a = Math.random() * Math.PI * 2;
        const rr = islandRadiusAt(a) - 1.7 - Math.random() * 1.5;
        if (rr < 9.5) continue;
        const x = Math.sin(a) * rr, z = Math.cos(a) * rr;
        if (blocked(x, z)) continue;
        taken.push([x, z]);
        makePalm(x, z, 0.9 + Math.random() * 0.4, Math.random() * 6.28, Math.random() * 6.28);
        placed++;
    }
}

/* ============ 礁石 ============ */
const ROCK = LITMAT(0xd2cbc0, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const ROCK_EDGE = new THREE.LineBasicMaterial({ color: 0x6a6458, transparent: true, opacity: 0.55 });
function makeRock(r, amp, x, z, y) {
    const rg = jitterGeo(new THREE.IcosahedronGeometry(r, 0), amp);
    const rm = new THREE.Mesh(rg, ROCK);
    rm.add(new THREE.LineSegments(new THREE.EdgesGeometry(rg, 5), ROCK_EDGE));
    rm.position.set(x, y, z);
    rm.rotation.y = Math.random() * 6.28;
    scene.add(rm);
    return rm;
}
makeRock(0.9, 0.35, 12.6, -3.2, -0.12);
makeRock(0.6, 0.3, 13.8, 1.4, -0.2);
makeRock(0.5, 0.3, -12.9, 3.6, -0.15);
makeRock(0.75, 0.32, -11.9, -5.8, -0.1);
makeRock(0.45, 0.28, 10.6, 6.9, -0.18);

/* ============ 木栈桥码头 ============ */
const DOCK_WOOD = LITMAT(0xd9c9a6, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
{
    const dockG = new THREE.Group();
    const a = -0.62;
    const dx = Math.sin(a), dz = Math.cos(a);
    for (let i = 0; i < 9; i++) {
        const r = 13.0 + i * 0.52;
        const plank = boxT(1.35, 0.07, 0.46, DOCK_WOOD);
        plank.position.set(dx * r, 0.26, dz * r);
        plank.rotation.y = a;
        dockG.add(plank);
    }
    for (const [ri, side] of [[13.4, -1], [13.4, 1], [16.4, -1], [16.4, 1]]) {
        const post = cylT(0.07, 0.08, 0.85, 6, DOCK_WOOD);
        const px = dx * ri + Math.cos(a) * 0.56 * side, pz = dz * ri - Math.sin(a) * 0.56 * side;
        post.position.set(px, -0.12, pz);
        dockG.add(post);
    }
    const bollard = cylT(0.09, 0.11, 0.42, 6, DOCK_WOOD);
    bollard.position.set(dx * 16.9, 0.5, dz * 16.9);
    dockG.add(bollard);
    scene.add(dockG);
}

/* ============ 遮阳伞 + 沙滩巾 ============ */
const UMB_RELF = LITMAT(0xf2c8b4, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const TOWEL = LITMAT(0xb8d8e8, { polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 3 });
{
    const ux = 5.2, uz = 6.3;
    const pole = cylT(0.028, 0.034, 2.25, 6, PALM_TRUNK);
    put(pole, ux, 1.1, uz, 0, 0, 0.1);
    const canopy = edgeTinted(new THREE.ConeGeometry(1.25, 0.5, 8), UMB_RELF);
    put(canopy, ux + 0.22, 2.14, uz, 0, 0.35, 0.1);
    const towel = boxT(0.95, 0.035, 1.8, TOWEL);
    put(towel, ux - 1.5, 0.045, uz - 0.4, 0, 0.4, 0);
}

/* ============ 沙滩螃蟹（横着爬，史莱姆靠近会受惊） ============ */
const CRAB_BODY = LITMAT(0xe89a5a, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const CRAB_DARK = LITMAT(0xc97a42, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const crabs = [];
function makeCrab(x, z, ph) {
    const g = new THREE.Group();
    const body = edgeTinted(new THREE.SphereGeometry(0.16, 8, 6), CRAB_BODY);
    body.scale.set(1.25, 0.7, 0.9);
    body.position.y = 0.1;
    g.add(body);
    for (const sd of [-1, 1]) {
        put(cylT(0.012, 0.012, 0.09, 4, CRAB_DARK), sd * 0.07, 0.22, 0.1, 0, 0, 0, g);
        put(edgeTinted(new THREE.SphereGeometry(0.025, 6, 4), CRAB_DARK), sd * 0.07, 0.27, 0.1, 0, 0, 0, g);
    }
    const claws = [];
    for (const sd of [-1, 1]) {
        const claw = new THREE.Group();
        const arm = cylT(0.025, 0.03, 0.16, 5, CRAB_BODY);
        arm.position.set(sd * 0.2, 0.13, 0.05);
        arm.rotation.z = sd * -0.65;
        claw.add(arm);
        const pincer = edgeTinted(new THREE.SphereGeometry(0.06, 6, 5), CRAB_BODY);
        pincer.scale.set(1.1, 0.7, 1.35);
        pincer.position.set(sd * 0.29, 0.16, 0.09);
        claw.add(pincer);
        claw.userData.s = sd;
        claws.push(claw);
        g.add(claw);
    }
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
        const leg = cylT(0.013, 0.017, 0.22, 4, CRAB_DARK);
        leg.position.set(sd * 0.19, 0.09, -0.07 + i * 0.12);
        leg.rotation.z = sd * 1.02;
        g.add(leg);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    crabs.push({ g, claws, ph, dir: Math.random() < 0.5 ? 1 : -1, speed: 0.35 + Math.random() * 0.3, pause: 0, flee: 0, face: Math.random() * 6.28 });
}
function updateCrabs(dt, time) {
    for (const c of crabs) {
        const dx = player.pos.x - c.g.position.x, dz = player.pos.z - c.g.position.z;
        const dPlayer = Math.hypot(dx, dz);
        if (dPlayer < 2.0 && c.flee <= 0) { c.flee = 1.6; c.dir = (dx * Math.cos(c.face) - dz * Math.sin(c.face)) > 0 ? -1 : 1; }
        if (c.flee > 0) c.flee -= dt;
        if (c.pause > 0) { c.pause -= dt; c.g.position.y = 0; }
        else {
            const spd = c.speed * (c.flee > 0 ? 4.5 : 1);
            const nx = c.g.position.x + Math.cos(c.face) * c.dir * spd * dt;
            const nz = c.g.position.z - Math.sin(c.face) * c.dir * spd * dt;
            const r = Math.hypot(nx, nz);
            const rim = islandRadiusAtXZ(nx, nz) - 0.7;
            if (r < rim && r > 8.5) { c.g.position.x = nx; c.g.position.z = nz; } else c.dir *= -1;
            const hopPh = time * (c.flee > 0 ? 16 : 7) + c.ph;
            c.g.position.y = Math.abs(Math.sin(hopPh)) * 0.022;
            c.g.rotation.x = Math.sin(hopPh) * 0.05;
            if (c.flee <= 0) {
                if (Math.random() < dt * 0.22) c.pause = 0.8 + Math.random() * 1.6;
                if (Math.random() < dt * 0.1) c.dir *= -1;
                if (Math.random() < dt * 0.07) c.face += (Math.random() - 0.5) * 1.2;
            }
        }
        c.g.rotation.y = c.face;
        for (const claw of c.claws) {
            claw.rotation.z = Math.sin(time * 3 + c.ph + claw.userData.s) * (c.flee > 0 ? 0.5 : 0.12);
        }
    }
}
makeCrab(8.6, 7.8, 0.5);
makeCrab(-7.2, 8.8, 2.1);
makeCrab(10.8, -5.2, 3.7);
makeCrab(-10.4, -4.6, 5.0);
makeCrab(0.8, 10.9, 1.3);

/* ============ 码头旁的小船（随波轻摇） ============ */
const boatGroup = new THREE.Group();
{
    const bx = -9.4, bz = 15.8;
    const hullL = boxT(0.06, 0.4, 2.5, DOCK_WOOD); hullL.position.set(-0.44, 0.2, 0); hullL.rotation.z = -0.1; boatGroup.add(hullL);
    const hullR = boxT(0.06, 0.4, 2.5, DOCK_WOOD); hullR.position.set(0.44, 0.2, 0); hullR.rotation.z = 0.1; boatGroup.add(hullR);
    const floor = boxT(0.86, 0.06, 2.5, DOCK_WOOD); floor.position.set(0, 0.06, 0); boatGroup.add(floor);
    const bow = boxT(0.94, 0.36, 0.5, DOCK_WOOD); bow.position.set(0, 0.2, -1.35); bow.rotation.x = 0.25; boatGroup.add(bow);
    const stern = boxT(0.94, 0.4, 0.14, DOCK_WOOD); stern.position.set(0, 0.22, 1.3); boatGroup.add(stern);
    for (const bz2 of [-0.55, 0.45]) { const bench = boxT(0.92, 0.05, 0.28, DOCK_WOOD); bench.position.set(0, 0.3, bz2); boatGroup.add(bench); }
    const oar = cylT(0.025, 0.025, 1.7, 5, DOCK_WOOD); oar.position.set(0.12, 0.34, 0.2); oar.rotation.z = Math.PI / 2 - 0.12; boatGroup.add(oar);
    const blade = boxT(0.05, 0.02, 0.26, DOCK_WOOD); blade.position.set(-0.72, 0.38, 0.2); boatGroup.add(blade);
    boatGroup.position.set(bx, -0.05, bz);
    boatGroup.rotation.y = -0.32;
    scene.add(boatGroup);
    scene.add(line([[-9.05, 0.3, 14.65], [-9.5, 0.12, 14.2], [-9.82, 0.48, 13.76]]));
}
function updateBoat(time) {
    boatGroup.position.y = -0.05 + Math.sin(time * 0.8) * 0.045;
    boatGroup.rotation.z = Math.sin(time * 0.9) * 0.045;
    boatGroup.rotation.x = Math.sin(time * 0.66 + 1.2) * 0.035;
}

/* ============ 萤火虫（移植自原作，暮色中出现） ============ */
const FF_N = 26;
const fireflies = [];
for (let i = 0; i < FF_N; i++) {
    let x = 0, z = 0, ok = false, guard = 0;
    while (!ok && guard++ < 200) {
        const t = Math.random() * Math.PI * 2;
        const rr = 3 + Math.random() * 8.5;
        x = Math.sin(t) * rr; z = Math.cos(t) * rr;
        if (Math.hypot(x - 6.5, z + 0.4) < 2.6) continue;
        ok = true;
    }
    fireflies.push({ bx: x, by: 0.35 + Math.random() * 1.35, bz: z, ph: Math.random() * 7, sp: 0.45 + Math.random() * 0.7, amp: 0.5 + Math.random() * 0.9 });
}
const ffPos = new Float32Array(FF_N * 3);
const ffPhase = new Float32Array(FF_N);
for (let i = 0; i < FF_N; i++) { ffPos[i * 3] = fireflies[i].bx; ffPos[i * 3 + 1] = fireflies[i].by; ffPos[i * 3 + 2] = fireflies[i].bz; ffPhase[i] = Math.random(); }
const ffGeo = new THREE.BufferGeometry();
ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
ffGeo.setAttribute('aPhase', new THREE.BufferAttribute(ffPhase, 1));
const ffUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
const ffMat = new THREE.ShaderMaterial({
    uniforms: ffUniforms,
    vertexShader: `
    attribute float aPhase;
    uniform float uTime;
    varying float vBlink;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      float tw = abs(sin(uTime * 1.25 + aPhase * 6.2831));
      vBlink = 0.15 + 0.85 * pow(tw, 3.0);
      gl_PointSize = (2.2 + 2.6 * vBlink) * (150.0 / -mv.z);
    }`,
    fragmentShader: `
    varying float vBlink;
    uniform float uOpacity;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      if (d > 0.5) discard;
      float a = (1.0 - d * 2.0) * (1.0 - d * 2.0) * vBlink * uOpacity * 0.9;
      gl_FragColor = vec4(0.82, 1.0, 0.52, a);
    }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
});
const fireflyPts = new THREE.Points(ffGeo, ffMat); fireflyPts.frustumCulled = false; scene.add(fireflyPts);
let ffOpacity = 0;
function updateFireflies(dt, time, night, wxType) {
    let ffTarget = 0;
    if ((wxType === 'sunny' || wxType === 'cloudy') && night > 0.3) ffTarget = Math.min(1, night * 1.3);
    ffOpacity += (ffTarget - ffOpacity) * Math.min(1, dt * 1.2);
    ffUniforms.uOpacity.value = ffOpacity;
    if (ffOpacity > 0.01) {
        for (let i = 0; i < FF_N; i++) {
            const f = fireflies[i];
            ffPos[i * 3] = f.bx + Math.sin(time * f.sp + f.ph) * f.amp;
            ffPos[i * 3 + 1] = f.by + Math.sin(time * f.sp * 0.8 + f.ph * 1.3) * 0.32;
            ffPos[i * 3 + 2] = f.bz + Math.cos(time * f.sp * 0.9 + f.ph * 0.7) * f.amp;
        }
        ffGeo.attributes.position.needsUpdate = true;
    }
    ffUniforms.uTime.value = time;
}
