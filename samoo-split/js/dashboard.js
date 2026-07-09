import { db, collection, onSnapshot } from "./firebase-config.js";

const dashboardMonth = document.getElementById("dashboardMonth");
const dashboardInfractions = document.getElementById("dashboardInfractions");
const dashboardMisdemeanors = document.getElementById("dashboardMisdemeanors");
const dashboardFines = document.getElementById("dashboardFines");
const dashboardSpecialPolice = document.getElementById("dashboardSpecialPolice");
const dashboardTotal = document.getElementById("dashboardTotal");

const CLASSIFICATIONS = {
    violation: ["مخالفة", "Ù…Ø®Ø§Ù„ÙØ©"],
    misdemeanor: ["جنحة", "Ø¬Ù†Ø­Ø©"],
    fine: ["غرامة", "ØºØ±Ø§Ù…Ø©"]
};

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
const currentMonthPrefix = `${currentYear}-${currentMonth}`;

if (dashboardMonth) {
    dashboardMonth.textContent = `إحصائيات الشهر الحالي: ${currentMonthPrefix}`;
}

function isCurrentMonth(date) {
    return typeof date === "string" && date.startsWith(currentMonthPrefix);
}

function hasClassification(item, type) {
    return CLASSIFICATIONS[type].includes(item.classification || "");
}

function updateDashboard(snapshot) {
    let infractions = 0;
    let misdemeanors = 0;
    let fines = 0;
    let specialPolice = 0;
    let total = 0;

    snapshot.forEach(docSnap => {
        const item = docSnap.data();

        if (!isCurrentMonth(item.date)) {
            return;
        }

        const isViolation = hasClassification(item, "violation");
        const isMisdemeanor = hasClassification(item, "misdemeanor");
        const isFine = hasClassification(item, "fine");

        total++;

        if (isViolation) infractions++;
        if (isMisdemeanor) misdemeanors++;
        if (isFine) fines++;

        // الشرطة الخاصة تحسب من المخالفات والجنح فقط.
        if ((isViolation || isMisdemeanor) && item.specialPolice === true) {
            specialPolice++;
        }
    });

    dashboardInfractions.textContent = infractions;
    dashboardMisdemeanors.textContent = misdemeanors;
    dashboardFines.textContent = fines;
    dashboardSpecialPolice.textContent = specialPolice;
    dashboardTotal.textContent = total;
}

onSnapshot(collection(db, "infractions"), updateDashboard);
