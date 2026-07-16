import {db,collection,addDoc,onSnapshot,doc,updateDoc,deleteDoc,query,orderBy,where ,getDocs} from "./firebase-config.js";

const filesCollection=collection(db,"case_files"),actionsCollection=collection(db,"file_actions");
let currentFileId=null;
let unsubscribeActions = null;
let editingFileId = null;
let allFiles = [];
const fileTypesCollection = collection(db,"file_types");
function loadFileTypes(){   
    const select=document.getElementById("fileType");

    onSnapshot(fileTypesCollection,snapshot=>{

        select.innerHTML=`
            <option value="">اختر النوع</option>
        `;

        snapshot.forEach(docSnap=>{

            const t=docSnap.data();

            select.innerHTML+=`
                <option value="${t.name}">
                    ${t.name}
                </option>
            `;

        });

        select.innerHTML+=`
            <option value="new">
                ➕ إضافة نوع جديد
            </option>
        `;

    });

}

loadFileTypes();

const typeSelect=document.getElementById("fileType");

typeSelect.addEventListener("change",()=>{

const newType=document.getElementById("newFileType");

if(typeSelect.value==="new"){

newType.style.display="block";
newType.focus();

}else{

newType.style.display="none";
newType.value="";

}

});
onSnapshot(filesCollection,snapshot=>{

    let open=0;
    let archived=0;
    const types={};

    snapshot.forEach(docSnap=>{

        const file=docSnap.data();

        if(file.archived)
            archived++;
        else
            open++;

        types[file.type]=(types[file.type]||0)+1;

    });

    document.getElementById("statsOpenFiles").textContent=open;
    document.getElementById("statsArchivedFiles").textContent=archived;
    document.getElementById("statsTotalFiles").textContent=open+archived;

    const table=document.getElementById("statsTypes");
    table.innerHTML="";

    Object.keys(types).sort().forEach(type=>{

        table.innerHTML+=`
        <tr>
            <td>${type}</td>
            <td>${types[type]}</td>
        </tr>`;

    });

});

window.toggleFileForm=()=>{

const form=document.getElementById("addFileSection");

form.style.display=
form.style.display==="block"
?"none"
:"block";

};

window.toggleActionDone = async (id,current,title)=>{

    await updateDoc(
        doc(db,"file_actions",id),
        {
            done:!current,
            doneDate:!current
                ? new Date().toLocaleDateString("ar-DZ")
                : null
        }
    );

    if(!current){

        await updateDoc(
            doc(db,"case_files",currentFileId),
            {
                lastAction:title
            }
        );

    }

};

