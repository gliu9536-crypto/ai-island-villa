/* ====================================================================
 * 线稿风格海岛别墅 - 别墅模块：现代平顶二层别墅 + 泳池 + 阳台 + 外置楼梯
 * ==================================================================== */

/* ============ 关键尺寸（碰撞/天气/玩家共用） ============ */
const VILLA = {
    fx1: -3.5, fx2: 3.5, fz1: -2.75, fz2: 2.75,   // 主体占地
    h1: 2.9, slab: 0.15, h2: 2.75, roof: 5.98,     // 一层高 / 楼板厚 / 二层高 / 屋面高
    balcony: { x1: -5.72, x2: 3.2, z1: 2.75, z2: 5.15, top: 3.05 },
    stair: { x1: -5.7, x2: -4.6, zTop: 5.18, zBot: 8.35, top: 3.05 },
    pool: { x1: 4.6, x2: 8.4, z1: -2.2, z2: 1.4 },
    doorGap: { a: -2.2, b: -1.1 },                 // 一层入户门洞
    slideGap: { a: -0.85, b: 0.85 }                // 二层推拉门洞
};
function stairHAt(z) {
    const s = VILLA.stair;
    if (z <= s.zTop) return s.top;
    if (z >= s.zBot) return 0;
    return (s.zBot - z) / (s.zBot - s.zTop) * s.top;
}
/* 雨雪落点：屋顶 > 雨棚 > 阳台 > 泳池水面 > 地面 */
function topSurfaceAt(x, z) {
    if (x > -3.95 && x < 3.95 && z > -3.2 && z < 3.2) return VILLA.roof;
    if (x > -2.9 && x < -0.35 && z > 2.75 && z < 4.0) return 2.6;
    if (x > VILLA.balcony.x1 && x < VILLA.balcony.x2 && z > VILLA.balcony.z1 && z < VILLA.balcony.z2) return VILLA.balcony.top;
    if (x > VILLA.pool.x1 && x < VILLA.pool.x2 && z > VILLA.pool.z1 && z < VILLA.pool.z2) return 0.1;
    return 0;
}

/* ============ 材质 ============ */
const WOOD = LITMAT(0xd9c9a6, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const DOOR_WOOD = LITMAT(0xc9a878, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const SOFA = LITMAT(0xe8e4dc, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const RUG = LITMAT(0xefe3d2, { polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4 });
const BLANKET = LITMAT(0xa8c8e0, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const SOLAR = LITMAT(0x8a98a8, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const POOL_WATER = LITMAT(0x9fd8e8, { polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 3 });

/* ============ 弹簧门系统 ============ */
const springs = [];
function registerSpring(kind, apply, closedVal, openVal) {
    const s = { kind, apply, closedVal, openVal, cur: closedVal, v: 0, open: false };
    springs.push(s);
    return s;
}
function updateSprings(dt) {
    for (const s of springs) {
        const target = s.open ? s.openVal : s.closedVal;
        const a = (target - s.cur) * 90 - s.v * 11;
        s.v += a * dt;
        s.cur += s.v * dt;
        s.apply(s.cur);
    }
}

/* ============ 一层 ============ */
{   /* 室内地坪 */
    put(boxT(7.0, 0.12, 5.5, RUG), 0, 0.06, 0);
    const g = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(7.0, 0.12, 5.5), 1), MAT);
    put(g, 0, 0.06, 0);
    /* 南面幕墙：玻璃 + 竖向分格 + 门洞 */
    put(box(7.0, 0.3, 0.12), 0, 2.75, 2.75);                       // 顶部横梁
    put(box(0.12, 0.25, 0.12), 0, 0.12, 2.75);                     // 门洞下坎
    for (const [a, b] of [[VILLA.fx1, VILLA.doorGap.a], [VILLA.doorGap.b, VILLA.fx2]]) {
        const w = b - a, cx = (a + b) / 2;
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, 2.3), WIN_GLASS);
        put(glass, cx, 1.35, 2.75);
        const n = Math.max(1, Math.round(w / 0.9));
        for (let i = 0; i <= n; i++) put(box(0.05, 2.42, 0.07), a + (w) * i / n, 1.35, 2.75);
    }
    /* 北墙：实墙 + 横向条窗 */
    put(box(7.0, 1.1, 0.12), 0, 0.55, -2.75);
    put(box(7.0, 0.8, 0.12), 0, 2.5, -2.75);
    put(new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.0), WIN_GLASS), 0, 1.65, -2.75);
    for (const mx of [-2.3, 0, 2.3]) put(box(0.05, 1.0, 0.07), mx, 1.65, -2.75);
    /* 西墙：木格栅 accent 墙 */
    put(boxT(0.12, VILLA.h1, 5.5, WOOD), -3.5, 1.45, 0);
    for (let i = 0; i < 9; i++) put(box(0.16, 0.05, 5.3), -3.52, 0.3 + i * 0.32, 0);
    /* 东墙：实墙 + 方窗 */
    put(box(0.12, 1.1, 5.5), 3.5, 0.55, 0);
    put(box(0.12, 0.8, 5.5), 3.5, 2.5, 0);
    put(box(0.12, 1.0, 1.45), 3.5, 1.65, -2.02);
    put(box(0.12, 1.0, 1.45), 3.5, 1.65, 2.02);
    put(new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.0), WIN_GLASS), 3.5, 1.65, 0, 0, Math.PI / 2, 0);
    put(box(0.07, 1.0, 0.05), 3.5, 1.65, 0);
}

