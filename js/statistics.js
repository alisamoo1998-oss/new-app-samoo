import { fmtDate } from "./dateFormat.js";
import { allInfractions } from "./infractions.js";

const statsClassifications = {
    misdemeanor: ["جنحة", "Ø¬Ù†Ø­Ø©"],
    violation: ["مخالفة", "Ù…Ø®Ø§Ù„ÙØ©"],
    fine: ["غرامة", "ØºØ±Ø§Ù…Ø©"]
};

function hasStatsClassification(infraction, type) {
    return statsClassifications[type].includes(infraction.classification || "");
}

window.calculateStats = () => {
    const fromDate = document.getElementById("statsFromDate").value;
    const toDate = document.getElementById("statsToDate").value;

    if (!fromDate || !toDate) {
        alert("الرجاء اختيار تاريخ البداية والنهاية");
        return;
    }

    const filteredInfractions = allInfractions.filter(inf => {
        return inf.date >= fromDate && inf.date <= toDate;
    });

    const total = filteredInfractions.length;
    const misdemeanors = filteredInfractions.filter(inf => hasStatsClassification(inf, "misdemeanor")).length;
    const violations = filteredInfractions.filter(inf => hasStatsClassification(inf, "violation")).length;
    const fines = filteredInfractions.filter(inf => hasStatsClassification(inf, "fine")).length;

    document.getElementById("totalInfractions").textContent = total;
    document.getElementById("totalMisdemeanors").textContent = misdemeanors;
    document.getElementById("totalViolations").textContent = violations;
    document.getElementById("totalFines").textContent = fines;

    const recentInfractions = filteredInfractions.slice(-10).reverse();
    const recentList = document.getElementById("recentInfractionsList");

    if (recentInfractions.length > 0) {
        recentList.innerHTML = recentInfractions.map(inf => {
            const archiveIcon = inf.archived ? ' <i class="fas fa-archive" style="color:#666; font-size:10px;"></i>' : "";
            return `
                    <div class="detail-row">
                        <span>${inf.nom || ""} - ${inf.pv || ""} ${archiveIcon}</span>
                        <span class="count">${fmtDate(inf.date)} (${inf.classification || "غير مصنف"})</span>
                    </div>
                `;
        }).join("");
    } else {
        recentList.innerHTML = '<div class="detail-row">لا توجد مخالفات في هذا النطاق</div>';
    }
};
