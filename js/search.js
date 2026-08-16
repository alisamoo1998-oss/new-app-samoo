import { allInfractions } from "./infractions.js";
import { allFiles } from "./pieces.js";

function norm(v) {
    return (v || "").toString().toLowerCase();
}

function matchFile(file, term) {
    const text = [file.number, file.person, file.title, file.type, file.phone]
        .map(norm).join(" ");
    return text.includes(term);
}

function matchInfraction(inf, term) {
    const text = [inf.nom, inf.pv, inf.classification].map(norm).join(" ");
    return text.includes(term);
}

function buildFileResult(file) {
    const label = file.type === "استدعاء" ? (file.callType || "استدعاء") : (file.title || "بدون عنوان");
    return `
        <div class="samoo-search-result" onclick="goToFileResult('${file.id}')">
            <div class="res-title"><i class="fas fa-folder-open"></i> ${label}</div>
            <div class="res-sub">${file.person || ""} ${file.number ? "· رقم " + file.number : ""}</div>
        </div>
    `;
}

function buildInfractionResult(inf) {
    return `
        <div class="samoo-search-result" onclick="goToInfractionResult()">
            <div class="res-title"><i class="fas fa-exclamation-triangle"></i> ${inf.nom || ""}</div>
            <div class="res-sub">${inf.classification || ""} ${inf.pv ? "· محضر " + inf.pv : ""} ${inf.date ? "· " + inf.date : ""}</div>
        </div>
    `;
}

window.goToFileResult = (id) => {
    window.closeSearchPanel();
    window.show("pieces");
    if (typeof window.openFile === "function") window.openFile(id);
};

window.goToInfractionResult = () => {
    window.closeSearchPanel();
    window.show("infractions");
    document.querySelectorAll("#infractions .tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll("#infractions .tab-btn")[1]?.classList.add("active");
    document.querySelectorAll("#infractions .tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById("list-tab")?.classList.add("active");
};

window.runGlobalSearch = () => {
    const term = norm(document.getElementById("globalSearchInput").value.trim());
    const resultsBox = document.getElementById("globalSearchResults");

    if (!term) {
        resultsBox.innerHTML = `<div class="samoo-empty"><i class="fas fa-search" style="font-size:28px;display:block;margin-bottom:10px;"></i>اكتب كلمة أو رقم للبحث</div>`;
        return;
    }

    const fileResults = allFiles.filter(f => matchFile(f, term)).slice(0, 15);
    const infResults = allInfractions.filter(i => matchInfraction(i, term)).slice(0, 15);

    if (fileResults.length === 0 && infResults.length === 0) {
        resultsBox.innerHTML = `<div class="samoo-empty"><i class="fas fa-folder-open" style="font-size:28px;display:block;margin-bottom:10px;"></i>لا توجد نتائج</div>`;
        return;
    }

    let html = "";

    if (fileResults.length > 0) {
        html += `<div class="samoo-search-group-title"><i class="fas fa-folder-open"></i> الملفات</div>`;
        html += fileResults.map(buildFileResult).join("");
    }

    if (infResults.length > 0) {
        html += `<div class="samoo-search-group-title"><i class="fas fa-exclamation-triangle"></i> المخالفات</div>`;
        html += infResults.map(buildInfractionResult).join("");
    }

    resultsBox.innerHTML = html;
};

window.openSearchPanel = () => {
    const overlay = document.getElementById("searchOverlay");
    if (!overlay) return;
    overlay.classList.add("show");
    const input = document.getElementById("globalSearchInput");
    input.value = "";
    document.getElementById("globalSearchResults").innerHTML =
        `<div class="samoo-empty"><i class="fas fa-search" style="font-size:28px;display:block;margin-bottom:10px;"></i>اكتب كلمة أو رقم للبحث</div>`;
    setTimeout(() => input.focus(), 100);
};

window.closeSearchPanel = () => {
    const overlay = document.getElementById("searchOverlay");
    if (overlay) overlay.classList.remove("show");
};
