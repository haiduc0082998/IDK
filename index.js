// --- BIẾN TOÀN CỤC HỆ THỐNG ---
var appliedWeek = null;
var currentBaseWeek = 27; // Tuần gốc mặc định của template HTML
var originalTableBodies = {};
var originalDisplays = {};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Lưu lại trạng thái HTML ban đầu để phục vụ tính năng Tự động Reset/Xóa
    saveOriginalState();

    // 2. Khởi chạy các thành phần thời gian và đồng bộ bộ lọc
    initRealTimeClock();
    initIsoWeekSelector();

    // 3. Lắng nghe sự kiện từ các nút bấm trên giao diện
    document.getElementById("btn-process").addEventListener("click", processRawData);
    document.getElementById("btn-clear").addEventListener("click", () => {
        document.getElementById("rawDataInput").value = "";
    });
    document.getElementById("btn-clear-all").addEventListener("click", clearAllData);
    document.getElementById("btn-clear-tables").addEventListener("click", clearTableData);
    document.getElementById("btn-export").addEventListener("click", exportToWord);
    document.getElementById("btn-apply-week").addEventListener("click", () => applyWeekToReport(false));
    document.getElementById("btn-import-gsheets").addEventListener("click", importFromGoogleSheets);

    var prevBtn = document.getElementById('btn-week-prev');
    var nextBtn = document.getElementById('btn-week-next');
    if (prevBtn) prevBtn.addEventListener('click', () => changeWeek(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeWeek(1));
    
    // 4. Khởi tạo ô có thể chỉnh sửa và nút xóa dòng
    initEditableTableCells();
    initDeleteButtons();

    // 5. Xử lý file CSV/Excel
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileNameSpan = document.getElementById('fileName');
            if (fileNameSpan && e.target.files[0]) {
                fileNameSpan.textContent = 'Đã chọn: ' + e.target.files[0].name;
            }
            handleFileImport(e);
        });
    }

    const btnChooseFile = document.getElementById('btn-choose-file');
    if (btnChooseFile && fileInput) {
        btnChooseFile.addEventListener('click', function() {
            fileInput.click();
        });
    }
});

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        let textData = '';

        if (file.name.endsWith('.csv')) {
            textData = csvToArray(content);
        } else if (file.name.match(/\.(xlsx|xls)$/i)) {
            const data = new Uint8Array(content);
            const workbook = XLSX.read(data, { type: 'array' });
            textData = excelToArray(workbook);
        }

        if (textData) {
            document.getElementById('rawDataInput').value = textData;
            processRawData();
        } else {
            alert('Không thể đọc file. Vui lòng kiểm tra lại định dạng.');
        }
    };

    if (file.name.match(/\.(xlsx|xls)$/i)) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function excelToArray(workbook) {
    const result = [];
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: false });

    jsonData.forEach((row, index) => {
        if (index === 0 || !row || row.length === 0) return;

        const cells = row.map(c => {
            if (c === null || c === undefined) return '';
            if (typeof c === 'number') {
                return c.toString();
            }
            return String(c).trim();
        });

        if (cells.length >= 5) {
            result.push(`${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[4]}`);
        } else if (cells.length === 4) {
            result.push(`${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | `);
        }
    });
    return result.join('\n');
}

function csvToArray(csvContent) {
    const lines = csvContent.trim().split(/\r?\n/);
    const result = [];
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        const cells = line.split(',').map(c => c.trim());
        if (cells.length >= 5) {
            result.push(`${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[4]}`);
        } else if (cells.length === 4) {
            result.push(`${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | `);
        }
    });
    return result.join('\n');
}

