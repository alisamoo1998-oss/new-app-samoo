// --- دوال حساب الإجازة الجديدة ---
    window.setCalcType = (type) => {
        const futureDiv = document.getElementById('futureCalc');
        const pastDiv = document.getElementById('pastCalc');
        const futureBtn = document.getElementById('calcTypeFuture');
        const pastBtn = document.getElementById('calcTypePast');

        if (type === 'future') {
            futureDiv.style.display = 'block';
            pastDiv.style.display = 'none';
            futureBtn.style.background = '#1a237e';
            futureBtn.style.color = 'white';
            pastBtn.style.background = '#ddd';
            pastBtn.style.color = '#333';
            document.getElementById('result').innerHTML = '';
        } else {
            futureDiv.style.display = 'none';
            pastDiv.style.display = 'block';
            pastBtn.style.background = '#1a237e';
            pastBtn.style.color = 'white';
            futureBtn.style.background = '#ddd';
            futureBtn.style.color = '#333';
            document.getElementById('result').innerHTML = '';
        }
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

    window.calcFuture = () => {
        let days = parseInt(document.getElementById("leaveType").value);
        let start = new Date(document.getElementById("startDate").value);
        if(!isNaN(start.getTime())){
            start.setDate(start.getDate() + days);
            let result = start.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');
            document.getElementById("result").innerHTML = `<span style="font-size:20px;">الإجازة القادمة: <strong>${result}</strong></span>`;
        }
    };