window.saveFile=async()=>{
     let number=document.getElementById("fileNumber").value.trim(),
      person=document.getElementById("filePerson").value.trim(),
      title=document.getElementById("fileTitle").value.trim(),
      type=document.getElementById("fileType").value,
      newType=document.getElementById("newFileType").value.trim(),
      receivedDate=document.getElementById("receivedDate").value,
      receivedFrom=document.getElementById("receivedFrom").value.trim(),
      notes=document.getElementById("fileNotes").value.trim();
      
     if(type==="new"){
      
    type=newType.trim();

    if(type===""){

        alert("اكتب اسم النوع");

        return;

    }

    let exists=false;

    const select=document.getElementById("fileType");

    [...select.options].forEach(o=>{

        if(o.value===type)
            exists=true;

    });

    if(!exists){

     await addDoc(fileTypesCollection,{
        name:type
     });
     const select=document.getElementById("fileType");

      select.innerHTML+=`<option value="${type}">${type}</option>`;

     select.value=type;

     document.getElementById("newFileType").style.display="none";

     document.getElementById("newFileType").value="";


     }
     
}

const data={
      number,
       person,
      title,
      type,
      receivedDate,
      receivedFrom,
      notes
     }; 

      if(editingFileId){

    await updateDoc(
        doc(db,"case_files",editingFileId),
        data
    );

       }else{

     await addDoc(filesCollection,{
        ...data,
        status:"قيد المتابعة",
        lastAction:"لا يوجد",
        archived:false,
        archiveDate:"",
        createdAt:Date.now()
     });

       };
       ["fileNumber","filePerson","fileTitle","fileType","newFileType","receivedDate","receivedFrom","fileNotes"].forEach(id=>document.getElementById(id).value="");
      document.getElementById("newFileType").style.display="none";
      document.getElementById("addFileSection").classList.remove("show");
      editingFileId=null;

      document.querySelector("#addFileSection .addBtn").innerHTML=
       '<i class="fas fa-save"></i> إضافة';};

      const q=query(filesCollection,orderBy("createdAt","desc"));
    onSnapshot(q,snapshot=>{
  const list=document.getElementById("filesList"),archive=document.getElementById("filesArchive");
   allFiles = [];
   list.innerHTML = "";
   archive.innerHTML = "";  let openCount=0,archiveCount=0;
  snapshot.forEach(docSnap=>{
    const file=docSnap.data(),id=docSnap.id;allFiles.push({
    id,
    ...file
   });
   const card=`
<div class="file-card">

<div class="file-head">
<div class="file-title">${file.title}</div>
<span class="file-status ${file.archived?"status-closed":"status-open"}">${file.status}</span>
</div>

<div class="file-person">
<i class="fas fa-user"></i>
${file.person}
</div>

<div class="file-info">

<div class="file-item">
<span>رقم الملف</span>
<b>${file.number}</b>
</div>

<div class="file-item">
<span>التصنيف</span>
<b>${file.type}</b>
</div>

<div class="file-item">
<span>تاريخ الاستلام</span>
<b>${file.receivedDate||"-"}</b>
</div>

<div class="file-item">
<span>استلمته من</span>
<b>${file.receivedFrom||"-"}</b>
</div>

</div>

<div class="file-last-action">
<b>آخر إجراء</b><br>
${file.lastAction}
</div>

<div class="file-buttons">
<button class="btn-open" onclick="openFile('${id}')">
<i class="fas fa-folder-open"></i>
</button>

<button class="btn-edit" onclick="editFile('${id}')">
<i class="fas fa-pen"></i>
</button>

${file.archived?"":`
<button class="btn-archive" onclick="archiveFile('${id}')">
<i class="fas fa-box-archive"></i>
</button>`}

<button class="btn-delete" onclick="deleteFile('${id}')">
<i class="fas fa-trash"></i>
</button>
</div>

</div>`;
    if(file.archived){archive.innerHTML+=card;archiveCount++;}else{list.innerHTML+=card;openCount++;}
    });
  document.getElementById("openFilesCount").textContent=openCount;
  document.getElementById("archiveFilesCount").textContent=archiveCount;
  if(openCount===0)list.innerHTML=`<div class="loading"><i class="fas fa-folder-open"></i>لا توجد ملفات</div>`;
  if(archiveCount===0)archive.innerHTML=`<div class="loading"><i class="fas fa-box-open"></i>الأرشيف فارغ</div>`;


});

