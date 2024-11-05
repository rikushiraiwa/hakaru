// 選択された行を削除
function deleteSelectedRows() {
    document.getElementById('deleteForm').submit();
}

// 日付でソート
function sortByDate() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentSortField = urlParams.get('sortField');
    const currentSortOrder = urlParams.get('sortOrder') === 'asc' ? 'desc' : 'asc'; // 昇順と降順を切り替える

    // サーバーにソートリクエストを送信
    window.location.href = `/stocks/stockHome?sortField=date&sortOrder=${currentSortOrder}`;
}


// // 在庫をテーブルに追加
// function addStock() {
//     const table = document.getElementById("stockTable").querySelector("tbody");
//     const form = document.getElementById("stockForm");

//     const newRow = document.createElement("tr");

//     // テーブルに追加するデータの順番をテーブル列に合わせて修正
//     const data = [
//         form.date.value,              // 日付
//         form.itemName.value,          // 商品名
//         form.purchaseQuantity.value,  // 購入数
//         form.purchasePrice.value,     // 購入価格
//         form.unitPrice.value || "-",  // 単価 (未入力の場合は"-"を表示)
//         "-",                          // 残量（計算等のため現在は仮のデータ）
//         "-"                           // 残量高（計算等のため現在は仮のデータ）
//     ];

//     data.forEach((value) => {
//         const td = document.createElement("td");
//         td.textContent = value || "0";  // データが無い場合は"0"を表示
//         newRow.appendChild(td);
//     });

//     newRow.setAttribute("onclick", "toggleRowSelection(this)");  // 行をクリックして選択できるように
//     table.appendChild(newRow);

//     // フォームのリセットとモーダルを閉じる
//     form.reset();
//     $('#addStockModal').modal('hide');
// }




// ブートストラップのバリデーションを適用
document.addEventListener('DOMContentLoaded', function () {
    const stockForm = document.getElementById('stockForm');

    stockForm.addEventListener('submit', function (event) {
        if (!stockForm.checkValidity()) {
            event.preventDefault();  // フォームの送信を止める
            event.stopPropagation();
        }

        stockForm.classList.add('was-validated');  // バリデーションスタイルを適用
    }, false);
});