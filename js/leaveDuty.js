import { fmtDate } from "./dateFormat.js";
import { averageGapDays, recordYear, pageRecords, escapeHtml } from "./leaveRecords.js";
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

// --- بناء بطاقة سجل مناوبة واحد ---
function buildDutyCard(d, id) {
    const cssClass = DUTY_CSS_CLASS[d.dutyType] || "";

    return `
        <div class="record-row ${cssClass}">
            <div class="record-main">
                <div class="record-heading"><span><i class="fas ${DUTY_ICONS[d.dutyType] || "fa-user-shield"}"></i> ${escapeHtml(d.dutyType)}</span><time dir="ltr">${fmtDate(d.date)}</time></div>
                ${d.notes ? `<div class="record-note">${escapeHtml(d.notes)}</div>` : ""}
            </div>
            <button class="delete-btn record-action" title="حذف المناوبة" aria-label="حذف المناوبة" onclick="deleteDuty('${escapeHtml(id)}')"><i class="fas fa-trash"></i></button>
        </div>`;
}

// --- بناء صندوق إحصائيات نهاية السنة ---
function buildYearStatsBox(yearRecords) {
    const khafaraDates = yearRecords.filter(r => r.dutyType === "خفارة").map(r => r.date);
    const hirasaDates = yearRecords.filter(r => r.dutyType === "حراسة").map(r => r.date);
    const rahaDates = yearRecords.filter(r => r.dutyType === "راحة").map(r => r.date);

    const fmtAvg = (avg) => avg === null ? "غير متاح" : `${avg} يوم`;

    return `
        <div class="duty-summary">
            <h4><i class="fas fa-chart-bar"></i> إحصائيات ${selectedYear}</h4>
            <div class="duty-stats-grid">
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

let records = [];
let selectedYear = "";
let currentPage = 1;

window.selectDutyYear = year => { selectedYear = String(year); currentPage = 1; renderDuty(); };
window.changeDutyPage = step => { currentPage += step; renderDuty(); };

function renderDuty() {
    const years = [...new Set(records.map(r => recordYear(r.date)).filter(Boolean))].sort().reverse();
    if (!years.includes(selectedYear)) selectedYear = years[0] || "";
    document.getElementById("dutyYearFilter").innerHTML = years.map(year =>
        `<button class="leave-year-btn ${year === selectedYear ? "active" : ""}" aria-pressed="${year === selectedYear}" onclick="selectDutyYear('${year}')">${year}</button>`).join("");
    const yearRecords = records.filter(r => recordYear(r.date) === selectedYear);
    document.getElementById("dutyStats").innerHTML = selectedYear ? buildYearStatsBox(yearRecords) : '<div class="loading">لا توجد سجلات مناوبة</div>';
    const result = pageRecords(yearRecords, currentPage);
    currentPage = result.current;
    document.getElementById("dutyArchive").innerHTML = result.rows.map(r => buildDutyCard(r, r.id)).join("") || '<div class="loading">لا توجد سجلات</div>';
    document.getElementById("dutyPagination").innerHTML = result.pages > 1 ? `
        <button class="record-action" title="السابق" aria-label="السابق" onclick="changeDutyPage(-1)" ${currentPage === 1 ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>
        <span>${currentPage} / ${result.pages} · ${yearRecords.length} سجل</span>
        <button class="record-action" title="التالي" aria-label="التالي" onclick="changeDutyPage(1)" ${currentPage === result.pages ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>` : "";
}

const q = query(dutyCollection, orderBy("date", "desc"));
onSnapshot(q, snapshot => {
    records = snapshot.docs.map(s => ({ ...s.data(), id: s.id }));
    renderDuty();
}, () => {
    document.getElementById("dutyStats").innerHTML = '<div class="loading">تعذر تحميل المناوبات، يرجى إعادة المحاولة.</div>';
});
