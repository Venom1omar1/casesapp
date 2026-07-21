import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBBT8q9a9vJMAdT4YoIr7-C5VsmwZJL0SI",
    authDomain: "melange-of-shadows.firebaseapp.com",
    databaseURL: "https://melange-of-shadows-default-rtdb.firebaseio.com",
    projectId: "melange-of-shadows",
    storageBucket: "melange-of-shadows.firebasestorage.app",
    messagingSenderId: "520791996899",
    appId: "1:520791996899:web:d6552c970cb7c1cc4588d6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let casesData = {
    case_1: {
        id: "case_1", title: "عشاء الموت", desc: "جريمة تسميم غامضة لـ رجل أعمال في منزله بالمعادي وسط عائلته.",
        isUnlocked: true, isStarted: false,
        chapters: [
            { id: "c1_1", title: "الفصل الأول: مسرح الجريمة وبلاغ المباحث", isFree: true },
            { id: "c1_2", title: "الفصل الثاني: استجواب كريم وفريدة", isFree: true },
            { id: "c1_3", title: "الفصل الثالث: الدليل الرقمي وفك اللغز", isFree: true }
        ]
    },
    case_2: {
        id: "case_2", title: "شبكة الظل", desc: "من هو البارون؟ تتبع خيوط القاتل المجهول المحبوس في غرف القسم.",
        isUnlocked: false, isStarted: false,
        keyHash: "b909067b",
        chapters: [
            { id: "c2_1", title: "الفصل الأول: مكالمة نصف الليل الغامضة", isFree: true },
            { id: "c2_2", title: "الفصل الثاني: تفتيش شقة ومكتب البارون", isFree: false },
            { id: "c2_3", title: "الفصل الثالث: المواجهة الأخيرة واعتراف الصدمة", isFree: false }
        ]
    }
};

function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).slice(0, 8);
}

window.addEventListener('DOMContentLoaded', () => {
    loadLocalProgress();
    checkAuthStatus();
    initParticles();
});

function loadLocalProgress() {
    if (localStorage.getItem("case_2_unlocked") === "true") casesData.case_2.isUnlocked = true;
    if (localStorage.getItem("case_1_started") === "true") casesData.case_1.isStarted = true;
    if (localStorage.getItem("case_2_started") === "true") casesData.case_2.isStarted = true;
    loadSavedAvatar();
}

function checkAuthStatus() {
    let savedName = localStorage.getItem("detective_name");
    let savedID = localStorage.getItem("detective_id");
    let accountType = localStorage.getItem("account_type");

    if (savedName && savedID) {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('main-menu').classList.add('active');

        let typeBadge = accountType === "GUEST" ? "🕵️‍♂️ ضيف" : "🌐 سيرفر";
        document.getElementById('detective-badge').innerText = `المحقق: ${savedName} [${typeBadge}] | ID: ${savedID}`;
    }
}

window.showAuthForm = function (type) {
    document.getElementById('auth-main-options').style.display = 'none';
    document.querySelectorAll('.auth-sub-form').forEach(f => f.classList.remove('active-form'));
    let targetForm = document.getElementById(`form-${type}`);
    if (targetForm) targetForm.classList.add('active-form');
}

window.backToAuthMain = function () {
    document.querySelectorAll('.auth-sub-form').forEach(f => f.classList.remove('active-form'));
    document.getElementById('auth-main-options').style.display = 'flex';
}

window.loginAsGuest = function () {
    let nameInput = document.getElementById('guest-name-input').value.trim();
    if (nameInput === "") return alert("اكتب اسمك الأول يا سيادة المحقق الضيف!");
    let randomID = "Gst-" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem("detective_name", nameInput);
    localStorage.setItem("detective_id", randomID);
    localStorage.setItem("account_type", "GUEST");
    document.getElementById('detective-badge').innerText = `المحقق: ${nameInput} [🕵️‍♂️ ضيف] | ID: ${randomID}`;
    switchScreen('auth-screen', 'main-menu');
}

