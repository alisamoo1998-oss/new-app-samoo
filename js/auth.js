import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);

// دالة تسجيل الدخول
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
        await signInWithEmailAndPassword(auth, email, password);

        // إعادة تحميل الصفحة لضمان تحميل البيانات بشكل صحيح بعد الدخول
        location.reload();
    } catch (err) {
        errorEl.textContent = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        loginBtn.disabled = false;
        loginBtn.textContent = "دخول";
    }
};

// دالة تسجيل الخروج
window.logout = async () => {
    if (confirm("هل تريد تسجيل الخروج؟")) {
        await signOut(auth);
        location.reload();
    }
};

// مراقبة حالة تسجيل الدخول عند فتح الصفحة
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
