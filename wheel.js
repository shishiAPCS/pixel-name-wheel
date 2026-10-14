/*
 * Pixel Roster Picker — bilingual Wario-inspired arcade wheel v3.2.
 * Keeps app.js as the authority for random draws, attendance, history,
 * undo, reset, and localStorage. Only the two scanner visuals are overridden.
 * Wheel + sound are local JavaScript/SVG/Web Audio; no external libraries.
 */
(() => {
    'use strict';
    const frame = document.getElementById('scanner-wrapper');
    const btnStart = document.getElementById('btn-start');
    const btnPanel = document.getElementById('btn-open-panel');
    const btnSound = document.getElementById('btn-sound');
    const reveal = document.getElementById('reveal-area');
    if (!frame || !btnStart || !btnPanel || !reveal) return;

    // Localization is a presentation layer: app.js and its data stay untouched.
    // The class/roster names are user content and must never be translated.
    const LANG_KEY = 'pixelPickerWheelLanguage';
    const LINES = {
        en: {
            remaining:'Remaining:', picked:'Picked:', start:'SPIN THE WHEEL', spinningBtn:'SPINNING...', again:'SPIN AGAIN',
            teacher:'Teacher Panel', close:'Close [X]', panelTitle:'TEACHER TERMINAL',
            classManager:'1. Class Management', selectClass:'Select Class:', newClass:'New Class', renameClass:'Rename', deleteClass:'Delete',
            rosterManager:'2. Roster Setup', rosterHint:'Paste names (one per line or comma-separated):', saveRoster:'Save Roster', importHint:'Or import .txt / .json file:',
            importFile:'Choose File', attendanceTitle:'3. Attendance', allPresent:'Mark All Present', historyTitle:'4. Picked History', undo:'Undo Last Pick', reset:'Reset All',
            badgePicked:'PICKED', badgeUnpicked:'UNPICKED',
            arcadeBanner:'■ MR.MOU ARCADE ■', topTitle:'★ STOP ME! ★', challengeLabel:'★ NEXT CHALLENGE',
            challengeHeadline:"WHO'S NEXT?", challengeDesc:'SPIN THE DISK.\nWATCH THE DRILL.\nGET YOUR MISSION!',
            trim:'▸ READY · SET · PICK ◂', ornament:'◂ ARCADE 01 ▸', ornamentRight:'★ HIT THE NAME ★',
            instruction:'PUSH TO SPIN ◆ WATCH THE DRILL!',
            ready:n=>`${n} READY`, roundOver:'ROUND OVER', spinning:'SPINNING!', locked:'LOCKED ON!', hit:'DIRECT HIT!',
            noStudents:'NO STUDENTS READY', soundOn:'♪ SOUND ON', soundOff:'♪ SOUND OFF', soundMute:'Mute arcade sounds', soundEnable:'Enable arcade sounds',
            switchLang:'切换到简体中文', wheelAria:'Student selection wheel', svgAria:'Eligible students on a rotating wheel',
            winnerLines:['A WILD [name] APPEARED!', 'MISSION ASSIGNED TO: [name]', "TODAY'S BRAVE SOUL: [name]", 'THE CLASSROOM ORACLE CHOSE: [name]', 'THE PIXEL GODS SELECTED: [name]', 'INITIATING PROTOCOL: [name]']
        },
        zh: {
            remaining:'待抽：', picked:'已抽：', start:'开始点名', spinningBtn:'转转转…', again:'再来一位',
            teacher:'教师后台', close:'返回转盘 ✕', panelTitle:'牟老师控制台',
            classManager:'1. 班级管理', selectClass:'选择班级：', newClass:'新建班级', renameClass:'改个名字', deleteClass:'删除班级',
            rosterManager:'2. 名单管理', rosterHint:'粘贴学生姓名（每行一位，或用逗号分隔）：', saveRoster:'保存名单', importHint:'也可以导入 .txt / .json 文件：',
            importFile:'选文件导入', attendanceTitle:'3. 出勤管理', allPresent:'全员到齐', historyTitle:'4. 抽选记录', undo:'撤销上一抽', reset:'本轮清零',
            badgePicked:'已点到', badgeUnpicked:'待点名',
            arcadeBanner:'■ 牟老师点名机 ■', topTitle:'★ 看谁中招！ ★', challengeLabel:'★ 下一位幸运儿',
            challengeHeadline:'轮到谁啦？', challengeDesc:'转盘开转！\n钻头出击！\n谁被点中，谁登场！',
            trim:'▸ 就位 · 开转 · 点名 ◂', ornament:'◂ 街机 01 ▸', ornamentRight:'★ 一击命中 ★',
            instruction:'按下按钮 ◆ 开转点名！',
            ready:n=>`${n} 位待点名`, roundOver:'本轮收工！', spinning:'转得飞起！', locked:'目标锁定！', hit:'正中靶心！',
            noStudents:'暂无可抽同学', soundOn:'♪ 音效开', soundOff:'♪ 音效关', soundMute:'关闭游戏音效', soundEnable:'开启游戏音效',
            switchLang:'Switch to English', wheelAria:'学生随机点名转盘', svgAria:'转盘中显示本轮可抽取的学生',
            winnerLines:['就是你啦，[name]！', '天降任务：[name]，接招！', '今日幸运儿：[name]！', '牟老师的转盘点到了：[name]！', '恭喜 [name]，成功出镜！', '[name]，准备登场！']
        }
    };
    let language = 'zh';
    try { if (localStorage.getItem(LANG_KEY) === 'en') language = 'en'; } catch (_) {}
    const t = (key,...args) => {
        const value = LINES[language][key];
        return typeof value === 'function' ? value(...args) : value;
    };
    const idText = [
        ['label-remaining','remaining'], ['label-picked','picked'], ['btn-open-panel','teacher'],
        ['btn-close-panel','close'], ['btn-new-class','newClass'], ['btn-rename-class','renameClass'],
        ['btn-delete-class','deleteClass'], ['btn-save-roster','saveRoster'], ['btn-import-file','importFile'], ['btn-clear-absences','allPresent'],
        ['btn-undo-pick','undo'], ['btn-reset-picks','reset']
    ];
    const panelText = [
        ['#teacher-panel .panel-header h2','panelTitle'],
        ['#teacher-panel .panel-section:nth-child(1) h3','classManager'],
        ['#teacher-panel label[for="class-select"]','selectClass'],
        ['#teacher-panel .panel-section:nth-child(2) h3','rosterManager'],
        ['#teacher-panel .panel-section:nth-child(2) .help-text:first-of-type','rosterHint'],
        ['#teacher-panel .panel-section:nth-child(2) .help-text:last-of-type','importHint'],
        ['#teacher-panel .panel-section:nth-child(3) h3','attendanceTitle'],
        ['#teacher-panel .panel-section:nth-child(4) h3','historyTitle']
    ];
    function localizeAttendance() {
        document.querySelectorAll('#attendance-list .status-badge').forEach(b => {
            b.textContent = t(b.classList.contains('status-picked') ? 'badgePicked' : 'badgeUnpicked');
        });
    }
    function localizeHistory() {
        document.querySelectorAll('#history-list li').forEach(item => {
            // History is generated by app.js; only translate its time prefix.
            if (language === 'zh') item.textContent = item.textContent.replace(/ \(at ([^)]+)\)$/, '（$1）');
            else item.textContent = item.textContent.replace(/（([^）]+)）$/, ' (at $1)');
        });
    }
    function translateDialog(message) {
        if (language !== 'zh') return message;
        const fixed = {
            'Enter new class name:':'给新班级起个名字：',
            'Enter new name for class:':'班级想改成什么名字？',
            'Class already exists!':'这个班级已经存在啦！',
            'You cannot delete the last remaining class.':'至少得留一个班级，最后一个不能删哦！',
            'Roster updated successfully.':'名单更新成功！',
            'JSON Imported successfully!':'JSON 文件导入成功！',
            'Error parsing JSON file. Check format.':'JSON 文件读取失败，请检查格式。',
            'Are you sure you want to reset all picked statuses for this class?':'确定清空本班已抽中的记录，重新开一轮吗？',
            'Everyone available has been picked. Reset picked students to start a new round.':'能抽的同学都登场啦！清空本轮记录，就能再来一轮。'
        };
        if (Object.prototype.hasOwnProperty.call(fixed, message)) return fixed[message];
        const deletion = /^Are you sure you want to delete (.*)\?$/.exec(message);
        return deletion ? `确定要删除班级「${deletion[1]}」吗？` : message;
    }
    // The existing app uses native browser dialogs; translate their messages
    // while delegating input, confirmation, and all behavior to the originals.
    for (const method of ['alert','confirm','prompt']) {
        const original = window[method];
        if (typeof original === 'function') {
            window[method] = function(message,...args) {
                return original.call(window,translateDialog(String(message)),...args);
            };
        }
    }
    // Original app's render methods are called on every teacher panel refresh.
    // Wrapping their presentation output preserves checkbox handlers and data.
    for (const [method,after] of [['renderAttendanceList',localizeAttendance],['renderHistoryList',localizeHistory]]) {
        const original = window[method];
        if (typeof original === 'function') {
            window[method] = function(...args) {
                const result = original.apply(this,args);
                after();
                return result;
            };
        }
    }
    let wheelPhase='idle';
    let idleCount=0;
    let winnerName='';
    let winnerLine=0;
    let winnerOriginalMessage='';
    function localizeWinner() {
        if (wheelPhase !== 'winner' || !winnerName) return;
        const templates = t('winnerLines');
        document.getElementById('reveal-message').textContent = language === 'en'
            ? winnerOriginalMessage
            : templates[winnerLine].replace('[name]',winnerName);
    }
    function applyLanguage() {
        document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
        document.title = language === 'zh' ? '牟老师点名转盘' : 'Pixel Picker';
        idText.forEach(([id,key]) => { const node=document.getElementById(id); if(node) node.textContent=t(key); });
        panelText.forEach(([sel,key]) => { const node=document.querySelector(sel); if(node) node.textContent=t(key); });
        localizeAttendance(); localizeHistory();
        const langButton = document.getElementById('btn-lang');
        if (langButton) {
            langButton.textContent = language === 'zh' ? 'ENGLISH' : '中文';
            langButton.setAttribute('aria-label',t('switchLang'));
            langButton.title=t('switchLang');
        }
        // Wheel elements are appended below; guard for initial startup.
        const wheelText = [
            ['.wheel-title','topTitle'],['.hud-banner','arcadeBanner'],['.hud-label','challengeLabel'],
            ['.hud-headline','challengeHeadline'],['.hud-trim','trim'],
            ['.wheel-ornament:not(.wheel-ornament-right)','ornament'],
            ['.wheel-ornament-right','ornamentRight']
        ];
        wheelText.forEach(([sel,key])=>{const el=frame.querySelector(sel);if(el)el.textContent=t(key);});
        const desc=frame.querySelector('.hud-desc');
        if (desc) {
            desc.replaceChildren();
            t('challengeDesc').split('\n').forEach((line,i)=> {
                if(i)desc.appendChild(document.createElement('br'));
                desc.appendChild(document.createTextNode(line));
            });
        }
        const instruction=frame.querySelector('.wheel-instruction');
        if (instruction) {
            instruction.replaceChildren();
            const [first,second] = t('instruction').split('◆');
            instruction.append(document.createTextNode(first),Object.assign(document.createElement('span'),{textContent:'◆'}),document.createTextNode(second));
        }
        const wheelSvg=document.getElementById('wheel-svg');
        const wheelDisc=document.getElementById('wheel-disc');
        if(wheelSvg) {
            wheelSvg.setAttribute('aria-label',t('svgAria'));
            const emptyLabel=wheelSvg.querySelector('.empty-wheel-label');
            if(emptyLabel)emptyLabel.textContent=t('noStudents');
        }
        if(wheelDisc)wheelDisc.setAttribute('aria-label',t('wheelAria'));
        if (typeof updateSoundButton === 'function') updateSoundButton();
        const statusEl=document.getElementById('wheel-status');
        const startEl=document.getElementById('btn-start');
        if (statusEl) statusEl.textContent = ({
            idle:idleCount ? t('ready',idleCount):t('roundOver'),
            spinning:t('spinning'),locked:t('locked'),winner:t('hit')
        })[wheelPhase];
        if (startEl)startEl.textContent=wheelPhase==='spinning'||wheelPhase==='locked' ? t('spinningBtn') : wheelPhase==='winner'?t('again'):t('start');
        localizeWinner();
    }
    document.getElementById('btn-import-file')?.addEventListener('click',()=>{
        document.getElementById('file-import')?.click();
    });
    document.getElementById('btn-lang')?.addEventListener('click',()=>{
        language = language === 'zh' ? 'en' : 'zh';
        try{localStorage.setItem(LANG_KEY,language);}catch(_){}
        applyLanguage();
    });

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const TURN = 360;
    const AUDIO_STORAGE_KEY = 'pixelPickerWheelSound';
    let angle = 0;
    let token = 0;
    let frameId = null;
    let hitTimer = null;
    let lastTickTime = 0;
    let lastBoundary = 0;
    let reducedMotion = false;

    frame.classList.add('wheel-mounted');
    frame.innerHTML = `
      <div class="wheel-cabinet">
        <div class="wheel-topline">
          <span class="wheel-title">★ STOP ME! ★</span>
          <span id="wheel-status" class="wheel-status">READY!</span>
        </div>
        <div class="wheel-screen">
          <div class="wheel-scene" id="wheel-scene">
            <aside class="wheel-hud" id="wheel-hud" aria-hidden="true">
              <div class="hud-banner">■ MR.MOU ARCADE ■</div>
              <div class="hud-card">
                <div class="hud-label">★ NEXT CHALLENGE</div>
                <div class="hud-headline">WHO'S NEXT?</div>
                <div class="hud-desc">SPIN THE DISK.<br>WATCH THE DRILL.<br>GET YOUR MISSION!</div>
              </div>
              <div class="hud-trim">▸ READY · SET · PICK ◂</div>
            </aside>
            <div class="wheel-ornament">◂ ARCADE 01 ▸</div>
            <div class="wheel-ornament wheel-ornament-right">★ HIT THE NAME ★</div>
            <div class="wheel-disc" id="wheel-disc" aria-label="Student selection wheel">
              <div id="wheel-rotor" class="wheel-rotor">
                <svg id="wheel-svg" viewBox="0 0 600 600" role="img"
                     aria-label="Eligible students on a rotating wheel"></svg>
              </div>
              <div class="wheel-hub" aria-hidden="true">✦</div>
            </div>
                    <div id="drill-unit" class="drill-unit" aria-hidden="true">
                        <!-- Original blocky drill machine, drawn inline; no image files needed. -->
                        <svg class="drill-svg" viewBox="0 0 230 168" xmlns="http://www.w3.org/2000/svg">
                            <rect x="83" y="20" width="134" height="130" fill="#060a10"/>
                            <rect x="93" y="30" width="114" height="110" fill="#3e4766"/>
                            <rect x="103" y="40" width="94" height="90" fill="#8894b4"/>
                            <rect x="114" y="51" width="57" height="45" fill="#181d2e"/>
                            <rect x="120" y="57" width="45" height="33" fill="#f0be41"/>
                            <rect x="128" y="65" width="9" height="18" fill="#fff4ad"/>
                            <rect x="143" y="65" width="9" height="18" fill="#fff4ad"/>
                            <rect x="171" y="51" width="16" height="45" fill="#475471"/>
                            <rect x="110" y="108" width="22" height="12" fill="#292d45"/>
                            <rect x="140" y="108" width="22" height="12" fill="#292d45"/>
                            <rect x="170" y="108" width="17" height="12" fill="#292d45"/>
                            <rect x="217" y="42" width="13" height="17" fill="#e761a1"/>
                            <rect x="217" y="108" width="13" height="17" fill="#e761a1"/>
                            <rect x="100" y="4" width="100" height="13" fill="#aaafd1"/>
                            <rect x="110" y="0" width="82" height="6" fill="#eec2ef"/>
                            <rect x="100" y="150" width="100" height="13" fill="#aaafd1"/>
                            <rect x="110" y="161" width="82" height="7" fill="#5f577d"/>
                            <!-- Drill shaft and diamond-shaped pixel tip point LEFT -->
                            <rect x="48" y="72" width="45" height="24" fill="#141a2a"/>
                            <rect x="48" y="76" width="45" height="16" fill="#ffed6a"/>
                            <rect x="35" y="70" width="19" height="28" fill="#0e1725"/>
                            <path d="M 5 84 L 36 60 L 36 108 Z" fill="#0e1725"/>
                            <path d="M 10 84 L 34 66 L 34 102 Z" fill="#64e7fc"/>
                            <rect x="35" y="72" width="9" height="24" fill="#37aacc"/>
                            <rect x="75" y="64" width="8" height="9" fill="#ec5598"/>
                            <rect x="75" y="95" width="8" height="9" fill="#ec5598"/>
                        </svg>
                    </div>
            <span id="wheel-spark" class="wheel-spark" aria-hidden="true">✹</span>
          </div>
        </div>
        <div class="wheel-instruction">PUSH TO SPIN <span>◆</span> WATCH THE DRILL!</div>
      </div>`;

    const svg = document.getElementById('wheel-svg');
    const rotor = document.getElementById('wheel-rotor');
    const drill = document.getElementById('drill-unit');
    const spark = document.getElementById('wheel-spark');
    const status = document.getElementById('wheel-status');
    const scene = document.getElementById('wheel-scene');
    const disc = document.getElementById('wheel-disc');
    const hud = document.getElementById('wheel-hud');
    const hudCard = hud.querySelector('.hud-card');
    const main = document.querySelector('#classroom-view .main-area');

    // Fit to the ACTUAL stage dimensions. No 590px cap: projector / zoomed-out
    // browsers should still use nearly the whole game screen.
    function fitWheel() {
        if (!scene.clientWidth || !scene.clientHeight) return;
        const sceneStyle = getComputedStyle(scene);
        const gap = parseFloat(sceneStyle.columnGap) || 0;
        const padX = (parseFloat(sceneStyle.paddingLeft) || 0) + (parseFloat(sceneStyle.paddingRight) || 0);
        const padY = (parseFloat(sceneStyle.paddingTop) || 0) + (parseFloat(sceneStyle.paddingBottom) || 0);
        const drillW = drill.getBoundingClientRect().width;
        const hudW = getComputedStyle(hud).display === 'none' ? 0 : hud.getBoundingClientRect().width;
        const nGaps = hudW ? 2 : 1;
        const widthLimit = scene.clientWidth - drillW - hudW - gap*nGaps - padX - 26;
        const heightLimit = scene.clientHeight - padY - 32;
        const size = Math.floor(Math.min(widthLimit, heightLimit));
        if (size >= 70) disc.style.width = `${size}px`;
        // The SVG drill tip is at x=10 in its 230-unit viewBox. Measure the
        // untransformed layout positions (offsetLeft) so a held strike cannot
        // feed back into the next resize calculation.
        const contactX = disc.offsetLeft + disc.offsetWidth - 3;
        const restingTipX = drill.offsetLeft + drill.offsetWidth * (10 / 230);
        const strikeDistance = Math.max(0, restingTipX - contactX);
        drill.style.setProperty('--drill-contact', `${-strikeDistance}px`);
        spark.style.left = `${contactX}px`;
        spark.style.top = `${drill.offsetTop + drill.offsetHeight * .5}px`;

        const mainBox = main.getBoundingClientRect();
        const cardBox = hudCard.getBoundingClientRect();
        if (hudW >= 170 && size >= 250) {
            // Winner card REPLACES the prompt card, never partially covers it.
            reveal.classList.add('reveal-side');
            reveal.style.width = `${cardBox.width}px`;
            reveal.style.height = `${cardBox.height}px`;
            reveal.style.left = `${cardBox.left - mainBox.left}px`;
            reveal.style.top = `${cardBox.top - mainBox.top + cardBox.height / 2}px`;
        } else {
            reveal.classList.remove('reveal-side');
            ['width','height','left','top'].forEach(prop => reveal.style.removeProperty(prop));
        }
    }
    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(fitWheel).observe(scene);
    } else {
        window.addEventListener('resize', fitWheel);
    }
    requestAnimationFrame(fitWheel);

    // Sound is opt-out, not autoplay: the AudioContext starts only after a click.
    let soundOn = true;
    try { soundOn = localStorage.getItem(AUDIO_STORAGE_KEY) !== 'off'; } catch (_) {}
    let audioCtx = null, master = null, noiseBuffer = null, motor = null;
    function updateSoundButton() {
        if (!btnSound) return;
        btnSound.textContent = soundOn ? t('soundOn') : t('soundOff');
        btnSound.setAttribute('aria-pressed', String(soundOn));
        btnSound.setAttribute('aria-label', soundOn ? t('soundMute') : t('soundEnable'));
        btnSound.title = soundOn ? t('soundMute') : t('soundEnable');
    }
    updateSoundButton();
    if (btnSound) btnSound.addEventListener('click', () => {
        soundOn = !soundOn;
        try { localStorage.setItem(AUDIO_STORAGE_KEY, soundOn ? 'on' : 'off'); } catch (_) {}
        updateSoundButton();
        if (audioCtx && master) {
            const t = audioCtx.currentTime;
            master.gain.cancelScheduledValues(t);
            master.gain.setTargetAtTime(soundOn ? .72 : 0, t, .015);
            if (soundOn && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        }
    });

    function prepareAudio() {
        if (!soundOn) return false;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return false;
        try {
            if (!audioCtx) {
                audioCtx = new Ctor();
                master = audioCtx.createGain();
                master.gain.value = .72;
                master.connect(audioCtx.destination);
                noiseBuffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * .13), audioCtx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            }
            // Invoked synchronously in the user click handler, for iOS Safari.
            if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            return true;
        } catch (error) {
            console.warn('Audio unavailable; wheel still works:', error);
            return false;
        }
    }

    function noise(time, duration, volume, cutoff) {
        if (!audioCtx || !master || !soundOn) return;
        const src = audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        const hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = cutoff;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(Math.max(.0001, volume), time);
        gain.gain.exponentialRampToValueAtTime(.001, time + duration);
        src.connect(hp).connect(gain).connect(master);
        src.start(time); src.stop(time + Math.min(.13, duration + .01));
    }
    function beep(freq, time, duration, volume, type = 'square', endFreq = null) {
        if (!audioCtx || !master || !soundOn) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
        gain.gain.setValueAtTime(Math.max(.0001, volume), time);
        gain.gain.exponentialRampToValueAtTime(.001, time + duration);
        osc.connect(gain).connect(master);
        osc.start(time); osc.stop(time + duration + .012);
    }
    function startMotor() {
        if (!prepareAudio()) return;
        stopMotor();
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 450;
        const gain = audioCtx.createGain();
        gain.gain.value = .001;
        const oscA = audioCtx.createOscillator();
        const oscB = audioCtx.createOscillator();
        oscA.type = 'sawtooth'; oscB.type = 'triangle';
        oscA.frequency.value = 95; oscB.frequency.value = 193;
        oscA.connect(filter); oscB.connect(filter);
        filter.connect(gain).connect(master);
        oscA.start(); oscB.start();
        motor = { gain, oscA, oscB, filter };
    }
    function updateMotor(degreesPerSecond) {
        if (!audioCtx || !motor) return;
        const now = audioCtx.currentTime;
        const power = Math.min(1, degreesPerSecond / 1600);
        motor.oscA.frequency.setTargetAtTime(68 + power * 88, now, .03);
        motor.oscB.frequency.setTargetAtTime(140 + power * 164, now, .03);
        motor.filter.frequency.setTargetAtTime(290 + power * 540, now, .05);
        motor.gain.gain.setTargetAtTime(.012 + .043 * power, now, .025);
    }
    function stopMotor() {
        if (!motor || !audioCtx) return;
        const old = motor; motor = null;
        const now = audioCtx.currentTime;
        old.gain.gain.cancelScheduledValues(now);
        old.gain.gain.setTargetAtTime(.001, now, .025);
        old.oscA.stop(now + .18);
        old.oscB.stop(now + .18);
    }
    function gearClick(speed) {
        if (!audioCtx || !soundOn) return;
        const now = audioCtx.currentTime;
        noise(now, .023, .075, 1350);
        beep(520 + Math.min(speed, 1200) * .08, now, .018, .045, 'square', 250);
    }
    function drillHit() {
        if (!audioCtx || !soundOn) return;
        const now = audioCtx.currentTime;
        noise(now, .095, .37, 350);
        beep(230, now, .15, .21, 'sawtooth', 67);
        beep(110, now + .025, .12, .12, 'triangle', 55);
    }
    function victoryChime() {
        if (!audioCtx || !soundOn) return;
        const t = audioCtx.currentTime + .05;
        [[523,.00,.10],[659,.11,.10],[784,.22,.20]].forEach(([hz,dt,len]) => {
            beep(hz, t + dt, len, .09, 'square');
        });
    }

    const normalize = degrees => ((degrees % TURN) + TURN) % TURN;
    const circlePoint = (r, a) => [300 + r * Math.cos(a * Math.PI / 180), 300 + r * Math.sin(a * Math.PI / 180)];
    function element(tag, attrs, parent = svg) {
        const el = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs || {}).forEach(([k,v]) => el.setAttribute(k, String(v)));
        parent.appendChild(el);
        return el;
    }
    function sectorPath(outer, inner, a1, a2) {
        const [x1,y1] = circlePoint(outer,a1), [x2,y2] = circlePoint(outer,a2);
        const [x3,y3] = circlePoint(inner,a2), [x4,y4] = circlePoint(inner,a1);
        const large = a2-a1 >= 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
    }
    function renderWheel(students) {
        svg.replaceChildren();
        const count = students.length;
        // Three-zone GBA-style wheel: (1) outer bezel (2) clean student name
        // track (3) dense decorative rings confined to the INNER hub.
        element('circle',{cx:300,cy:300,r:294,fill:'#06080d',stroke:'#fad25a','stroke-width':8});
        element('circle',{cx:300,cy:300,r:286,fill:'#090b10',stroke:'#171a27','stroke-width':4});
        if (!count) {
            [54,82,112,143].forEach((r,i) => element('circle',{cx:300,cy:300,r,fill:'none',stroke:i%2?'#d8af37':'#ffdc53','stroke-width':8}));
            const label = element('text',{x:300,y:496,fill:'#fdf0bd','font-size':31,'text-anchor':'middle','font-family':'VT323, monospace'});
            label.classList.add('empty-wheel-label');
            label.textContent=t('noStudents');
            return;
        }
        const step = TURN / count;
        const inner = 155, outer = 281;
        const groups = [];
        students.forEach((student,i) => {
            const a = i*step;
            const group = element('g',{'data-student-index':i});
            groups.push(group);
            if (count===1) {
                element('circle',{cx:300,cy:300,r:outer,fill:'#20242c',class:'name-sector'},group);
            } else {
                element('path',{
                    class:'name-sector', d:sectorPath(outer,inner,a-step/2,a+step/2),
                    fill:i%2===0?'#24282e':'#141a23',
                    stroke:'#c7aa4f','stroke-width':count>=28?1.2:2
                },group);
            }
            // A small end-cap outside the label zone gives a tactile cartridge feel.
            // No ring crosses through names, unlike v2.
        });
        element('circle',{cx:300,cy:300,r:283,fill:'none',stroke:'#ffe17a','stroke-width':5});
        // The center is intentionally separate from the student name annulus.
        element('circle',{cx:300,cy:300,r:153,fill:'#070a0f',stroke:'#ffe36c','stroke-width':7});
        [125,99,73,47].forEach((r,i)=>element('circle',{
            cx:300,cy:300,r,fill:'none',stroke:i%2?'#c79b35':'#ffe364',
            'stroke-width':i===1?7:9
        }));
        students.forEach((student,i) => {
            const a=i*step;
            const group=groups[i];
            const [x,y]=circlePoint(220,a);
            const flipped=normalize(a)>90 && normalize(a)<270;
            const text=element('text',{
                class:'name-label',x:0,y:0,
                transform:`translate(${x} ${y}) rotate(${a+(flipped?180:0)})`,
                'data-upright':`translate(${x} ${y}) rotate(${a})`,
                'data-was-flipped':flipped?'yes':'no',
                'data-wheel-flipped':flipped?'yes':'no',
                'data-angle':a,'data-name-x':x,'data-name-y':y,
                'text-anchor':'middle','dominant-baseline':'central',
                'font-family':'VT323, Courier New, monospace',
                'font-weight':'bold',
                'font-size':count>=38?17:count>=29?19:count>=22?22:count>=15?26:31,
                fill:'#fff3ca',stroke:'#080c12','stroke-width':count>28?2.3:3,
                'paint-order':'stroke','stroke-linejoin':'round'
            },group);
            text.textContent=student.name;
            // Long names fit within the outer label band; retain radial alignment.
            // Canvas/SVG measurement avoids crushing short names unnecessarily.
            const naturalWidth=typeof text.getComputedTextLength==='function'?text.getComputedTextLength():0;
            const maxWidth=118;
            if (naturalWidth>maxWidth) {
                text.setAttribute('textLength',String(maxWidth));
                text.setAttribute('lengthAdjust','spacingAndGlyphs');
            }
        });
        element('circle',{cx:300,cy:300,r:29,fill:'#13202d',stroke:'#fff087','stroke-width':6});
        element('circle',{cx:300,cy:300,r:11,fill:'#ffda56'});
    }

    // Keep names upright in the screen's left/right halves, even as the disk
    // rotates. Only change the SVG transform when a name crosses a half-plane:
    // no per-frame layout churn or snap-to-upright at the winning moment.
    function orientLabels(rotation) {
        svg.querySelectorAll('.name-label').forEach(label => {
            const baseAngle = Number(label.getAttribute('data-angle'));
            const onLeft = normalize(baseAngle + rotation) > 90 && normalize(baseAngle + rotation) < 270;
            const flipped = onLeft ? 'yes' : 'no';
            if (label.getAttribute('data-wheel-flipped') === flipped) return;
            const x = label.getAttribute('data-name-x');
            const y = label.getAttribute('data-name-y');
            label.setAttribute('transform', `translate(${x} ${y}) rotate(${baseAngle + (onLeft ? 180 : 0)})`);
            label.setAttribute('data-wheel-flipped', flipped);
        });
    }

    function clearAnimation() {
        token++;
        if (frameId != null) cancelAnimationFrame(frameId);
        if (hitTimer != null) clearTimeout(hitTimer);
        frameId = hitTimer = null;
        stopMotor();
        scene.classList.remove('shake');
        spark.classList.remove('spark-fire');
        drill.classList.remove('drill-fire');
        hud.classList.remove('hud-winner');
        svg.querySelectorAll('.wheel-hit').forEach(el=>el.classList.remove('wheel-hit'));
    }
    function setupWheelIdle() {
        clearAnimation();
        const cls = appData.classes[appData.currentClass];
        const eligible = cls ? cls.students.filter(s=>!s.absent&&!s.picked) : [];
        rotor.style.transform = `rotate(${angle}deg)`;
        renderWheel(eligible);
        orientLabels(angle);
        wheelPhase = 'idle';
        idleCount = eligible.length;
        winnerName = '';
        status.textContent = eligible.length ? t('ready',eligible.length) : t('roundOver');
        btnStart.textContent = t('start');
        btnPanel.disabled = false;
        reveal.classList.add('hidden');
        requestAnimationFrame(fitWheel);
    }

    function spinWheel(winner, allStudents) {
        const eligible = allStudents.filter(s=>!s.absent&&!s.picked);
        const index = eligible.indexOf(winner);
        if (index < 0) {
            console.error('Selected winner not present in eligible roster');
            btnStart.disabled = false;
            btnPanel.disabled = false;
            return;
        }
        clearAnimation();
        const thisToken = token;
        const step = TURN / eligible.length;
        const startAngle = angle;
        const destination = normalize(-index * step);
        const delta = normalize(destination - normalize(startAngle));
        const travel = 6 * TURN + delta;
        const endAngle = startAngle + travel;
        reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        const duration = reducedMotion ? 280 : 4100;
        let beganAt = null;
        let prevTime = null;
        let prevDegrees = startAngle;
        lastBoundary = Math.floor(startAngle / step);
        lastTickTime = 0;
        renderWheel(eligible);
        orientLabels(startAngle);
        rotor.style.transform = `rotate(${startAngle}deg)`;
        wheelPhase = 'spinning';
        status.textContent = t('spinning');
        btnStart.textContent = t('spinningBtn');
        btnPanel.disabled = true;
        startMotor();

        function finish() {
            frameId = null;
            angle = normalize(endAngle);
            rotor.style.transform = `rotate(${angle}deg)`;
            orientLabels(angle);
            stopMotor();
            wheelPhase = 'locked';
            status.textContent = t('locked');
            const target = svg.querySelector(`[data-student-index="${index}"]`);
            if (target) {
                target.classList.add('wheel-hit');
            }
            // CSS transitions/animations are decorative; bookkeeping remains in app.js.
            void drill.offsetWidth;
            drill.classList.add('drill-fire');
            spark.classList.add('spark-fire');
            scene.classList.add('shake');
            drillHit();
            hitTimer = setTimeout(() => {
                if (token !== thisToken) return;
                hitTimer = null;
                wheelPhase = 'winner';
                status.textContent = t('hit');
                finalizePick(winner);
                winnerName = winner.name;
                // Preserve app.js's original randomly chosen English line.
                // Reuse that same variation in Chinese: no extra random calls.
                winnerOriginalMessage = document.getElementById('reveal-message').textContent;
                winnerLine = LINES.en.winnerLines.findIndex(line => line.replace('[name]',winner.name) === winnerOriginalMessage);
                if (winnerLine < 0) winnerLine = 4;
                localizeWinner();
                hud.classList.add('hud-winner'); // hide prompt while winner takes its place
                btnStart.textContent = t('again');
                btnPanel.disabled = false;
                victoryChime();
            }, reducedMotion ? 140 : 540);
        }
        function advance(time) {
            if (token !== thisToken) return;
            if (beganAt == null) beganAt = time;
            const t = Math.min(1,(time-beganAt)/duration);
            // Cubic ease-out: starts frantic, winds down to individual audible clicks.
            const eased = 1-Math.pow(1-t,3);
            const rotation = startAngle + travel*eased;
            rotor.style.transform = `rotate(${rotation}deg)`;
            orientLabels(rotation);
            if (prevTime != null && time>prevTime) {
                const speed = (rotation-prevDegrees)/(time-prevTime)*1000;
                updateMotor(speed);
                const boundary = Math.floor(rotation/step);
                if (boundary!==lastBoundary && time-lastTickTime>Math.max(60, 1000/32)) {
                    gearClick(speed);
                    lastTickTime=time;
                }
                lastBoundary=boundary;
            }
            prevTime=time;
            prevDegrees=rotation;
            if (t<1) frameId=requestAnimationFrame(advance);
            else finish();
        }
        frameId=requestAnimationFrame(advance);
    }

    // These are the existing app's two global animation entry points.
    window.setupIdleScanner = setupWheelIdle;
    window.buildAndRunScanner = spinWheel;
    // Original app.js has already initialized at this point.
    setupWheelIdle();
    applyLanguage();
})();
