/* =========================================================
   SAMOO - تنسيق موحّد لعرض التواريخ (DD/MM/YYYY)
   ---------------------------------------------------------
   للعرض فقط. لا يغيّر أي قيمة مخزّنة في Firebase أو
   LocalStorage أو المتغيرات الداخلية (تبقى YYYY-MM-DD كما هي).
   الاستعمال:  fmtDate(value)  أو  window.fmtDate(value)
========================================================= */

function pad2(n) {
    return String(n).padStart(2, "0");
}

/**
 * يحوّل أي قيمة تاريخ إلى نص للعرض بصيغة DD/MM/YYYY.
 * يقبل: "YYYY-MM-DD" ، ISO ، Date ، رقم (timestamp) ، Firestore Timestamp.
 * إذا لم يمكن التعرف على القيمة تُعاد كما هي (بدون كسر أي شيء).
 */
export function fmtDate(value) {
    if (value === null || value === undefined || value === "") return "";

    // Firestore Timestamp
    if (typeof value === "object" && typeof value.toDate === "function") {
        const d = value.toDate();
        return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    if (value instanceof Date) {
        if (isNaN(value.getTime())) return "";
        return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`;
    }

    if (typeof value === "number") {
        const d = new Date(value);
        if (isNaN(d.getTime())) return "";
        return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    const str = String(value).trim();
    if (!str) return "";

    // مسبقاً بصيغة DD/MM/YYYY
    let m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return str;

    // YYYY-MM-DD أو ISO كامل
    m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;

    // DD-MM-YYYY
    m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) return `${m[1]}/${m[2]}/${m[3]}`;

    // YYYY/MM/DD
    m = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    return str;
}

/** عرض الشهر بصيغة MM/YYYY انطلاقاً من "YYYY-MM" */
export function fmtMonth(value) {
    if (!value) return "";
    const m = String(value).match(/^(\d{4})-(\d{2})/);
    return m ? `${m[2]}/${m[1]}` : String(value);
}

// إتاحة الدالة عالمياً لأي كود غير مُستورَد (inline / onclick)
window.fmtDate = fmtDate;
window.fmtMonth = fmtMonth;
