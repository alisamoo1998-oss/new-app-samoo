import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from './firebase-config.js';

// --- إدارة القطع الإدارية ---
    window.addPiece = async () => {
        let type = document.getElementById("typePiece").value;
        let name = document.getElementById("namePiece").value;
        let notes = document.getElementById("notesPiece").value;
        let rec = document.getElementById("dateRec").value;
        if(type) {
            await addDoc(collection(db, "pieces"), { type, name, notes, rec, archived: false });
            document.getElementById("typePiece").value = ""; 
            document.getElementById("namePiece").value = "";
            document.getElementById("notesPiece").value = "";
            document.getElementById("dateRec").value = "";
            // إخفاء قسم الإضافة بعد الإضافة
            document.getElementById('addPieceSection').classList.remove('show');
        }
    };

    window.deliverPiece = async (id) => {
        await updateDoc(doc(db, "pieces", id), { archived: true, deliverDate: new Date().toLocaleDateString('ar-EG') });
    };

    // دالة تعديل القطعة
    window.editPiece = async (id, currentType, currentName, currentNotes, currentRec) => {
        const newType = prompt('تعديل نوع القطعة:', currentType);
        if (newType === null) return;
        
        const newName = prompt('تعديل اسم القطعة:', currentName);
        if (newName === null) return;
        
        const newNotes = prompt('تعديل الملاحظات:', currentNotes);
        if (newNotes === null) return;
        
        const newRec = prompt('تعديل تاريخ الاستلام (YYYY-MM-DD):', currentRec);
        if (newRec === null) return;
        
        if (newType.trim() !== '') {
            const ref = doc(db, "pieces", id);
            await updateDoc(ref, { 
                type: newType,
                name: newName,
                notes: newNotes,
                rec: newRec
            });
        }
    };

    // دالة حذف القطعة
    window.deletePiece = async (id) => {
        if (confirm('هل أنت متأكد من حذف هذه القطعة؟')) {
            const ref = doc(db, "pieces", id);
            await deleteDoc(ref);
        }
    };

    onSnapshot(collection(db, "pieces"), (snapshot) => {
        let list = document.getElementById("pieceList");
        let arch = document.getElementById("pieceArchive");
        list.innerHTML = ""; 
        arch.innerHTML = "";
        
        snapshot.forEach(docSnap => {
            let p = docSnap.data();
            let id = docSnap.id;
            let card = `<div class="card">
                <div class="card-actions" style="position:absolute; top:10px; left:10px; display:flex; gap:5px;">
                    <button class="edit-btn" onclick="editPiece('${id}', '${p.type}', '${p.name}', '${p.notes}', '${p.rec}')">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="delete-btn" onclick="deletePiece('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-content" style="margin-left:50px;">
                    <b>${p.type}</b><br>${p.name}<br><small>${p.notes}</small><br>استلام: ${p.rec}
                    ${!p.archived ? `<br><button class="addBtn" style="margin-top:10px;" onclick="deliverPiece('${id}')">تم التسليم</button>` : `<br><small>تم التسليم في: ${p.deliverDate}</small>`}
                </div>
            </div>`;
            p.archived ? arch.innerHTML += card : list.innerHTML += card;
        });
    });