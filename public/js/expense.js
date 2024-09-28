// 選択された行を削除
function deleteSelectedRows() {
document.getElementById('deleteForm').submit();
}

// 合計の計算
function calculateTotal() {
    const rows = document.querySelectorAll('#expenseTable tbody tr');
    let total = 0;
    rows.forEach(row => {
        const content = parseFloat(row.cells[3].innerText.trim()) || 0;  // Content列を加算
        const purchase = parseFloat(row.cells[4].innerText.trim()) || 0;
        const consumable = parseFloat(row.cells[5].innerText.trim()) || 0;
        const otherExpense = parseFloat(row.cells[6].innerText.trim()) || 0;
        const shippingCost = parseFloat(row.cells[7].innerText.trim()) || 0;  // ShippingCostは加算
        const discount = parseFloat(row.cells[8].innerText.trim()) || 0;      // Purchase Discountは引く
        const cash = parseFloat(row.cells[9].innerText.trim()) || 0;
        const credit = parseFloat(row.cells[10].innerText.trim()) || 0;        // Creditも加算

        total += content + purchase + consumable + otherExpense + shippingCost - discount + cash + credit;
    });
// 合計を表示する要素に値を設定
    document.getElementById('totalValue').innerText = total.toFixed(2);
}


//ダウンロード
document.getElementById('confirmDownload').addEventListener('click', async function () {
    const table = document.getElementById("expenseTable");
    const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.innerText).join(","));
    const csvContent = rows.join("\n");

    // BOM（Byte Order Mark）を追加してUTF-8として認識させる
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `expense_report_${new Date().getFullYear()}.csv`;
    downloadLink.click();
    URL.revokeObjectURL(url);

    // データベースからExpenseデータを全削除するリクエストを送信
    try {
        const response = await fetch('/expenses/delete-all', {
            method: 'DELETE',
        });
        if (response.ok) {
            // テーブルのデータを空にする
            const tbody = table.querySelector("tbody");
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            document.getElementById('totalValue').innerText = "0.00"; // 合計もリセット
            // モーダルを閉じる
            var confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
            confirmModal.hide();
        } else {
            console.error('Failed to delete data from database');
        }
    } catch (error) {
        console.error('Error deleting data:', error);
    }
});




// 日付でソート (新しい日付が上に来る)
function sortByDate() {
    const table = document.getElementById("expenseTable").querySelector("tbody");
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.sort((a, b) => new Date(b.cells[1].innerText) - new Date(a.cells[1].innerText));
    rows.forEach(row => table.appendChild(row));
}

// 経費を追加
function addExpense() {
    const table = document.getElementById("expenseTable").querySelector("tbody");
    const form = document.getElementById("expenseForm");

    const newRow = document.createElement("tr");
    const data = [
        form.date.value,
        form.content.value,
        form.supplier.value,
        form.purchase.value,
        form.consumable.value,
        form.otherExpense.value,
        form.shippingCost.value,
        form.purchaseDiscount.value,
        form.cash.value,
        form.credit.value
    ];

    data.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value || "0";
        newRow.appendChild(td);
    });

    newRow.setAttribute("onclick", "toggleRowSelection(this)");  // 行をクリックして選択できるように
    table.appendChild(newRow);
    calculateTotal();

    // フォームのリセットとモーダルを閉じる
    form.reset();
    $('#addExpenseModal').modal('hide');
}

// ページ読み込み時に合計を計算
window.onload = calculateTotal;