function importFromGoogleSheets() {
    const url = document.getElementById('gsheetsUrl').value.trim();
    if (!url) {
        alert('Vui lòng nhập link Google Sheets!');
        return;
    }

    var match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        alert('Link Google Sheets không hợp lệ!');
        return;
    }

    var sheetId = match[1];
    var csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    fetch(csvUrl)
        .then(response => {
            if (!response.ok) throw new Error('Lỗi tải dữ liệu');
            return response.text();
        })
        .then(csvContent => {
            var textData = csvToArray(csvContent);
            document.getElementById('rawDataInput').value = textData;
            processRawData();
        })
        .catch(error => {
            alert('Lỗi khi nhập từ Google Sheets. Kiểm tra lại link và chia sẻ công khai: ' + error.message);
        });
}

// --- CÁC HÀM XỬ LÝ TIỀN TỆ & ĐỊNH DẠNG ---
function formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

function parseCurrency(str) {
    if (!str) return 0;
    var cleanStr = str.toString().replace(/[^\d]/g, '');
    var num = parseInt(cleanStr);
    return isNaN(num) ? 0 : num;
}

function formatDateVn(date) {
    return date.getDate().toString().padStart(2, '0') + '/' +
           (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
           date.getFullYear();
}

// --- XỬ LÝ CHỈNH SỬA TRỰC TIẾP TRONG BẢNG ---
function initEditableTableCells() {
    document.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        cell.addEventListener('blur', function() {
            // Format currency for so-tien cells
            if (this.hasAttribute('data-field') && this.getAttribute('data-field') === 'so-tien') {
                const raw = this.textContent.trim();
                const num = parseCurrency(raw);
                this.textContent = formatCurrency(num);
            }
            
            // Update data-label on name change
            if (this.closest('tr') && this.cellIndex === 2) {
                const row = this.closest('tr');
                const strong = this.querySelector('strong');
                if (strong) {
                    strong.textContent = this.textContent;
                }
                const oldLabel = row.getAttribute('data-label');
                const newLabel = this.textContent.trim();
                if (oldLabel && newLabel && oldLabel !== newLabel) {
                    row.setAttribute('data-label', newLabel);
                }
            }
            
            // Recalculate totals if editing amount or name changed
            const label = this.closest('tr')?.getAttribute('data-label');
            if (label && (this.hasAttribute('data-field') || this.cellIndex === 2)) {
                updateTotalsOnEdit();
            }
        });
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });

        if (cell.hasAttribute('data-field') && cell.getAttribute('data-field') === 'so-tien') {
            cell.addEventListener('focus', function() {
                const raw = this.textContent.trim();
                const num = parseCurrency(raw);
                this.textContent = num ? num.toString() : '';
            });
        }
    });
}

function initDeleteButtons() {
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
}

function handleDeleteClick(e) {
    deleteRow(e);
}

function deleteRow(event) {
    var btn = event.target;
    var row = btn.closest('tr');
    if (!row) return;
    
    var tbody = row.parentElement;
    row.remove();
    
    // Update STT numbers for this table
    updateSttNumbers(tbody.id);
    
    // Recalculate totals
    updateTotalsOnEdit();
    
    // Update original state to reflect deletion
    if (originalTableBodies[tbody.id]) {
        var tbodyEl = document.getElementById(tbody.id);
        if (tbodyEl) {
            originalTableBodies[tbody.id] = tbodyEl.innerHTML;
        }
    }
}

function updateSttNumbers(tbodyId) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function(row, index) {
        var sttCell = row.querySelector('td:nth-child(2)');
        if (sttCell) {
            sttCell.textContent = (index + 1).toString().padStart(2, '0');
        }
    });
}

