import { fmtDate } from "./dateFormat.js";
import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from "./firebase-config.js";

const dutyCollection = collection(db, "duty_schedule");

const DUTY_ICONS = {
    "حراسة": "fa-shield-alt",
    "خفارة": "fa-user-shield",
    "راحة": "fa-bed"
};

// فئة CSS آمنة (بدون أحرف عربية) لكل نوع مناوبة، تُستخدم لتلوين حدود البطاقة
const DUTY_CSS_CLASS = {
    "حراسة": "duty-record-hirasa",
    "خفارة": "duty-record-khafara",
    "راحة": "duty-record-raha"
};

function todayString() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
}

// --- تسجيل سريع (بدون نافذة وبدون ملاحظات) ---
window.quickDuty = async (dutyType) => {
    await addDoc(dutyCollection, {
        date: todayString(),
        dutyType,
        notes: "",
        createdAt: new Date().toISOString()
    });
};

// --- إظهار/إخفاء نموذج الإدخال اليدوي ---
window.toggleDutyForm = () => {
    document.getElementById("addDutySection").classList.toggle("show");
};

// --- حفظ إدخال يدوي ---
window.saveDutyManual = async () => {
    const date = document.getElementById("dutyDate").value;
    const dutyType = document.getElementById("dutyType").value;
    const notes = document.getElementById("dutyNotes").value.trim();

    if (!date || !dutyType) {
        alert("الرجاء اختيار التاريخ والنوع");
        return;
    }

    await addDoc(dutyCollection, {
        date,
        dutyType,
        notes,
        createdAt: new Date().toISOString()
    });

    document.getElementById("dutyDate").value = "";
    document.getElementById("dutyType").value = "حراسة";
    document.getElementById("dutyNotes").value = "";
    document.getElementById("addDutySection").classList.remove("show");
};

// --- حذف سجل مناوبة ---
window.deleteDuty = async (id) => {
    if (confirm("هل تريد حذف هذا السجل؟")) {
        await deleteDoc(doc(db, "duty_schedule", id));
    }
};

// --- متوسط عدد الأيام بين تكرارات نفس النوع (بترتيب زمني تصاعدي) ---
function averageGapDays(dateList) {
    if (dateList.length < 2) return null;

    const sorted = [...dateList].sort((a, b) => new Date(a) - new Date(b));
    let totalGap = 0;

    for (let i = 1; i < sorted.length; i++) {
        totalGap += Math.floor((new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24));
    }

    return Math.round(totalGap / (sorted.length - 1));
}

// --- بناء بطاقة سجل مناوبة واحد ---
function buildDutyCard(d, id) {
    const cssClass = DUTY_CSS_CLASS[d.dutyType] || "";

    return `
        <div class="leave-item-card ${cssClass}">
            <div class="leave-item-header">
                <span class="leave-item-kind"><i class="fas ${DUTY_ICONS[d.dutyType] || "fa-user-shield"}"></i> ${d.dutyType || ""}</span>
                <span class="leave-item-date">${fmtDate(d.date)}</span>
            </div>
            ${d.notes ? `<div class="leave-item-notes">${d.notes}</div>` : ""}
            <div class="leave-item-actions">
                <button class="delete-btn" onclick="deleteDuty('${id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// --- بناء صندوق إحصائيات نهاية السنة ---
function buildYearStatsBox(yearRecords) {
    const khafaraDates = yearRecords.filter(r => r.dutyType === "خفارة").map(r => r.date);
    const hirasaDates = yearRecords.filter(r => r.dutyType === "حراسة").map(r => r.date);
    const rahaDates = yearRecords.filter(r => r.dutyType === "راحة").map(r => r.date);

    const fmtAvg = (avg) => avg === null ? "-" : `${avg} يوم`;

    return `
        <div class="year-stats-box">
            <h4><i class="fas fa-chart-bar"></i> إحصائيات السنة</h4>
            <div class="year-stats-grid">
                <div><span>عدد الخفارات</span><b>${khafaraDates.length}</b></div>
                <div><span>عدد الحراسات</span><b>${hirasaDates.length}</b></div>
                <div><span>عدد أيام الراحة</span><b>${rahaDates.length}</b></div>
                <div><span>إجمالي المناوبات</span><b>${yearRecords.length}</b></div>
                <div><span>متوسط الأيام بين كل خفارة</span><b>${fmtAvg(averageGapDays(khafaraDates))}</b></div>
                <div><span>متوسط الأيام بين كل حراسة</span><b>${fmtAvg(averageGapDays(hirasaDates))}</b></div>
                <div><span>متوسط الأيام بين كل راحة</span><b>${fmtAvg(averageGapDays(rahaDates))}</b></div>
            </div>
        </div>
    `;
}

// --- الاستماع للبيانات وعرض الأرشيف مجمّعاً حسب السنة ---
const q = query(dutyCollection, orderBy("date", "desc"));

onSnapshot(q, snapshot => {
    const archive = document.getElementById("dutyArchive");

    if (snapshot.empty) {
        archive.innerHTML = `<div class="loading"><i class="fas fa-user-shield"></i> لا توجد سجلات</div>`;
        return;
    }

    const records = [];
    snapshot.forEach(docSnap => {
        records.push({ id: docSnap.id, ...docSnap.data() });
    });

    const years = [...new Set(records.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a);

    let html = "";

    years.forEach(year => {
        const yearRecords = records.filter(r => new Date(r.date).getFullYear() === year);

        html += `
            <div class="year-group">
                <h3 class="year-group-title"><i class="fas fa-calendar"></i> سنة ${year}</h3>
                <div class="leave-list">
                    ${yearRecords.map(r => buildDutyCard(r, r.id)).join("")}
                </div>
                ${buildYearStatsBox(yearRecords)}
            </div>
        `;
    });

    archive.innerHTML = html;
});
