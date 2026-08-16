import { db, collection, onSnapshot } from "./firebase-config.js";

// عدد الأيام التي تجعل الملف أو الاستدعاء "طويل المدى بدون إنجاز"
const LONG_PENDING_DAYS = 21;

const filesCollection = collection(db, "case_files");

let pendingItems = [];

function daysSince(value) {
    if (!value) return 0;
    const created = typeof value === "number" ? new Date(value) : new Date(value);
    if (isNaN(created.getTime())) return 0;
    const diff = Date.now() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function renderNotifications() {
    const badge = document.getElementById("notifBadge");
    const body = document.getElementById("notifPanelBody");
    if (!body) return;

    if (pendingItems.length === 0) {
        badge && badge.classList.remove("show");
        body.innerHTML = `<div class="samoo-empty"><i class="fas fa-check-circle" style="font-size:32px;display:block;margin-bottom:10px;"></i>لا توجد ملفات أو استدعاءات متأخرة</div>`;
        return;
    }

    badge && badge.classList.add("show");

    body.innerHTML = pendingItems.map(item => `
        <div class="samoo-list-item" onclick="openNotificationItem('${item.id}')">
            <i class="fas ${item.type === "استدعاء" ? "fa-envelope-open-text" : "fa-folder-open"}"></i>
            <div>
                <div class="item-title">${item.title}</div>
                <div class="item-sub">${item.person || ""} · متأخر منذ ${item.days} يوم</div>
            </div>
        </div>
    `).join("");
}

window.openNotificationItem = (id) => {
    window.closeNotifPanel();
    if (typeof window.openFile === "function") {
        window.show("pieces");
        window.openFile(id);
    }
};

window.toggleNotifPanel = () => {
    const overlay = document.getElementById("notifOverlay");
    if (!overlay) return;
    overlay.classList.toggle("show");
};

window.closeNotifPanel = () => {
    const overlay = document.getElementById("notifOverlay");
    if (overlay) overlay.classList.remove("show");
};

onSnapshot(filesCollection, snapshot => {
    pendingItems = [];

    snapshot.forEach(docSnap => {
        const f = docSnap.data();
        const id = docSnap.id;

        if (f.archived) return;

        const days = daysSince(f.createdAt);
        if (days < LONG_PENDING_DAYS) return;

        if (f.type === "استدعاء") {
            if (f.deliveryStatus === "delivered") return;
            pendingItems.push({
                id,
                type: "استدعاء",
                title: f.callType || "استدعاء",
                person: f.person,
                days
            });
        } else {
            pendingItems.push({
                id,
                type: f.type || "ملف",
                title: f.title || f.type || "ملف",
                person: f.person,
                days
            });
        }
    });

    pendingItems.sort((a, b) => b.days - a.days);
    renderNotifications();
});
