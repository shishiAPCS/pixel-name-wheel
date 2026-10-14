/* ========================================== */
/* STATE MANAGEMENT & LOCAL STORAGE           */
/* ========================================== */

// Default data structure
let appData = {
    classes: {},
    currentClass: null
};

const STORAGE_KEY = 'pixelPickerData';
const ITEM_HEIGHT = 96; // Must match CSS .scanner-item height

// Reveal text variations
const REVEAL_LINES = [
    "A WILD [name] APPEARED!",
    "MISSION ASSIGNED TO: [name]",
    "TODAY'S BRAVE SOUL: [name]",
    "THE CLASSROOM ORACLE CHOSE: [name]",
    "THE PIXEL GODS SELECTED: [name]",
    "INITIATING PROTOCOL: [name]"
];

// Load data from localStorage or initialize defaults
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse local data.", e);
        }
    }
    
    if (Object.keys(appData.classes).length === 0) {
        createDemoClass();
    }
    
    if (!appData.currentClass || !appData.classes[appData.currentClass]) {
        appData.currentClass = Object.keys(appData.classes)[0];
    }

    normalizeAllClasses();
    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function createDemoClass() {
    const demoStudents = ["Eric", "Sword", "Joe", "Zao", "August", "Richard", "Isaiah", "Mike", "Kevin Jin", "Meredith"];
    const students = demoStudents.map(name => ({
        name: name,
        absent: false,
        picked: false,
        pickedCount: 0
    }));

    appData.classes["Demo Class"] = {
        students: students,
        pickedHistory: []
    };
    appData.currentClass = "Demo Class";
    saveData();
}

/* ========================================== */
/* DOM CACHING                                */
/* ========================================== */
const viewClassroom = document.getElementById('classroom-view');
const viewTeacher = document.getElementById('teacher-panel');

// Classroom elements
const titleEl = document.getElementById('class-title');
const statRemaining = document.getElementById('stat-remaining');
const statPicked = document.getElementById('stat-picked');
const scannerList = document.getElementById('scanner-list');
const revealArea = document.getElementById('reveal-area');
const revealMessage = document.getElementById('reveal-message');
const revealName = document.getElementById('reveal-name');

// Buttons
const btnStart = document.getElementById('btn-start');
const btnOpenPanel = document.getElementById('btn-open-panel');
const btnClosePanel = document.getElementById('btn-close-panel');

// Teacher Panel elements
const classSelect = document.getElementById('class-select');
const rosterInput = document.getElementById('roster-input');
const attendanceList = document.getElementById('attendance-list');
const historyList = document.getElementById('history-list');

/* ========================================== */
/* INITIALIZATION & UI UPDATES                */
/* ========================================== */

function init() {
    loadData();
    updateClassroomUI();
    updateTeacherPanelUI();
    setupEventListeners();
    setupIdleScanner();
}

function updateClassroomUI() {
    if (!appData.currentClass) return;
    
    titleEl.textContent = appData.currentClass;
    const cls = appData.classes[appData.currentClass];
    
    const presentStudents = cls.students.filter(s => !s.absent);
    const pickedCount = presentStudents.filter(s => s.picked).length;
    const remainingCount = presentStudents.length - pickedCount;

    statPicked.textContent = pickedCount;
    statRemaining.textContent = remainingCount;
}

function updateTeacherPanelUI() {
    renderClassSelect();
    renderRosterInput();
    renderAttendanceList();
    renderHistoryList();
}

// Populates the empty scanner with filler text
function setupIdleScanner() {
    scannerList.style.transition = 'none';
    scannerList.style.transform = 'translateY(0px)';
    scannerList.innerHTML = `
        <div class="scanner-item">---</div>
        <div class="scanner-item">READY</div>
        <div class="scanner-item">---</div>
    `;
    revealArea.classList.add('hidden');
}

/* ========================================== */
/* EVENT LISTENERS                            */
/* ========================================== */

