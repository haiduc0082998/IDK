// --- DỮ LIỆU MẶC ĐỊNH HỆ THỐNG KHI KHÔNG CÓ PARAMETER TRUYỀN SANG ---
const DEFAULT_DATA = {
    title: "DU DOAN DONG TIEN W27",
    period: "Chu kỳ tuần: 29/06/2026 – 05/07/2026",
    owner: "@Kim Phuong",
    report_date: "29/06/2026"
};

document.addEventListener("DOMContentLoaded", function() {
    initTemplateReport();
    initEditableCells();
});

// --- HÀM KHỞI CHẠY VÀ XỬ LÝ DỮ LIỆU ĐƯỢC ĐẨY TỪ URL ---
function initTemplateReport() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawData = urlParams.get('data');
    const targetWeekStr = urlParams.get('week');

    let targetWeek = 27; // Tuần mặc định ban đầu
    if (targetWeekStr) {
        targetWeek = parseInt(targetWeekStr, 10) || 27;
    }

    // Tính toán độ lệch tuần (shift) giữa tuần được chọn và tuần gốc W27 của hệ thống
    const shift = targetWeek - 27;

    // Cập nhật các thông tin tiêu đề chung dựa trên tuần thực tế
    updateReportMetaHeaders(targetWeek);

    // Nếu có dữ liệu thô đẩy từ trang index sang, tiến hành bóc tách và render bảng biểu chi tiết
    if (rawData) {
        try {
            parseAndPopulateData(decodeURIComponent(rawData), targetWeek);
        } catch (error) {
            console.error("Lỗi khi bóc tách dữ liệu thô truyền qua URL:", error);
        }
    }
}

// --- TỰ ĐỘNG CẬP NHẬT TIÊU ĐỀ THEO CHUẨN ISO 8601 ---
function updateReportMetaHeaders(week) {
    // Tính toán ngày Thứ Hai và Chủ Nhật dựa vào số tuần và năm 2026
    const range = getISOWeekRange(2026, week);
    const startStr = formatDateVn(range.start);
    const endStr = formatDateVn(range.end);

    // Cập nhật hiển thị tiêu đề và chu kỳ trên trang in Word
    document.title = `Dự Đoán Dòng Tiền W${week} - Báo Cáo Xuất Bản`;
    
    const titleEl = document.getElementById('lbl-title');
    if (titleEl) titleEl.textContent = `DỰ ĐOÁN DÒNG TIỀN W${week}`;

    const periodEl = document.getElementById('lbl-period');
    if (periodEl) periodEl.textContent = `Chu kỳ tuần: ${startStr} – ${endStr}/2026`;

    const reportDateEl = document.getElementById('lbl-report-date');
    if (reportDateEl) reportDateEl.textContent = startStr;

    // Cập nhật lại số hiệu tuần trong phần text tiêu đề phụ
    const kpiT6 = document.getElementById('lbl-kpi-t6');
    const kpiT7 = document.getElementById('lbl-kpi-t7');
    if (kpiT6) kpiT6.textContent = kpiT6.textContent.replace(/W\d+/g, 'W' + (week - 2)); 
    if (kpiT7) kpiT7.textContent = kpiT7.textContent.replace(/W\d+/g, 'W' + week);
}

