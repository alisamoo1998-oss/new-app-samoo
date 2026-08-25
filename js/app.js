import { LiveUpdate } from "@capawesome/capacitor-live-update";

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

// إخبار نظام Live Update أن التطبيق يعمل بشكل طبيعي
LiveUpdate.ready()
    .then((result) => {
        console.log("Samoo Live Update ready:", result);
    })
    .catch((error) => {
        console.error("Samoo Live Update ready error:", error);
    });
