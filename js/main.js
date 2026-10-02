/* ====================================================================
 * 线稿风格海岛别墅 - 主循环
 * ==================================================================== */

/* 当前时刻对应的夜晚系数（随黄昏/午夜模式变化） */
function nightFactor() {
    const h = ((fixedHour % 24) + 24) % 24;
    if (h < 5 || h > 19) return 1;
    if (h < 7) return (7 - h) / 2;
    if (h > 17) return (h - 17) / 2;
    return 0;
}

let lastT = 0;
function animate(t) {
    requestAnimationFrame(animate);
    const time = t * 0.001;
    const dt = Math.min(time - lastT, 0.05);
    lastT = time;

    updateSprings(dt);
    updatePlayer(dt, time);
    updateWeatherSystem(dt, time);
    updateInteractHint();

    updateSeaWaves(time);
    updateSeaWaveHi(time);
    updateGlitter(time);
    updateFoamRings(time);
    updatePalmCrowns(time);
    updateFireflies(dt, time, nightFactor(), wx.type);
    updatePoolLight(dt, nightFactor());
    updateVillaGlow(nightFactor());
    updateVillaProps(dt);
    updateCrabs(dt, time);
    updateBoat(time);

    FILL.uniforms.uTime.value = time;

    renderer.render(scene, camera);
}
animate(0);

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
