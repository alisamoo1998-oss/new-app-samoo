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
    ["regStartDate", "regEndDate", "regReturnDate", "regNotes",
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
        const returnDate = document.getElementById("regReturnDate").value;
        const cycle = document.getElementById("regCycle").value;
        const notes = document.getElementById("regNotes").value.trim();

        if (!startDate || !endDate || !returnDate) {
            alert("الرجاء ملء تواريخ البداية والنهاية والعودة");
            return;
        }

        data = { ...data, startDate, endDate, returnDate, cycle, notes };
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
        document.getElementById("regReturnDate").value = event.returnDate || "";
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

// --- بناء بطاقة سجل إجازة واحد ---
function buildEventCard(event) {
    let infoHtml = "";

    if (event.type === "regular") {
        infoHtml = `
            <div class="details-grid">
                <div><span>البداية</span><b>${event.startDate || "-"}</b></div>
                <div><span>النهاية</span><b>${event.endDate || "-"}</b></div>
                <div><span>العودة</span><b>${event.returnDate || "-"}</b></div>
                <div><span>الدورة</span><b>${event.cycle || "-"} يوم</b></div>
            </div>
        `;
    } else if (event.type === "exceptional") {
        infoHtml = `
            <div class="details-grid">
                <div><span>التاريخ</span><b>${event.date || "-"}</b></div>
                <div><span>النوع</span><b>${event.exceptionType || "-"}</b></div>
            </div>
        `;
    } else if (event.type === "vacation") {
        infoHtml = `
            <div class="details-grid">
                <div><span>التاريخ</span><b>${event.date || "-"}</b></div>
            </div>
        `;
    }

    return `
        <div class="leave-item-card leave-record-${event.type}">
            <div class="leave-item-header">
                <span class="leave-item-kind"><i class="fas ${EVENT_ICONS[event.type]}"></i> ${EVENT_LABELS[event.type]}</span>
            </div>
            ${infoHtml}
            ${event.notes ? `<div class="leave-item-notes">${event.notes}</div>` : ""}
            <div class="leave-item-actions">
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

// --- حساب مجموع أيام إجازة عادية (شامل تاريخي البداية والنهاية) ---
function regularEventDays(event) {
    if (!event.startDate || !event.endDate) return 0;
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
}

// --- بناء صندوق إحصائيات نهاية السنة ---
function buildYearStatsBox(yearEvents) {
    const regularEvents = yearEvents.filter(e => e.type === "regular");
    const exceptionalEvents = yearEvents.filter(e => e.type === "exceptional");
    const vacationEvents = yearEvents.filter(e => e.type === "vacation");
    const sickEvents = exceptionalEvents.filter(e => e.exceptionType === "مرض");

    const totalDays = regularEvents.reduce((sum, e) => sum + regularEventDays(e), 0)
        + exceptionalEvents.length
        + vacationEvents.length;

    return `
        <div class="year-stats-box">
            <h4><i class="fas fa-chart-bar"></i> إحصائيات السنة</h4>
            <div class="year-stats-grid">
                <div><span>عدد الإجازات</span><b>${yearEvents.length}</b></div>
                <div><span>مجموع أيام الإجازات</span><b>${totalDays}</b></div>
                <div><span>إجازات عادية</span><b>${regularEvents.length}</b></div>
                <div><span>إجازات سنوية</span><b>${vacationEvents.length}</b></div>
                <div><span>إجازات مرضية</span><b>${sickEvents.length}</b></div>
                <div><span>إجازات استثنائية</span><b>${exceptionalEvents.length}</b></div>
            </div>
        </div>
    `;
}

// --- بناء القائمة كاملة مجمّعة حسب السنة ---
function renderArchiveList() {
    const container = document.getElementById("leaveArchiveList");

    if (allLeaveEvents.length === 0) {
        container.innerHTML = `<div class="loading"><i class="fas fa-calendar-alt"></i> لا توجد إجازات مسجلة</div>`;
        return;
    }

    const years = [...new Set(allLeaveEvents.map(e => e.year))].sort((a, b) => b - a);

    let html = "";

    years.forEach(year => {
        const yearEvents = allLeaveEvents
            .filter(e => e.year === year)
            .sort((a, b) => new Date(getEventPrimaryDate(b)) - new Date(getEventPrimaryDate(a)));

        html += `
            <div class="year-group">
                <h3 class="year-group-title"><i class="fas fa-calendar"></i> سنة ${year}</h3>
                <div class="leave-list">
                    ${yearEvents.map(buildEventCard).join("")}
                </div>
                ${buildYearStatsBox(yearEvents)}
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