// --- PHÂN TÍCH VÀ ĐỔ SỐ LIỆU VÀO CÁC Ô ĐỊNH DẠNG ---
function parseAndPopulateData(rawText, targetWeek) {
    const lines = rawText.split('\n');
    let dataMap = {};
    
    let tongThu = 0;
    let tongChi = 0;
    let tongLuongTon = 0;
    let tongPriority1 = 0;
    let tongPriority2 = 0;

    // Duyệt từng dòng để bóc tách dữ liệu
    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split('|');
        if (parts.length >= 2) {
            const label = parts[0].trim();
            const value = parseInt(parts[1].trim().replace(/[^\d]/g, '')) || 0;
            const action = parts[4] ? parts[4].trim().toLowerCase() : '';

            dataMap[label] = { value: value, action: action };
            
            // Phân loại cộng dồn tổng tiền
            const lowerAction = action.toLowerCase();
            if (lowerAction.includes('thu')) tongThu += value;
            if (lowerAction.includes('chi')) tongChi += value;

            // Tính tổng danh mục chi tiết phục vụ bảng 2
            if (label.includes('Lương T03') || label.includes('Lương T04') || label.includes('Lương T05')) {
                tongLuongTon += value;
            }
            if (label.includes('BHXH') || label.includes('Tiền thuê văn phòng') || label.includes('Google Usage') || 
                label.includes('Internet') || label.includes('Krea Slack') || label.includes('Phí dịch vụ thuế') || label.includes('Các khoản chi nhỏ')) {
                tongPriority1 += value;
            }
            if (label.includes('Lương T07') || label.includes('Thuế GTGT')) {
                tongPriority2 += value;
            }
        }
    });

    // Tính toán dự phòng nếu chuỗi dữ liệu đầu vào không gán nhãn Sum tổng trực tiếp
    if (tongThu === 0) {
        tongThu = (dataMap['Mission 01'] ? dataMap['Mission 01'].value : 0) + 
                  (dataMap['Mission 02'] ? dataMap['Mission 02'].value : 0) + 
                  (dataMap['Sale'] ? dataMap['Sale'].value : 0);
    }
    if (tongChi === 0) {
        tongChi = (dataMap['Dự án'] ? dataMap['Dự án'].value : 0) + 
                  (dataMap['Cố định'] ? dataMap['Cố định'].value : 0);
    }

    // 1. Đổ dữ liệu vào bảng Tổng quan chỉ số chính (Trang 1)
    document.getElementById('val-du-thu-tuan').textContent = formatCurrencyVn(tongThu);
    document.getElementById('val-du-chi-tuan').textContent = formatCurrencyVn(tongChi);
    
    const netCashflow = tongThu - tongChi;
    const netEl = document.getElementById('val-net-cashflow');
    if (netEl) {
        netEl.textContent = (netCashflow >= 0 ? '+' : '-') + formatCurrencyVn(Math.abs(netCashflow));
        netEl.className = netCashflow >= 0 ? 'amount text-blue' : 'amount text-danger';
    }

    // 2. Cập nhật tiến độ KPI Doanh thu tháng
    const kpiMax = 1000000000;
    const thuT6 = dataMap['Tổng thu W21-W25'] ? dataMap['Tổng thu W21-W25'].value : 300597074;
    const thuT7 = dataMap['Tổng thu W26-W30'] ? dataMap['Tổng thu W26-W30'].value : 115049200;

    document.getElementById('val-thu-t6').textContent = `${formatCurrencyVn(thuT6)} (${(thuT6 / kpiMax * 100).toFixed(2)}% KPI)`;
    document.getElementById('val-thu-t7').textContent = `${formatCurrencyVn(thuT7)} (${(thuT7 / kpiMax * 100).toFixed(2)}% KPI)`;

    // 3. Đổ dữ liệu vào bảng chi tiết Pipeline Khách hàng (Trang 2)
    let pipelineRows = '';
    let stt = 1;
    
    ['Mission 01', 'Mission 02', 'Sale'].forEach((itemLabel, idx) => {
        if (dataMap[itemLabel]) {
            let badgeClass = 'badge-green';
            let badgeText = 'Dự án lớn';
            if (idx === 2) badgeText = 'Bán lẻ phát sinh';
            
            pipelineRows += `
                <tr data-label="${itemLabel}">
                    <td style="text-align: center;">${(idx+1).toString().padStart(2, '0')}</td>
                    <td><strong>${itemLabel}</strong></td>
                    <td style="text-align: right; font-weight: bold;" data-field="so-tien" contenteditable="true" class="text-blue">${formatCurrencyVn(dataMap[itemLabel].value)}</td>
                    <td style="text-align: center;"><span class="badge ${badgeClass}">${badgeText}</span></td>
                </tr>
            `;
            stt++;
        }
    });
    
    // Thêm các mục thu khác
    Object.keys(dataMap).forEach(function(key) {
        const lowerAction = dataMap[key].action.toLowerCase();
        if (lowerAction.includes('thu') && !['Mission 01', 'Mission 02', 'Sale'].includes(key)) {
            pipelineRows += `
                <tr data-label="${key}">
                    <td style="text-align: center;">${stt.toString().padStart(2, '0')}</td>
                    <td><strong>${key}</strong></td>
                    <td style="text-align: right; font-weight: bold;" data-field="so-tien" contenteditable="true" class="text-blue">${formatCurrencyVn(dataMap[key].value)}</td>
                    <td style="text-align: center;"><span class="badge badge-success">Phát sinh thu</span></td>
                </tr>
            `;
            stt++;
        }
    });
    
    const pipelineBody = document.getElementById('export-body-pipeline');
    if (pipelineBody) {
        pipelineBody.innerHTML = pipelineRows;
    }

    // 4. Đổ dữ liệu vào bảng tổng khối chi phí quản lý (Trang 2)
    if (document.getElementById('val-tong-luong')) document.getElementById('val-tong-luong').textContent = formatCurrencyVn(tongLuongTon);
    if (document.getElementById('val-tong-priority1')) document.getElementById('val-tong-priority1').textContent = formatCurrencyVn(tongPriority1);
    if (document.getElementById('val-tong-priority2')) document.getElementById('val-tong-priority2').textContent = formatCurrencyVn(tongPriority2);
    
    // 4b. Thêm các mục chi vào bảng chi tiết (Trang 2)
    let chiRows = '';
    const chiBody = document.querySelector('#export-body-chi');
    
    Object.keys(dataMap).forEach(function(key) {
        const lowerAction = dataMap[key].action.toLowerCase();
        if (lowerAction.includes('chi')) {
            const lowerKey = key.toLowerCase();
            let badgeClass = 'badge-orange';
            let badgeText = 'Chi phí';
            
            if (lowerKey.includes('lương t07') || lowerKey.includes('thuế gtgt')) {
                badgeClass = 'badge-blue';
                badgeText = 'Ưu tiên 2';
            }
            
            chiRows += `
                <tr data-label="${key}">
                    <td style="text-align: center;">+</td>
                    <td>${key}</td>
                    <td style="text-align: right; font-weight: bold;" data-field="so-tien" contenteditable="true" class="text-blue">${formatCurrencyVn(dataMap[key].value)}</td>
                    <td style="text-align: center;"><span class="badge ${badgeClass}">${badgeText}</span></td>
                </tr>
            `;
        }
    });
    
    if (chiBody && chiRows) {
        chiBody.innerHTML += chiRows;
    }

    // Tự động tinh chỉnh nội dung kết luận dựa trên dòng tiền thực tế âm hay dương
    updateStrategicConclusion(netCashflow, targetWeek);
    
    // Re-initialize editable cells after dynamic content is loaded
    initEditableCells();
}

