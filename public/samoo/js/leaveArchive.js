import { fmtDate } from "./dateFormat.js";
import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "./firebase-config.js";

const leaveEventsCollection = collection(db, "leave_events");

const EVENT_LABELS = {
    regular: "إجازة عادية",
    exceptional: "إجازة استثنائية",
    vacation: "عطلة سنوية"
};

const EVENT_ICONS = {
    regular: "fa-umbrella-beach",
    exceptional: "fa-notes-medical",
    vacation: "fa-sun"
};

let allLeaveEvents = [];
let editingLeaveEventId = null;

// --- إظهار/إخفاء نموذج الإضافة ---
window.toggleLeaveEventForm = () => {
    document.getElementById("addLeaveEventSection").classList.toggle("show");
};

// --- إظهار الحقول المناسبة حسب نوع الحدث ---
window.updateLeaveEventFields = () => {
    const type = document.getElementById("leaveEventType").value;

    document.getElementById("regularEventFields").classList.toggle("show", type === "regular");
    document.getElementById("exceptionalEventFields").classList.toggle("show", type === "exceptional");
    document.getElementById("vacationEventFields").classList.toggle("show", type === "vacation");
};

// --- الحصول على تاريخ الحدث الأساسي (لتحديد السنة) ---
function getEventPrimaryDate(event) {
    if (event.type === "regular") return event.startDate;
    if (event.type === "exceptional") return event.date;
    if (event.type === "vacation") return event.date;
    return null;
}