window.handleServerRegister = async function () {
    let fullName = document.getElementById('signup-fullname').value.trim();
    let username = document.getElementById('signup-username').value.trim().toLowerCase();
    let pass = document.getElementById('signup-pass').value.trim();
    let confirmPass = document.getElementById('signup-confirm-pass').value.trim();

    if (!fullName || !username || !pass || !confirmPass) return alert("املا كل البيانات يا فنان!");
    if (username.includes(" ")) return alert("اليوزر نيم مينفعش يكون فيه مسافات!");
    if (pass.length < 6) return alert("الباسورد لازم تكون 6 خانات على الأقل!");
    if (pass !== confirmPass) return alert("الباسورد وتأكيد الباسورد مش زي بعض!");

    try {
        let snapshot = await get(child(ref(db), `detectives/${username}`));
        if (snapshot.exists()) return alert("❌ اليوزر نيم ده محجوز لمحقق تاني!");

        let serverID = "DET-" + Math.floor(5000 + Math.random() * 4000);
        let currentProgress = {
            case_1_started: localStorage.getItem("case_1_started") || "false",
            case_2_started: localStorage.getItem("case_2_started") || "false",
            case_2_unlocked: localStorage.getItem("case_2_unlocked") || "false"
        };

        await set(ref(db, 'detectives/' + username), {
            fullName, username, password: pass, detective_id: serverID, account_type: "SERVER", progress: currentProgress
        });

        localStorage.setItem("detective_name", fullName);
        localStorage.setItem("detective_username", username);
        localStorage.setItem("detective_id", serverID);
        localStorage.setItem("account_type", "SERVER");

        document.getElementById('detective-badge').innerText = `المحقق: ${fullName} [🌐 سيرفر] | ID: ${serverID}`;
        switchScreen('auth-screen', 'main-menu');
        alert("🎉 تم إنشاء حسابك ومزامنة قضاياك بنجاح!");
    } catch (error) {
        alert("❌ خطأ من السيرفر: " + error.message);
    }
}

window.handleServerLogin = async function () {
    let username = document.getElementById('login-username').value.trim().toLowerCase();
    let pass = document.getElementById('login-pass').value.trim();
    if (!username || !pass) return alert("اكتب اسم المستخدم والباسورد بتوعك!");

    try {
        let snapshot = await get(child(ref(db), `detectives/${username}`));
        if (snapshot.exists()) {
            let userData = snapshot.val();
            if (userData.password === pass) {
                localStorage.setItem("detective_name", userData.fullName);
                localStorage.setItem("detective_username", username);
                localStorage.setItem("detective_id", userData.detective_id);
                localStorage.setItem("account_type", "SERVER");

                if (userData.progress) {
                    localStorage.setItem("case_1_started", userData.progress.case_1_started);
                    localStorage.setItem("case_2_started", userData.progress.case_2_started);
                    localStorage.setItem("case_2_unlocked", userData.progress.case_2_unlocked);
                    loadLocalProgress();
                }
                document.getElementById('detective-badge').innerText = `المحقق: ${userData.fullName} [🌐 سيرفر] | ID: ${userData.detective_id}`;
                switchScreen('auth-screen', 'main-menu');
                alert("🎯 تم فتح أرشيفك وتنزيل ملفاتك على الموبايل.");
            } else { alert("❌ كلمة المرور غلط!"); }
        } else { alert("❌ اسم المستخدم مش مسجل!"); }
    } catch (error) { alert("❌ خطأ في الدخول: " + error.message); }
}

