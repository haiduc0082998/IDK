const DEFAULT_DATA = {
  title: "DU DOAN DONG TIEN W27",
  period: "06/29 – 07/05/2026",
  owner: "@Bach Nguyen",
  report_date: "29/06/2026",
  report_cycle: "06/20 – 07/19/2026",
  kpi_t6:  { label: "KPI thang 06 (05/20–06/19)",  value: "1.000.000.000 đ" },
  thu_t6:  { label: "Tong thu W21–W25",             value: "300.597.074 đ (30,06% KPI)" },
  chi_t6:  { label: "Tong chi thang (DA+CD)",       value: "375.136.006 đ" },
  net_t6:  { label: "Net Cashflow thang 06",        value: "–74.538.932 đ (Thu < Chi)" },
  kpi_t7:  { label: "KPI thang 07 (06/20–07/19)",   value: "1.000.000.000 đ" },
  thu_t7:  { label: "Tong thu luy ke W26–W30",      value: "115.049.200 đ (11,50% KPI)" },
  chi_t7:  { label: "Tong du chi thang (DA+CD)",    value: "850.000.000 đ" },
  thu_w26: { label: "Tong thu W26",   value: "115.049.200 đ" },
  chi_w26: { label: "Tong chi W26",   value: "118.809.150 đ" },
  net_w26: { label: "Net Cashflow W26", value: "–3.759.950 đ (Thieu tien)" },
  dashboard: { thu_w27: "222.366.970 đ", chi_w27: "492.128.773 đ", thieu_hut: "–269.761.803 đ", pipeline: "1.450.000 đ" },
  mission01_total: "222.366.970 đ",
  must_total: "104.234.620 đ",
  must_items: [
    { amount:"53.080.000 đ",  desc:"sa_2506201707_duplex_thuthiemriver_164m2 — Dot 3 | 20% sau khi hoan thien HSDHTK", goal:"W27: Hoan thien HSDHTK → Gui DNTT → Thu tien", status:"Phai chi" },
    { amount:"1.476.658 đ",   desc:"sa_2410241156_bietthu_tranhungdao_650m2_hn — NCC Casa Bella Dot 3 (tam tinh) | Ly", goal:"W27: Doi soat GTDH → Gui DNTT → Thu tien", status:"Phai chi" },
  ],
  hard_total: "38.400.000 đ",
  hard_items: [
    { amount:"38.400.000 đ", desc:"sa_2512090941_club_cambodia_160m2 — Dot 3 | 20% sau khi ban giao ho so 2D", goal:"W27: Hoan thanh HS2D → Gui DNTT → Thu tien", status:"De xuat" },
  ],
  mission02_total: "356.831.258 đ",
  p01_total: "79.732.350 đ",
  p01_items: [
    { amount:"38.185.350 đ", desc:"sa_2410241156_bietthu_tranhungdao_650m2_hn — Dot 7 sau khi hoan thien thi cong", goal:"Cap nhat TG → Gui DNTT | Vi, Hien" },
  ],
  p02_total: "19.500.000 đ",
  p02_items: [
    { amount:"19.500.000 đ", desc:"Dot 2 | 30% PLHD01 khi gui HSDHTK 2D khu Coffee 07/12/26", goal:"W28: Lam ro KL HSTKBG | Vi, Hien" },
  ],
  p03_total: "257.598.908 đ",
  p03_items: [],
  sale_items: [],
  duchi_total: "492.128.773 đ",
  duan_chi: "58.204.888 đ",
  codinh_chi: "433.923.885 đ",
  must_luong_total: "326.861.029 đ",
  must_luong_items: [
    { stt:"1", amount:"35.000.000 đ",  desc:"Luong T03.26 lan 16", han:"–", tre:"–", status:"Phai chi" },
    { stt:"2", amount:"118.698.750 đ", desc:"Luong T04.26 lan 7",  han:"–", tre:"–", status:"Phai chi" },
    { stt:"3", amount:"173.162.279 đ", desc:"Luong T05.26 lan 3",  han:"–", tre:"–", status:"Phai chi" },
  ],
  p01chi_total: "107.062.856 đ",
  p01chi_items: [],
  p02chi_total: "325.084.792 đ",
  p02chi_items: [],
  pipeline_total: "1.450.000 đ",
  pipeline_items: [],
  summary: {
    tong_thu: "222.366.970 đ",
    tong_chi: "492.128.773 đ",
    thieu_hut: "–269.761.803 đ",
    ap_luc: "Luong ton dong T03–T05 (326,8M)",
    rui_ro: "Thue GTGT Q1.26 tre 9 tuan",
    pipeline: "1.450.000 đ (VND)"
  },
  top5: [
    "Day luong ton dong — Xu ly 326,8M luong T03–T05",
    "Thu 79,7M tu Priority 01",
    "Chot 3 deal Sale lon",
    "Xu ly Thue GTGT Q1.26 + BHXH T06",
    "Day Check vibes KS Bao Khanh"
  ]
};