window.openFile=id=>{

currentFileId=id;

const file=allFiles.find(f=>f.id===id);

if(file){

document.getElementById("detailsTitle").innerHTML=file.title;

document.getElementById("fileInformation").innerHTML=`

<div class="details-grid">

<div><span>👤 الشخص</span><b>${file.person}</b></div>

<div><span>📂 رقم الملف</span><b>${file.number}</b></div>

<div><span>📁 التصنيف</span><b>${file.type}</b></div>

<div><span>📅 الاستلام</span><b>${file.receivedDate||"-"}</b></div>

<div><span>📨 استلمته من</span><b>${file.receivedFrom||"-"}</b></div>

<div><span>📝 الملاحظات</span><b>${file.notes||"لا توجد"}</b></div>

</div>

`;

}

show("fileDetails");

loadActions();

};
window.saveAction=async()=>{
  const title=document.getElementById("actionTitle").value.trim();
  if(title===""){alert("اكتب عنوان الإجراء");return;}
  await addDoc(actionsCollection,{fileId:currentFileId,title,notes:document.getElementById("actionNotes").value,actionDate:document.getElementById("actionDate").value,done:false,doneDate:null,createdAt:Date.now()});
  ["actionTitle","actionNotes","actionDate"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("actionForm").classList.remove("show");
};

window.loadActions=()=>{
    if(unsubscribeActions) unsubscribeActions();
    const q=query(
        actionsCollection,
        where("fileId","==",currentFileId),
        orderBy("createdAt")
    );
    unsubscribeActions=onSnapshot(q,snapshot=>{
        const list=document.getElementById("actionsList");
        list.innerHTML="";
        let total=0;
        let done=0;

        snapshot.forEach(docSnap=>{
            const a=docSnap.data();
            total++;
            if(a.done) done++;
            list.innerHTML+=`

<div class="file-card">

<div style="display:flex;justify-content:space-between;align-items:center;">

<b>${a.done?"🟢":"🟠"} ${a.title}</b>

<div>

<button onclick="toggleActionDone('${docSnap.id}',${a.done},'${a.title.replace(/'/g,"\\'")}')">

${a.done?"✅":"⭕"}

</button>

<button onclick="editAction('${docSnap.id}')">

✏️

</button>

<button onclick="deleteAction('${docSnap.id}')">

🗑️

</button>

</div>

</div>

<div style="margin-top:8px">

${a.notes||""}

</div>

<small>

الإنشاء :

${a.actionDate||"-"}

</small>

${a.done?

`<br><small>

التنفيذ :

${a.doneDate}

</small>`

:""}

</div>

`;
        });

        const percent=
            total===0
            ?0
            :Math.round((done/total)*100);

        document.getElementById("progressBar").style.width=
            percent+"%";

        document.getElementById("progressText").innerHTML=
            `${done} / ${total} إجراءات مكتملة (${percent}%)`;
    });
};

window.editFile=id=>{

    showFilesTab("tabAdd",document.querySelectorAll(".tab-btn")[3]);

    document.getElementById("addFileSection").style.display="block";

    const file=allFiles.find(f=>f.id===id);

    if(!file)return;

    editingFileId=id;

    document.getElementById("fileNumber").value=file.number||"";

    document.getElementById("filePerson").value=file.person||"";

    document.getElementById("fileTitle").value=file.title||"";

    const select=document.getElementById("fileType");const exists=[...select.options].some(o=>o.value===file.type);if(exists){select.value=file.type;

    document.getElementById("newFileType").style.display="none";

}else{

    select.value="new";

    document.getElementById("newFileType").style.display="block";

    document.getElementById("newFileType").value=file.type;

}

    document.getElementById("receivedDate").value=file.receivedDate||"";

    document.getElementById("receivedFrom").value=file.receivedFrom||"";

    document.getElementById("fileNotes").value=file.notes||"";

    document.getElementById("addFileSection")
        .classList.add("show");

    document.querySelector("#addFileSection .addBtn").innerHTML=
    '<i class="fas fa-save"></i> حفظ التعديل';

};

window.archiveFile=async id=>{
  if(!confirm("هل تريد أرشفة هذا الملف؟"))return;
  const ref=doc(db,"case_files",id);
  await updateDoc(ref,{archived:true,status:"مؤرشف",archiveDate:new Date().toLocaleDateString("ar-DZ")});
};

window.deleteFile = async id=>{

    if(!confirm("هل تريد حذف الملف نهائياً؟"))
        return;

    const q=query(
        actionsCollection,
        where("fileId","==",id)
    );

    const snapshot=await getDocs(q);

    for(const action of snapshot.docs){

        await deleteDoc(action.ref);

    }

    await deleteDoc(
        doc(db,"case_files",id)
    );

};

window.toggleActionForm=()=>document.getElementById("actionForm").classList.toggle("show");

window.deleteAction=async id=>{
  if(confirm("حذف الإجراء؟"))await deleteDoc(doc(db,"file_actions",id));
};

window.editAction=async id=>{
    const action=prompt("عنوان الإجراء الجديد");
    if(action===null)return;
    const notes=prompt("الملاحظات الجديدة");
    if(notes===null)return;
    await updateDoc(
        doc(db,"file_actions",id),
        {
            title:action,
            notes:notes
        }

    );

};

window.filterFiles = () => {

    const search = document
        .getElementById("fileSearch")
        .value
        .toLowerCase()
        .trim();

    const list = document.getElementById("filesList");
    const archive = document.getElementById("filesArchive");

    list.innerHTML = "";
    archive.innerHTML = "";

    allFiles.forEach(file => {

        const text = (
            file.number +
            " " +
            file.person +
            " " +
            file.title +
            " " +
            file.type
        ).toLowerCase();

        if (!text.includes(search)) return;

        const card = `
<div class="file-card">

<div class="file-title">${file.title}</div>

<div class="file-person">
👤 ${file.person}
</div>

<div class="file-info">

<div class="file-item">
<b>رقم الملف</b><br>${file.number}
</div>

<div class="file-item">
<b>التصنيف</b><br>${file.type}
</div>

<div class="file-item">
<b>تاريخ الاستلام</b><br>${file.receivedDate||"-"}
</div>

<div class="file-item">
<b>استلمته من</b><br>${file.receivedFrom||"-"}
</div>

</div>

<div class="file-last-action">

<b>آخر إجراء:</b>

${file.lastAction}

</div>

<span class="file-status ${file.archived?"status-closed":"status-open"}">

${file.status}

</span>

<div class="file-buttons">

<button onclick="openFile('${file.id}')">
<i class="fas fa-folder-open"></i>
</button>

<button onclick="editFile('${file.id}')">
<i class="fas fa-pen"></i>
</button>

${file.archived?"":`
<button onclick="archiveFile('${file.id}')">
<i class="fas fa-box-archive"></i>
</button>`}

<button onclick="deleteFile('${file.id}')">
<i class="fas fa-trash"></i>
</button>

</div>

</div>
`;

        if(file.archived)
            archive.innerHTML += card;
        else
            list.innerHTML += card;

    });

};

window.showFilesTab=(id,btn)=>{
document.querySelectorAll(".filesTab").forEach(e=>e.style.display="none");
document.getElementById(id).style.display="block";
document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
};