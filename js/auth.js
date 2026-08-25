import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);

// =========================================================
// تثبيت حالة تسجيل الدخول محليًا بشكل دائم
// =========================================================
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("فشل تفعيل حفظ جلسة تسجيل الدخول:", error);
    });


// =========================================================
// دالة تسجيل الدخول
// =========================================================
window.login = async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");
    const loginBtn = document.getElementById("loginBtn");

    errorEl.textContent = "";

    if (!email || !password) {
        errorEl.textContent = "الرجاء إدخال البريد الإلكتروني وكلمة المرور";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "جاري الدخول...";

    try {
        // التأكد من أن Local Persistence جاهز قبل تسجيل الدخول
        await setPersistence(auth, browserLocalPersistence);

        await signInWithEmailAndPassword(auth, email, password);

        // إعادة تحميل الصفحة بعد نجاح الدخول
        location.reload();

    } catch (err) {
        console.error("Login error:", err);

        errorEl.textContent = "البريد الإلكتروني أو كلمة المرور غير صحيحة";

        loginBtn.disabled = false;
        loginBtn.textContent = "دخول";
    }
};


// =========================================================
// دالة تسجيل الخروج
// =========================================================
window.logout = async () => {
    if (confirm("هل تريد تسجيل الخروج؟")) {

        try {
            await signOut(auth);
            location.reload();

        } catch (error) {
            console.error("Logout error:", error);
        }
    }
};


// =========================================================
// مراقبة حالة تسجيل الدخول عند فتح الصفحة
// =========================================================
onAuthStateChanged(auth, (user) => {

    const loginScreen = document.getElementById("loginScreen");
    const appContent = document.getElementById("appContent");

    if (user) {

        loginScreen.style.display = "none";
        appContent.style.display = "block";

    } else {

        loginScreen.style.display = "flex";
        appContent.style.display = "none";

    }
});