function setupEventListeners() {
    // Navigation
    btnOpenPanel.addEventListener('click', () => {
        viewClassroom.classList.remove('active');
        viewClassroom.classList.add('hidden');
        viewTeacher.classList.remove('hidden');
        viewTeacher.classList.add('active');
        updateTeacherPanelUI();
    });

    btnClosePanel.addEventListener('click', () => {
        viewTeacher.classList.remove('active');
        viewTeacher.classList.add('hidden');
        viewClassroom.classList.remove('hidden');
        viewClassroom.classList.add('active');
        updateClassroomUI();
        setupIdleScanner();
    });

    // Picker Start
    btnStart.addEventListener('click', handleStartPicker);

    // Class Management
    classSelect.addEventListener('change', (e) => {
        appData.currentClass = e.target.value;
        saveData();
        updateTeacherPanelUI();
    });

    document.getElementById('btn-new-class').addEventListener('click', () => {
        const name = prompt("Enter new class name:");
        if (name && !appData.classes[name]) {
            appData.classes[name] = { students: [], pickedHistory: [] };
            appData.currentClass = name;
            saveData();
            updateTeacherPanelUI();
        } else if (appData.classes[name]) {
            alert("Class already exists!");
        }
    });

    document.getElementById('btn-rename-class').addEventListener('click', () => {
        const oldName = appData.currentClass;
        const newName = prompt("Enter new name for class:", oldName);
        if (newName && newName !== oldName && !appData.classes[newName]) {
            appData.classes[newName] = appData.classes[oldName];
            delete appData.classes[oldName];
            appData.currentClass = newName;
            saveData();
            updateTeacherPanelUI();
            updateClassroomUI();
        }
    });

    document.getElementById('btn-delete-class').addEventListener('click', () => {
        if (Object.keys(appData.classes).length <= 1) {
            alert("You cannot delete the last remaining class.");
            return;
        }
        if (confirm(`Are you sure you want to delete ${appData.currentClass}?`)) {
            delete appData.classes[appData.currentClass];
            appData.currentClass = Object.keys(appData.classes)[0];
            saveData();
            updateTeacherPanelUI();
        }
    });

    // Roster Management
    document.getElementById('btn-save-roster').addEventListener('click', () => {
        const rawText = rosterInput.value;
        // Split by newline or comma, trim, remove empty
        // let names = rawText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
        // Remove duplicates
        // names = [...new Set(names)];
        let names = cleanNameList(rawText.split(/[\n,]+/));
        
        const currentStudents = appData.classes[appData.currentClass].students;
        
        // Preserve old status if exists, otherwise create new
        const newStudentList = names.map(name => {
            const existing = currentStudents.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                existing.name = name;
                return existing;
            }
            return { name: name, absent: false, picked: false, pickedCount: 0 };
        });

        appData.classes[appData.currentClass].students = newStudentList;
        saveData();
        updateTeacherPanelUI();
        alert("Roster updated successfully.");
    });

    // File Import
    document.getElementById('file-import').addEventListener('change', handleFileImport);

    // Attendance & History Actions
    document.getElementById('btn-clear-absences').addEventListener('click', () => {
        appData.classes[appData.currentClass].students.forEach(s => s.absent = false);
        saveData();
        renderAttendanceList();
    });

    document.getElementById('btn-undo-pick').addEventListener('click', () => {
        const cls = appData.classes[appData.currentClass];
        if (cls.pickedHistory.length === 0) return;
        
        const lastPick = cls.pickedHistory.pop();
        const student = cls.students.find(s => s.name === lastPick.name);
        if (student) {
            student.picked = false;
            student.pickedCount = Math.max(0, student.pickedCount - 1);
        }
        saveData();
        renderHistoryList();
        renderAttendanceList();
    });

    document.getElementById('btn-reset-picks').addEventListener('click', () => {
        if (!confirm("Are you sure you want to reset all picked statuses for this class?")) return;
        const cls = appData.classes[appData.currentClass];
        cls.students.forEach(s => s.picked = false);
        cls.pickedHistory = [];
        saveData();
        renderHistoryList();
        renderAttendanceList();
    });
}

