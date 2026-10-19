// Pure helpers: stored ISO dates remain unchanged; display formatting is separate.
export const RECORD_PAGE_SIZE = 12;

export function recordYear(date) {
    return String(date || "").match(/^(\d{4})-/)?.[1] || "";
}

export function averageGapDays(dates) {
    const days = dates.map(date => Date.parse(String(date).slice(0, 10) + "T00:00:00Z"))
        .filter(Number.isFinite).sort((a, b) => a - b);
    if (days.length < 2) return null;
    return Math.round((days[days.length - 1] - days[0]) / 86400000 / (days.length - 1));
}

export function maintenanceStatus(record) {
    return record.status === "completed" ? "completed" : "ongoing";
}

export function maintenanceStatusPatch(completed, now = new Date().toISOString()) {
    return { status: completed ? "completed" : "ongoing", completedAt: completed ? now : null };
}

export function pageRecords(records, page) {
    const pages = Math.max(1, Math.ceil(records.length / RECORD_PAGE_SIZE));
    const current = Math.max(1, Math.min(page, pages));
    return { current, pages, rows: records.slice((current - 1) * RECORD_PAGE_SIZE, current * RECORD_PAGE_SIZE) };
}

export function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}