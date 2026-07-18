import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from "./firebase-config.js";

const missionsCollection = collection(db, "leave_missions");

const KIND_LABELS = {
    mission: "مهمة",
    assignment: "تكليف"
};

const KIND_ICONS = {
    mission: "fa-route",
    assignment: "fa-clipboard-check"
};

// --- إظهار/إخفاء نموذج الإضافة ---
window.toggleMissionForm = () => {
    document.getElementById("addMissionSection").classList.toggle("show");
};

// --- تحديث نص الحقل حسب النوع (مهمة / تكليف) ---
window.updateMissionFields = () => {
    const kind = document.getElementById("missionKind").value;
    const titleInput = document.getElementById("missionTitle");
    titleInput.placeholder = kind === "mission" ? "اسم المهمة أو المكان" : "عنوان التكليف";
};
window.updateMissionFields();

// --- حفظ مهمة أو تكليف ---
window.saveMission = async () => {
    const kind = document.getElementById("missionKind").value;
    const date = document.getElementById("missionDate").value;
    const title = document.getElementById("missionTitle").value.trim();
    const notes = document.getElementById("missionNotes").value.trim();

    if (!date || !title) {
        alert("الرجاء ملء التاريخ والعنوان");
        return;
    }

    await addDoc(missionsCollection, {
        kind,
        date,
        title,
        notes,
        createdAt: new Date().toISOString()
    });

    document.getElementById("missionDate").value = "";
    document.getElementById("missionTitle").value = "";
    document.getElementById("missionNotes").value = "";
    document.getElementById("addMissionSection").classList.remove("show");
};

// --- حذف مهمة أو تكليف ---
window.deleteMission = async (id) => {
    if (confirm("هل تريد حذف هذا السجل؟")) {
        await deleteDoc(doc(db, "leave_missions", id));
    }
};

// --- الاستماع للبيانات وعرضها ---
const q = query(missionsCollection, orderBy("date", "desc"));

onSnapshot(q, snapshot => {
    const list = document.getElementById("missionsList");
    list.innerHTML = "";

    if (snapshot.empty) {
        list.innerHTML = `<div class="loading"><i class="fas fa-route"></i> لا توجد مهام أو تكليفات</div>`;
        return;
    }

    snapshot.forEach(docSnap => {
        const m = docSnap.data();
        const id = docSnap.id;

        list.innerHTML += `
            <div class="leave-item-card">
                <div class="leave-item-header">
                    <span class="leave-item-kind"><i class="fas ${KIND_ICONS[m.kind] || "fa-route"}"></i> ${KIND_LABELS[m.kind] || "مهمة"}</span>
                    <span class="leave-item-date">${m.date || ""}</span>
                </div>
                <div class="leave-item-title">${m.title || ""}</div>
                ${m.notes ? `<div class="leave-item-notes">${m.notes}</div>` : ""}
                <div class="leave-item-actions">
                    <button class="delete-btn" onclick="deleteMission('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
});
