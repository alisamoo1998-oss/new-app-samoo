import { fmtDate } from "./dateFormat.js";
import {db,collection,addDoc,onSnapshot,doc,updateDoc,deleteDoc,query,orderBy,where ,getDocs} from "./firebase-config.js";

const filesCollection=collection(db,"case_files"),actionsCollection=collection(db,"file_actions");
let currentFileId=null;
let unsubscribeActions = null;
let editingFileId = null;
export let allFiles = [];
let currentCategory = null; // التصنيف المختار حاليًا في تبويب "قيد المتابعة"
let searchTerm = "";
const fileTypesCollection = collection(db,"file_types");

const SUMMONS_TYPE = "استدعاء";

const NOT_DELIVERED_REASONS = ["لم يعثر عليه", "معلومات غير صحيحة", "رفض الاستلام", "سبب آخر"];

function loadFileTypes(){   
    const select=document.getElementById("fileType");

    onSnapshot(fileTypesCollection,snapshot=>{

        select.innerHTML=`
            <option value="">اختر النوع</option>
            <option value="${SUMMONS_TYPE}">🧾 استدعاء</option>
        `;

        snapshot.forEach(docSnap=>{

            const t=docSnap.data();

            if(t.name===SUMMONS_TYPE) return;

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

// --- إظهار/إخفاء الحقول حسب التصنيف المختار (استدعاء أم ملف عادي) ---
function updateFileFormFields(){

    const newType=document.getElementById("newFileType");
    const summonsFields=document.getElementById("summonsFields");
    const genericFields=document.getElementById("genericFileFields");

    if(typeSelect.value==="new"){
        newType.style.display="block";
        newType.focus();
    }else{
        newType.style.display="none";
        newType.value="";
    }

    const isSummons = typeSelect.value === SUMMONS_TYPE;
    summonsFields.classList.toggle("show", isSummons);
    genericFields.classList.toggle("show", !isSummons);

}

typeSelect.addEventListener("change", updateFileFormFields);

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
    const chart=document.getElementById("statsChart");
    table.innerHTML="";
    if(chart) chart.innerHTML="";

    const maxCount = Math.max(1, ...Object.values(types));
    const barColors = ["#1976d2","#43a047","#ff9800","#8e24aa","#e53935","#00897b","#3949ab"];
    let colorIdx = 0;

    Object.keys(types).sort().forEach(type=>{

        table.innerHTML+=`
        <tr>
            <td>${type}</td>
            <td>${types[type]}</td>
        </tr>`;

        if(chart){
            const pct = Math.round((types[type]/maxCount)*100);
            const color = barColors[colorIdx % barColors.length];
            colorIdx++;
            chart.innerHTML+=`
                <div class="bar-row">
                    <span class="bar-label">${type}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color};"></div></div>
                    <span class="bar-count">${types[type]}</span>
                </div>
            `;
        }

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

function clearFileForm(){
    ["fileNumber","filePerson","fileTitle","newFileType","receivedDate","receivedFrom","fileNotes","summonsPhone"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.value="";
    });
    document.getElementById("fileType").value="";
    document.getElementById("summonsCallType").value=SUMMONS_TYPE;
    updateFileFormFields();
}

window.saveFile=async()=>{
     let number=document.getElementById("fileNumber").value.trim(),
      person=document.getElementById("filePerson").value.trim(),
      type=document.getElementById("fileType").value,
      newType=document.getElementById("newFileType").value.trim(),
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

if(!person || !number){
    alert("الرجاء إدخال اسم الشخص ورقم الملف");
    return;
}

const isSummons = type === SUMMONS_TYPE;

let data;

if(isSummons){

    const callType = document.getElementById("summonsCallType").value;
    const phone = document.getElementById("summonsPhone").value.trim();

    data = {
        number,
        person,
        type,
        callType,
        phone,
        notes
    };

    if(editingFileId){

        data.lastEditedAt = new Date().toISOString();
        await updateDoc(doc(db,"case_files",editingFileId), data);

    }else{

        await addDoc(filesCollection,{
            ...data,
            deliveryStatus:"pending",
            deliveryDate:"",
            notDeliveredReason:"",
            archived:false,
            archiveDate:"",
            finishedDate:"",
            createdAt:Date.now()
        });

    }

}else{

    let title=document.getElementById("fileTitle").value.trim(),
        receivedDate=document.getElementById("receivedDate").value,
        receivedFrom=document.getElementById("receivedFrom").value.trim();

    data={
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

}

      clearFileForm();
      document.getElementById("addFileSection").classList.remove("show");
      document.getElementById("addFileSection").style.display="none";
      editingFileId=null;

      document.querySelector("#addFileSection .addBtn").innerHTML=
       '<i class="fas fa-save"></i> إضافة';};

// ===========================================
// بطاقة ملف عادي
// ===========================================
function buildGenericCard(file,id){
    return `
<div class="file-card">

<div class="file-head">
<div class="file-title">${file.title||""}</div>
<span class="file-status ${file.archived?"status-closed":"status-open"}">${file.status||""}</span>
</div>

<div class="file-person">
<i class="fas fa-user"></i>
${file.person||""}
</div>

<div class="file-info">

<div class="file-item">
<span>رقم الملف</span>
<b>${file.number||""}</b>
</div>

<div class="file-item">
<span>التصنيف</span>
<b>${file.type||""}</b>
</div>

<div class="file-item">
<span>تاريخ الاستلام</span>
<b>${fmtDate(file.receivedDate)||"-"}</b>
</div>

<div class="file-item">
<span>استلمته من</span>
<b>${file.receivedFrom||"-"}</b>
</div>

</div>

<div class="file-last-action">
<b>آخر إجراء</b><br>
${file.lastAction||""}
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
}

// ===========================================
// بطاقة الاستدعاء (شكل الورقة)
// ===========================================
function deliveryStatusBadge(file){
    if(file.archived){
        return `<span class="summons-badge summons-badge-archived"><i class="fas fa-box-archive"></i> مؤرشف</span>`;
    }
    if(file.deliveryStatus==="delivered"){
        return `<span class="summons-badge summons-badge-delivered"><i class="fas fa-circle"></i> تم التسليم</span>`;
    }
    if(file.deliveryStatus==="not_delivered"){
        return `<span class="summons-badge summons-badge-notdelivered"><i class="fas fa-circle"></i> لم يتم التسليم</span>`;
    }
    return `<span class="summons-badge summons-badge-pending"><i class="fas fa-circle"></i> قيد التسليم</span>`;
}

function buildSummonsCard(file,id){

    const isWarrant = file.callType===("استدعاء بأمر");
    const cardClass = "summons-card " + (isWarrant?"summons-warrant":"summons-normal") + (file.archived?" summons-archived":"");

    let archivedInfo = "";
    if(file.archived){
        archivedInfo = `
            <div class="summons-meta">
                <div><span>تاريخ الإضافة</span><b>${file.createdAt?fmtDate(file.createdAt):"-"}</b></div>
                ${file.deliveryDate?`<div><span>تاريخ التسليم</span><b>${fmtDate(file.deliveryDate)}</b></div>`:""}
                ${file.finishedDate?`<div><span>تاريخ الإنهاء</span><b>${fmtDate(file.finishedDate)}</b></div>`:""}
                ${(!file.deliveryStatus || file.deliveryStatus!=="delivered") && file.notDeliveredReason?`<div><span>السبب</span><b>${file.notDeliveredReason}</b></div>`:""}
            </div>
        `;
    }

    const actions = file.archived ? `
        <div class="summons-actions">
            <button class="btn-open" onclick="openFile('${id}')"><i class="fas fa-folder-open"></i></button>
        </div>
    ` : `
        <div class="summons-actions">
            <button class="btn-edit" onclick="editFile('${id}')" title="تعديل"><i class="fas fa-pen"></i></button>
            <button class="btn-open" onclick="toggleDeliveryBox('${id}')" title="التسليم"><i class="fas fa-box"></i></button>
            <button class="btn-archive" onclick="finishSummons('${id}')" title="إنهاء الاستدعاء"><i class="fas fa-flag-checkered"></i></button>
            <button class="btn-delete" onclick="deleteFile('${id}')" title="حذف"><i class="fas fa-trash"></i></button>
        </div>

        <div id="deliveryBox-${id}" class="delivery-box">
            <div class="delivery-choices">
                <button class="delivery-yes" onclick="markDelivered('${id}')"><i class="fas fa-check"></i> تم التسليم</button>
                <button class="delivery-no" onclick="showNotDeliveredReasons('${id}')"><i class="fas fa-times"></i> لم يتم التسليم</button>
            </div>
            <div id="reasonBox-${id}" class="reason-box">
                <select id="reasonSelect-${id}">
                    <option value="">بدون سبب</option>
                    ${NOT_DELIVERED_REASONS.map(r=>`<option value="${r}">${r}</option>`).join("")}
                </select>
                <button class="addBtn" onclick="markNotDelivered('${id}')"><i class="fas fa-save"></i> حفظ</button>
            </div>
        </div>
    `;

    return `
        <div class="${cardClass}">
            <div class="summons-holes"></div>
            <div class="summons-body">
                <div class="summons-top">
                    <span class="summons-kind">${file.callType||SUMMONS_TYPE}</span>
                    ${deliveryStatusBadge(file)}
                </div>
                <div class="summons-name"><i class="fas fa-user"></i> ${file.person||""}</div>
                <div class="summons-sub">
                    <span><i class="fas fa-hashtag"></i> ${file.number||"-"}</span>
                    ${file.phone?`<span><i class="fas fa-phone"></i> ${file.phone}</span>`:""}
                </div>
                ${file.notes?`<div class="summons-notes">${file.notes}</div>`:""}
                ${archivedInfo}
                ${actions}
            </div>
        </div>
    `;
}

function buildCard(file,id){
    return file.type===SUMMONS_TYPE ? buildSummonsCard(file,id) : buildGenericCard(file,id);
}

// ===========================================
// التصنيفات (قيد المتابعة)
// ===========================================
function renderCategories(openFiles){
    const box=document.getElementById("fileCategories");
    if(!box) return;

    if(openFiles.length===0){
        box.innerHTML=`<div class="loading"><i class="fas fa-folder-open"></i>لا توجد ملفات</div>`;
        return;
    }

    const counts={};
    openFiles.forEach(f=>{
        const t=f.type||"غير مصنف";
        counts[t]=(counts[t]||0)+1;
    });

    box.innerHTML = Object.keys(counts).sort().map(type=>`
        <button class="category-card" onclick="filterByCategory('${type}')">
            <span class="category-icon"><i class="fas ${type===SUMMONS_TYPE?"fa-envelope-open-text":"fa-folder"}"></i></span>
            <span class="category-name">${type}</span>
            <span class="category-count">${counts[type]}</span>
        </button>
    `).join("");
}

function renderFileList(files){
    const wrap=document.getElementById("filesListWrap");
    const list=document.getElementById("filesList");
    const categories=document.getElementById("fileCategories");

    categories.style.display="none";
    wrap.style.display="block";

    if(files.length===0){
        list.innerHTML=`<div class="loading"><i class="fas fa-folder-open"></i>لا توجد ملفات</div>`;
        return;
    }

    list.innerHTML = files.map(f=>buildCard(f,f.id)).join("");
}

function refreshOpenView(openFiles){
    if(searchTerm){
        const term=searchTerm.toLowerCase();
        const matched=openFiles.filter(f=>{
            const text=[f.number,f.person,f.title,f.type,f.phone].map(v=>(v||"").toString().toLowerCase()).join(" ");
            return text.includes(term);
        });
        renderFileList(matched);
        return;
    }

    if(currentCategory){
        renderFileList(openFiles.filter(f=>(f.type||"غير مصنف")===currentCategory));
        return;
    }

    document.getElementById("filesListWrap").style.display="none";
    document.getElementById("fileCategories").style.display="grid";
    renderCategories(openFiles);
}

window.filterByCategory=(type)=>{
    currentCategory=type;
    searchTerm="";
    const search=document.getElementById("fileSearch");
    if(search) search.value="";
    refreshOpenView(allFiles.filter(f=>!f.archived));
};

window.showAllCategories=()=>{
    currentCategory=null;
    searchTerm="";
    const search=document.getElementById("fileSearch");
    if(search) search.value="";
    refreshOpenView(allFiles.filter(f=>!f.archived));
};

const q=query(filesCollection,orderBy("createdAt","desc"));
onSnapshot(q,snapshot=>{
  const archive=document.getElementById("filesArchive");
  allFiles = [];
  archive.innerHTML = "";
  let openCount=0,archiveCount=0;

  const openFiles=[];

  snapshot.forEach(docSnap=>{
    const file=docSnap.data(),id=docSnap.id;
    const fileWithId={id,...file};
    allFiles.push(fileWithId);

    if(file.archived){
        archive.innerHTML+=buildCard(fileWithId,id);
        archiveCount++;
    }else{
        openFiles.push(fileWithId);
        openCount++;
    }
  });

  document.getElementById("openFilesCount").textContent=openCount;
  document.getElementById("archiveFilesCount").textContent=archiveCount;
  if(archiveCount===0)archive.innerHTML=`<div class="loading"><i class="fas fa-box-open"></i>الأرشيف فارغ</div>`;

  refreshOpenView(openFiles);

});

// ===========================================
// عرض تفاصيل ملف
// ===========================================
window.openFile=id=>{

currentFileId=id;

const file=allFiles.find(f=>f.id===id);

if(file){

if(file.type===SUMMONS_TYPE){

    document.getElementById("detailsTitle").innerHTML=file.callType||SUMMONS_TYPE;

    document.getElementById("fileInformation").innerHTML=`

<div class="details-grid">

<div><span>👤 الشخص</span><b>${file.person||""}</b></div>

<div><span>📂 رقم الملف</span><b>${file.number||""}</b></div>

<div><span>📞 الهاتف</span><b>${file.phone||"غير متوفر"}</b></div>

<div><span>📌 الحالة</span><b>${file.archived?"مؤرشف":(file.deliveryStatus==="delivered"?"تم التسليم":file.deliveryStatus==="not_delivered"?"لم يتم التسليم":"قيد التسليم")}</b></div>

<div><span>📅 تاريخ الإضافة</span><b>${file.createdAt?fmtDate(file.createdAt):"-"}</b></div>

<div><span>📝 الملاحظات</span><b>${file.notes||"لا توجد"}</b></div>

</div>

`;

    document.querySelector("#fileDetails .add-main-btn").style.display="none";
    document.getElementById("actionForm").style.display="none";
    document.querySelector("#fileDetails .progress-box").style.display="none";
    document.querySelector("#fileDetails h3").style.display="none";
    document.getElementById("actionsList").innerHTML="";

}else{

    document.querySelector("#fileDetails .add-main-btn").style.display="";
    document.getElementById("actionForm").style.display="";
    document.querySelector("#fileDetails .progress-box").style.display="";
    document.querySelector("#fileDetails h3").style.display="";

    document.getElementById("detailsTitle").innerHTML=file.title;

    document.getElementById("fileInformation").innerHTML=`

<div class="details-grid">

<div><span>👤 الشخص</span><b>${file.person}</b></div>

<div><span>📂 رقم الملف</span><b>${file.number}</b></div>

<div><span>📁 التصنيف</span><b>${file.type}</b></div>

<div><span>📅 الاستلام</span><b>${fmtDate(file.receivedDate)||"-"}</b></div>

<div><span>📨 استلمته من</span><b>${file.receivedFrom||"-"}</b></div>

<div><span>📝 الملاحظات</span><b>${file.notes||"لا توجد"}</b></div>

</div>

`;

    loadActions();

}

}

show("fileDetails");

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

${fmtDate(a.actionDate)||"-"}

</small>

${a.done?

`<br><small>

التنفيذ :

${fmtDate(a.doneDate)}

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

    const select=document.getElementById("fileType");const exists=[...select.options].some(o=>o.value===file.type);if(exists){select.value=file.type;

    document.getElementById("newFileType").style.display="none";

}else{

    select.value="new";

    document.getElementById("newFileType").style.display="block";

    document.getElementById("newFileType").value=file.type;

}

    updateFileFormFields();

    if(file.type===SUMMONS_TYPE){

        document.getElementById("summonsCallType").value=file.callType||SUMMONS_TYPE;
        document.getElementById("summonsPhone").value=file.phone||"";

    }else{

        document.getElementById("fileTitle").value=file.title||"";
        document.getElementById("receivedDate").value=file.receivedDate||"";
        document.getElementById("receivedFrom").value=file.receivedFrom||"";

    }

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

    searchTerm = document
        .getElementById("fileSearch")
        .value
        .trim();

    refreshOpenView(allFiles.filter(f=>!f.archived));

};

window.showFilesTab=(id,btn)=>{
document.querySelectorAll(".filesTab").forEach(e=>e.style.display="none");
document.getElementById(id).style.display="block";
document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
};

// ===========================================
// دورة متابعة الاستدعاء: التسليم / الإنهاء
// ===========================================
window.toggleDeliveryBox=(id)=>{
    document.querySelectorAll(".delivery-box.show").forEach(b=>{
        if(b.id!==`deliveryBox-${id}`) b.classList.remove("show");
    });
    document.getElementById(`deliveryBox-${id}`).classList.toggle("show");
};

window.showNotDeliveredReasons=(id)=>{
    document.getElementById(`reasonBox-${id}`).classList.add("show");
};

window.markDelivered=async(id)=>{
    await updateDoc(doc(db,"case_files",id),{
        deliveryStatus:"delivered",
        deliveryDate:new Date().toLocaleDateString("ar-DZ"),
        notDeliveredReason:""
    });
    document.getElementById(`deliveryBox-${id}`)?.classList.remove("show");
};

window.markNotDelivered=async(id)=>{
    const reason=document.getElementById(`reasonSelect-${id}`).value;
    await updateDoc(doc(db,"case_files",id),{
        deliveryStatus:"not_delivered",
        notDeliveredReason:reason
    });
    document.getElementById(`deliveryBox-${id}`)?.classList.remove("show");
    document.getElementById(`reasonBox-${id}`)?.classList.remove("show");
};

window.finishSummons=async(id)=>{
    if(!confirm("هل تريد إنهاء هذا الاستدعاء؟ سينتقل إلى الأرشيف."))return;
    await updateDoc(doc(db,"case_files",id),{
        archived:true,
        finishedDate:new Date().toLocaleDateString("ar-DZ")
    });
};
