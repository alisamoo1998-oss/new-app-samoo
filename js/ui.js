    // دالة التبديل بين تبويبات المخالفات
    window.switchInfractionTab = (tabName) => {
        // تحديث الأزرار
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // إخفاء كل المحتويات
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // إظهار المحتوى المطلوب
        document.getElementById(`${tabName}-tab`).classList.add('active');
    };

    // دالة التبديل بين تبويبات قسم الإجازات (الفروع الخمسة)
    window.switchLeaveTab = (tabName, btn) => {
        // تحديث الأزرار
        document.querySelectorAll('.leave-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // إخفاء كل المحتويات
        document.querySelectorAll('.leave-tab-content').forEach(content => content.classList.remove('active'));

        // إظهار المحتوى المطلوب
        document.getElementById(`${tabName}-tab`).classList.add('active');
    };

    // دالة لإظهار/إخفاء قسم إضافة المخالفات
    window.toggleAddSection = () => {
        document.getElementById('addInfractionSection').classList.toggle('show');
    };
    
    // دالة لإظهار/إخفاء قسم إضافة القطع
    window.togglePieceSection = () => {
        document.getElementById('addPieceSection').classList.toggle('show');
    };

    // الدوال الأساسية للواجهة
    window.show = (id) => {
        document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
        document.getElementById(id).classList.add("active");
    };

    window.toggleArchive = (id) => {
        let el = document.getElementById(id);
        el.style.display = el.style.display === "block" ? "none" : "block";
    };