function calculateTotalsFromTable() {
    let tongThu = 0, tongChi = 0, tongLuong = 0, tongPriority1 = 0, tongPriority2 = 0;
    
    document.querySelectorAll('tr[data-label]').forEach(row => {
        const soTienCell = row.querySelector('[data-field="so-tien"]');
        if (!soTienCell) return;
        const value = parseCurrency(soTienCell.textContent);
        const label = row.getAttribute('data-label');
        
        if (label) {
            const lowerLabel = label.toLowerCase();
            if (lowerLabel.includes('sale') || (lowerLabel.includes('thu') && !lowerLabel.includes('thuê') && !lowerLabel.includes('thuế')) || lowerLabel.includes('mission') || lowerLabel.includes('lượng')) {
                tongThu += value;
            } else if (lowerLabel.includes('lương')) {
                if (lowerLabel.includes('t03') || lowerLabel.includes('t04') || lowerLabel.includes('t05')) {
                    tongChi += value;
                    tongLuong += value;
                } else if (lowerLabel.includes('t07')) {
                    tongChi += value;
                    tongPriority2 += value;
                } else {
                    tongChi += value;
                    tongPriority1 += value;
                }
            } else if (lowerLabel.includes('chi') || lowerLabel.includes('phí') || lowerLabel.includes('thuê') || lowerLabel.includes('internet') || lowerLabel.includes('bhxh') || lowerLabel.includes('thuế')) {
                tongChi += value;
                if (lowerLabel.includes('thuế gtgt')) {
                    tongPriority2 += value;
                } else {
                    tongPriority1 += value;
                }
            }
        }
    });
    
    return { tongThu, tongChi, tongLuong, tongPriority1, tongPriority2 };
}

function updateTotalsOnEdit() {
    const totals = calculateTotalsFromTable();
    
    const duThuEl = document.getElementById('du-thu-tuan');
    const duChiEl = document.getElementById('du-chi-tuan');
    const netEl = document.getElementById('net-cashflow');
    
    if (duThuEl) duThuEl.textContent = formatCurrency(totals.tongThu);
    if (duChiEl) duChiEl.textContent = formatCurrency(totals.tongChi);
    if (netEl) {
        const net = totals.tongThu - totals.tongChi;
        netEl.textContent = formatCurrency(Math.abs(net));
        netEl.className = net >= 0 ? 'card-value text-success' : 'card-value text-danger';
    }
    
    const tongLuongEl = document.querySelector('[data-label="Tổng lương tồn"]');
    if (tongLuongEl) tongLuongEl.textContent = formatCurrency(totals.tongLuong);
    
    const tongPriority1El = document.querySelector('[data-label="Tổng priority 01"]');
    if (tongPriority1El) tongPriority1El.textContent = formatCurrency(totals.tongPriority1);
    
    const tongPriority2El = document.querySelector('[data-label="Tổng priority 02"]');
    if (tongPriority2El) tongPriority2El.textContent = formatCurrency(totals.tongPriority2);
}

// --- CÁC HÀM XỬ LÝ LOGIC DỮ LIỆU CHÍNH ---
function processRawData() {
    var rawInput = document.getElementById('rawDataInput').value.trim();
    if (!rawInput) {
        alert('Vui lòng nhập dữ liệu!');
        return;
    }

    var lines = rawInput.split('\n');
    var dataMap = {};

    lines.forEach(function(line) {
        if (!line.trim()) return;
        var parts = line.split('|');
        if (parts.length >= 3) {
            var label = parts[0].trim();
            var value = parts[1].trim();
            var type = parts[2] ? parts[2].trim().toLowerCase() : 'so-tien';
            var han = parts[3] || '';
            var action = parts[4] ? parts[4].trim().toLowerCase() : '';

            var numericValue = parseCurrency(value);
            dataMap[label] = { value: numericValue, type: type, han: han, action: action };
        }
    });

    // Luôn khóa cứng việc map dữ liệu theo số tuần đang hiển thị trên giao diện
    var targetWeek = currentBaseWeek;

    Object.keys(dataMap).forEach(function(label) {
        var item = dataMap[label];
        var displayLabel = label.replace(/W\d+/g, 'W' + targetWeek);
        updateDOMElement(displayLabel, item.value, item.action);
    });

    updateTotalsOnEdit();
    alert('Dữ liệu đã được xử lý và cập nhật thành công!');
}