const DATA = window.EXPORT_DATA || DEFAULT_DATA;

function badgeClass(status){
  const s = (status||"").toLowerCase();
  if (s.includes("phai chi") || s.includes("tre")) return "badge-red";
  if (s.includes("de xuat")) return "badge-orange";
  if (s.includes("cho duyet")) return "badge-yellow";
  if (s.includes("dung han")) return "badge-green";
  return "badge-gray";
}
function rowTintClass(status){
  const s=(status||"").toLowerCase();
  if (s.includes("phai chi")) return "row-red";
  if (s.includes("de xuat")) return "row-orange";
  return "";
}
function badge(status){
  return '<span class="badge ' + badgeClass(status) + '">[' + status + ']</span>';
}
function esc(s){ return s==null ? "" : String(s); }

function kvTable(rows){
  let html = '<table class="kv">';
  rows.forEach(r=>{
    html += '<tr><td class="label">' + esc(r.label) + '</td><td class="value" style="color:' + (r.color||'inherit') + '">' + esc(r.value) + '</td></tr>';
  });
  html += '</table>';
  return html;
}

function itemTable(items, withStatus){
  let html = '<table class="items"><tr><th>So tien</th><th>Mo ta / Goal</th>';
  if (withStatus) html += '<th>Trang thai</th>';
  html += '</tr>';
  items.forEach(it=>{
    html += '<tr class="' + rowTintClass(it.status) + '">';
    html += '<td class="amount">' + esc(it.amount) + '</td>';
    html += '<td class="desc">' + esc(it.desc) + (it.goal? '<span class="goal">→ ' + esc(it.goal) + '</span>':'') + '</td>';
    if (withStatus) html += '<td class="status">' + badge(it.status) + '</td>';
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

function chiTable(items){
  let html = '<table class="chi"><tr><th>STT</th><th>So tien</th><th>Mo ta</th><th>Han</th><th>Tre</th><th>Trang thai</th></tr>';
  items.forEach(it=>{
    html += '<tr class="' + rowTintClass(it.status) + '">';
    html += '<td class="stt">' + esc(it.stt) + '</td>';
    html += '<td class="amount">' + esc(it.amount) + '</td>';
    html += '<td class="desc">' + esc(it.desc) + '</td>';
    html += '<td class="han">' + esc(it.han) + '</td>';
    html += '<td class="tre">' + esc(it.tre) + '</td>';
    html += '<td class="status">' + badge(it.status) + '</td>';
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

function dashboardTable(d){
  return '<table class="dashboard"><tr><th>Thu</th><th>Chi</th><th>Thieu hut</th><th>Pipeline</th></tr><tr><td style="color:var(--green)">' + esc(d.thu_w27) + '</td><td style="color:var(--red)">' + esc(d.chi_w27) + '</td><td style="color:var(--red)">' + esc(d.thieu_hut) + '</td><td style="color:var(--orange)">' + esc(d.pipeline) + '</td></tr></table>';
}

function renderPage1(d){
  return '<div class="title">' + esc(d.title) + '</div><div class="subtitle">' + esc(d.period) + ' &nbsp;|&nbsp; ' + esc(d.owner) + '</div><hr class="rule"><div class="sec-header">DASHBOARD CEO / CFO</div>' + dashboardTable(d.dashboard) + '<div class="alert-red">CASH GAP: ' + esc(d.dashboard.thieu_hut) + ' &nbsp;|&nbsp; Thu < Chi</div><div class="sec-header">A. BAO THU CHI</div><div class="sub-header">Theo thang 06</div>' + kvTable([
    { label: d.kpi_t6.label, value: d.kpi_t6.value },
    { label: d.thu_t6.label, value: d.thu_t6.value, color:"var(--green)" },
    { label: d.chi_t6.label, value: d.chi_t6.value },
    { label: d.net_t6.label, value: d.net_t6.value, color:"var(--red)" },
  ]) + '<div class="sub-header">Theo thang 07</div>' + kvTable([
    { label: d.kpi_t7.label, value: d.kpi_t7.value },
    { label: d.thu_t7.label, value: d.thu_t7.value, color:"var(--orange)" },
    { label: d.chi_t7.label, value: d.chi_t7.value },
  ]) + '<div class="sub-header">W26 Ket qua thuc te</div>' + kvTable([
    { label: d.thu_w26.label, value: d.thu_w26.value, color:"var(--green)" },
    { label: d.chi_w26.label, value: d.chi_w26.value },
    { label: d.net_w26.label, value: d.net_w26.value, color:"var(--red)" },
  ]);
}

function renderPage2(d){
  return '<div class="sec-header must-header">B. DU THU THEO DU AN / NHA THAU — ' + esc(d.mission01_total) + '</div><div class="sub-header" style="color:var(--danger-color)">MUST — ' + esc(d.must_total) + '</div>' + itemTable(d.must_items, true) + '<div class="sub-header priority01-header" style="color:white">HARD — ' + esc(d.hard_total) + '</div>' + itemTable(d.hard_items, true) + '<div class="sub-header priority02-header" style="color:white">MISSION 02 — BAO VE DONG TIEN — ' + esc(d.mission02_total) + '</div><div class="sub-header" style="color:var(--danger-color)">Priority 01 — ' + esc(d.p01_total) + '</div>' + itemTable(d.p01_items, false) + '<div class="sec-header must-header">D. TONG DU CHI — ' + esc(d.duchi_total) + '</div>' + kvTable([
    { label:"Du an", value: d.duan_chi },
    { label:"Co dinh", value: d.codinh_chi, color:"var(--danger-color)" },
  ]) + '<div class="sub-header must-header" style="color:white">MUST – LUONG TON DONG — ' + esc(d.must_luong_total) + '</div>' + chiTable(d.must_luong_items) + '<div class="sec-header card-conclusion">CEO / CFO SUMMARY</div>' + kvTable([
    { label:"Tong du thu", value: d.summary.tong_thu, color:"var(--success-color)" },
    { label:"Tong du chi", value: d.summary.tong_chi, color:"var(--danger-color)" },
  ]) + '<div class="footer-note">Bao cao tu dong — Ngay lap: ' + esc(d.report_date) + ' &nbsp;|&nbsp; Ky: ' + esc(d.report_cycle) + '</div>';
}

function exportTemplateToWord() {
    var pages = document.querySelectorAll('.page');
    var htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>BaoCaoDongTienW27</title><style>';
    htmlContent += 'body{font-family:Arial,sans-serif;font-size:13pt;line-height:1.5;color:#313131}.page{width:210mm;min-height:297mm;padding:15mm 20mm;margin:0}.title{font-size:18pt;font-weight:bold;margin-bottom:4px}.subtitle{font-size:10pt;color:#6E6E73;margin-bottom:14px}';
    htmlContent += '.sec-header{background:#0f1b2d;color:white;border:1px solid #e2e8f0;padding:10px 12px;font-size:14pt;font-weight:bold;margin-bottom:12px}.alert-red{background:#fee2e2;border:1.5px solid #c0392b;color:#9b1c1c;font-weight:bold;font-size:11pt;padding:10px 12px;margin-bottom:14px}';
    htmlContent += '.must-header{background:#c0392b;color:white}.priority01-header{background:#f97316;color:white}.priority02-header{background:#0f1b2d;color:white}.pipeline-header{background:#f39c12;color:white}';
    htmlContent += '.kv{width:100%;border-collapse:collapse;margin-bottom:14px}.kv td{border:1px solid #e2e8f0;padding:10px 12px;font-size:13pt}.kv td.label{width:45%;color:#6E6E73;font-size:10pt}.kv td.value{width:55%;font-weight:bold;text-align:right}';
    htmlContent += '.dashboard{width:100%;border-collapse:collapse;margin-bottom:14px}.dashboard th,.dashboard td{border:1px solid #e2e8f0;background:#dbeafe;text-align:center;padding:12px 8px;width:25%}.dashboard th{font-size:10pt;color:#6E6E73;font-weight:bold}.dashboard td{font-size:14pt;font-weight:bold}';
    htmlContent += '.dashboard td.thu{color:#2563eb}.dashboard td.chi{color:#c0392b}.dashboard td.thieu{color:#c0392b}.dashboard td.pipeline{color:#f39c12}';
    htmlContent += '.items{width:100%;border-collapse:collapse;margin-bottom:14px}.items th{background:#f8fafc;border:1px solid #e2e8f0;font-size:10pt;color:#6E6E73;font-weight:bold;padding:10px 12px}.items td{border:1px solid #e2e8f0;padding:10px 12px;font-size:13pt}';
    htmlContent += '.items td.amount{font-weight:bold;width:22%}.items td.desc{width:58%}.items td.status{width:20%;text-align:center}';
    htmlContent += '.chi{width:100%;border-collapse:collapse;margin-bottom:14px}.chi th{background:#f8fafc;border:1px solid #e2e8f0;font-size:10pt;color:#6E6E73;font-weight:bold;padding:10px 8px}.chi td{border:1px solid #e2e8f0;padding:10px 8px;font-size:13pt}.chi td.stt{width:6%}.chi td.amount{width:18%;font-weight:bold}.chi td.status{width:16%}';
    htmlContent += '.badge{display:inline-block;font-size:10pt;font-weight:bold;padding:3px 8px;border-radius:12px}.badge-blue{background:#dbeafe;color:#1e40af}.badge-orange{background:#fef3c7;color:#92400e}.badge-yellow{background:#FFFBEB;color:#f39c12}.badge-green{background:#dcfce7;color:#065f46}.badge-red{background:#fee2e2;color:#c0392b}';
    htmlContent += 'tr.row-red td{background:#fee2e2}.tr.row-orange td{background:#fef3c7}.footer-note{text-align:center;font-size:9pt;color:#718096;margin-top:24px}.card-conclusion{border:4px solid #27ae60}';
    htmlContent += '</style></head><body>';
    pages.forEach(function(page) {
        htmlContent += page.innerHTML;
    });
    htmlContent += '</body></html>';
    var blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Bao_Cao_Dong_Tien_W27_Template.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function populateDataFromRaw(rawInput) {
    var lines = rawInput.split('\n');
    var dataMap = {};
    lines.forEach(function(line) {
        var parts = line.split('|');
        if (parts.length >= 3) {
            var label = parts[0].trim();
            var value = parts[1].trim();
            dataMap[label] = value;
        }
    });
    function formatCurrency(value) {
        if (value === undefined || value === null || isNaN(value)) return '0 đ';
        return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
    }
    function parseCurrency(str) {
        if (!str) return 0;
        var num = parseFloat(str.toString().replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : Math.abs(num);
    }
    if (dataMap['Dự Thu Tuần W27']) {
        var thuVal = parseCurrency(dataMap['Dự Thu Tuần W27']);
        DATA.dashboard.thu_w27 = formatCurrency(thuVal);
    }
    if (dataMap['Dự Chi Tuần W27']) {
        var chiVal = parseCurrency(dataMap['Dự Chi Tuần W27']);
        DATA.dashboard.chi_w27 = formatCurrency(chiVal);
    }
    if (dataMap['Net Cashflow']) {
        var net = parseCurrency(dataMap['Net Cashflow']);
        DATA.dashboard.thieu_hut = '-' + formatCurrency(net);
    }
    if (dataMap['Tổng thu W21-W25']) {
        var thu06Val = parseCurrency(dataMap['Tổng thu W21-W25']);
        var percent06 = ((thu06Val / 1000000000) * 100).toFixed(2);
        DATA.thu_t6 = { label: "Tong thu W21–W25", value: formatCurrency(thu06Val) + ' (' + percent06 + '% KPI)' };
    }
    if (dataMap['Tổng thu W26-W30']) {
        var thu07Val = parseCurrency(dataMap['Tổng thu W26-W30']);
        var percent07 = ((thu07Val / 1000000000) * 100).toFixed(2);
        DATA.thu_t7 = { label: "Tong thu luy ke W26–W30", value: formatCurrency(thu07Val) + ' (' + percent07 + '% KPI)' };
    }
    document.getElementById("page1").innerHTML = renderPage1(DATA);
    document.getElementById("page2").innerHTML = renderPage2(DATA);
}

document.addEventListener('DOMContentLoaded', function() {
    var exportBtn = document.createElement('button');
    exportBtn.id = 'exportBtn';
    exportBtn.innerHTML = '📤 Xuat Word';
    exportBtn.style.cssText = 'position:fixed;top:20px;right:20px;background:#0A4FA0;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-weight:bold;z-index:1000;';
    document.body.appendChild(exportBtn);
    exportBtn.addEventListener('click', exportTemplateToWord);
    var urlParams = new URLSearchParams(window.location.search);
    var rawInput = urlParams.get('data');
    console.log('Raw input from URL:', rawInput);
    if (rawInput) {
        try {
            populateDataFromRaw(decodeURIComponent(rawInput));
        } catch (e) {
            console.error('Error parsing data:', e);
            document.getElementById("page1").innerHTML = renderPage1(DATA);
            document.getElementById("page2").innerHTML = renderPage2(DATA);
        }
    } else {
        document.getElementById("page1").innerHTML = renderPage1(DATA);
        document.getElementById("page2").innerHTML = renderPage2(DATA);
    }
});