/* ========================================== */
/* TEACHER PANEL RENDER FUNCTIONS             */
/* ========================================== */

function renderClassSelect() {
    classSelect.innerHTML = '';
    Object.keys(appData.classes).forEach(clsName => {
        const opt = document.createElement('option');
        opt.value = clsName;
        opt.textContent = clsName;
        if (clsName === appData.currentClass) opt.selected = true;
        classSelect.appendChild(opt);
    });
}

function renderRosterInput() {
    const students = appData.classes[appData.currentClass].students;
    rosterInput.value = students.map(s => s.name).join('\n');
}

function renderAttendanceList() {
    attendanceList.innerHTML = '';
    const students = appData.classes[appData.currentClass].students;
    
    students.forEach(s => {
        const div = document.createElement('div');
        div.className = 'attendance-item';
        
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !s.absent; // Checked means Present
        
        checkbox.addEventListener('change', (e) => {
            s.absent = !e.target.checked;
            saveData();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(s.name));

        const badge = document.createElement('span');
        badge.className = `status-badge ${s.picked ? 'status-picked' : 'status-unpicked'}`;
        badge.textContent = s.picked ? 'PICKED' : 'UNPICKED';

        div.appendChild(label);
        div.appendChild(badge);
        attendanceList.appendChild(div);
    });
}

function renderHistoryList() {
    historyList.innerHTML = '';
    const history = appData.classes[appData.currentClass].pickedHistory;
    
    // Show newest first
    [...history].reverse().forEach(h => {
        const li = document.createElement('li');
        const time = new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        li.textContent = `${h.name} (at ${time})`;
        historyList.appendChild(li);
    });
}

/* ========================================== */
/* IMPORT LOGIC (.txt and .json)              */
/* ========================================== */

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const content = evt.target.result;
        
        if (file.name.endsWith('.json')) {
            try {
                const parsed = JSON.parse(content);
                importJson(parsed);
                alert("JSON Imported successfully!");
            } catch (err) {
                alert("Error parsing JSON file. Check format.");
                console.error(err);
            }
        } else {
            // Treat as txt file for the current class
            rosterInput.value = content;
            document.getElementById('btn-save-roster').click();
        }
        
        // Reset file input
        e.target.value = '';
    };
    reader.readAsText(file);
}

function importJson(data) {
    // Check if multiple classes format
    if (data.classes && Array.isArray(data.classes)) {
        data.classes.forEach(c => {
            if (c.className && c.students) {
                appData.classes[c.className] = buildClassFromNames(c.students);
            }
        });
        if (data.classes.length > 0) appData.currentClass = data.classes[0].className;
    } 
    // Check if single class format
    else if (data.className && data.students) {
        appData.classes[data.className] = buildClassFromNames(data.students);
        appData.currentClass = data.className;
    } else {
        throw new Error("Invalid JSON structure");
    }
    
    saveData();
    updateTeacherPanelUI();
}

function buildClassFromNames(nameArray) {
    const names = cleanNameList(nameArray);

    return {
        students: names.map(name => ({
            name: name,
            absent: false,
            picked: false,
            pickedCount: 0
        })),
        pickedHistory: []
    };
}

/* ========================================== */
/* PICKER & ANIMATION LOGIC                   */
/* ========================================== */

function handleStartPicker() {
    btnStart.disabled = true;
    revealArea.classList.add('hidden');
    
    const cls = appData.classes[appData.currentClass];
    const eligible = cls.students.filter(s => !s.absent && !s.picked);

    if (eligible.length === 0) {
        alert("Everyone available has been picked. Reset picked students to start a new round.");
        btnStart.disabled = false;
        return;
    }

    // Pick winner randomly
    const winnerIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[winnerIndex];

    // Build the visual animation strip
    buildAndRunScanner(winner, cls.students);
}