window.openProfileScreen = function () {
    let accountType = localStorage.getItem("account_type") || "GUEST";
    let savedName = localStorage.getItem("detective_name") || "محقق مجهول";
    let savedID = localStorage.getItem("detective_id") || "0000";

    document.getElementById('display-name').innerText = savedName;
    let displayUsername = document.getElementById('display-username');

    // التحكم في ظهور زر ترقية الحساب
    let upgradeBtn = document.getElementById('btn-upgrade-guest');
    if (accountType === "GUEST") {
        displayUsername.innerText = `محقق ضيف # ${savedID.slice(-4)}`;
        if (upgradeBtn) upgradeBtn.style.display = 'flex'; // إظهار الزر للضيف
    } else {
        let serverUsername = localStorage.getItem("detective_username");
        displayUsername.innerText = serverUsername ? `@${serverUsername}` : `@${savedName.replace(/\s+/g, '_').toLowerCase()}`;
        if (upgradeBtn) upgradeBtn.style.display = 'none'; // إخفاء الزر لمستخدمي السيرفر
    }

    let profileArchiveList = document.getElementById('profile-archive-list');
    if (profileArchiveList) {
        let allCases = Object.values(casesData);
        let archiveHTML = "";
        allCases.forEach(c => {
            let caseStatus = localStorage.getItem(`case_status_${c.id}`) || (c.isUnlocked ? "ACTIVE" : "LOCKED");
            if (caseStatus === "LOCKED" && !c.isUnlocked) return;

            let statusText = "قيد التحقيق 🔎";
            let statusColor = "#ffaa00";
            let progressPercent = 0;

            if (caseStatus === "COMPLETED") {
                statusText = "محلولة 🏁"; statusColor = "#44ff44"; progressPercent = 100;
            } else {
                if (c.chapters && c.chapters.length > 0) {
                    let completedChapters = 0;
                    c.chapters.forEach(ch => {
                        if (localStorage.getItem(`${ch.id}_started`) === "true" || localStorage.getItem(`${ch.id}_completed`) === "true") completedChapters++;
                    });
                    if (completedChapters === 0 && (c.isStarted || localStorage.getItem(`${c.id}_started`) === "true")) completedChapters = 1;
                    progressPercent = Math.round((completedChapters / c.chapters.length) * 100);
                    if (progressPercent > 100) progressPercent = 100;
                }
            }

            archiveHTML += `
            <div onclick="switchScreen('profile-sync-screen', 'cases-screen'); openCaseDetails('${c.id}', 'cases-screen');" 
                 style="display: flex; flex-direction: column; gap: 6px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s;"
                 onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='${statusColor}';"
                 onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.1)';">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #eee; font-weight: bold; font-size: 0.85rem;">🔍 ${c.title}</span>
                    <span style="color: ${statusColor}; font-weight: bold; font-size: 0.75rem;">${statusText} (${progressPercent}%)</span>
                </div>
                <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, ${statusColor}, #fff); border-radius: 2px; transition: width 0.4s ease;"></div>
                </div>
            </div>`;
        });
        profileArchiveList.innerHTML = archiveHTML || `<div style="color: #888; text-align: center; padding: 10px; font-size: 0.8rem;">لم تبدأ في أي تحقيق بعد.</div>`;
    }

    if (typeof updateForensicStats === "function") updateForensicStats();
    if (typeof updateXPUI === "function") updateXPUI();
    switchScreen('main-menu', 'profile-sync-screen');
}

// تأكد من وجود دالة فتح Modal الترقية (أضفها إذا لم تكن موجودة)
window.openUpgradeModal = function () {
    // تفريغ الحقول القديمة
    document.getElementById('sync-fullname').value = '';
    document.getElementById('sync-username').value = '';
    document.getElementById('sync-pass').value = '';
    document.getElementById('sync-confirm-pass').value = '';
    window.openModal('modal-upgrade');
}

