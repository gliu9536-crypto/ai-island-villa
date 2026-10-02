/* ====================================================================
 * 线稿风格海岛别墅 - 玩家模块：史莱姆 / 三视角 / 碰撞 / 交互 / 功能键
 * 移植自 YIBI2333/line-art-style-magic-cabin (MIT)
 * ==================================================================== */

/* ============ 小海龟玩家（平滑着色，无描边） ============ */
function TURTLE_MAT(hex) {
    const u = {
        uTint: { value: new THREE.Color(hex) },
        uColor: FILL.uniforms.uColor,
        fogColor: { value: new THREE.Color(0xfdfbf6) }, fogNear: { value: 40 }, fogFar: { value: 110 }
    };
    const m = new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: `
            varying vec3 vN; varying float vFogDepth;
            void main() {
                vN = normalize(mat3(modelMatrix) * normal);
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vFogDepth = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: `
            uniform vec3 uTint; uniform vec3 uColor;
            uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
            varying vec3 vN; varying float vFogDepth;
            void main() {
                vec3 base = uColor * uTint;
                vec3 L = normalize(vec3(-0.5, 0.85, -0.3));
                float ndl = dot(normalize(vN), L);
                float diff = 0.58 + 0.42 * max(ndl, 0.0);
                vec3 col = base * diff;
                col = mix(col, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
                gl_FragColor = vec4(col, 1.0);
            }`,
        fog: true
    });
    return m;
}
const SHELL_MAT = TURTLE_MAT(0x9aa865);
const SHELL_DARK = TURTLE_MAT(0x76854a);
const SKIN_MAT = TURTLE_MAT(0xdcc9a0);
const slimeRoot = new THREE.Group(); scene.add(slimeRoot); const slimeBody = new THREE.Group(); slimeRoot.add(slimeBody);
const SLIME_R = 0.30;
/* 龟壳：扁圆顶 + 裙边 + 中央甲纹（平滑无描边） */
const shell = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 16), SHELL_MAT);
shell.scale.set(1.12, 0.45, 1.32);
shell.position.y = 0.26;
slimeBody.add(shell);
const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.09, 20), SHELL_DARK);
rim.position.y = 0.185;
slimeBody.add(rim);
const scute = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.035, 6), SHELL_DARK);
scute.position.y = 0.4;
slimeBody.add(scute);
/* 头 + 大眼睛带高光 */
const head = new THREE.Group();
const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 14), SKIN_MAT);
headMesh.scale.set(1, 0.85, 1.25);
head.add(headMesh);
for (const sd of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), new THREE.MeshBasicMaterial({ color: 0x1a1d18 }));
    eye.position.set(sd * 0.052, 0.03, 0.08);
    head.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(sd * 0.052 + sd * 0.008, 0.042, 0.096);
    head.add(glint);
}
head.position.set(0, 0.17, 0.46);
slimeBody.add(head);
/* 尾巴 */
const tail = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.15, 8), SKIN_MAT);
tail.rotation.x = Math.PI / 2 + 0.5;
tail.position.set(0, 0.17, -0.5);
slimeBody.add(tail);
/* 四条短腿（可摆动的枢轴组） */
const legs = [];
for (const [lx, lz] of [[-0.27, 0.3], [0.27, 0.3], [-0.27, -0.31], [0.27, -0.31]]) {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, 0.16, lz);
    const legGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.17, 10);
    legGeo.translate(0, -0.085, 0);
    legPivot.add(new THREE.Mesh(legGeo, SKIN_MAT));
    slimeBody.add(legPivot);
    legs.push(legPivot);
}
/* 角色专用灯光（场景其他物体都是无灯材质，不受影响） */
const charHemi = new THREE.HemisphereLight(0xfff2e0, 0x9a8870, 1.0);
const charSun = new THREE.DirectionalLight(0xffd9a8, 1.1);
charSun.position.set(-4, 9, -3);
scene.add(charHemi); scene.add(charSun);
const CHAR_WARM = new THREE.Color(0xffd9a8), CHAR_COOL = new THREE.Color(0xa8b8e8);
function setCharNight(night) {
    charHemi.intensity = 1.0 - night * 0.55;
    charSun.intensity = 1.1 - night * 0.65;
    charSun.color.copy(CHAR_WARM).lerp(CHAR_COOL, night);
}

/* 狮耶角色（GLB，加载成功后替换小海龟） */
let charModel = null, charBones = {}, charBaseY = 0, eyeH = 0.3;
new THREE.GLTFLoader().load('models/shiye.glb?v=3', (gltf) => {
    charModel = gltf.scene;
    charModel.traverse(o => { if (o.isMesh) { o.frustumCulled = false; } });
    const bx = new THREE.Box3().setFromObject(charModel);
    const size = new THREE.Vector3(); bx.getSize(size);
    const s = 1.12 / size.y;
    charModel.scale.setScalar(s);
    const bx2 = new THREE.Box3().setFromObject(charModel);
    charBaseY = -bx2.min.y;
    charModel.position.y = charBaseY;
    slimeBody.add(charModel);
    for (const o of [shell, rim, scute, head, tail]) o.visible = false;
    for (const l of legs) l.visible = false;
    charModel.traverse(o => { if (o.isBone) { charBones[o.name] = o; o.userData.restQ = o.quaternion.clone(); } });
    eyeH = 0.85;
}, undefined, () => { /* 加载失败时保留小海龟 */ });
const slimeShadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: 0x6a5f4a, transparent: true, opacity: 0.16, depthWrite: false })); slimeShadow.rotation.x = -Math.PI / 2; slimeShadow.position.y = 0.012; slimeRoot.add(slimeShadow);
const SLIME_FLAT = 0.96; const slime = { squash: SLIME_FLAT, squashV: 0, wob: 0, wobV: 0, tilt: 0, tiltV: 0, pulse: 2.0 };

/* ============ 视角状态 ============ */
const isLocked = () => document.pointerLockElement === renderer.domElement;
let viewMode = 'fixed';
const FIX_LOOK = V(0, 2.4, 0);
let fixYaw = 0.60, fixPitch = 0.28, fixDist = 23;
let camYaw = Math.PI, camPitch = 0.32, viewDist = 3.4;
let pendYaw = 0, pendPitch = 0;
const player = { pos: new THREE.Vector3(0, 0, 9.0), vy: 0, yaw: Math.PI, moveSpeed: 0, onGround: true, groundT: -10 };
const PLAYER_R = 0.34;

/* ============ 碰撞 ============ */
function collideXZ(px, pz, y) {
    const boxes = solidBoxes.slice();
    if (y < 2.5) {
        boxes.push(...lowerBoxes);
        if (frontDoorGroup.userData.spring.cur < 0.5) boxes.push(DOOR_BOX);
    } else {
        boxes.push(...upperBoxes);
        if (slideDoorGroup.userData.spring.cur < 0.5) boxes.push(SLIDE_BOX);
    }
    boxes.push(...stairBoxes);
    for (const b of boxes) {
        const cx = Math.max(b.x1, Math.min(px, b.x2));
        const cz = Math.max(b.z1, Math.min(pz, b.z2));
        let dx = px - cx, dz = pz - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < PLAYER_R * PLAYER_R) {
            if (d2 < 1e-9) {
                const l = px - b.x1, rr = b.x2 - px, tt = pz - b.z1, bb = b.z2 - pz;
                const m = Math.min(l, rr, tt, bb);
                if (m === l) px = b.x1 - PLAYER_R; else if (m === rr) px = b.x2 + PLAYER_R; else if (m === tt) pz = b.z1 - PLAYER_R; else pz = b.z2 + PLAYER_R;
            } else {
                const d = Math.sqrt(d2);
                px = cx + dx / d * PLAYER_R; pz = cz + dz / d * PLAYER_R;
            }
        }
    }
    /* 海岸线边界 */
    const r = Math.hypot(px, pz);
    const rim = islandRadiusAtXZ(px, pz) - 0.5;
    if (r > rim) { const s = rim / r; px *= s; pz *= s; }
    return [px, pz];
}

/* ============ 音效辅助 / 跳跃 ============ */
function tryJump() {
    const now = performance.now() * 0.001;
    if (player.onGround || (now - player.groundT) < 0.15) {
        player.vy = 6.2; player.onGround = false; player.groundT = -10;
        slime.squashV += 1.3; slime.wobV += 2.2;
    }
}

/* ============ 输入 ============ */
const keys = {};
let joyX = 0, joyY = 0, sprintBtnDown = false;
addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyV' && viewMode !== 'fixed') setViewMode(viewMode === 'fp' ? 'tp' : 'fp');
    if (e.code === 'Space') { e.preventDefault(); tryJump(); }
    if (e.code === 'KeyE' && nearestInteract) doInteract();
    if (e.code === 'KeyB') waveT = 0;
});
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space' && player.vy > 2.6) player.vy = 2.6; });

const joyZone = document.getElementById('joyZone'), joyBase = document.getElementById('joyBase'), joyKnob = document.getElementById('joyKnob');
const JOY_R = 44; let joyId = null, joyCx = 0, joyCy = 0;
function setKnob(dx, dy) { joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
joyZone.addEventListener('pointerdown', e => {
    if (joyId !== null) return; joyId = e.pointerId; joyCx = e.clientX; joyCy = e.clientY;
    joyBase.style.display = 'block'; joyBase.style.left = joyCx + 'px'; joyBase.style.top = joyCy + 'px';
    setKnob(0, 0); joyZone.setPointerCapture(e.pointerId); e.preventDefault();
});
joyZone.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    let dx = e.clientX - joyCx, dy = e.clientY - joyCy; const m = Math.hypot(dx, dy);
    if (m > JOY_R) { dx = dx / m * JOY_R; dy = dy / m * JOY_R; }
    setKnob(dx, dy); joyX = dx / JOY_R; joyY = dy / JOY_R; e.preventDefault();
});
function joyEnd(e) { if (e.pointerId !== joyId) return; joyId = null; joyX = 0; joyY = 0; joyBase.style.display = 'none'; setKnob(0, 0); }
joyZone.addEventListener('pointerup', joyEnd); joyZone.addEventListener('pointercancel', joyEnd);
const btnSprint = document.getElementById('btnSprint'), btnJump = document.getElementById('btnJump'), btnAct = document.getElementById('btnAct');
btnSprint.addEventListener('pointerdown', e => { sprintBtnDown = true; btnSprint.classList.add('pressed'); e.preventDefault(); });
function sprintEnd() { sprintBtnDown = false; btnSprint.classList.remove('pressed'); }
btnSprint.addEventListener('pointerup', sprintEnd); btnSprint.addEventListener('pointercancel', sprintEnd);
btnJump.addEventListener('pointerdown', e => { btnJump.classList.add('pressed'); tryJump(); e.preventDefault(); });
btnJump.addEventListener('pointerup', () => { btnJump.classList.remove('pressed'); if (player.vy > 2.6) player.vy = 2.6; });
btnJump.addEventListener('pointercancel', () => btnJump.classList.remove('pressed'));
btnAct.addEventListener('pointerdown', e => { btnAct.classList.add('pressed'); doInteract(); e.preventDefault(); });
btnAct.addEventListener('pointerup', () => btnAct.classList.remove('pressed')); btnAct.addEventListener('pointercancel', () => btnAct.classList.remove('pressed'));

/* 鼠标 / 触摸：拖拽旋转、双指缩放、滚轮缩放、点击交互 */
let dragInfo = null; const ptrs = new Map(); let pinchMode = false, pinchD = 0, didPinch = false;
renderer.domElement.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); pinchMode = true; didPinch = true; dragInfo = null; }
    else if (ptrs.size === 1) { dragInfo = { x: e.clientX, y: e.clientY, moved: 0 }; didPinch = false; }
});
renderer.domElement.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchMode && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const nd = Math.hypot(a.x - b.x, a.y - b.y);
        const diff = pinchD - nd;
        if (viewMode === 'fixed') fixDist = Math.max(6, Math.min(46, fixDist + diff * 0.03));
        else viewDist = Math.max(1.4, Math.min(7.0, viewDist + diff * 0.006));
        pinchD = nd; return;
    }
    if (!dragInfo) return;
    if (viewMode === 'fp' && isLocked()) return;
    const dx = e.clientX - dragInfo.x, dy = e.clientY - dragInfo.y;
    dragInfo.x = e.clientX; dragInfo.y = e.clientY;
    dragInfo.moved += Math.abs(dx) + Math.abs(dy);
    pendYaw -= dx * 0.0055;
    pendPitch += dy * 0.0045 * (viewMode === 'fp' ? -1 : 1);
});
renderer.domElement.addEventListener('pointerup', e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinchMode = false;
    if (!dragInfo) return;
    const wasClick = dragInfo.moved < 6 && !didPinch;
    dragInfo = null;
    if (!wasClick) return;
    if (viewMode === 'fp' && (isLocked() || IS_TOUCH)) { if (nearestInteract) nearestInteract.act(); return; }
    if (viewMode === 'fp' && !IS_TOUCH && !isLocked()) {
        try {
            const req = renderer.domElement.requestPointerLock();
            if (req && req.catch) req.catch(() => showHintOverride('当前环境不支持鼠标锁定 · <b>直接拖拽</b>即可转动视角', 3.5));
        } catch (e) {
            showHintOverride('当前环境不支持鼠标锁定 · <b>直接拖拽</b>即可转动视角', 3.5);
        }
        return;
    }
});
renderer.domElement.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchMode = false; dragInfo = null; });
document.addEventListener('mousemove', e => {
    if (isLocked() && viewMode === 'fp') {
        camYaw -= e.movementX * 0.0026; camPitch -= e.movementY * 0.0022;
        camPitch = Math.max(-1.2, Math.min(1.2, camPitch));
    }
});
document.addEventListener('pointerlockerror', () => showHintOverride('当前环境不支持鼠标锁定 · <b>直接拖拽</b>即可转动视角', 3.5));
document.addEventListener('pointerlockchange', () => {
    const locked = isLocked();
    crosshairEl.classList.toggle('show', viewMode === 'fp' && (locked || IS_TOUCH));
    lockTipEl.classList.toggle('show', viewMode === 'fp' && !locked && !IS_TOUCH);
});
renderer.domElement.addEventListener('wheel', e => {
    if (viewMode === 'fixed') fixDist = Math.max(6, Math.min(46, fixDist + e.deltaY * 0.016));
    else viewDist = Math.max(1.4, Math.min(7.0, viewDist + e.deltaY * 0.0025));
}, { passive: true });
addEventListener('contextmenu', e => { if (e.target === renderer.domElement || e.target.closest('#joyZone, .touchBtn')) e.preventDefault(); });

/* ============ 交互提示 ============ */
const hintEl = document.getElementById('hint'), crosshairEl = document.getElementById('crosshair'), lockTipEl = document.getElementById('lockTip');
let nearestInteract = null;
let hintOverrideUntil = 0, hintOverrideText = '';
function showHintOverride(text, sec) { hintOverrideUntil = performance.now() * 0.001 + sec; hintOverrideText = text; }
function doInteract() { if (nearestInteract) nearestInteract.act(); }
function updateInteractHint() {
    if (performance.now() * 0.001 < hintOverrideUntil) { hintEl.innerHTML = hintOverrideText; hintEl.classList.add('show'); return; }
    nearestInteract = null; let best = 1e9;
    for (const it of interactables) {
        if (it.minY !== undefined && player.pos.y < it.minY) continue;
        if (it.maxY !== undefined && player.pos.y > it.maxY) continue;
        const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z);
        if (d < it.r && d < best) { best = d; nearestInteract = it; }
    }
    if (nearestInteract) {
        hintEl.innerHTML = (IS_TOUCH ? '点按 <b>交互键</b> ' : '按 <b>E</b> ') + nearestInteract.label;
        hintEl.classList.add('show');
    } else hintEl.classList.remove('show');
}

/* ============ 视角切换 / 重置 ============ */
function setViewMode(m) {
    viewMode = m;
    viewFixedBtn.classList.toggle('on', m === 'fixed');
    viewTpBtn.classList.toggle('on', m === 'tp');
    viewFpBtn.classList.toggle('on', m === 'fp');
    if (m === 'fixed') {
        if (document.pointerLockElement) document.exitPointerLock();
        slimeRoot.visible = true;
        crosshairEl.classList.remove('show'); lockTipEl.classList.remove('show');
    } else {
        slimeRoot.visible = (m !== 'fp');
        if (m === 'fp') {
            if (IS_TOUCH) crosshairEl.classList.add('show');
            else lockTipEl.classList.add('show');
        } else {
            if (document.pointerLockElement) document.exitPointerLock();
            crosshairEl.classList.remove('show'); lockTipEl.classList.remove('show');
        }
    }
}
function resetSlime() {
    player.pos.set(0, 0, 9.0); player.vy = 0; player.yaw = Math.PI; player.moveSpeed = 0; player.onGround = true;
    camYaw = Math.PI; camPitch = 0.32; pendYaw = 0; pendPitch = 0;
    slime.squash = SLIME_FLAT; slime.squashV = 0; slime.wob = 0; slime.wobV = 0;
}

function lerpAngle(a, b, t) { let d = (b - a + Math.PI * 3) % (Math.PI * 2) - Math.PI; return a + d * t; }
function slimeLand(time) {
    if (player.vy < -3.0) { const impact = Math.min(1.5, (-player.vy - 3.0) * 0.30); slime.squashV -= impact; slime.wobV += impact * 2.6; }
    player.pos.y = groundAt(player.pos.x, player.pos.z, player.pos.y);
    player.pos.y = Math.max(player.pos.y, 0);
    player.vy = 0; player.onGround = true; player.groundT = time;
}

/* ============ 玩家主更新 ============ */
const _swingQ = new THREE.Quaternion();
const _swingEuler = new THREE.Euler();
let waveT = -1;   // >=0 表示挥手动作进行中
function updatePlayer(dt, time) {
    /* 视角惯性 + 固定视角功能键 */
    if (viewMode === 'fixed') {
        const rotSpd = 1.5, zoomSpd = 7;
        if (keys['ArrowLeft']) fixYaw -= rotSpd * dt;
        if (keys['ArrowRight']) fixYaw += rotSpd * dt;
        if (keys['ArrowUp']) fixPitch = Math.min(1.45, fixPitch + rotSpd * 0.6 * dt);
        if (keys['ArrowDown']) fixPitch = Math.max(0.06, fixPitch - rotSpd * 0.6 * dt);
        if (keys['Equal'] || keys['NumpadAdd']) fixDist = Math.max(6, fixDist - zoomSpd * dt);
        if (keys['Minus'] || keys['NumpadSubtract']) fixDist = Math.min(46, fixDist + zoomSpd * dt);
    }
    if (pendYaw !== 0 || pendPitch !== 0) {
        const APPLY = 0.6;
        if (viewMode === 'fixed') {
            fixYaw += pendYaw * APPLY; fixPitch += pendPitch * APPLY;
            fixPitch = Math.max(0.05, Math.min(1.45, fixPitch));
        } else {
            camYaw += pendYaw * APPLY; camPitch += pendPitch * APPLY;
            if (viewMode === 'fp') camPitch = Math.max(-1.2, Math.min(1.2, camPitch));
            else camPitch = Math.max(-0.25, Math.min(1.15, camPitch));
        }
        pendYaw *= (1 - APPLY); pendPitch *= (1 - APPLY);
        if (Math.abs(pendYaw) < 1e-5) pendYaw = 0;
        if (Math.abs(pendPitch) < 1e-5) pendPitch = 0;
    }
    if (viewMode === 'fixed') camYaw = fixYaw + Math.PI;

    /* 移动输入：WASD 全视角可用；方向键在固定视角下留给旋转缩放 */
    let ix = 0, iz = 0;
    {
        if (keys['KeyW']) iz += 1;
        if (keys['KeyS']) iz -= 1;
        if (keys['KeyA']) ix -= 1;
        if (keys['KeyD']) ix += 1;
        if (viewMode !== 'fixed') {
            if (keys['ArrowUp']) iz += 1;
            if (keys['ArrowDown']) iz -= 1;
            if (keys['ArrowLeft']) ix -= 1;
            if (keys['ArrowRight']) ix += 1;
        }
        ix += joyX; iz += -joyY;
        const m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; }
    }
    const joyFull = Math.hypot(joyX, joyY) > 0.85;
    const running = !!(keys['ShiftLeft'] || keys['ShiftRight']) || sprintBtnDown || joyFull;
    const maxSpeed = running ? 3.2 : 1.6;
    let tx = 0, tz = 0;
    if (ix !== 0 || iz !== 0) {
        const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
        const rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
        tx = (fx * iz + rx * ix) * maxSpeed;
        tz = (fz * iz + rz * ix) * maxSpeed;
    }
    player.moveSpeed += (Math.hypot(tx, tz) - player.moveSpeed) * Math.min(1, dt * 10);
    const spd = player.moveSpeed; const moving = spd > 0.12;
    if (moving) slime.pulse += dt * (2.6 + spd * 1.3);
    const creep = moving ? 0.45 + 0.55 * Math.max(0, Math.sin(slime.pulse - 0.5)) : 1;
    const ox = player.pos.x, oz = player.pos.z;
    let nx = player.pos.x + tx * dt * creep, nz = player.pos.z + tz * dt * creep;
    [nx, nz] = collideXZ(nx, nz, player.pos.y);
    player.pos.x = nx; player.pos.z = nz;
    const ground = groundAt(player.pos.x, player.pos.z, player.pos.y);
    if (player.pos.y <= ground + 0.001 && player.vy <= 0) { if (player.pos.y - ground > 0.5) player.vy = 0; else slimeLand(time); }
    if (player.pos.y > ground + 0.001 || player.vy > 0) {
        player.vy -= 22 * dt; player.pos.y += player.vy * dt;
        const g2 = groundAt(player.pos.x, player.pos.z, player.pos.y);
        if (player.pos.y <= g2 && player.vy <= 0) slimeLand(time); else if (player.pos.y > g2) player.onGround = false;
    }
    if (spd > 0.15) player.yaw = lerpAngle(player.yaw, Math.atan2(tx, tz), Math.min(1, dt * 9));

    /* 小海龟动作：四腿对角交替爬行 / 跳跃收腿 / 呼吸起伏 */
    const breathe = 1 + Math.sin(time * 1.7) * 0.02;
    const pulseSq = moving ? 1 - 0.05 * Math.max(0, Math.sin(slime.pulse - 0.9)) : 1;
    let jumpSq = 1;
    if (!player.onGround) jumpSq = player.vy > 2 ? 1.1 : (player.vy < -2 ? 1.06 : 1.03);
    const targetS = SLIME_FLAT * breathe * pulseSq * jumpSq;
    slime.squashV += (targetS - slime.squash) * 165 * dt; slime.squashV *= Math.exp(-6.2 * dt); slime.squash += slime.squashV * dt;
    const sy = Math.max(0.7, Math.min(1.3, slime.squash)); const sxz = 1 / Math.sqrt(sy);
    slime.wobV += (-slime.wob) * 55 * dt; slime.wobV *= Math.exp(-3.4 * dt); slime.wob += slime.wobV * dt;
    const wob = Math.max(-0.35, Math.min(0.35, slime.wob));
    slimeRoot.position.set(player.pos.x, player.pos.y, player.pos.z);
    slimeRoot.rotation.y = player.yaw;
    slimeBody.scale.set(sxz, sy, sxz); slimeBody.position.y = 0;
    const leanT = Math.min(spd / 1.6, 1) * 0.1;
    slime.tiltV += (leanT - slime.tilt) * 130 * dt; slime.tiltV *= Math.exp(-5 * dt); slime.tilt += slime.tiltV * dt;
    slimeBody.rotation.x = slime.tilt + wob * 0.15;
    slimeBody.rotation.z = Math.sin(slime.pulse * 0.5) * 0.03 * Math.min(spd / 1.6, 1) + wob * 0.25;
    const gait = moving ? Math.sin(slime.pulse * 2.2) * Math.min(spd / 1.6, 1) : 0;
    if (charModel) {
        charModel.position.y = charBaseY + (player.onGround ? 0 : 0.08) + Math.sin(time * 2.1) * 0.012;
        const sw = gait * 0.5;
        /* 所有骨骼动画 = 静置姿态四元数 × 本帧欧拉增量 */
        const restRot = (name, ex, ey, ez) => {
            const b = charBones[name];
            if (!b || !b.userData.restQ) return;
            _swingQ.setFromEuler(_swingEuler.set(ex, ey, ez));
            b.quaternion.copy(b.userData.restQ).multiply(_swingQ);
        };
        /* 头：待机左右张望（走路时幅度变小）；挥手时歪头回应 */
        const waveK = waveT >= 0 ? Math.min(1, waveT / 0.35) * Math.min(1, Math.max(0, (1.9 - waveT) / 0.45)) : 0;
        const shakeAmp = moving ? 0.05 : 0.15;
        restRot('0', 0, Math.sin(time * 1.35) * shakeAmp, Math.sin(time * 0.9) * shakeAmp * 0.35 - waveK * 0.22);
        /* 尾巴：三节递进摇摆，走路摇得更欢 */
        const wagAmp = moving ? 0.5 : 0.28;
        restRot('8', 0, Math.sin(time * 3.2) * wagAmp, 0);
        restRot('9', 0, Math.sin(time * 3.2 - 0.7) * wagAmp * 1.25, 0);
        restRot('22', 0, Math.sin(time * 3.2 - 1.4) * wagAmp * 1.5, 0);
        /* 手臂：走路摆臂；B 键举手挥舞 */
        let armLx = sw, armRx = -sw, armRz = 0, foreR = 0;
        if (waveT >= 0) {
            waveT += dt;
            const k = Math.min(1, waveT / 0.35) * Math.min(1, Math.max(0, (1.9 - waveT) / 0.45));
            if (waveT > 1.9) waveT = -1;
            armRz = 2.2 * k;
            armRx = -sw * (1 - k);
            foreR = Math.sin(waveT * 16) * 0.5 * k;
        }
        /* 大臂=4(左)/6(右)，小臂=20(左)/15(右) */
        restRot('4', armLx, 0, 0);
        restRot('20', 0, 0, armLx * 0.3);
        restRot('6', armRx, 0, armRz);
        restRot('15', 0, 0, foreR);
        /* 腿：走路交替迈步 */
        restRot('12', -sw * 0.7, 0, 0);
        restRot('10', sw * 0.7, 0, 0);
    } else {
        const tuck = player.onGround ? 0 : 0.9;
        legs[0].rotation.x = gait * 0.55 - tuck;
        legs[3].rotation.x = gait * 0.55 - tuck;
        legs[1].rotation.x = -gait * 0.55 - tuck;
        legs[2].rotation.x = -gait * 0.55 - tuck;
        head.position.y = 0.17 + Math.sin(time * 2.1) * 0.015 + (moving ? Math.sin(slime.pulse * 2.2) * 0.02 : 0);
    }
    const shs = 1 / Math.sqrt(sy);
    slimeShadow.scale.set(shs, shs, 1); slimeShadow.material.opacity = 0.10 + 0.10 / sy;

    /* 三种相机 */
    if (viewMode === 'fixed') {
        const cp = Math.cos(fixPitch), sp = Math.sin(fixPitch);
        camera.position.set(FIX_LOOK.x + Math.sin(fixYaw) * cp * fixDist, FIX_LOOK.y + sp * fixDist, FIX_LOOK.z + Math.cos(fixYaw) * cp * fixDist);
        camera.lookAt(FIX_LOOK);
    } else if (viewMode === 'fp') {
        camera.position.set(player.pos.x, player.pos.y + eyeH, player.pos.z);
        camera.lookAt(player.pos.x + Math.sin(camYaw) * Math.cos(camPitch) * 10, player.pos.y + eyeH + Math.sin(camPitch) * 10, player.pos.z + Math.cos(camYaw) * Math.cos(camPitch) * 10);
    } else {
        const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
        const px = player.pos.x - Math.sin(camYaw) * cp * viewDist, py = player.pos.y + 0.34 + sp * viewDist, pz = player.pos.z - Math.cos(camYaw) * cp * viewDist;
        camera.position.set(px, Math.max(py, 0.25), pz);
        camera.lookAt(player.pos.x, player.pos.y + 0.25, player.pos.z);
    }
}
