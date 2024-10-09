// 選択された行を削除
function deleteSelectedRows() {
    document.getElementById('deleteForm').submit();
}

// 日付でソート (新しい日付が上に来る)
function sortByDate() {
    const table = document.getElementById("stockTable").querySelector("tbody");
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.sort((a, b) => new Date(b.cells[1].innerText) - new Date(a.cells[1].innerText));
    rows.forEach(row => table.appendChild(row));
}

// 在庫を追加
function addStock() {
    const table = document.getElementById("stockTable").querySelector("tbody");
    const form = document.getElementById("stockForm");

    const newRow = document.createElement("tr");

    // テーブルに追加するデータの順番をテーブル列に合わせて修正
    const data = [
        form.date.value,              // 日付
        form.itemName.value,          // 商品名
        form.purchaseQuantity.value,  // 購入数
        form.purchasePrice.value,     // 購入価格
        form.unitPrice.value || "-",  // 単価 (未入力の場合は"-"を表示)
        "-",                          // 残量（計算等のため現在は仮のデータ）
        "-"                           // 残量高（計算等のため現在は仮のデータ）
    ];

    data.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value || "0";  // データが無い場合は"0"を表示
        newRow.appendChild(td);
    });

    newRow.setAttribute("onclick", "toggleRowSelection(this)");  // 行をクリックして選択できるように
    table.appendChild(newRow);

    // フォームのリセットとモーダルを閉じる
    form.reset();
    $('#addStockModal').modal('hide');
}