// 👁️ إظهار/إخفاء الباسورد
// 👁️ إظهار/إخفاء الباسوردين معاً (المنطق المعكوس)
window.toggleBothPasswords = function (clickedBtn) {
    const pass1 = document.getElementById('sync-pass');
    const pass2 = document.getElementById('sync-confirm-pass');

    // نحدد الحالة الحالية
    const isCurrentlyPassword = pass1.type === 'password';

    // نعكس الحالة للحقلين معاً
    const newType = isCurrentlyPassword ? 'text' : 'password';
    pass1.type = newType;
    pass2.type = newType;

    // نحدث شكل كل أزرار العين في المودال لتتطابق
    const allToggleBtns = document.querySelectorAll('.toggle-password-btn');
    allToggleBtns.forEach(btn => {
        if (isCurrentlyPassword) {
            // الباسورد أصبح ظاهراً -> نضيف كلاس active ليظهر العين المفتوحة
            btn.classList.add('active');
        } else {
            // الباسورد أصبح مخفياً -> نحذف كلاس active لتعود العين المغلقة
            btn.classList.remove('active');
        }
    });
}



window.upgradeGuestToServer = async function () {
    let fullName = document.getElementById('sync-fullname').value.trim();
    let username = document.getElementById('sync-username').value.trim().toLowerCase();
    let pass = document.getElementById('sync-pass').value.trim();
    let confirmPass = document.getElementById('sync-confirm-pass').value.trim();

    if (!fullName || !username || !pass || !confirmPass) return alert("املا البيانات كاملة يا فنان!");
    if (username.includes(" ")) return alert("اليوزر نيم مينفعش يكون فيه مسافات!");
    if (pass.length < 6) return alert("الباسورد لازم تكون 6 خانات على الأقل!");
    if (pass !== confirmPass) return alert("الباسورد وتأكيد الباسورد مش متطابقين!");

    try {
        let snapshot = await get(child(ref(db), `detectives/${username}`));
        if (snapshot.exists()) return alert("❌ اليوزر نيم ده محجوز لمحقق تاني!");

        let serverID = "DET-" + Math.floor(5000 + Math.random() * 4000);
        let currentProgress = {
            case_1_started: localStorage.getItem("case_1_started") || "false",
            case_2_started: localStorage.getItem("case_2_started") || "false",
            case_2_unlocked: localStorage.getItem("case_2_unlocked") || "false"
        };

        await set(ref(db, 'detectives/' + username), {
            fullName, username, password: pass, detective_id: serverID, account_type: "SERVER", progress: currentProgress
        });

        localStorage.setItem("detective_name", fullName);
        localStorage.setItem("detective_username", username);
        localStorage.setItem("detective_id", serverID);
        localStorage.setItem("account_type", "SERVER");

        alert("🎯 تمت المزامنة والترقية بنجاح وحفظنا قضاياك القديمة!");
        openProfileScreen();
    } catch (error) { alert("❌ خطأ في المزامنة: " + error.message); }
}

window.handleLogOut = function () {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟ تذكر أن الداتا الأوفلاين غير المربوطة بسيرفر ستضيع!")) {
        const keysToRemove = ["detective_name", "detective_id", "detective_username", "account_type", "case_1_started", "case_2_started", "case_2_unlocked", "detective_xp", "detective_level", "stats_solved_cases", "stats_total_attempts", "stats_wrong_attempts", "stats_hints_used", "detective_avatar"];
        keysToRemove.forEach(k => localStorage.removeItem(k));
        alert("تم تسجيل الخروج بنجاح 🛡️");
        window.location.reload();
    }
}

window.renderAllCases = function () {
    const container = document.getElementById('cases-slider-container');
    if (!container) return;
    container.innerHTML = "";
    Object.values(casesData).forEach(c => {
        let card = document.createElement('div');
        card.className = `case-card glass-card ${c.isUnlocked ? '' : 'locked'}`;
        card.innerHTML = `
            <h3>${c.title}</h3>
            <p>${c.desc}</p>
            <span class="badge ${c.isUnlocked ? 'open' : 'closed'}">${c.isUnlocked ? '🔓 مفتوحة' : '🔒 مغلقة (تحتاج تفعيل)'}</span>
            <button onclick="openCaseDetails('${c.id}', 'cases-screen')">معاينة الملف 🔎</button>
        `;
        container.appendChild(card);
    });
}

window.renderArchiveCases = function () {
    const container = document.getElementById('archive-slider-container');
    if (!container) return;
    container.innerHTML = "";
    let startedCases = Object.values(casesData).filter(c => c.isStarted || c.id === 'case_1');
    if (startedCases.length === 0) {
        container.innerHTML = `<p style="color: #bbb; text-align: center; width: 100%; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px;">أرشيفك فاضي.. اذهب لقسم القضايا وابدأ تحقيقاً!</p>`;
        return;
    }
    startedCases.forEach(c => {
        let card = document.createElement('div');
        card.className = "case-card glass-card";
        card.innerHTML = `
            <h3>${c.title}</h3>
            <p>${c.desc}</p>
            <button onclick="openCaseDetails('${c.id}', 'archive-screen')">متابعة التحقيق 📑</button>
        `;
        container.appendChild(card);
    });
}

window.openCaseDetails = function (caseId, fromScreen) {
    let c = casesData[caseId];
    if (!c) return;
    document.getElementById('case-details-screen').setAttribute('data-from', fromScreen);
    document.getElementById('detail-case-title').innerText = c.title;

    let chaptersContainer = document.getElementById('chapters-container');
    chaptersContainer.innerHTML = "";
    c.chapters.forEach(ch => {
        let item = document.createElement('div');
        let canPlay = c.isUnlocked || ch.isFree;
        item.className = `chapter-item ${canPlay ? '' : 'locked-chap'}`;
        item.innerHTML = `
            <span>${ch.title}</span>
            <button ${canPlay ? '' : 'disabled'}>${canPlay ? 'اذهب لمسرح الجريمة 🔍' : '🔒 مغلق'}</button>
        `;
        chaptersContainer.appendChild(item);
    });

    let activationArea = document.getElementById('activation-area');
    if (c.isUnlocked) {
        activationArea.style.display = "none";
    } else {
        activationArea.style.display = "flex";
        document.getElementById('btn-submit-key').setAttribute('data-case-id', caseId);
    }
    switchScreen(fromScreen, 'case-details-screen');
}

window.checkActivationKey = function () {
    let caseId = document.getElementById('btn-submit-key').getAttribute('data-case-id');
    let inputKey = document.getElementById('activation-key-input').value.trim();
    let c = casesData[caseId];
    if (!c) return;

    if (c.keyHash && simpleHash(inputKey) === c.keyHash) {
        c.isUnlocked = true;
        localStorage.setItem(`${caseId}_unlocked`, "true");
        alert("🎉 تم فك تشفير الملف بنجاح! الفصول كاملة متاحة الآن.");
        let fromScreen = document.getElementById('case-details-screen').getAttribute('data-from') || 'cases-screen';
        openCaseDetails(caseId, fromScreen);
        renderAllCases();
    } else {
        alert("❌ كود التفعيل غير صحيح أو منتهي الصلاحية!");
    }
}

window.backToArchive = function () {
    let fromScreen = document.getElementById('case-details-screen').getAttribute('data-from') || 'archive-screen';
    if (fromScreen === 'cases-screen') renderAllCases();
    else renderArchiveCases();
    switchScreen('case-details-screen', fromScreen);
}

window.showCasesMenu = function () { switchScreen('main-menu', 'cases-screen'); renderAllCases(); }
window.showArchiveMenu = function () { switchScreen('main-menu', 'archive-screen'); renderArchiveCases(); }
window.backToMenu = function (fromScreenId) { switchScreen(fromScreenId, 'main-menu'); }

window.switchScreen = function (fromId, toId) {
    let fromScreen = document.getElementById(fromId);
    let toScreen = document.getElementById(toId);
    if (fromScreen && toScreen) {
        fromScreen.classList.remove('active');
        fromScreen.classList.add('hidden');
        toScreen.classList.remove('hidden');
        setTimeout(() => toScreen.classList.add('active'), 10);
    }
}

window.toggleSound = function () {
    let status = localStorage.getItem("sound") === "off" ? "on" : "off";
    localStorage.setItem("sound", status);
    document.getElementById("sound-status").innerText = status === "on" ? "شغال" : "طافي";
}

window.toggleVibration = function () {
    let status = localStorage.getItem("vibrate") === "off" ? "on" : "off";
    localStorage.setItem("vibrate", status);
    document.getElementById("vibrate-status").innerText = status === "on" ? "شغال" : "طافي";
    if (status === "on" && navigator.vibrate) navigator.vibrate(200);
}

window.changeName = function () {
    let newName = prompt("اكتب اسمك الجديد يا سيادة المحقق:");
    if (newName) {
        localStorage.setItem("detective_name", newName);
        document.getElementById("display-name").innerText = newName;
        let username = localStorage.getItem("detective_username");
        if (localStorage.getItem("account_type") === "SERVER" && username) {
            set(ref(db, `detectives/${username}/fullName`), newName).catch(err => console.error("فشلت المزامنة:", err));
        }
    }
}

window.uploadAvatar = function (input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 150 * 1024) return alert("❌ الصورة ضخمة جداً! اختر صورة أصغر من 150 كيلوبايت.");
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('profile-pic').src = e.target.result;
        localStorage.setItem("detective_avatar", e.target.result);
        alert("📸 تم تحديث صورة المحقق بنجاح!");
    };
    reader.readAsDataURL(file);
}

function loadSavedAvatar() {
    const savedAvatar = localStorage.getItem("detective_avatar");
    if (savedAvatar) document.getElementById('profile-pic').src = savedAvatar;
}

window.updateXPUI = function () {
    let currentXP = parseInt(localStorage.getItem("detective_xp")) || 0;
    let currentLevel = parseInt(localStorage.getItem("detective_level")) || 1;
    let xpNeeded = 50 + (currentLevel * 50);
    let percentage = Math.min((currentXP / xpNeeded) * 100, 100);

    document.getElementById("display-level").innerText = `المستوى: ${currentLevel}`;
    document.getElementById("display-xp").innerText = `${currentXP} / ${xpNeeded} XP`;
    document.getElementById("xp-bar-fill").style.width = `${percentage}%`;

    let title = "مخبر تحت التمرين 🕵️‍♂️";
    if (currentLevel >= 2 && currentLevel < 4) title = "محقق جنائي 🔍";
    else if (currentLevel >= 4 && currentLevel < 6) title = "مفتش العاصمة 👮‍♂️";
    else if (currentLevel >= 6) title = "رئيس جهاز التحقيقات 🦅";
    document.getElementById("badge-rank").innerText = title;
}

window.rewardXP = function (amount) {
    let currentXP = parseInt(localStorage.getItem("detective_xp")) || 0;
    let currentLevel = parseInt(localStorage.getItem("detective_level")) || 1;
    currentXP += amount;
    let xpNeeded = 50 + (currentLevel * 50);
    while (currentXP >= xpNeeded) {
        currentXP -= xpNeeded;
        currentLevel++;
        xpNeeded = 50 + (currentLevel * 50);
        alert(`🎉 عاش يا محقق! ليفل أب.. المستوى الحالي: ${currentLevel}`);
    }
    localStorage.setItem("detective_xp", currentXP);
    localStorage.setItem("detective_level", currentLevel);
    updateXPUI();
}