/* ============ 楼板 + 阳台 ============ */
put(box(7.0, VILLA.slab, 5.5), 0, 2.975, 0);
put(box(8.92, VILLA.slab, 2.4), -1.26, 2.975, 3.95);
/* 阳台栏杆：立柱 + 扶手 */
{
    const railPosts = (x1, x2, z, n) => { for (let i = 0; i <= n; i++) put(box(0.04, 0.92, 0.04), x1 + (x2 - x1) * i / n, 3.53, z); };
    const railPostsZ = (z1, z2, x, n) => { for (let i = 0; i <= n; i++) put(box(0.04, 0.92, 0.04), x, 3.53, z1 + (z2 - z1) * i / n); };
    railPosts(-4.5, 3.1, 5.1, 9);
    railPostsZ(2.8, 5.1, 3.15, 5);
    railPostsZ(3.75, 5.1, -5.67, 3);
    put(box(7.7, 0.06, 0.06), -0.65, 4.01, 5.1);
    put(box(0.06, 0.06, 2.35), 3.15, 4.01, 3.95);
    put(box(0.06, 0.06, 1.4), -5.67, 4.01, 4.42);
}

/* ============ 二层 ============ */
{
    /* 南面幕墙 + 推拉门洞 */
    put(box(7.0, 0.28, 0.12), 0, 5.66, 2.75);
    for (const [a, b] of [[VILLA.fx1, VILLA.slideGap.a], [VILLA.slideGap.b, VILLA.fx2]]) {
        const w = b - a, cx = (a + b) / 2;
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, 2.2), WIN_GLASS);
        put(glass, cx, 4.4, 2.75);
        const n = Math.max(1, Math.round(w / 0.9));
        for (let i = 0; i <= n; i++) put(box(0.05, 2.32, 0.07), a + w * i / n, 4.4, 2.75);
    }
    /* 北墙条窗 */
    put(box(7.0, 1.1, 0.12), 0, 3.6, -2.75);
    put(box(7.0, 0.75, 0.12), 0, 5.42, -2.75);
    put(new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.1), WIN_GLASS), 0, 4.6, -2.75);
    for (const mx of [-2.3, 0, 2.3]) put(box(0.05, 1.1, 0.07), mx, 4.6, -2.75);
    /* 东西墙 */
    put(box(0.12, VILLA.h2, 5.5), -3.5, 4.42, 0);
    put(box(0.12, 1.0, 5.5), 3.5, 3.55, 0);
    put(box(0.12, 0.85, 5.5), 3.5, 5.37, 0);
    put(new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.0), WIN_GLASS), 3.5, 4.6, 0, 0, Math.PI / 2, 0);
    for (const mz of [-1.9, 1.9]) put(box(0.07, 1.0, 0.05), 3.5, 4.6, mz);
}