// --- CẬP NHẬT KẾT LUẬN CHIẾN LƯỢC TỰ ĐỘNG ---
function updateStrategicConclusion(netCashflow, week) {
    const box = document.getElementById('lbl-conclusion');
    if (!box) return;

    if (netCashflow >= 0) {
        box.innerHTML = `Hệ thống dự báo tuần <strong>W${week} hoàn toàn có khả năng dương dòng tiền (+${formatCurrencyVn(netCashflow)})</strong> nếu hoàn thành kế hoạch thu hồi công nợ đạt 100%. Trọng tâm giai đoạn này không tập trung vào phát sinh chi phí mới, mà ưu tiên giải phóng triệt để áp lực tài chính tồn đọng thuộc nhóm Priority 01 nhằm ổn định hệ thống nhân sự và duy trì chỉ số an toàn vận hành liên tục.`;
        box.style.backgroundColor = '#f0fdf4'; // Xanh lá nhẹ cho dòng tiền dương
    } else {
        box.innerHTML = `Cảnh báo hệ thống: Tuần <strong>W${week} đang có nguy cơ âm dòng tiền thuần (${formatCurrencyVn(netCashflow)})</strong>. Yêu cầu bộ phận CFO phối hợp chặt chẽ với các đầu mối dự án thúc đẩy tiến độ đối soát của Mission 01 và Mission 02, đồng thời áp dụng lệnh thắt chặt ngân sách chi tiêu, tạm hoãn các khoản chi dự phòng thuộc nhóm Priority 02 để tập trung quỹ tiền mặt thanh toán lương tồn đọng.`;
        box.style.backgroundColor = '#fff5f5'; // Đỏ nhẹ cảnh báo cho dòng tiền âm
    }
}

// --- TIỆN ÍCH TÍNH TOÁN NGÀY THÁNG THEO ISO 8601 ---
function getISOWeekRange(year, week) {
    let d = new Date(year, 0, 1);
    const dayNum = d.getDay() || 7;
    let diff = 1 - dayNum;
    if (dayNum > 4) diff += 7;
    const firstMonday = new Date(year, 0, 1 + diff);
    
    const ISOweekStart = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);
    const ISOweekEnd = new Date(ISOweekStart.getTime() + 6 * 86400000);
    return { start: ISOweekStart, end: ISOweekEnd };
}

function formatDateVn(date) {
    return date.getDate().toString().padStart(2, '0') + '/' +
           (date.getMonth() + 1).toString().padStart(2, '0');
}

function formatCurrencyVn(value) {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

// --- XỬ LÝ CHỈNH SỬA GIÁ TRỊ EDITABLE ---
function parseCurrencyInput(input) {
    const num = parseInt(input.replace(/[^\d]/g, '')) || 0;
    return num;
}

function initEditableCells() {
    const editableCells = document.querySelectorAll('[contenteditable="true"]');
    editableCells.forEach(cell => {
        cell.addEventListener('blur', function() {
            let currentValue = this.textContent.trim();
            const parsed = parseCurrencyInput(currentValue);
            if (this.dataset.field && (this.dataset.field.includes('thu') || this.dataset.field.includes('chi') || this.dataset.field.includes('luong') || this.dataset.field.includes('priority') || this.dataset.field.includes('net'))) {
                this.textContent = formatCurrencyVn(parsed);
            }
        });
        
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });
}

// --- XUẤT FILE BÁO CÁO THEO CÁC ĐỊNH DẠNG ---
function exportToWord() {
    window.print();
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const week = document.getElementById('lbl-title').textContent.replace(/\D/g, '') || '27';

    // Sheet 1: Tổng quan
    const summaryData = [];
    const duThu = document.getElementById('val-du-thu-tuan')?.textContent || '0 ₫';
    const duChi = document.getElementById('val-du-chi-tuan')?.textContent || '0 ₫';
    const net = document.getElementById('val-net-cashflow')?.textContent || '0 ₫';
    summaryData.push(['Chỉ số', 'Giá trị']);
    summaryData.push(['Dự thu tuần', duThu]);
    summaryData.push(['Dự chi tuần', duChi]);
    summaryData.push(['Net cashflow', net]);
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'TỔNG QUAN');

    // Sheet 2: Pipeline
    const pipelineData = [];
    const pipelineHeader = ['STT', 'Nguồn Doanh Thu', 'Số Tiền', 'Trạng Thái'];
    pipelineData.push(pipelineHeader);
    document.querySelectorAll('#export-body-pipeline tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
            pipelineData.push([
                tds[0]?.textContent?.trim() || '',
                tds[1]?.textContent?.trim() || '',
                tds[2]?.textContent?.trim() || '',
                tds[3]?.textContent?.trim() || ''
            ]);
        }
    });
    const ws2 = XLSX.utils.aoa_to_sheet(pipelineData);
    XLSX.utils.book_append_sheet(wb, ws2, 'PIPELINE');

    // Sheet 3: Chi tiết chi
    const chiData = [];
    const chiHeader = ['STT', 'Nội dung chi', 'Số tiền', 'Nhóm ưu tiên'];
    chiData.push(chiHeader);
    document.querySelectorAll('#export-body-chi tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 4) {
            chiData.push([
                tds[0]?.textContent?.trim() || '',
                tds[1]?.textContent?.trim() || '',
                tds[2]?.textContent?.trim() || '',
                tds[3]?.textContent?.trim() || ''
            ]);
        }
    });
    const ws3 = XLSX.utils.aoa_to_sheet(chiData);
    XLSX.utils.book_append_sheet(wb, ws3, 'CHI TIẾT CHI');

    // Sheet 4: KPI
    const kpiData = [];
    kpiData.push(['Tháng', 'Mục tiêu', 'Lũy kế', 'Tỷ lệ']);
    const thuT6 = document.getElementById('val-thu-t6')?.textContent?.trim() || '';
    const thuT7 = document.getElementById('val-thu-t7')?.textContent?.trim() || '';
    kpiData.push(['Tháng 06', '1.000.000.000 ₫', thuT6, '']);
    kpiData.push(['Tháng 07', '1.000.000.000 ₫', thuT7, '']);
    const ws4 = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, ws4, 'KPI DOANH THU');

    XLSX.writeFile(wb, `Du_Doan_Dong_Tien_W${week}.xlsx`);
}

