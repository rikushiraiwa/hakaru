document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み時にlocalStorageからrecipeNameを設定
    const savedRecipeName = localStorage.getItem('recipeName');
    if (savedRecipeName) {
        document.getElementById('recipeNameInput').value = savedRecipeName;
    }

    // recipeNameInputの値をlocalStorageに保存
    document.getElementById('recipeNameInput').addEventListener('input', function () {
        const recipeName = this.value;
        localStorage.setItem('recipeName', recipeName);
    });

    // モーダルが開いたときにrecipeNameをhidden inputに設定
    document.getElementById('addRecipeModal').addEventListener('shown.bs.modal', function () {
        const recipeNameInput = document.getElementById('recipeNameInput').value;
        document.getElementById('recipeNameHidden').value = recipeNameInput;
    });

    // ページ読み込み時に合計を計算
    calculateTotal();
});

// 選択された行を削除
function deleteSelectedRows() {
    document.getElementById('deleteForm').submit();
}

// 合計の計算
function calculateTotal() {
    const rows = document.querySelectorAll('#recipeTable tbody tr');
    let total = 0;
    rows.forEach(row => {
        const content = parseFloat(row.cells[3].innerText.trim()) || 0;
        const unitPrice = parseFloat(row.cells[4].innerText.trim()) || 0;
        const amountUsage = parseFloat(row.cells[5].innerText.trim()) || 0;
        const amountFee = parseFloat(row.cells[6].innerText.trim()) || 0;

        total += content + unitPrice + amountUsage + amountFee;
    });

    // 合計を表示する要素に値を設定
    document.getElementById('totalValue').innerText = Math.round(total);
}

// レシピを追加
function addRecipe() {
    const table = document.getElementById("recipeTable").querySelector("tbody");
    const form = document.getElementById("recipeForm");

    const newRow = document.createElement("tr");
    const data = [
        form.recipeName.value,
        form.itemName.value,
        form.content.value,
        form.unitPrice.value,
        form.amountUsage.value,
        form.amountFee.value,
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
    $('#addRecipeModal').modal('hide');
}
