// 選択された行を削除
function deleteSelectedRows() {
document.getElementById('deleteForm').submit();
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
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortOrder = urlParams.get('sortOrder') === 'asc' ? 'desc' : 'asc'; // 昇順と降順を切り替える

    // サーバーにソートリクエストを送信
    window.location.href = `/expenses?sortField=date&sortOrder=${currentSortOrder}`;
}


