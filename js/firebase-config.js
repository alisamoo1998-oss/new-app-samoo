import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const firebaseConfig = {
        apiKey: "AIzaSyBbj9zJK7QXwetU4wfM4DbZkurFSy_9v08",
        authDomain: "samoo-app.firebaseapp.com",
        projectId: "samoo-app",
        storageBucket: "samoo-app.firebasestorage.app",
        messagingSenderId: "474368360223",
        appId: "1:474368360223:web:eb28dace95f8e42e02ba2a"
    };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy };