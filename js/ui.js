/* ====================================================================
 * 线稿风格海岛别墅 - UI 模块：菜单 / 天气切换 / 音效 / 视角按钮
 * ==================================================================== */

const menuPanel = document.getElementById('menuPanel');
const viewFixedBtn = document.getElementById('viewFixedBtn');
const viewTpBtn = document.getElementById('viewTpBtn');
const viewFpBtn = document.getElementById('viewFpBtn');
const resetBtn = document.getElementById('resetBtn');

document.getElementById('menuDot').addEventListener('click', () => { SND.play('ui'); menuPanel.classList.toggle('open'); });

/* 天气切换 chips */
const wxChipsBox = document.getElementById('wxChips'), wxRandToggle = document.getElementById('wxRandToggle');
const chipEls = [];
for (const t of WX_LIST) {
    const b = document.createElement('div');
    b.className = 'wxChip';
    b.textContent = WX_NAME[t];
    b.addEventListener('click', () => { SND.play('ui'); setWeather(t); });
    wxChipsBox.appendChild(b);
    chipEls.push(b);
}
setWeather('sunny');
wxRandToggle.addEventListener('click', () => {
    SND.play('ui');
    wx.random = !wx.random;
    wxRandToggle.classList.toggle('on', wx.random);
    wx.timer = 6 + Math.random() * 10;
});

/* 时间模式：黄昏 / 午夜 */
const timeDusk = document.getElementById('timeDusk'), timeMid = document.getElementById('timeMid');
function onTimeModeChanged(mode) {
    timeDusk.classList.toggle('on', mode === 'dusk');
    timeMid.classList.toggle('on', mode === 'midnight');
    const mid = (mode === 'midnight');
    const big = document.querySelector('#menuPanel .rl-read b');
    const sub = document.querySelector('#menuPanel .rl-read span');
    if (big) big.textContent = mid ? '00:30' : '17:48';
    if (sub) sub.textContent = mid ? 'MIDNIGHT · 午夜' : 'DUSK · 黄昏';
}
timeDusk.addEventListener('click', () => { SND.play('ui'); setTimeMode('dusk'); });
timeMid.addEventListener('click', () => { SND.play('ui'); setTimeMode('midnight'); });

/* 音效 */
const sfxToggle = document.getElementById('sfxToggle'), sfxSlider = document.getElementById('sfxSlider');
sfxToggle.addEventListener('click', () => {
    const on = !SND.isEnabled();
    SND.setEnabled(on);
    sfxToggle.classList.toggle('on', on);
    if (on) SND.play('ui');
});
sfxSlider.addEventListener('input', () => SND.setVolume(parseFloat(sfxSlider.value)));

/* 视角 */
viewFixedBtn.addEventListener('click', () => { SND.play('ui'); setViewMode('fixed'); });
viewTpBtn.addEventListener('click', () => { SND.play('ui'); setViewMode('tp'); });
viewFpBtn.addEventListener('click', () => { SND.play('ui'); setViewMode('fp'); });

/* 重置 */
resetBtn.addEventListener('click', () => { SND.play('ui'); resetSlime(); showHintOverride('狮耶回到了沙滩 ✨', 1.6); });