/* ============ 平屋顶 + 女儿墙 + 屋顶设备 ============ */
put(box(7.9, 0.18, 6.4), 0, 5.89, 0);
{
    put(box(7.7, 0.35, 0.1), 0, 6.15, -3.12);
    put(box(7.7, 0.35, 0.1), 0, 6.15, 3.12);
    put(box(0.1, 0.35, 6.3), -3.87, 6.15, 0);
    put(box(0.1, 0.35, 6.3), 3.87, 6.15, 0);
    const solar = boxT(1.7, 0.06, 1.15, SOLAR);
    put(solar, -1.6, 6.35, -1.9, 0.32, 0.4, 0);
    put(boxT(0.62, 0.42, 0.52, SOFA), 2.9, 6.22, -2.4);
}

/* ============ 入户门（平开弹簧门） ============ */
const frontDoorGroup = new THREE.Group();
{
    const panel = boxT(1.06, 2.5, 0.07, DOOR_WOOD);
    panel.position.set(0.53, 1.37, 0);
    frontDoorGroup.add(panel);
    const handle = edgeTinted(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), SOFA);
    put(handle, 0.95, 1.35, 0.08, Math.PI / 2, 0, 0, frontDoorGroup);
    frontDoorGroup.position.set(VILLA.doorGap.a, 0, 2.75);
    scene.add(frontDoorGroup);
    frontDoorGroup.userData.spring = registerSpring('hinge',
        v => { frontDoorGroup.rotation.y = -v * 1.9; },
        0, 1);
}
/* 门棚 + 台阶 */
put(boxT(1.3, 0.09, 0.5, STEP_STONE), -1.65, 0.045, 3.1);
put(boxT(1.3, 0.09, 0.5, STEP_STONE), -1.65, 0.135, 2.98);

/* ============ 露台推拉门（二层） ============ */
const slideDoorGroup = new THREE.Group();
{
    const frameTop = box(1.72, 0.09, 0.07); frameTop.position.set(0, 2.3, 0); slideDoorGroup.add(frameTop);
    const frameBot = box(1.72, 0.09, 0.07); frameBot.position.set(0, 0.06, 0); slideDoorGroup.add(frameBot);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 2.2), WIN_GLASS);
    glass.position.set(0.83, 1.22, 0); slideDoorGroup.add(glass);
    slideDoorGroup.add(box(0.06, 2.32, 0.06));
    const stile = box(0.06, 2.32, 0.06); stile.position.set(1.66, 1.16, 0); slideDoorGroup.add(stile);
    const mid = box(1.66, 0.05, 0.05); mid.position.set(0.83, 1.16, 0); slideDoorGroup.add(mid);
    slideDoorGroup.position.set(VILLA.slideGap.a, 3.05, 2.75);
    scene.add(slideDoorGroup);
    slideDoorGroup.userData.spring = registerSpring('slide',
        v => { slideDoorGroup.position.x = VILLA.slideGap.a - v * 1.72; },
        0, 1);
}

/* ============ 外置悬挑楼梯（西侧） ============ */
{
    const s = VILLA.stair;
    const run = s.zBot - s.zTop, rise = s.top;
    const len = Math.hypot(run, rise);
    const ang = Math.atan2(rise, run);
    /* 西侧实心脊梁（踏步由此向东悬挑）+ 一体实心栏板（顶边即扶手） */
    put(box(0.3, len, 0.35), -5.53, rise / 2 - 0.12, (s.zTop + s.zBot) / 2, -ang, 0, 0);
    put(box(0.1, len, 1.1), -5.68, rise / 2 + 0.62, (s.zTop + s.zBot) / 2, -ang, 0, 0);
    /* 悬挑踏步（伸入阳台底下的最后几级省略，由阳台完成面衔接） */
    const N = 13;
    for (let i = 0; i < N; i++) {
        const z = s.zBot - 0.22 - i * (run - 0.34) / (N - 1);
        const top = stairHAt(z);
        put(boxT(1.02, 0.05, 0.22, WOOD), -5.15, top - 0.025, z);
    }
    /* 东侧扶手 + 立柱 */
    put(box(0.05, len, 0.05), -4.66, rise / 2 + 0.9, (s.zTop + s.zBot) / 2, -ang, 0, 0);
    for (let i = 0; i <= 6; i++) {
        const z = s.zBot - 0.28 - i * (run - 0.5) / 6;
        put(box(0.045, 0.9, 0.045), -4.66, stairHAt(z) + 0.45, z);
    }
    /* 楼梯底座石板 */
    put(boxT(1.6, 0.08, 1.1, STEP_STONE), -5.15, 0.04, 8.5);
}

