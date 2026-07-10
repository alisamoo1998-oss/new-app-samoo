import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "./firebase-config.js";

// متغير لتخزين جميع المخالفات
export let allInfractions = [];
let searchText = "";

const MISDEMEANOR = "جنحة";
const VIOLATION = "مخالفة";
const FINE = "غرامة";

function addDays(dateValue, days) {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function isOverdue(dateValue, days) {
    if (!dateValue) return false;

    const today = new Date();
    const target = new Date(dateValue);

    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24));

    return diffDays >= days;
}

function isFineExpired(item) {
    return item.classification === FINE &&
           !item.pay &&
           isOverdue(item.date, 45);
}

function isReportLate(item) {
    return (item.classification === VIOLATION ||
            item.classification === MISDEMEANOR) &&
           !item.pay &&
           isOverdue(item.date, 30);
}

function isFine(classification) {
    return classification === FINE;
}

function isSpecialPoliceAllowed(classification) {
    return classification === VIOLATION || classification === MISDEMEANOR;
}

window.updateInfractionFields = () => {
    const classification = document.getElementById("classification").value;
    const fineFields = document.getElementById("fineFields");
    const specialPoliceField = document.getElementById("specialPoliceField");
    const specialPolice = document.getElementById("specialPolice");

    fineFields.classList.toggle("show", isFine(classification));
    specialPoliceField.classList.toggle("show", isSpecialPoliceAllowed(classification));

    if (!isFine(classification)) {
        document.getElementById("fineType").value = "";
        document.getElementById("couponNumber").value = "";
    }

    if (!isSpecialPoliceAllowed(classification)) {
        specialPolice.checked = false;
    }
};

// --- إدارة المخالفات ---
window.addInfraction = async () => {
    let nom = document.getElementById("nom").value;
    let pv = document.getElementById("pv").value;
    let date = document.getElementById("date").value;
    let classification = document.getElementById("classification").value;
    let fineType = document.getElementById("fineType").value;
    let couponNumber = document.getElementById("couponNumber").value;
    let specialPolice = document.getElementById("specialPolice").checked;

    if (!nom || !pv || !date || !classification) {
        alert("الرجاء ملء جميع الحقول");
        return;
    }

    if (isFine(classification) && (!fineType || !couponNumber)) {
        alert("الرجاء ملء نوع الغرامة ورقم القسيمة");
        return;
    }

    const data = {
        nom,
        pv,
        date,
        classification,
        pay: false,
        h1: false,
        h2: false,
        archived: false,
        createdAt: new Date().toISOString()
    };

    // حقول V2.2 الجديدة، تضاف فقط دون تغيير بنية البيانات القديمة.
    if (isFine(classification)) {
        data.fineType = fineType;
        data.couponNumber = couponNumber;
        data.dueDate = addDays(date, 45);
        data.paymentStatus = "غير مسدد";
        data.specialPolice = false;
    } else {
        data.specialPolice = isSpecialPoliceAllowed(classification) ? specialPolice : false;
    }

    await addDoc(collection(db, "infractions"), data);

    document.getElementById("nom").value = "";
    document.getElementById("pv").value = "";
    document.getElementById("date").value = "";
    document.getElementById("classification").value = "";
    document.getElementById("fineType").value = "";
    document.getElementById("couponNumber").value = "";
    document.getElementById("specialPolice").checked = false;
    window.updateInfractionFields();

    document.getElementById("addInfractionSection").classList.remove("show");

    alert("تمت الإضافة بنجاح");
};

window.toggleInfStatus = async (id, field, val) => {
    const ref = doc(db, "infractions", id);
    let update = { [field]: !val };
    await updateDoc(ref, update);
};

window.editInfraction = async (id, currentNom, currentPv, currentDate, currentClassification) => {
    const newNom = prompt("تعديل اسم المخالف:", currentNom);
    if (newNom === null) return;

    const newPv = prompt("تعديل رقم المحضر:", currentPv);
    if (newPv === null) return;

    const newDate = prompt("تعديل التاريخ (YYYY-MM-DD):", currentDate);
    if (newDate === null) return;

    const newClassification = prompt("تعديل التصنيف (جنحة/مخالفة/غرامة):", currentClassification);
    if (newClassification === null) return;

    if (newNom.trim() !== "" && newPv.trim() !== "" && newDate.trim() !== "" && newClassification.trim() !== "") {
        const ref = doc(db, "infractions", id);
        await updateDoc(ref, {
            nom: newNom,
            pv: newPv,
            date: newDate,
            classification: newClassification
        });
    }
};

window.deleteInfraction = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذه المخالفة؟")) {
        const ref = doc(db, "infractions", id);
        await deleteDoc(ref);
    }
};

const q = query(collection(db, "infractions"), orderBy("date", "desc"));

