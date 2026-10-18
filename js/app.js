import "./firebase-config.js";
import "./dashboard.js";
import "./ui.js";
import "./infractions.js";
import "./pieces.js";
import "./statistics.js";
import "./leave.js";
import "./leaveArchive.js";
import "./leaveMissions.js";
import "./leaveMaintenance.js";
import "./leaveDuty.js";

const LiveUpdate = window.Capacitor?.registerPlugin?.("LiveUpdate");
const LATEST_URL = "https://alisamoo1998-oss.github.io/new-app-samoo/latest.json";

async function samooLiveUpdate() {
    if (!LiveUpdate || !window.Capacitor?.isNativePlatform?.()) return;

    // Tell Live Update that this version started correctly
    try {
        const result = await LiveUpdate.ready();
        console.log("Samoo Live Update ready:", result);
    } catch (error) {
        console.error("Samoo Live Update ready error:", error);
    }

    // Check for a newer bundle and prepare it for the next app launch
    try {
        const res = await fetch(LATEST_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return;
        const latest = await res.json();
        const current = await LiveUpdate.getCurrentBundle();
        const next = await LiveUpdate.getNextBundle();
        if (latest.bundleId === current.bundleId || latest.bundleId === next.bundleId) return;
        await LiveUpdate.downloadBundle({ bundleId: latest.bundleId, url: latest.url });
        await LiveUpdate.setNextBundle({ bundleId: latest.bundleId });
        console.log("Samoo Live Update: bundle ready for next launch", latest.bundleId);
    } catch (error) {
        console.error("Samoo Live Update check error:", error);
    }
}

samooLiveUpdate();