// --- تفريغ حقول النموذج ---
function resetLeaveEventForm() {
    ["regStartDate", "regEndDate", "regNotes",
     "excDate", "excNotes", "vacDate", "vacNotes"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("regCycle").value = "75";
    document.getElementById("excType").value = "مرض";
    document.getElementById("leaveEventType").value = "";
    window.updateLeaveEventFields();
    editingLeaveEventId = null;
    document.querySelector("#addLeaveEventSection .addBtn").innerHTML = '<i class="fas fa-save"></i> حفظ';
}

// --- حفظ حدث إجازة جديد أو تعديل حدث موجود ---
window.saveLeaveEvent = async () => {
    const type = document.getElementById("leaveEventType").value;

    if (!type) {
        alert("الرجاء اختيار نوع الحدث");
        return;
    }

    let data = { type };
    let primaryDate = "";

    if (type === "regular") {
        const startDate = document.getElementById("regStartDate").value;
        const endDate = document.getElementById("regEndDate").value;
        const cycle = document.getElementById("regCycle").value;
        const notes = document.getElementById("regNotes").value.trim();

        if (!startDate || !endDate) {
            alert("الرجاء ملء تاريخي البداية والنهاية");
            return;
        }

        data = { ...data, startDate, endDate, cycle, notes };
        primaryDate = startDate;

    } else if (type === "exceptional") {
        const date = document.getElementById("excDate").value;
        const exceptionType = document.getElementById("excType").value;
        const notes = document.getElementById("excNotes").value.trim();

        if (!date || !exceptionType) {
            alert("الرجاء ملء التاريخ والنوع");
            return;
        }

        data = { ...data, date, exceptionType, notes };
        primaryDate = date;

    } else if (type === "vacation") {
        const date = document.getElementById("vacDate").value;
        const notes = document.getElementById("vacNotes").value.trim();

        if (!date) {
            alert("الرجاء اختيار التاريخ");
            return;
        }

        data = { ...data, date, notes };
        primaryDate = date;
    }

    data.year = new Date(primaryDate).getFullYear();

    if (editingLeaveEventId) {
        await updateDoc(doc(db, "leave_events", editingLeaveEventId), data);
    } else {
        data.createdAt = new Date().toISOString();
        await addDoc(leaveEventsCollection, data);
    }

    resetLeaveEventForm();
    document.getElementById("addLeaveEventSection").classList.remove("show");
};

// --- تعديل حدث إجازة ---
window.editLeaveEvent = (id) => {
    const event = allLeaveEvents.find(e => e.id === id);
    if (!event) return;

    editingLeaveEventId = id;
    document.getElementById("leaveEventType").value = event.type;
    window.updateLeaveEventFields();

    if (event.type === "regular") {
        document.getElementById("regStartDate").value = event.startDate || "";
        document.getElementById("regEndDate").value = event.endDate || "";
        document.getElementById("regCycle").value = event.cycle || "75";
        document.getElementById("regNotes").value = event.notes || "";
    } else if (event.type === "exceptional") {
        document.getElementById("excDate").value = event.date || "";
        document.getElementById("excType").value = event.exceptionType || "مرض";
        document.getElementById("excNotes").value = event.notes || "";
    } else if (event.type === "vacation") {
        document.getElementById("vacDate").value = event.date || "";
        document.getElementById("vacNotes").value = event.notes || "";
    }

    document.querySelector("#addLeaveEventSection .addBtn").innerHTML = '<i class="fas fa-save"></i> حفظ التعديل';
    document.getElementById("addLeaveEventSection").classList.add("show");
};

// --- حذف حدث إجازة ---
window.deleteLeaveEvent = async (id) => {
    if (confirm("هل تريد حذف هذا السجل؟")) {
        await deleteDoc(doc(db, "leave_events", id));
    }
};

// --- بناء بطاقة سجل إجازة واحد (مضغوطة) ---
function buildEventCard(event) {
    let dateLine = "";

    if (event.type === "regular") {
        dateLine = `${fmtDate(event.startDate) || "-"} <i class="fas fa-arrow-left-long"></i> ${fmtDate(event.endDate) || "-"}`;
    } else {
        dateLine = fmtDate(event.date) || "-";
    }

    const tag = event.type === "exceptional" && event.exceptionType
        ? `<span class="leave-chip">${event.exceptionType}</span>`
        : (event.type === "regular" && event.cycle ? `<span class="leave-chip">${event.cycle} يوم</span>` : "");

    return `
        <div class="leave-item-card leave-card-compact leave-record-${event.type}">
            <div class="leave-compact-main">
                <div class="leave-compact-title">
                    <i class="fas ${EVENT_ICONS[event.type]}"></i>
                    <span>${EVENT_LABELS[event.type]}</span>
                    ${tag}
                </div>
                <div class="leave-compact-dates"><i class="fas fa-calendar-day"></i> ${dateLine}</div>
                ${event.notes ? `<div class="leave-compact-note"><i class="fas fa-pen-nib"></i> ${event.notes}</div>` : ""}
            </div>
            <div class="leave-compact-actions">
                <button class="edit-btn" onclick="editLeaveEvent('${event.id}')">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="deleteLeaveEvent('${event.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// --- متوسط الأيام بين تواريخ بداية الإجازات العادية ---
function averageGapBetweenRegular(regularEvents) {
    const starts = regularEvents
        .map(e => e.startDate)
        .filter(Boolean)
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

    if (starts.length < 2) return null;

    let total = 0;
    for (let i = 1; i < starts.length; i++) {
        total += Math.round((starts[i] - starts[i - 1]) / (1000 * 60 * 60 * 24));
    }
    return Math.round(total / (starts.length - 1));
}

// --- بناء صندوق إحصائيات السنة ---
function buildYearStatsBox(year, yearEvents) {
    const regularEvents = yearEvents.filter(e => e.type === "regular");
    const exceptionalEvents = yearEvents.filter(e => e.type === "exceptional");
    const vacationEvents = yearEvents.filter(e => e.type === "vacation");
    const avg = averageGapBetweenRegular(regularEvents);

    return `
        <div class="year-stats-box">
            <h4><i class="fas fa-chart-bar"></i> إحصائيات ${year}</h4>
            <div class="year-stats-grid">
                <div><span>الإجازات العادية</span><b>${regularEvents.length}</b></div>
                <div><span>الإجازات الاستثنائية</span><b>${exceptionalEvents.length}</b></div>
                <div><span>العطل</span><b>${vacationEvents.length}</b></div>
                <div><span>الإجمالي</span><b>${yearEvents.length}</b></div>
            </div>
            <div class="year-stats-avg">
                متوسط المدة بين الإجازات العادية: <b>${avg === null ? "غير متاح" : `${avg} يومًا`}</b>
            </div>
        </div>
    `;
}

// --- السنة المختارة للعرض ("all" = كل السنوات) ---
let selectedLeaveYear = "all";

window.selectLeaveYear = (year) => {
    selectedLeaveYear = year;
    renderArchiveList();
};

// --- بناء القائمة كاملة مجمّعة حسب السنة ---
function renderArchiveList() {
    const container = document.getElementById("leaveArchiveList");
    if (!container) return;

    if (allLeaveEvents.length === 0) {
        container.innerHTML = `<div class="loading"><i class="fas fa-calendar-alt"></i> لا توجد إجازات مسجلة</div>`;
        return;
    }

    const years = [...new Set(allLeaveEvents.map(e => e.year))].sort((a, b) => b - a);

    if (selectedLeaveYear !== "all" && !years.includes(Number(selectedLeaveYear))) {
        selectedLeaveYear = "all";
    }

    const filterHtml = `
        <div class="leave-year-filter">
            <button class="leave-year-btn ${selectedLeaveYear === "all" ? "active" : ""}" onclick="selectLeaveYear('all')">الكل</button>
            ${years.map(y => `<button class="leave-year-btn ${Number(selectedLeaveYear) === y ? "active" : ""}" onclick="selectLeaveYear(${y})">${y}</button>`).join("")}
        </div>
    `;

    const shownYears = selectedLeaveYear === "all" ? years : [Number(selectedLeaveYear)];

    let html = filterHtml;

    shownYears.forEach(year => {
        const yearEvents = allLeaveEvents
            .filter(e => e.year === year)
            .sort((a, b) => new Date(getEventPrimaryDate(b)) - new Date(getEventPrimaryDate(a)));

        html += `
            <div class="year-group">
                <h3 class="year-group-title"><i class="fas fa-calendar"></i> سنة ${year}</h3>
                <div class="leave-list">
                    ${yearEvents.map(buildEventCard).join("")}
                </div>
                ${buildYearStatsBox(year, yearEvents)}
            </div>
        `;
    });

    container.innerHTML = html;
}

// --- الاستماع لبيانات أحداث الإجازات ---
onSnapshot(leaveEventsCollection, snapshot => {
    allLeaveEvents = [];
    snapshot.forEach(docSnap => {
        allLeaveEvents.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderArchiveList();
});