/* ============ 泳池 ============ */
const poolLightSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xaef0e0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
}));
poolLightSprite.scale.set(3.2, 2.2, 1);
let poolLightOn = false, poolLightP = 0;
{
    const p = VILLA.pool;
    const w = p.x2 - p.x1, d = p.z2 - p.z1, cx = (p.x1 + p.x2) / 2, cz = (p.z1 + p.z2) / 2;
    put(box(w + 0.28, 0.34, 0.14), cx, 0.17, p.z1 - 0.07);
    put(box(w + 0.28, 0.34, 0.14), cx, 0.17, p.z2 + 0.07);
    put(box(0.14, 0.34, d + 0.28), p.x1 - 0.07, 0.17, cz);
    put(box(0.14, 0.34, d + 0.28), p.x2 + 0.07, 0.17, cz);
    put(new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, d - 0.1), POOL_WATER), cx, 0.1, cz, -Math.PI / 2, 0, 0);
    const rim = new THREE.Line(geo([
        [p.x1, 0.12, p.z1], [p.x2, 0.12, p.z1], [p.x2, 0.12, p.z2], [p.x1, 0.12, p.z2], [p.x1, 0.12, p.z1]
    ]), MAT);
    scene.add(rim);
    /* 扶梯 */
    put(cylT(0.03, 0.03, 0.85, 6, SOFA), p.x1 + 0.1, 0.35, cz - 0.25, 0, 0, 0.25);
    put(cylT(0.03, 0.03, 0.85, 6, SOFA), p.x1 + 0.1, 0.35, cz + 0.25, 0, 0, 0.25);
    put(box(0.04, 0.04, 0.55), p.x1 + 0.22, 0.62, cz);
    poolLightSprite.position.set(cx, 0.16, cz);
    scene.add(poolLightSprite);
}
function togglePoolLight() { poolLightOn = !poolLightOn; SND.play('toggle'); }
function updatePoolLight(dt, night) {
    const target = poolLightOn ? 0.85 : (night > 0.3 ? 0.25 : 0);
    poolLightP += (target - poolLightP) * Math.min(1, dt * 4);
    poolLightSprite.material.opacity = poolLightP * (0.9 + 0.1 * Math.sin(performance.now() * 0.002));
}

/* ============ 室内陈设（透过玻璃可见） ============ */
{   /* 一层客厅 */
    put(boxT(2.9, 0.02, 2.0, RUG), -0.7, 0.13, -0.6);
    const sofa = new THREE.Group();
    put(boxT(2.1, 0.42, 0.85, SOFA), 0, 0.21, 0, 0, 0, 0, sofa);
    put(boxT(2.1, 0.55, 0.22, SOFA), 0, 0.62, -0.32, 0, 0, 0, sofa);
    put(boxT(0.22, 0.3, 0.85, SOFA), -0.94, 0.5, 0, 0, 0, 0, sofa);
    put(boxT(0.22, 0.3, 0.85, SOFA), 0.94, 0.5, 0, 0, 0, 0, sofa);
    put(sofa, -0.7, 0.12, -1.75);
    put(boxT(0.95, 0.28, 0.55, SOFA), -0.7, 0.27, 0.15);
    put(boxT(0.5, 0.5, 0.5, WOOD), 2.4, 0.37, -1.6);
    put(cylT(0.35, 0.4, 0.1, 8, SOFA), 2.4, 0.68, -1.6);
    /* 二层卧室 */
    const bed = new THREE.Group();
    put(boxT(1.5, 0.32, 2.1, SOFA), 0, 0.16, 0, 0, 0, 0, bed);
    put(boxT(1.42, 0.18, 1.55, BLANKET), 0, 0.41, 0.24, 0, 0, 0, bed);
    put(boxT(1.2, 0.14, 0.42, RUG), 0, 0.45, -0.72, 0, 0, 0, bed);
    put(boxT(0.09, 0.9, 1.5, WOOD), 0, 0.45, -1.05, 0, 0, 0, bed);
    put(bed, 2.4, 3.05, -1.3);
    put(boxT(0.45, 0.45, 0.45, WOOD), 1.3, 3.27, -2.1);
}

