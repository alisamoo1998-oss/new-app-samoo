import { db, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from "./firebase-config.js";

const maintenanceCollection = collection(db, "vehicle_maintenance");

// --- إظهار/إخفاء نموذج الإضافة ---
window.toggleMaintenanceForm = () => {
    document.getElementById("addMaintenanceSection").classList.toggle("show");
};

// --- حفظ سجل صيانة جديد ---
window.saveMaintenance = async () => {
    const date = document.getElementById("maintDate").value;
    const odometer = parseInt(document.getElementById("maintOdometer").value);
    const maintenanceType = document.getElementById("maintType").value.trim();
    const oilType = document.getElementById("maintOilType").value.trim();
    const oilQuantity = document.getElementById("maintOilQty").value.trim();
    const filterChanged = document.getElementById("maintFilter").checked;
    const nextInterval = parseInt(document.getElementById("maintInterval").value);

    if (!date || isNaN(odometer) || !maintenanceType || isNaN(nextInterval)) {
        alert("الرجاء ملء التاريخ والعداد ونوع الصيانة والفاصل القادم");
        return;
    }

    const nextOdometer = odometer + nextInterval;

    await addDoc(maintenanceCollection, {
        date,
        odometer,
        maintenanceType,
        oilType,
        oilQuantity,
        filterChanged,
        nextInterval,
        nextOdometer,
        createdAt: new Date().toISOString()
    });

    document.getElementById("maintDate").value = "";
    document.getElementById("maintOdometer").value = "";
    document.getElementById("maintType").value = "";
    document.getElementById("maintOilType").value = "";
    document.getElementById("maintOilQty").value = "";
    document.getElementById("maintFilter").checked = false;
    document.getElementById("maintInterval").value = "";
    document.getElementById("addMaintenanceSection").classList.remove("show");
};

// --- حذف سجل صيانة ---
window.deleteMaintenance = async (id) => {
    if (confirm("هل تريد حذف هذا السجل؟")) {
        await deleteDoc(doc(db, "vehicle_maintenance", id));
    }
};

// --- الاستماع للبيانات وعرضها ---
const q = query(maintenanceCollection, orderBy("date", "desc"));

onSnapshot(q, snapshot => {
    const list = document.getElementById("maintenanceList");
    list.innerHTML = "";

    if (snapshot.empty) {
        list.innerHTML = `<div class="loading"><i class="fas fa-oil-can"></i> لا توجد سجلات صيانة</div>`;
        return;
    }

    snapshot.forEach(docSnap => {
        const m = docSnap.data();
        const id = docSnap.id;

        list.innerHTML += `
            <div class="leave-item-card">
                <div class="leave-item-header">
                    <span class="leave-item-kind"><i class="fas fa-oil-can"></i> ${m.maintenanceType || ""}</span>
                    <span class="leave-item-date">${m.date || ""}</span>
                </div>
                <div class="details-grid">
                    <div><span>العداد</span><b>${m.odometer ?? "-"} كم</b></div>
                    <div><span>نوع الزيت</span><b>${m.oilType || "-"}</b></div>
                    <div><span>كمية الزيت</span><b>${m.oilQuantity || "-"}</b></div>
                    <div><span>تغيير الفلتر</span><b>${m.filterChanged ? "نعم" : "لا"}</b></div>
                    <div><span>الفاصل القادم</span><b>${m.nextInterval ?? "-"} كم</b></div>
                    <div><span>عداد الصيانة القادمة</span><b>${m.nextOdometer ?? "-"} كم</b></div>
                </div>
                <div class="leave-item-actions">
                    <button class="delete-btn" onclick="deleteMaintenance('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
});