// --- QUẢN LÝ TRẠNG THÁI GỐC (RESET & HOÀN TÁC) ---
function saveOriginalState() {
    ['table-body-luong', 'table-body-priority1', 'table-body-priority2', 'table-body-pipeline'].forEach(id => {
        var el = document.getElementById(id);
        if (el) {
            // Store original HTML with contenteditable added for editable cells
            var html = el.innerHTML.replace(/<td([^>]*)data-field="so-tien"([^>]*)>(.*?)<\/td>/gi, '<td$1data-field="so-tien" contenteditable="true"$2>$3</td>');
            originalTableBodies[id] = html;
        }
    });

    originalDisplays['du-thu-tuan'] = document.getElementById('du-thu-tuan')?.textContent;
    originalDisplays['du-chi-tuan'] = document.getElementById('du-chi-tuan')?.textContent;
    originalDisplays['net-cashflow'] = {
        text: document.getElementById('net-cashflow')?.textContent,
        className: document.getElementById('net-cashflow')?.className
    };
    originalDisplays['progress-thang-06'] = document.getElementById('progress-thang-06')?.style.width;
    originalDisplays['progress-thang-07'] = document.getElementById('progress-thang-07')?.style.width;
}

function clearTableData() {
    if (confirm('Bạn có chắc muốn đặt tất cả số tiền trong bảng chi tiết về 0 ₫?')) {
        document.querySelectorAll('table tbody td[data-field="so-tien"]').forEach(td => {
            td.textContent = '0 ₫';
            td.setAttribute('contenteditable', 'true');
        });
        document.querySelectorAll('[contenteditable="true"]').forEach(td => {
            if (!td.hasAttribute('data-field')) return;
        });
        ['Tổng lương tồn', 'Tổng priority 01', 'Tổng priority 02'].forEach(lbl => {
            var el = document.querySelector(`[data-label="${lbl}"]`);
            if (el) el.textContent = '0 ₫';
        });
        alert('Đã reset toàn bộ số tiền bảng chi tiết về 0 ₫!');
    }
}

function clearAllData() {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã xử lý và hoàn tác giao diện về ban đầu?')) {
        document.getElementById('rawDataInput').value = '';

        Object.keys(originalTableBodies).forEach(id => {
            var el = document.getElementById(id);
            if (el) el.innerHTML = originalTableBodies[id];
        });

        if (originalDisplays['du-thu-tuan']) document.getElementById('du-thu-tuan').textContent = originalDisplays['du-thu-tuan'];
        if (originalDisplays['du-chi-tuan']) document.getElementById('du-chi-tuan').textContent = originalDisplays['du-chi-tuan'];
        if (originalDisplays['net-cashflow']) {
            document.getElementById('net-cashflow').textContent = originalDisplays['net-cashflow'].text;
            document.getElementById('net-cashflow').className = originalDisplays['net-cashflow'].className;
        }
        if (originalDisplays['progress-thang-06']) document.getElementById('progress-thang-06').style.width = originalDisplays['progress-thang-06'];
        if (originalDisplays['progress-thang-07']) document.getElementById('progress-thang-07').style.width = originalDisplays['progress-thang-07'];

        var labels = {'Tổng lương tồn':'326.861.029 ₫', 'Tổng priority 01':'107.062.856 ₫', 'Tổng priority 02':'325.084.792 ₫'};
        Object.keys(labels).forEach(lbl => {
            var el = document.querySelector(`[data-label="${lbl}"]`);
            if (el) el.textContent = labels[lbl];
        });
        // Re-initialize editable cells after clearing
        initEditableTableCells();
        initDeleteButtons();
        alert('Hệ thống đã hoàn tác và khôi phục trạng thái mặc định thành công!');
    }
}