/* ============ 一层客厅：电视 / 落地灯 / 小物件 ============ */
const tvScreenOff = LITMAT(0x2a3440, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const tvScreenOn = LITMAT(0xbfe8f2, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
let tvOn = false, tvGlowP = 0, floorLampOn = false, floorLampP = 0, bedLampOn = false, bedLampP = 0;
const tvGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbfe8f2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
const floorLampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
const bedLampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
let tvScreenMesh;
{
    /* 电视柜 + 电视 */
    put(boxT(2.6, 0.5, 0.45, WOOD), 0.6, 0.37, -2.32);
    put(boxT(1.9, 1.1, 0.08, SOFA), 0.6, 1.55, -2.6);
    tvScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 0.94), tvScreenOff);
    put(tvScreenMesh, 0.6, 1.55, -2.55);
    put(tvGlow, 0.6, 1.55, -2.2); tvGlow.scale.set(3.4, 2.4, 1);
    /* 落地灯 */
    put(cylT(0.16, 0.2, 0.05, 8, SOFA), -2.9, 0.15, 1.9);
    put(cylT(0.025, 0.025, 1.45, 6, SOFA), -2.9, 0.88, 1.9);
    put(cylT(0.2, 0.27, 0.34, 8, WIN_GLASS), -2.9, 1.72, 1.9);
    put(floorLampGlow, -2.9, 1.72, 1.9); floorLampGlow.scale.set(2.4, 2.8, 1);
    /* 咖啡桌上的书和杯子 */
    put(boxT(0.3, 0.045, 0.22, BLANKET), -0.92, 0.45, 0.02, 0, 0.3, 0);
    put(boxT(0.26, 0.04, 0.19, UMB_RELF), -0.92, 0.49, 0.03, 0, 0.1, 0);
    put(cylT(0.045, 0.04, 0.09, 6, RUG), -0.42, 0.46, 0.22);
    /* 冲浪板靠墙 */
    const board = edgeTinted(new THREE.SphereGeometry(1, 10, 8), UMB_RELF);
    board.scale.set(0.14, 0.9, 0.045);
    put(board, -3.28, 0.85, 0.55, 0, 0.25, 0.26);
    /* 救生圈 */
    put(edgeTinted(new THREE.TorusGeometry(0.2, 0.06, 8, 18), UMB_RELF), -0.2, 1.85, 2.66);
    /* 墙上挂画 */
    for (const [fy, fz] of [[1.85, -1.7], [1.75, 0.4]]) {
        put(boxT(0.04, 0.5, 0.65, WOOD), 3.42, fy, fz);
        put(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), LITMAT(0x9fc4de)), 3.39, fy, fz, 0, -Math.PI / 2, 0);
    }
    /* 角落绿植 */
    put(cylT(0.13, 0.1, 0.22, 7, DOOR_WOOD), 3.0, 0.23, 2.2);
    for (let i = 0; i < 5; i++) {
        const leaf = edgeTinted(new THREE.ConeGeometry(0.05, 0.34, 4), PALM_LEAF);
        const la = i / 5 * Math.PI * 2;
        put(leaf, 3.0 + Math.sin(la) * 0.09, 0.48, 2.2 + Math.cos(la) * 0.09, 0.5 * Math.cos(la), 0, -0.5 * Math.sin(la));
    }
    /* 厨房吧台 + 水壶 */
    put(boxT(0.5, 0.85, 1.7, WOOD), -3.12, 0.43, -1.5);
    put(cylT(0.09, 0.1, 0.16, 7, SOFA), -3.1, 0.94, -1.1);
    put(boxT(0.03, 0.08, 0.08, SOFA), -3.0, 0.99, -1.1);
}

