import { fmtDate } from "./dateFormat.js";
import { maintenanceStatus, maintenanceStatusPatch, pageRecords, escapeHtml } from "./leaveRecords.js";
import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "./firebase-config.js";

const maintenanceCollection = collection(db, "vehicle_maintenance");
let records = [];
let view = "ongoing";
let currentPage = 1;
let saving = false;
const updating = new Set();

window.toggleMaintenanceForm = () => document.getElementById("addMaintenanceSection").classList.toggle("show");
window.selectMaintenanceView = status => { view = status; currentPage = 1; renderMaintenance(); };
window.changeMaintenancePage = step => { currentPage += step; renderMaintenance(); };

window.saveMaintenance = async () => {
    if (saving) return;
    const date = document.getElementById("maintDate").value;
    const maintenanceType = document.getElementById("maintType").value.trim();
    const numberValue = id => { const value = document.getElementById(id).value; return value === "" ? null : Number(value); };
    const odometer = numberValue("maintOdometer");
    const nextInterval = numberValue("maintInterval");
    if (!date || !maintenanceType) { alert("الرجاء ملء التاريخ ونوع الصيانة"); return; }
    if ([odometer, nextInterval].some(v => v !== null && (!Number.isFinite(v) || v < 0))) { alert("العداد والفاصل يجب أن يكونا أرقامًا موجبة أو صفرًا"); return; }
    saving = true;
    const button = document.getElementById("maintSave");
    button.disabled = true;
    try {
        await addDoc(maintenanceCollection, {
            date, maintenanceType, odometer, nextInterval,
            nextOdometer: odometer !== null && nextInterval !== null ? odometer + nextInterval : null,
            partName: document.getElementById("maintPart").value.trim(),
            notes: document.getElementById("maintNotes").value.trim(),
            oilType: document.getElementById("maintOilType").value.trim(),
            oilQuantity: document.getElementById("maintOilQty").value.trim(),
            filterChanged: document.getElementById("maintFilter").checked,
            status: "ongoing", createdAt: new Date().toISOString()
        });
        ["maintDate", "maintType", "maintOdometer", "maintInterval", "maintPart", "maintNotes", "maintOilType", "maintOilQty"].forEach(id => document.getElementById(id).value = "");
        document.getElementById("maintFilter").checked = false;
        document.getElementById("maintOilDetails").open = false;
        document.getElementById("addMaintenanceSection").classList.remove("show");
        view = "ongoing"; currentPage = 1; renderMaintenance();
    } catch { alert("تعذر حفظ الصيانة، حاول مرة أخرى. لم يتم مسح الحقول."); }
    finally { saving = false; button.disabled = false; }
};

window.setMaintenanceCompleted = async (id, completed) => {
    if (updating.has(id)) return;
    updating.add(id); renderMaintenance();
    try { await updateDoc(doc(db, "vehicle_maintenance", id), maintenanceStatusPatch(completed)); }
    catch { alert("تعذر تغيير الحالة. يرجى إعادة المحاولة."); }
    finally { updating.delete(id); renderMaintenance(); }
};
window.deleteMaintenance = async id => {
    if (!confirm("هل تريد حذف هذا السجل نهائيًا؟")) return;
    try { await deleteDoc(doc(db, "vehicle_maintenance", id)); }
    catch { alert("تعذر حذف السجل، يرجى إعادة المحاولة."); }
};

function buildCard(m) {
    const completed = maintenanceStatus(m) === "completed";
    const details = [
        m.odometer != null ? `العداد: ${escapeHtml(m.odometer)} كم` : "",
        m.nextOdometer != null ? `الصيانة القادمة: ${escapeHtml(m.nextOdometer)} كم` : "",
        m.nextInterval != null ? `الفاصل: ${escapeHtml(m.nextInterval)} كم` : "",
        m.oilType ? `الزيت: ${escapeHtml(m.oilType)}` : "",
        m.oilQuantity ? `كمية الزيت: ${escapeHtml(m.oilQuantity)}` : "",
        m.filterChanged ? "تم تغيير الفلتر" : ""
    ].filter(Boolean);
    return `<article class="maintenance-record">
        <div class="record-heading"><strong><i class="fas fa-wrench"></i> ${escapeHtml(m.maintenanceType)}</strong><time dir="ltr">${fmtDate(m.date)}</time></div>
        ${m.partName ? `<div class="record-note">${escapeHtml(m.partName)}</div>` : ""}
        ${details.length ? `<div class="maintenance-meta">${details.map(d => `<span>${d}</span>`).join("")}</div>` : ""}
        ${m.notes ? `<div class="record-note">${escapeHtml(m.notes)}</div>` : ""}
        <div class="maintenance-actions"><span class="maintenance-status">${completed ? "مكتمل" : "جارٍ"}${completed && m.completedAt ? ` · ${fmtDate(m.completedAt)}` : ""}</span>
        <button class="edit-btn" title="${completed ? "إعادة إلى الجاري" : "إكمال وأرشفة"}" onclick="setMaintenanceCompleted('${escapeHtml(m.id)}', ${!completed})" ${updating.has(m.id) ? "disabled" : ""}><i class="fas ${completed ? "fa-undo" : "fa-box-archive"}"></i> ${completed ? "استعادة" : "إكمال وأرشفة"}</button>
        <button class="delete-btn" title="حذف الصيانة" aria-label="حذف الصيانة" onclick="deleteMaintenance('${escapeHtml(m.id)}')"><i class="fas fa-trash"></i></button></div>
    </article>`;
}

function renderMaintenance() {
    for (const status of ["ongoing", "completed"]) {
        const button = document.getElementById(`maintView-${status}`);
        button.classList.toggle("active", view === status);
        button.setAttribute("aria-pressed", String(view === status));
        document.getElementById(`maintCount-${status}`).textContent = records.filter(r => maintenanceStatus(r) === status).length;
    }
    const filtered = records.filter(r => maintenanceStatus(r) === view);
    const result = pageRecords(filtered, currentPage);
    currentPage = result.current;
    document.getElementById("maintenanceList").innerHTML = result.rows.map(buildCard).join("") || `<div class="loading"><i class="fas fa-${view === "completed" ? "box-archive" : "wrench"}"></i> ${view === "completed" ? "لا توجد صيانة مكتملة في الأرشيف" : "لا توجد صيانة جارية"}</div>`;
    document.getElementById("maintenancePagination").innerHTML = result.pages > 1 ? `<button class="record-action" title="السابق" aria-label="السابق" onclick="changeMaintenancePage(-1)" ${currentPage === 1 ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button><span>${currentPage} / ${result.pages}</span><button class="record-action" title="التالي" aria-label="التالي" onclick="changeMaintenancePage(1)" ${currentPage === result.pages ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>` : "";
}

onSnapshot(query(maintenanceCollection, orderBy("date", "desc")), snapshot => {
    records = snapshot.docs.map(s => ({ ...s.data(), id: s.id })); renderMaintenance();
}, () => { document.getElementById("maintenanceList").innerHTML = '<div class="loading">تعذر تحميل الصيانة، يرجى إعادة المحاولة.</div>'; });