// --- THỜI GIAN & CHUẨN ISO 8601 WEEK SELECTOR ---
function initRealTimeClock() {
    const clockEl = document.getElementById("real-time-clock");
    if (!clockEl) return;
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = `⏱ Hệ thống: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;
    }, 1000);
}

function initIsoWeekSelector() {
    const today = new Date();
    if (document.getElementById('ws-today')) document.getElementById('ws-today').textContent = formatDateVn(today);
    if (document.getElementById('ws-current-week')) document.getElementById('ws-current-week').textContent = 'W' + getISOWeekNumber(today).week;
    
    var dateInput = document.getElementById('ws-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    }
    
    if (dateInput) {
        dateInput.addEventListener("change", handleWeekDateChange);
    }
    updateSelectedWeekDisplay();
}

function getISOWeekNumber(date) {
    if (!date || isNaN(date.getTime())) return { week: 27, year: 2026 };
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    var year = d.getFullYear();
    var yearStart = new Date(year, 0, 1);
    var week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { week: isNaN(week) ? 27 : week, year: isNaN(year) ? 2026 : year };
}

// SỬA LỖI CHU KỲ THỜI GIAN: Tính toán chính xác khoảng từ Thứ Hai đến Chủ Nhật theo chuẩn ISO 8601
function getISOWeekRange(year, week) {
    var d = new Date(year, 0, 1);
    var dayNum = d.getDay() || 7;
    var diff = 1 - dayNum;
    if (dayNum > 4) diff += 7;
    var firstMonday = new Date(year, 0, 1 + diff);
    
    var ISOweekStart = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);
    var ISOweekEnd = new Date(ISOweekStart.getTime() + 6 * 86400000);
    return { start: ISOweekStart, end: ISOweekEnd };
}

function changeWeek(delta) {
    var dateStr = document.getElementById('ws-date').value.trim();
    if (!dateStr) return;
    var parts = dateStr.split('-');
    var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    date.setDate(date.getDate() + delta * 7);
    
    document.getElementById('ws-date').value = date.getFullYear() + '-' + 
                                               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                                               String(date.getDate()).padStart(2, '0');
    updateSelectedWeekDisplay();
    if (document.getElementById('ws-auto-apply')?.checked) {
        applyWeekToReport(true);
    }
}

function handleWeekDateChange() {
    updateSelectedWeekDisplay();
    if (document.getElementById('ws-auto-apply')?.checked) {
        applyWeekToReport(true);
    }
}

function updateSelectedWeekDisplay() {
    var dateStr = document.getElementById('ws-date').value.trim();
    if (!dateStr) return;
    var parts = dateStr.split('-');
    var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var weekInfo = getISOWeekNumber(date);
    var range = getISOWeekRange(weekInfo.year, weekInfo.week);
    document.getElementById('ws-selected-week').textContent = '→ W' + weekInfo.week + ' (' + formatDateVn(range.start) + ' - ' + formatDateVn(range.end) + '/' + weekInfo.year + ')';
}

function applyWeekToReport(silent) {
    var dateStr = document.getElementById('ws-date').value.trim();
    if (!dateStr) return;
    var parts = dateStr.split('-');
    var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var weekInfo = getISOWeekNumber(date);
    
    var shift = weekInfo.week - currentBaseWeek;
    currentBaseWeek = weekInfo.week;

    document.title = 'Dự Đoán Dòng Tiền W' + weekInfo.week + ' - Báo Cáo Thu Chi';
    var h1 = document.querySelector('header h1');
    if (h1) h1.textContent = 'A. Báo Thu Chi - Dự Đoán Dòng Tiền W' + weekInfo.week;

    var range = getISOWeekRange(weekInfo.year, weekInfo.week);
    var headerSub = document.querySelector('header div:first-child div:last-child');
    if (headerSub) headerSub.textContent = 'Chu kỳ: ' + formatDateVn(range.start) + ' - ' + formatDateVn(range.end) + '/' + weekInfo.year;

    var dateEl = document.querySelector('.meta-info');
    if (dateEl) {
        dateEl.innerHTML = 'Người lập: <strong>@Kim Phuong</strong><br>Ngày xuất bản: ' + formatDateVn(range.start) + '<br><div id="real-time-clock" style="margin-top: 4px; font-size: 13px; color: #fbbf24;"></div><button class="btn-process btn-danger btn-sm" id="btn-clear-all" style="margin-top: 8px;">🗑 Xóa Tất Cả Dữ Liệu</button>';
        document.getElementById("btn-clear-all").addEventListener("click", clearAllData);
    }

    // Tịnh tiến toàn bộ các thuộc tính [data-label] và text thuần chứa hậu tố Wxx trong hệ thống HTML
    document.querySelectorAll('[data-label]').forEach(function(el) {
        var label = el.getAttribute('data-label');
        if (!label) return;
        var newLabel = label.replace(/W(\d+)/g, (m, n) => 'W' + (parseInt(n) + shift));
        el.setAttribute('data-label', newLabel);
        
        if (el.children.length === 0) {
            el.textContent = el.textContent.replace(/W(\d+)/g, (m, n) => 'W' + (parseInt(n) + shift));
        }
    });

    document.querySelectorAll('h1, h2, h3, h4').forEach(function(heading) {
        if (heading.children.length === 0) {
            heading.textContent = heading.textContent.replace(/W(\d+)/g, (m, n) => 'W' + (parseInt(n) + shift));
        }
    });

    // Nếu đang có dữ liệu trong Khung nhập, tự động chạy lại để cập nhật đồng bộ sang tuần mới
    if (document.getElementById('rawDataInput').value.trim()) {
        processRawData();
    }

    if (!silent) {
        alert('Đã cập nhật toàn bộ báo cáo sang tuần W' + weekInfo.week);
    }
}

// --- XUẤT FILE BÁO CÁO TEMPLATE ---
function collectExportData() {
    var rawInput = document.getElementById('rawDataInput').value.trim();
    var dataMap = {};

    if (rawInput) {
        var lines = rawInput.split('\n');
        lines.forEach(function(line) {
            if (!line.trim()) return;
            var parts = line.split('|');
            if (parts.length >= 3) {
                var label = parts[0].trim();
                var value = parts[1].trim();
                var type = parts[2] ? parts[2].trim().toLowerCase() : 'so-tien';
                var han = parts[3] || '';
                var action = parts[4] ? parts[4].trim().toLowerCase() : '';
                var numericValue = parseCurrency(value);
                dataMap[label] = { value: numericValue, type: type, han: han, action: action };
            }
        });
    }

    var tableActions = {
        'table-body-luong': 'chi',
        'table-body-priority1': 'chi',
        'table-body-priority2': 'chi',
        'table-body-pipeline': 'thu'
    };

    Object.keys(tableActions).forEach(function(tbodyId) {
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        var action = tableActions[tbodyId];

        tbody.querySelectorAll('tr[data-label]').forEach(function(tr) {
            var rowLabel = tr.getAttribute('data-label');
            if (!rowLabel) return;

            var soTienCell = tr.querySelector('[data-field="so-tien"]');
            var soTienValue = soTienCell ? parseCurrency(soTienCell.textContent) : 0;
            var unitValue = tr.cells[4] ? tr.cells[4].textContent.trim() : 'VNĐ';
            var weekValue = tr.cells[5] ? tr.cells[5].textContent.trim() : ('W' + currentBaseWeek);

            dataMap[rowLabel] = {
                value: soTienValue,
                type: 'so-tien',
                han: weekValue,
                action: action
            };
        });
    });

    var outputLines = [];
    Object.keys(dataMap).forEach(function(label) {
        var item = dataMap[label];
        outputLines.push(label + ' | ' + formatCurrency(item.value) + ' | ' + item.type + ' | ' + item.han + ' | ' + item.action);
    });

    return outputLines.join('\n');
}

function exportToWord() {
    var exportData = collectExportData();
    if (!exportData || !exportData.trim()) {
        alert('Không có dữ liệu để xuất Word!');
        return;
    }
    var weekNum = parseInt(document.getElementById('ws-current-week').textContent.replace('W', ''), 10) || 27;
    var params = 'data=' + encodeURIComponent(exportData) + '&week=' + weekNum;
    window.open('du_doan_dong_tien_TEMPLATE.html?' + params, '_blank');
}
function updateDOMElement(label, value, action) {
    var normalize = (str) => str.toLowerCase().replace(/\s+/g, '').replace(/đ/g, '₫');
    var targetNorm = normalize(label);
    var isFound = false;

    // 1. Cập nhật các ô KPI độc lập (data-label nằm ngoài bảng)
    var elements = document.querySelectorAll('[data-label]');
    elements.forEach(function(el) {
        if (normalize(el.getAttribute('data-label') || '') === targetNorm) {
            if (action === 'dem') {
                el.textContent = value + ' khoản';
            } else {
                el.textContent = formatCurrency(value);
                el.classList.remove("text-warning");
            }
            isFound = true;
        }
    });

    // 2. Cập nhật hàng trong bảng nếu đã có sẵn
    var tableRows = document.querySelectorAll('table tbody tr');
    tableRows.forEach(function(row) {
        var rowLabel = row.getAttribute('data-label') || '';
        if (normalize(rowLabel) === targetNorm) {
            var soTienCell = row.querySelector('[data-field="so-tien"]');
            if (soTienCell) {
                soTienCell.textContent = formatCurrency(value);
                isFound = true;
            }
        }
    });

    // Re-initialize editable for dynamically added rows
    initEditableTableCells();

    // 3. TỰ ĐỘNG THÊM DÒNG MỚI NẾU KHÔNG TÌM THẤY NHÃN TRÊN GIAO DIỆN
    if (!isFound && value > 0) {
        let targetBodyId = '';
        let badgeClass = 'badge-warning';
        let badgeText = label;
        
        // Xác định bảng để chèn dòng mới dựa vào 'action' hoặc nội dung nhãn
        const lowerAction = action.toLowerCase();
        const lowerLabel = label.toLowerCase();
        if (lowerAction.includes('thu') || lowerAction.includes('thu nhập') || lowerLabel.includes('sale') || lowerLabel.includes('lượng')) {
            targetBodyId = 'table-body-pipeline';
            badgeClass = 'badge-success';
            if (lowerLabel.includes('sale')) {
                badgeText = 'Doanh thu';
            } else {
                badgeText = 'Dự án lớn';
            }
        } else if (lowerAction.includes('chi') || lowerLabel.includes('chi') || lowerLabel.includes('phí') || lowerLabel.includes('tiền thuê') || lowerLabel.includes('internet')) {
            targetBodyId = 'table-body-priority1';
            badgeClass = 'badge-warning';
            badgeText = 'Chi phí';
        } else {
            // Mặc định cho các mục khác
            targetBodyId = 'table-body-priority1';
            badgeClass = 'badge-info';
            badgeText = 'Phát sinh';
        }

        var tbody = document.getElementById(targetBodyId);
        if (tbody) {
            var nextStt = tbody.querySelectorAll('tr').length + 1;
            tbody.insertAdjacentHTML('beforeend', `
                <tr data-label="${label}">
                    <td style="text-align: center;"><button class="btn-delete-row" title="Xóa dòng này">×</button></td>
                    <td contenteditable="true">${nextStt.toString().padStart(2, '0')}</td>
                    <td contenteditable="true"><strong>${label}</strong></td>
                    <td class="text-danger font-mono" data-field="so-tien" contenteditable="true">${formatCurrency(value)}</td>
                    <td contenteditable="true">VNĐ</td>
                    <td contenteditable="true">W${currentBaseWeek}</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                </tr>
            `);
            initDeleteButtons();
            updateTotalsOnEdit();
        }
    }
}