/* ============ 二层卧室：床头柜台灯 / 衣柜 / 书桌 ============ */
const wardrobeDoorGroup = new THREE.Group();
{
    /* 床头柜台灯 */
    put(cylT(0.02, 0.02, 0.2, 5, SOFA), 1.3, 3.6, -2.1);
    put(cylT(0.09, 0.12, 0.13, 7, WIN_GLASS), 1.3, 3.76, -2.1);
    put(bedLampGlow, 1.3, 3.76, -2.1); bedLampGlow.scale.set(1.6, 1.9, 1);
    /* 衣柜（右门可开） */
    put(boxT(1.15, 1.9, 0.5, WOOD), -2.85, 4.02, -2.42);
    put(boxT(0.55, 1.8, 0.05, DOOR_WOOD), -3.12, 4.02, -2.14);
    wardrobeDoorGroup.position.set(-2.57, 4.02, -2.15);
    const wDoor = boxT(0.55, 1.8, 0.05, DOOR_WOOD);
    wDoor.position.set(0.275, 0, 0);
    wardrobeDoorGroup.add(wDoor);
    put(cylT(0.015, 0.015, 0.1, 5, SOFA), 0.5, 0, 0.05, Math.PI / 2, 0, 0, wardrobeDoorGroup);
    scene.add(wardrobeDoorGroup);
    wardrobeDoorGroup.userData.spring = registerSpring('hinge', v2 => { wardrobeDoorGroup.rotation.y = -v2 * 1.25; }, 0, 1);
    /* 书桌 + 椅子 */
    put(boxT(1.25, 0.05, 0.55, WOOD), -2.85, 3.98, 0.6);
    put(boxT(0.05, 0.85, 0.5, WOOD), -3.4, 3.55, 0.6);
    put(boxT(0.05, 0.85, 0.5, WOOD), -2.3, 3.55, 0.6);
    put(boxT(0.3, 0.24, 0.05, SOFA), -2.85, 4.13, 0.45, 0.3, 0, 0);
    put(boxT(0.4, 0.05, 0.4, SOFA), -2.15, 3.5, 0.6);
    for (const [lx, lz] of [[-2.3, 0.45], [-2.0, 0.45], [-2.3, 0.75], [-2.0, 0.75]])
        put(cylT(0.018, 0.022, 0.42, 5, WOOD), lx, 3.28, lz);
    put(boxT(0.05, 0.45, 0.4, SOFA), -1.96, 3.75, 0.6);
    /* 二层地毯 */
    put(boxT(1.9, 0.02, 1.3, RUG), 0.3, 3.065, -0.4);
    /* 便签本 + 笔 */
    put(boxT(0.22, 0.015, 0.3, RUG), -2.7, 4.01, 0.55, 0, 0.4, 0);
}

function toggleTV() { tvOn = !tvOn; tvScreenMesh.material = tvOn ? tvScreenOn : tvScreenOff; SND.play('toggle'); }
function toggleFloorLamp() { floorLampOn = !floorLampOn; SND.play('toggle'); }
function toggleBedLamp() { bedLampOn = !bedLampOn; SND.play('toggle'); }
function updateVillaProps(dt) {
    tvGlowP += ((tvOn ? 0.55 : 0) - tvGlowP) * Math.min(1, dt * 5);
    floorLampP += ((floorLampOn ? 0.75 : 0) - floorLampP) * Math.min(1, dt * 5);
    bedLampP += ((bedLampOn ? 0.55 : 0) - bedLampP) * Math.min(1, dt * 5);
    tvGlow.material.opacity = tvGlowP;
    floorLampGlow.material.opacity = floorLampP;
    bedLampGlow.material.opacity = bedLampP;
}

/* ============ 室内暖光（日落时透过玻璃渗出） ============ */
const villaGlow1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc888, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
const villaGlow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc888, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
villaGlow1.scale.set(7, 5, 1); villaGlow1.position.set(0, 1.5, 0);
villaGlow2.scale.set(6, 4, 1); villaGlow2.position.set(0.5, 4.4, -0.5);
scene.add(villaGlow1); scene.add(villaGlow2);
function updateVillaGlow(night) {
    const g = Math.max(0, night - 0.15) * 0.5;
    villaGlow1.material.opacity = g;
    villaGlow2.material.opacity = g * 0.8;
}

