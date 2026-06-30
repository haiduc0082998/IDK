function formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

function parseCurrency(str) {
    if (!str) return 0;
    const num = parseFloat(str.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
}

function updateElement(label, value, type) {
    var elements = document.querySelectorAll('[data-label="' + label + '"]');
    elements.forEach(function(el) {
        if (type === 'dem') {
            el.textContent = value + ' khoản';
        } else {
            el.textContent = formatCurrency(value);
        }
    });
}

function processRawData() {
    var rawInput = document.getElementById('rawDataInput').value.trim();
    if (!rawInput) {
        alert('Vui lòng nhập dữ liệu!');
        return;
    }

    var lines = rawInput.split('\n');
    var dataMap = {};

    lines.forEach(function(line) {
        var parts = line.split('|');
        if (parts.length >= 3) {
            var label = parts[0].trim();
            var value = parts[1].trim();
            var type = parts[2] ? parts[2].trim().toLowerCase() : 'so-tien';
            var han = parts[3] || '';
            var hanhdong = parts[4] ? parts[4].trim().toLowerCase() : '';

            var numericValue = parseCurrency(value);
            dataMap[label] = { value: numericValue, type: type, han: han, hanhdong: hanhdong };
        }
    });

    Object.keys(dataMap).forEach(function(label) {
        var item = dataMap[label];
        updateElement(label, item.value, item.type);
    });

    autoCalculateTotals(dataMap);
    alert('Dữ liệu đã được cập nhật thành công!');
}

function autoCalculateTotals(dataMap) {
    var tongThu = 0, tongChi = 0, tongLuong = 0, tongPriority1 = 0;

    Object.keys(dataMap).forEach(function(label) {
        var item = dataMap[label];
        if (item.hanhdong === 'thu') {
            tongThu += item.value;
        } else if (item.hanhdong === 'chi') {
            tongChi += item.value;
        }

        if (label.indexOf('Lương T03') !== -1 || label.indexOf('Lương T04') !== -1 || label.indexOf('Lương T05') !== -1) {
            tongLuong += item.value;
        }

        if (label.indexOf('BHXH') !== -1 || label.indexOf('Tiền thuê văn phòng') !== -1 || label.indexOf('Google Usage') !== -1 || label.indexOf('Internet') !== -1 || label.indexOf('Krea Slack') !== -1 || label.indexOf('Phí dịch vụ thuế') !== -1 || label.indexOf('Các khoản chi nhỏ') !== -1) {
            tongPriority1 += item.value;
        }
    });

    if (tongThu === 0) tongThu = (dataMap['Mission 01'] ? dataMap['Mission 01'].value : 0) + (dataMap['Mission 02'] ? dataMap['Mission 02'].value : 0) + (dataMap['Sale'] ? dataMap['Sale'].value : 0);
    if (tongChi === 0) tongChi = (dataMap['Dự án'] ? dataMap['Dự án'].value : 0) + (dataMap['Cố định'] ? dataMap['Cố định'].value : 0);

    var duThuTuan = document.getElementById('du-thu-tuan');
    var duChiTuan = document.getElementById('du-chi-tuan');
    var netCashflow = document.getElementById('net-cashflow');

    if (duThuTuan) duThuTuan.textContent = formatCurrency(tongThu);
    if (duChiTuan) duChiTuan.textContent = formatCurrency(tongChi);
    if (netCashflow) {
        var net = tongThu - tongChi;
        netCashflow.textContent = (net >= 0 ? '' : '-') + formatCurrency(Math.abs(net));
        netCashflow.className = net >= 0 ? 'text-success' : 'text-danger';
    }

    var tongLuongEl = document.querySelector('[data-label="Tổng lương tồn"]');
    if (tongLuongEl && tongLuong > 0) tongLuongEl.textContent = formatCurrency(tongLuong);

    var tongPriority1El = document.querySelector('[data-label="Tổng priority 01"]');
    if (tongPriority1El && tongPriority1 > 0) tongPriority1El.textContent = formatCurrency(tongPriority1);

    updateTableTotals(dataMap);
    updateProgressBars(dataMap);
}

function updateTableTotals(dataMap) {
    var tongPriority2 = 0;
    var labels = ['Lương T07', 'Thuế GTGT'];
    labels.forEach(function(label) {
        if (dataMap[label]) tongPriority2 += dataMap[label].value;
    });

    var tongPriority2El = document.querySelector('[data-label="Tổng priority 02"]');
    if (tongPriority2El && tongPriority2 > 0) tongPriority2El.textContent = formatCurrency(tongPriority2);
}

function updateProgressBars(dataMap) {
    var kpi06 = 1000000000;
    var kpi07 = 1000000000;

    var thu06 = dataMap['Tổng thu W21-W25'] ? dataMap['Tổng thu W21-W25'].value : 300597074;
    var thu07 = dataMap['Tổng thu W26-W30'] ? dataMap['Tổng thu W26-W30'].value : 115049200;

    var progress06 = document.getElementById('progress-thang-06');
    var progress07 = document.getElementById('progress-thang-07');

    if (progress06) {
        var percent = (thu06 / kpi06 * 100).toFixed(2);
        progress06.style.width = percent + '%';
    }

    if (progress07) {
        var percent = (thu07 / kpi07 * 100).toFixed(2);
        progress07.style.width = percent + '%';
    }
}

function clearAllData() {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã nhập?')) {
        document.getElementById('rawDataInput').value = '';
        location.reload();
    }
}

function exportToWord() {
    var rawInput = document.getElementById('rawDataInput').value.trim();
    if (!rawInput) {
        alert('Vui lòng nhập dữ liệu trước khi xuất Word!');
        return;
    }

    var encodedData = encodeURIComponent(rawInput);
    window.open('du_doan_dong_tien_TEMPLATE.html?data=' + encodedData, '_blank');
}

function init() {
    document.getElementById('btn-process').addEventListener('click', processRawData);
    document.getElementById('btn-clear').addEventListener('click', clearAllData);
    document.getElementById('btn-export').addEventListener('click', exportToWord);
}

init();
