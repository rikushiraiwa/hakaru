document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み時に合計を計算
    calculateTotal();
});

// 選択された行を削除
function deleteSelectedRows() {
    const checkboxes = document.querySelectorAll('input[name="selectRow"]:checked'); // 選択されたチェックボックスを取得
    checkboxes.forEach(checkbox => {
        checkbox.closest('tr').remove(); // チェックボックスが含まれている行を削除
    });
    calculateTotal(); // 合計を再計算
}


// 合計の計算
function calculateTotal() {
    const rows = document.querySelectorAll('#recipeTable tbody tr');
    let total = 0;
    rows.forEach(row => {
        const content = parseFloat(row.cells[2].innerText.trim()) || 0;
        const unitPrice = parseFloat(row.cells[3].innerText.trim()) || 0;
        const amountUsage = parseFloat(row.cells[4].innerText.trim()) || 0;
        const amountFee = parseFloat(row.cells[5].innerText.trim()) || 0;

        total += content + unitPrice + amountUsage + amountFee;
    });

    // 合計を表示する要素に値を設定
    document.getElementById('totalValue').innerText = Math.round(total);
}

// 一時的にレシピアイテムを保存するための配列
let tempRecipeItems = [];

// レシピを追加
function addRecipe() {
    const form = document.getElementById("recipeForm");
    const newItem = {
        itemName: form.itemName.value,
        content: form.content.value || 0,
        unitPrice: form.unitPrice.value || 0,
        amountUsage: form.amountUsage.value || 0,
        amountFee: form.amountFee.value || 0
    };

    // フロントエンドに一時的にデータを保持
    tempRecipeItems.push(newItem);

    // テーブルに新しいデータを表示
    const table = document.getElementById("recipeTable").querySelector("tbody");
    const newRow = document.createElement("tr");

    // 1列目にチェックボックスを追加
    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "selectRow"; // チェックボックスの名前を設定
    selectCell.appendChild(checkbox);
    newRow.appendChild(selectCell);

    // 残りのデータをテーブルに追加
    Object.values(newItem).forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        newRow.appendChild(td);
    });

    newRow.setAttribute("onclick", "toggleRowSelection(this)");  // 行をクリックして選択できるように
    table.appendChild(newRow);
    calculateTotal();

    // フォームのリセットとモーダルを閉じる
    form.reset();
    $('#addRecipeModal').modal('hide');
}


// レシピ全体をサーバーに送信
function submitRecipe() {
    const recipeName = document.getElementById('recipeNameInput').value;

    // レシピ名とアイテムをまとめてサーバーに送信
    fetch('/recipes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipeName: recipeName,
            items: tempRecipeItems
        }),
    })
    .then(response => response.json())
    .then(data => {
        // 成功時の処理
        console.log('Recipe submitted successfully:', data);
        window.location.href = '/recipeHome'; // ページ遷移やリセットなど
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