onSnapshot(q, (snapshot) => {
    let list = document.getElementById("infList");
    let arch = document.getElementById("infArchive");
    let expiredFines = 0;
    let lateReports = 0;
    list.innerHTML = "";
    arch.innerHTML = "";

    allInfractions = [];

    snapshot.forEach(docSnap => { 
        let i = docSnap.data();
        let id = docSnap.id;

        i.id = id;
        allInfractions.push(i);
        if (isFineExpired(i)) {
        expiredFines++;
        }

        if (isReportLate(i)) {
        lateReports++;
}

        if (i.pay && i.h1 && i.h2 && !i.archived) {
            updateDoc(doc(db, "infractions", id), { archived: true });
}
 const alertsBox = document.getElementById("alertsBox");
const alertsContent = document.getElementById("alertsContent");

let html = "";

if (expiredFines > 0) {
    html += `
    <div class="alert-item">
        🔴 لديك ${expiredFines} غرامة متأخرة
        <button class="alert-btn" onclick="showExpiredFines()">عرض</button>
    </div>`;
}

if (lateReports > 0) {
    html += `
    <div class="alert-item">
        🟠 لديك ${lateReports} مخالفة أو جنحة غير محررة
        <button class="alert-btn" onclick="showLateReports()">عرض</button>
    </div>`;
}

if (html === "") {
    alertsBox.style.display = "none";
} else {
    alertsContent.innerHTML = html;
    alertsBox.style.display = "block";
        }

        let row = document.createElement("div");
let rowClass = `infraction-row classification-${i.classification || VIOLATION}`;

if (isFineExpired(i)) {
    rowClass += " expired-fine";
}

if (isReportLate(i)) {
    rowClass += " late-report";
}

row.className = rowClass;
        let statusButtons = "";
        if (!i.archived) {
            statusButtons = `
                    <div class="status-buttons">
                                <button class="statusBtn ${i.pay ? "green" : ""}" onclick="toggleInfStatus('${id}','pay',${i.pay})">${i.classification === FINE ? "دفع" : "تحرير"}</button>          
                                <button class="statusBtn ${i.h1 ? "green" : ""}" onclick="toggleInfStatus('${id}','h1',${i.h1})">حجز1</button>
                                <button class="statusBtn ${i.h2 ? "green" : ""}" onclick="toggleInfStatus('${id}','h2',${i.h2})">حجز2</button>
                    </div>
                `;
        } else {
            statusButtons = '<span style="color:green"><i class="fas fa-check-circle"></i> مكتمل</span>';
        }

        let classificationIcon = "";
        if (i.classification === MISDEMEANOR) classificationIcon = "🚔";
        else if (i.classification === VIOLATION) classificationIcon = "📋";
        else if (i.classification === FINE) classificationIcon = "💰";
        else classificationIcon = "📌";

        const fineDetails = i.classification === FINE ? `
                    ${i.fineType ? `<span><i class="fas fa-tag"></i> ${i.fineType}</span>` : ""}
                    ${i.couponNumber ? `<span><i class="fas fa-receipt"></i> ${i.couponNumber}</span>` : ""}
                    ${i.dueDate ? `<span><i class="fas fa-hourglass-half"></i> ${i.dueDate}</span>` : ""}
                    ${i.paymentStatus ? `<span><i class="fas fa-money-check-alt"></i> ${i.paymentStatus}</span>` : ""}
                ` : "";

        const specialPoliceBadge = i.specialPolice === true ? `
                    <span><i class="fas fa-triangle-exclamation"></i> شرطة خاصة</span>
                ` : "";

        row.innerHTML = `
                <div class="infraction-info">
                    <span><i class="fas fa-user"></i> ${i.nom || ""}</span>
                    <span><i class="fas fa-file-alt"></i> ${i.pv || ""}</span>
                    <span><i class="fas fa-calendar"></i> ${i.date || ""}</span>
                    <span class="classification-badge">${classificationIcon} ${i.classification || "غير مصنف"}</span>
                    ${fineDetails}
                    ${specialPoliceBadge}
                    ${statusButtons}
                </div>
                <div class="infraction-actions">
                    <button class="edit-btn" onclick="editInfraction('${id}', '${i.nom || ""}', '${i.pv || ""}', '${i.date || ""}', '${i.classification || ""}')">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteInfraction('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

        if (i.archived) {
            arch.appendChild(row);
        } else {
            list.appendChild(row);
        }
    });
});

window.updateInfractionFields();
let currentFilter = "all";

window.showExpiredFines = function () {
    currentFilter = "expiredFines";
    show("infractions");
    refreshInfractions();
};

window.showLateReports = function () {
    currentFilter = "lateReports";
    show("infractions");
    refreshInfractions();
};

window.showAllInfractions = function () {
    currentFilter = "all";
    refreshInfractions();
};
window.filterInfractions = function () {

    searchText = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    document.querySelectorAll(".infraction-row").forEach(row => {

        const text = row.innerText.toLowerCase();

        if (text.includes(searchText)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

};