function exportToGoogleSheets() {
    const rows = [];
    rows.push(['CHỈ SỐ DÒNG TIỀN']);
    rows.push(['Dự thu tuần', document.getElementById('val-du-thu-tuan')?.textContent || '']);
    rows.push(['Dự chi tuần', document.getElementById('val-du-chi-tuan')?.textContent || '']);
    rows.push(['Net cashflow', document.getElementById('val-net-cashflow')?.textContent || '']);
    rows.push([]);
    rows.push(['PIPELINE']);
    rows.push(['STT', 'Nguồn Doanh Thu', 'Số Tiền', 'Trạng Thái']);
    document.querySelectorAll('#export-body-pipeline tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
            rows.push([
                tds[0]?.textContent?.trim() || '',
                tds[1]?.textContent?.trim() || '',
                tds[2]?.textContent?.trim() || '',
                tds[3]?.textContent?.trim() || ''
            ]);
        }
    });
    rows.push([]);
    rows.push(['CHI TIẾT CHI']);
    rows.push(['STT', 'Nội dung chi', 'Số tiền', 'Nhóm ưu tiên']);
    document.querySelectorAll('#export-body-chi tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 4) {
            rows.push([
                tds[0]?.textContent?.trim() || '',
                tds[1]?.textContent?.trim() || '',
                tds[2]?.textContent?.trim() || '',
                tds[3]?.textContent?.trim() || ''
            ]);
        }
    });

    let csvContent = '';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const week = document.getElementById('lbl-title').textContent.replace(/\D/g, '') || '27';
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `Du_Doan_Dong_Tien_W${week}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Đã tải file CSV. Bạn có thể nhập file này vào Google Sheets để tiếp tục chỉnh sửa.');
}

function exportToPowerPoint() {
    const title = document.getElementById('lbl-title')?.textContent || 'BAO CAO';
    const period = document.getElementById('lbl-period')?.textContent || '';
    const conclusion = document.getElementById('lbl-conclusion')?.textContent || '';

    let slideHtml = `
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${title} - Slide</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            .slide {
                width: 1280px;
                height: 720px;
                page-break-after: always;
                padding: 40px 60px;
                position: relative;
                font-family: Arial, sans-serif;
            }
            .slide-1 { background: #ffffff; }
            .slide-2 { background: #ffffff; }
            .company { font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 10px; }
            .title { font-size: 56px; font-weight: bold; color: #0f172a; margin-bottom: 15px; text-transform: uppercase; }
            .period { font-size: 28px; color: #475569; margin-bottom: 30px; }
            .meta { font-size: 20px; color: #475569; display: flex; justify-content: space-between; }
            h2 { font-size: 32px; color: #0f172a; margin-bottom: 20px; border-bottom: 3px solid #dc2626; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 20px; }
            th { background: #fef2f2; color: #dc2626; font-weight: bold; padding: 12px 16px; border: 1px solid #cbd5e1; text-align: left; }
            td { padding: 12px 16px; border: 1px solid #cbd5e1; }
            .amount { font-family: 'Courier New', monospace; font-weight: bold; text-align: right; }
            .kpi-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
            .kpi-header { display: flex; justify-content: space-between; font-size: 22px; font-weight: bold; margin-bottom: 8px; }
            .kpi-status { font-size: 18px; color: #475569; }
            .conclusion { background: #f0fdf4; border-left: 5px solid #16a34a; padding: 20px; font-size: 18px; line-height: 1.6; text-align: justify; }
            .text-blue { color: #1e40af !important; }
            .text-orange { color: #b45309 !important; }
            @media print { .slide { size: 1280px 720px; margin: 0; } }
        </style>
    </head>
    <body>
        <div class="slide slide-1">
            <div class="company">HỆ THỐNG QUẢN TRỊ TÀI CHÍNH DOANH NGHIỆP</div>
            <div class="title">${title}</div>
            <div class="period">${period}</div>
            <div class="meta">
                <div><strong>Người lập:</strong> @Kim Phuong</div>
                <div><strong>Ngày xuất bản:</strong> 29/06/2026</div>
            </div>
            <h2>I. CHỈ SỐ DÒNG TIỀN TRỌNG TÂM TRONG TUẦN</h2>
            <table>
                <tr><th>Chỉ số</th><th style="text-align: right;">Giá trị</th></tr>
                <tr>
                    <td><strong class="text-blue">Dự Thu Tuần</strong></td>
                    <td class="amount" style="color: #1e40af;">${document.getElementById('val-du-thu-tuan')?.textContent || ''}</td>
                </tr>
                <tr>
                    <td><strong class="text-orange">Dự Chi Tuần</strong></td>
                    <td class="amount" style="color: #b45309;">${document.getElementById('val-du-chi-tuan')?.textContent || ''}</td>
                </tr>
                <tr>
                    <td><strong>Net Cashflow</strong></td>
                    <td class="amount">${document.getElementById('val-net-cashflow')?.textContent || ''}</td>
                </tr>
            </table>
        </div>
        <div class="slide slide-2">
            <h2>II. PIPELINE DỰ THU</h2>
            <table>
                <tr><th>STT</th><th>Nguồn Doanh Thu</th><th style="text-align: right;">Số Tiền</th><th>Trạng Thái</th></tr>
                ${Array.from(document.querySelectorAll('#export-body-pipeline tr')).map(tr => {
                    const tds = tr.querySelectorAll('td');
                    const cells = Array.from(tds).map(td => td?.textContent?.trim() || '');
                    return `<tr><td>${cells[0]}</td><td>${cells[1]}</td><td class="amount">${cells[2]}</td><td>${cells[3]}</td></tr>`;
                }).join('')}
            </table>
            <h2>III. CHI TIẾT CHI PHÍ</h2>
            <table>
                <tr><th>STT</th><th>Nội dung chi</th><th style="text-align: right;">Số tiền</th><th>Nhóm ưu tiên</th></tr>
                ${Array.from(document.querySelectorAll('#export-body-chi tr')).map(tr => {
                    const tds = tr.querySelectorAll('td');
                    const cells = Array.from(tds).map(td => td?.textContent?.trim() || '');
                    return `<tr><td>${cells[0]}</td><td>${cells[1]}</td><td class="amount">${cells[2]}</td><td>${cells[3]}</td></tr>`;
                }).join('')}
            </table>
            <div class="conclusion" style="margin-top: 20px;">
                <strong>Kết luận chiến lược:</strong><br>
                ${conclusion}
            </div>
            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 18px;">
                <div style="text-align: center; width: 30%;"><strong>NGƯỜI LẬP BÁO CÁO</strong><br>(Ký, ghi rõ họ tên)<br><br><br><strong>@Kim Phuong</strong></div>
                <div style="text-align: center; width: 30%;"><strong>GIÁM ĐỐC TÀI CHÍNH</strong><br>(Biện pháp kiểm soát)<br><br><br>.........................</div>
                <div style="text-align: center; width: 30%;"><strong>TỔNG GIÁM ĐỐC</strong><br>(Phê duyệt phương án chi)<br><br><br>.........................</div>
            </div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([slideHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
        win.focus();
    }
}