function buildAndRunScanner(winnerObj, allStudents) {
    // Use only students who are actually eligible.
    // This prevents already-picked students from appearing in the scanner.
    const eligibleNames = allStudents
        .filter(s => !s.absent && !s.picked)
        .map(s => s.name);

    const totalSlots = 40;
    const targetSlot = 35;

    scannerList.innerHTML = '';

    scannerList.style.transition = 'none';
    scannerList.style.transform = 'translateY(0px)';

    const recentNames = [];

    for (let i = 0; i < totalSlots; i++) {
        const div = document.createElement('div');
        div.className = 'scanner-item';

        let displayName;

        if (i === targetSlot) {
            displayName = winnerObj.name;
        } else {
            const isNearFinalWinner = i === targetSlot - 1 || i === targetSlot + 1;

            displayName = pickVisualName(
                eligibleNames,
                recentNames,
                isNearFinalWinner ? winnerObj.name : null,
                isNearFinalWinner
            );
        }

        div.textContent = displayName;
        scannerList.appendChild(div);

        recentNames.push(displayName);
        if (recentNames.length > 2) {
            recentNames.shift();
        }
    }

    void scannerList.offsetWidth;

    scannerList.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';

    const offset = (targetSlot - 1) * ITEM_HEIGHT;
    scannerList.style.transform = `translateY(-${offset}px)`;

    scannerList.addEventListener('transitionend', function onEnd() {
        scannerList.removeEventListener('transitionend', onEnd);
        finalizePick(winnerObj);
    });
}

function pickVisualName(pool, recentNames, bannedName, strictMode) {
    const recentSet = new Set(
        recentNames.map(name => String(name).toLowerCase())
    );

    const bannedKey = bannedName ? String(bannedName).toLowerCase() : null;

    let candidates = pool.filter(name => {
        const key = String(name).toLowerCase();
        return !recentSet.has(key) && key !== bannedKey;
    });

    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // If there are too few remaining names, use a neutral filler.
    // This prevents the visible 3-row scanner from showing duplicate names.
    if (pool.length < 3 || strictMode) {
        return "SCANNING";
    }

    candidates = pool.filter(name => {
        const key = String(name).toLowerCase();
        return key !== bannedKey;
    });

    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    return "SCANNING";
}

function finalizePick(winnerObj) {
    const cls = appData.classes[appData.currentClass];
    
    // Update data state
    winnerObj.picked = true;
    winnerObj.pickedCount += 1;
    cls.pickedHistory.push({
        name: winnerObj.name,
        timestamp: new Date().toISOString()
    });
    
    saveData();
    updateClassroomUI();

    // Show Reveal
    const randLine = REVEAL_LINES[Math.floor(Math.random() * REVEAL_LINES.length)];
    revealMessage.textContent = randLine.replace("[name]", winnerObj.name);
    revealName.textContent = winnerObj.name;
    revealArea.classList.remove('hidden');

    btnStart.disabled = false;
    btnStart.textContent = "PICK NEXT";
}

// Start app
init();


function cleanNameList(nameArray) {
    const result = [];
    const seen = new Set();

    nameArray.forEach(name => {
        const cleaned = String(name).trim().replace(/\s+/g, " ");
        const key = cleaned.toLowerCase();

        if (cleaned && !seen.has(key)) {
            seen.add(key);
            result.push(cleaned);
        }
    });

    return result;
}


function normalizeAllClasses() {
    Object.keys(appData.classes).forEach(className => {
        const cls = appData.classes[className];
        const seen = new Set();
        const cleanedStudents = [];

        cls.students.forEach(student => {
            const cleanedName = String(student.name).trim().replace(/\s+/g, " ");
            const key = cleanedName.toLowerCase();

            if (cleanedName && !seen.has(key)) {
                seen.add(key);
                student.name = cleanedName;
                cleanedStudents.push(student);
            }
        });

        cls.students = cleanedStudents;

        if (!Array.isArray(cls.pickedHistory)) {
            cls.pickedHistory = [];
        }
    });
}