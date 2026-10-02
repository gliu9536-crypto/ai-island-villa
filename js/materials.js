/* ====================================================================
 * 线稿风格海岛别墅 - 基础材质与工具模块
 * 基于 YIBI2333/line-art-style-magic-cabin (MIT) 的线稿渲染技法
 * ==================================================================== */

/* ============ 全局 ============ */
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (IS_TOUCH) document.body.classList.add('touch');

/* ============ 音效系统：文件放 sounds/ 目录，缺失时静默跳过 ============ */
const SND = (() => {
    const NAMES = ['door', 'toggle', 'ui'];
    const pool = {};
    for (const n of NAMES) { const a = new Audio('sounds/' + n + '.mp3'); a.preload = 'auto'; pool[n] = a; }
    let vol = 0.6, on = true;
    function play(name) {
        if (!on) return;
        const a = pool[name];
        if (!a || a.error) return;
        try { const c = a.cloneNode(); c.volume = vol; c.play().catch(() => { }); } catch (e) { }
    }
    return {
        play,
        setVolume(v) { vol = Math.max(0, Math.min(1, v)); },
        getVolume() { return vol; },
        setEnabled(v) { on = !!v; },
        isEnabled() { return on; }
    };
})();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfdfbf6);
scene.fog = new THREE.Fog(0xfdfbf6, 60, 170);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const MAT = new THREE.LineBasicMaterial({ color: 0x111111 });
const DASHMAT = new THREE.LineDashedMaterial({ color: 0xa9a9a9, dashSize: 0.22, gapSize: 0.16, transparent: true, opacity: 0.85 });
const IN_MAT = new THREE.LineBasicMaterial({ color: 0x8a8a8a });

/* ============ 全局 FILL 材质：纸白底色 + 全局环境色（日落时被染成暖色） ============ */
const FILL = new THREE.ShaderMaterial({
    uniforms: {
        uColor: { value: new THREE.Color(0xffffff) },
        uTint: { value: new THREE.Color(0xffffff) },
        uTime: { value: 0 },
        fogColor: { value: new THREE.Color(0xfdfbf6) },
        fogNear: { value: 40 },
        fogFar: { value: 110 }
    },
    vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        varying float vFogDepth;
        void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            vec4 mvPosition = viewMatrix * worldPos;
            vFogDepth = -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uTint;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        varying float vFogDepth;
        void main() {
            /* 纸白底 + 极轻的法线明暗，让体积感靠描边和一点点灰阶表达 */
            float shade = 0.965 + 0.035 * clamp(dot(normalize(vWorldNormal), normalize(vec3(0.5, 0.85, 0.3))), 0.0, 1.0);
            vec3 col = uColor * uTint * shade;
            float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
            col = mix(col, fogColor, fogFactor);
            gl_FragColor = vec4(col, 1.0);
        }
    `,
    side: THREE.DoubleSide,
    fog: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

/* 彩色物品材质工厂：与 FILL 共享 uColor（环境色），uTint 独立 */
function LITMAT(hex, opts) {
    const u = { uTint: { value: new THREE.Color(hex) } };
    for (const k in FILL.uniforms) if (k !== 'uTint') u[k] = FILL.uniforms[k];
    const m = new THREE.ShaderMaterial({
        uniforms: u, vertexShader: FILL.vertexShader, fragmentShader: FILL.fragmentShader
    });
    if (opts) for (const k in opts) m[k] = opts[k];
    return m;
}

const WIN_GLASS = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

/* ============ 线稿构件工具 ============ */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const geo = pts => new THREE.BufferGeometry().setFromPoints(pts.map(p => V(p[0], p[1], p[2])));
const line = pts => new THREE.Line(geo(pts), MAT);
const iline = pts => new THREE.Line(geo(pts), IN_MAT);
function dline(pts) { const l = new THREE.Line(geo(pts), DASHMAT); l.computeLineDistances(); return l; }

/* 核心：白色填充 + EdgesGeometry 描边 = 手绘线稿质感 */
function edge(g, threshold = 1, lmat) {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(g, FILL));
    grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, threshold), lmat || MAT));
    return grp;
}
/* 彩色版本：彩色填充 + 深色描边 */
function edgeTinted(g, mat, lineColor) {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(g, mat));
    grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 1), lineColor ? new THREE.LineBasicMaterial({ color: lineColor }) : MAT));
    return grp;
}
const box = (w, h, d) => edge(new THREE.BoxGeometry(w, h, d));
const boxT = (w, h, d, mat) => edgeTinted(new THREE.BoxGeometry(w, h, d), mat);
const cylT = (rt, rb, h, seg, mat) => edgeTinted(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const log = (len, r = 0.15) => edge(new THREE.CylinderGeometry(r, r, len, 8));

function put(o, x, y, z, rx, ry, rz, parent) {
    o.position.set(x, y, z); if (rx) o.rotation.x = rx; if (ry) o.rotation.y = ry; if (rz) o.rotation.z = rz; (parent || scene).add(o); return o;
}
function jitterGeo(g, amp) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
        p.setXYZ(i,
            p.getX(i) * (1 + (Math.random() - 0.5) * amp),
            p.getY(i) * (1 + (Math.random() - 0.5) * amp),
            p.getZ(i) * (1 + (Math.random() - 0.5) * amp));
    }
    g.computeVertexNormals();
    return g;
}
/* 海岛轮廓半径函数：几何与碰撞共用同一来源 */
function islandRadiusAt(a) {
    return 14 + 1.1 * Math.sin(a * 3 + 1.2) + 0.75 * Math.sin(a * 5 + 4.0) + 0.4 * Math.sin(a * 8 + 2.0);
}
function islandRadiusAtXZ(x, z) { return islandRadiusAt(Math.atan2(x, z)); }