/* ============ 碰撞盒（按高度分层） ============ */
const solidBoxes = [
    { x1: VILLA.fx1, x2: VILLA.fx2, z1: -2.81, z2: -2.69 },               // 北墙（贯穿两层）
    { x1: -3.56, x2: -3.44, z1: -2.75, z2: 2.75 },                        // 西墙
    { x1: 3.44, x2: 3.56, z1: -2.75, z2: 2.75 },                          // 东墙
    { x1: VILLA.pool.x1 + 0.1, x2: VILLA.pool.x2 - 0.1, z1: VILLA.pool.z1 + 0.1, z2: VILLA.pool.z2 - 0.1 }, // 泳池水体
];
/* 一层南墙（y < 2.5 时生效——二层是玻璃推拉门，别挡二楼的路） */
const lowerBoxes = [
    { x1: VILLA.fx1, x2: VILLA.doorGap.a, z1: 2.69, z2: 2.81 },
    { x1: VILLA.doorGap.b, x2: VILLA.fx2, z1: 2.69, z2: 2.81 },
];
/* 二层专属（y > 2.5 时生效） */
const upperBoxes = [
    { x1: VILLA.fx1, x2: VILLA.slideGap.a, z1: 2.69, z2: 2.81 },
    { x1: VILLA.slideGap.b, x2: VILLA.fx2, z1: 2.69, z2: 2.81 },
    { x1: -4.6, x2: 3.2, z1: 5.05, z2: 5.17 },       // 阳台南栏杆
    { x1: 3.1, x2: 3.2, z1: 2.75, z2: 5.17 },        // 阳台东栏杆
    { x1: -5.72, x2: -5.62, z1: 3.7, z2: 5.17 },      // 阳台西栏杆（留楼梯口）
];
/* 楼梯护栏（全高度生效：防侧落 + 防从侧面穿模） */
const stairBoxes = [
    { x1: -5.76, x2: -5.6, z1: 5.0, z2: 8.5 },       // 楼梯西栏板
    { x1: -4.72, x2: -4.62, z1: 5.0, z2: 8.4 },      // 楼梯东侧扶手
];
const DOOR_BOX = { x1: VILLA.doorGap.a, x2: VILLA.doorGap.b, z1: 2.69, z2: 2.81 };
const SLIDE_BOX = { x1: VILLA.slideGap.a, x2: VILLA.slideGap.b, z1: 2.69, z2: 2.81 };

/* 平台（可站立面） */
const VILLA_PLATFORMS = [
    { x1: VILLA.fx1, x2: VILLA.fx2, z1: VILLA.fz1, z2: VILLA.fz2, top: 0.12 },
    { x1: VILLA.balcony.x1, x2: VILLA.balcony.x2, z1: VILLA.balcony.z1, z2: VILLA.balcony.z2, top: VILLA.balcony.top },
    { x1: VILLA.fx1, x2: VILLA.fx2, z1: VILLA.fz1, z2: VILLA.fz2, top: VILLA.balcony.top }
];

/* 站立高度查询 */
function groundAt(x, z, curY) {
    let g = 0;
    for (const p of VILLA_PLATFORMS) {
        if (x > p.x1 && x < p.x2 && z > p.z1 && z < p.z2 && curY > p.top - 0.5) g = Math.max(g, p.top);
    }
    const s = VILLA.stair;
    if (x > s.x1 && x < s.x2 && z > s.zTop - 0.35 && z < s.zBot + 0.15) {
        const h = stairHAt(z);
        if (curY > h - 0.6) g = Math.max(g, h);
    }
    return g;
}

/* ============ 交互点 ============ */
const interactables = [
    { x: -1.65, z: 3.3, r: 1.8, label: '打开 / 关上入户门', act: () => toggleSpringOf(frontDoorGroup), maxY: 2.5 },
    { x: 0, z: 3.7, r: 2.1, label: '推 / 拉露台推拉门', act: () => toggleSpringOf(slideDoorGroup), minY: 2.5 },
    { x: 6.5, z: -0.4, r: 2.6, label: '开 / 关泳池灯', act: togglePoolLight },
    { x: 0.6, z: -1.9, r: 1.5, label: '开 / 关电视', act: toggleTV, maxY: 2.5 },
    { x: -2.9, z: 1.9, r: 1.4, label: '开 / 关落地灯', act: toggleFloorLamp, maxY: 2.5 },
    { x: 1.3, z: -2.15, r: 1.2, label: '开 / 关床头灯', act: toggleBedLamp, minY: 2.5 },
    { x: -2.7, z: -1.9, r: 1.4, label: '开 / 关衣柜', act: () => toggleSpringOf(wardrobeDoorGroup), minY: 2.5 }
];
function toggleSpringOf(g) { g.userData.spring.open = !g.userData.spring.open; SND.play('door'); }
