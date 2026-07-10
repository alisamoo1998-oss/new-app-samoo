import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"; // استيراد الـ Realtime Database

const firebaseConfig = {
    apiKey: "AIzaSyBbj9zJK7QXwetU4wfM4DbZkurFSy_9v08",
    authDomain: "samoo-app.firebaseapp.com",
    databaseURL: "https://samoo-app-default-rtdb.firebaseio.com", 
    projectId: "samoo-app",
    storageBucket: "samoo-app.appspot.com",
    messagingSenderId: "474368360223",
    appId: "1:474368360223:web:eb28dace95f8e42e02b2a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const database = getDatabase(app); // تعريف قاعدة البيانات الفورية

export { db, database, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy };
