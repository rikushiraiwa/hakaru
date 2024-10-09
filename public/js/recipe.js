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

    // すでにモーダルに含まれているフィールドから値を取得
    const itemName = form.itemName.value;
    const content = form.content.value || 0;
    const amountUsage = form.amountUsage.value || 0;

    // 選択されたItemNameに対応するUnitPriceをセット
    const selectedStock = stocks.find(stock => stock.itemName === itemName);
    const unitPrice = selectedStock ? selectedStock.unitPrice : 0;

    // AmountFeeを計算
    const amountFee = unitPrice * amountUsage;

    // 新しいレシピアイテムのオブジェクトを作成
    const newItem = {
        itemName,
        content,
        unitPrice: unitPrice || 0,
        amountUsage: amountUsage || 0,
        amountFee: amountFee || 0
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

    // 新しい行をテーブルに追加
    table.appendChild(newRow);

    // 合計金額の再計算
    calculateTotal();

    // フォームのリセットとモーダルを閉じる
    form.reset();
    $('#addRecipeModal').modal('hide');
}


// レシピ全体をサーバーに送信
function submitRecipe() {
    const recipeName = document.getElementById('recipeNameInput').value;
    const recipeImage = document.getElementById('recipeImage').files[0];

    const formData = new FormData();
    formData.append('recipeName', recipeName);
    formData.append('recipeImage', recipeImage);
    formData.append('items', JSON.stringify(tempRecipeItems)); // アイテムリストを文字列に変換して送信

    // レシピ名とアイテム、画像をサーバーに送信
    fetch('/recipes', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log('Recipe submitted successfully:', data);
        window.location.href = '/recipeHome'; // ページ遷移やリセットなど
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


function submitEditedRecipe() {
    const recipeId = document.getElementById('recipeData').getAttribute('data-recipe-id');
    const recipeName = document.getElementById('recipeNameInput').value;
    const recipeImage = document.getElementById('recipeImage').files[0];

    // テーブル内のアイテムをすべて取得
    const rows = document.querySelectorAll('#recipeTable tbody tr');
    let updatedItems = [];
    
    rows.forEach(row => {
        const cells = row.cells;
        const item = {
            itemName: cells[1].innerText,
            content: parseFloat(cells[2].innerText) || 0,
            unitPrice: parseFloat(cells[3].innerText) || 0,
            amountUsage: parseFloat(cells[4].innerText) || 0,
            amountFee: parseFloat(cells[5].innerText) || 0
        };
        updatedItems.push(item);
    });

    const formData = new FormData();
    formData.append('recipeName', recipeName);
    if (recipeImage) {
        formData.append('recipeImage', recipeImage); // 画像ファイルを追加
    }
    formData.append('items', JSON.stringify(updatedItems)); // 残っているアイテムリストを送信

    fetch(`/recipes/${recipeId}?_method=PUT`, {
        method: 'POST',  // PUTをサポートしないため、POSTを使い?_method=PUTで偽装
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log('Recipe updated successfully:', data);
        window.location.href = '/recipeHome'; // 更新後にレシピホームにリダイレクト
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