window.updateForensicStats = function () {
    let totalAttempts = parseInt(localStorage.getItem("stats_total_attempts")) || 0;
    let wrongAttempts = parseInt(localStorage.getItem("stats_wrong_attempts")) || 0;
    let hintsUsed = parseInt(localStorage.getItem("stats_hints_used")) || 0;
    let accuracy = totalAttempts > 0 ? Math.round(((totalAttempts - wrongAttempts) / totalAttempts) * 100) : 100;

    document.getElementById("stat-accuracy").innerText = `${accuracy}%`;
    document.getElementById("stat-hints").innerText = `${hintsUsed}`;
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = -Math.random() * 0.3 - 0.1;
            this.size = Math.random() * 1.5 + 0.5;
            this.alpha = Math.random() * 0.4 + 0.1;
            this.color = Math.random() > 0.8 ? '0, 243, 255' : '255, 42, 42';
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.y < -10) { this.y = canvas.height + 10; this.x = Math.random() * canvas.width; }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
            ctx.shadowBlur = 5;
            ctx.shadowColor = `rgba(${this.color}, 0.8)`;
            ctx.fill();
        }
    }
    for (let i = 0; i < 40; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}


// ═══════════════════════════════════════════════════════════
// 🔲 MODALS & PROFILE FUNCTIONS
// ═══════════════════════════════════════════════════════════

// فتح وإغلاق الـ Modals مع ربطهم بـ window عشان الـ HTML يشوفهم
window.openModal = function (modalId) {
    let el = document.getElementById(modalId);
    if (el) el.classList.remove('hidden');
}

window.closeModal = function (modalId) {
    let el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
}

// فتح نافذة تعديل الاسم
window.openEditNameModal = function () {
    const currentName = document.getElementById('display-name').innerText;
    document.getElementById('input-new-name').value = currentName;
    document.getElementById('name-success-msg').classList.add('hidden');
    window.openModal('modal-edit-name');
}

// حفظ الاسم الجديد
window.saveNewName = function () {
    const newNameInput = document.getElementById('input-new-name').value.trim();
    if (!newNameInput) return;

    // تحديث الاسم في الواجهة و LocalStorage
    document.getElementById('display-name').innerText = newNameInput;
    localStorage.setItem("detective_name", newNameInput);

    // إظهار رسالة نجاح وإغلاق النافذة
    const toast = document.getElementById('name-success-msg');
    if (toast) toast.classList.remove('hidden');

    setTimeout(() => {
        window.closeModal('modal-edit-name');
    }, 1000);
}

// فتح نافذة الإعدادات وتحديث حالة الـ Swtiches
window.openSettingsModal = function () {
    const isSoundOn = localStorage.getItem('sound') !== 'off';
    const isVibOn = localStorage.getItem('vibrate') !== 'off';

    const soundToggle = document.getElementById('toggle-sound');
    const vibToggle = document.getElementById('toggle-vibration');

    if (soundToggle) soundToggle.checked = isSoundOn;
    if (vibToggle) vibToggle.checked = isVibOn;

    window.openModal('modal-settings');
}

// التغيير التفاعلي للصوت (تم دمجها ومنع التضارب)
window.toggleSound = function (enabled) {
    // لو الاستدعاء جاي من switch بيحمل true/false، أو من زرار بيغير الحالة
    let status;
    if (typeof enabled === 'boolean') {
        status = enabled ? "on" : "off";
    } else {
        status = localStorage.getItem("sound") === "off" ? "on" : "off";
    }

    localStorage.setItem("sound", status);

    let label = document.getElementById("sound-status");
    if (label) label.innerText = status === "on" ? "شغال" : "طافي";
}

// التغيير التفاعلي للاهتزاز (تم دمجها ومنع التضارب)
window.toggleVibration = function (enabled) {
    let status;
    if (typeof enabled === 'boolean') {
        status = enabled ? "on" : "off";
    } else {
        status = localStorage.getItem("vibrate") === "off" ? "on" : "off";
    }

    localStorage.setItem("vibrate", status);

    let label = document.getElementById("vibrate-status");
    if (label) label.innerText = status === "on" ? "شغال" : "طافي";

    if (status === "on" && navigator.vibrate) {
        navigator.vibrate(100);
    }
}