import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "...",
    authDomain: "samoo-app.firebaseapp.com",
    projectId: "samoo-app",
    storageBucket: "samoo-app.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};

const app = initializeApp(firebaseConfig);

// توليد المتغيرات بالطريقتين لضمان عمل الملفات القديمة مهما كان المتغير الذي تستدعيه
const db = getFirestore(app);

// تصدير المتغيرات للملفات الأخرى
export { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy };
