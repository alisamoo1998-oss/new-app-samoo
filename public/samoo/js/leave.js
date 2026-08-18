import { fmtDate } from "./dateFormat.js";
// --- دوال حساب الإجازة الجديدة ---
    // إظهار/إخفاء حقل المدة المخصصة
    window.updateLeaveTypeField = () => {
        const type = document.getElementById('leaveType').value;
        document.getElementById('customDaysField').classList.toggle('show', type === 'custom');
    };

    window.setCalcType = (type) => {
        const futureDiv = document.getElementById('futureCalc');
        const pastDiv = document.getElementById('pastCalc');
        const remainingDiv = document.getElementById('remainingCalc');
        const futureBtn = document.getElementById('calcTypeFuture');
        const pastBtn = document.getElementById('calcTypePast');
        const remainingBtn = document.getElementById('calcTypeRemaining');

        const panels = { future: futureDiv, past: pastDiv, remaining: remainingDiv };
        const buttons = { future: futureBtn, past: pastBtn, remaining: remainingBtn };

        Object.keys(panels).forEach(key => {
            const isActive = key === type;
            panels[key].style.display = isActive ? 'block' : 'none';
            buttons[key].style.background = isActive ? '#1a237e' : '#ddd';
            buttons[key].style.color = isActive ? 'white' : '#333';
        });

        document.getElementById('result').innerHTML = '';
    };

    window.calcDaysPassed = () => {
        const pastDateInput = document.getElementById('pastDate').value;
        if (!pastDateInput) {
            alert('الرجاء اختيار تاريخ قديم');
            return;
        }
        const past = new Date(pastDateInput);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (past > today) {
            alert('التاريخ المحدد في المستقبل، الرجاء اختيار تاريخ قديم');
            return;
        }

        const diffTime = today - past;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('result').innerHTML = `<span style="font-size:24px;">عدد الأيام المنقضية: <strong>${diffDays}</strong> يوم</span>`;
    };

    // حساب عدد الأيام بين تاريخين (بدون أي قيود على الترتيب أو المدة)
    window.calcDateRange = () => {
        const startInput = document.getElementById('rangeStartDate').value;
        const endInput = document.getElementById('rangeEndDate').value;

        if (!startInput || !endInput) {
            alert('الرجاء اختيار تاريخ البداية والنهاية');
            return;
        }

        const start = new Date(startInput);
        const end = new Date(endInput);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffDays = Math.abs(Math.floor((end - start) / (1000 * 60 * 60 * 24)));

        document.getElementById('result').innerHTML =
            `<span style="font-size:20px;">عدد الأيام بين التاريخين: <strong>${diffDays}</strong> يوم</span>`;
    };

    window.calcFuture = () => {
        const typeValue = document.getElementById("leaveType").value;
        const days = typeValue === "custom"
            ? parseInt(document.getElementById("customDays").value)
            : parseInt(typeValue);

        const startInput = document.getElementById("startDate").value;
        let start = new Date(startInput);

        if (!startInput || isNaN(start.getTime()) || isNaN(days) || days <= 0) {
            alert('الرجاء اختيار تاريخ البداية والمدة بشكل صحيح');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);

        let end = new Date(start);
        end.setDate(end.getDate() + days);

        let result = fmtDate(end);

        const elapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        const remaining = Math.floor((end - today) / (1000 * 60 * 60 * 24));

        document.getElementById("result").innerHTML = `
            <span style="font-size:20px;">الإجازة القادمة: <strong>${result}</strong></span><br>
            <span style="font-size:15px;">الأيام المنقضية منذ البداية: <strong>${Math.max(elapsed, 0)}</strong> يوم</span><br>
            <span style="font-size:15px;">الأيام المتبقية للإجازة: <strong>${Math.max(remaining, 0)}</strong> يوم</span>
        `;
    };