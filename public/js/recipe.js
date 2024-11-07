document.addEventListener('DOMContentLoaded', () => {
      // ページ読み込み時に合計を計算
    calculateTotal();
});

// 選択された行を削除
function deleteSelectedRows() {
    const checkboxes = document.querySelectorAll('input[name="selectRow"]:checked'); // 選択されたチェックボックスを取得

    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr'); // チェックボックスが含まれている行を取得
        const itemId = row.getAttribute('data-item-id'); // data-item-id属性からIDを取得

        // tempRecipeItemsから一致するIDを持つアイテムを削除
        tempRecipeItems = tempRecipeItems.filter(item => item.id !== itemId);

        // テーブルから行を削除
        row.remove();
    });

    calculateTotal(); // 合計を再計算
}

// 合計の計算
function calculateTotal() {
    const rows = document.querySelectorAll('#recipeTable tbody tr');
    let total = 0;
    rows.forEach(row => {
        const amountFee = parseFloat(row.cells[5].innerText.trim()) || 0;

        total += amountFee;
    });

    // 合計を表示する要素に値を設定
    document.getElementById('totalValue').innerText = Math.round(total);
}

// 一時的にレシピアイテムを保存するための配列
let tempRecipeItems = [];


function toggleNewItemField() {
    const itemSelect = document.getElementById("itemSelect");
    const newItemName = document.getElementById("newItemName");

    if (itemSelect.value === "new") {
        newItemName.style.display = "block"; // 新しいアイテム入力フィールドを表示
    } else {
        newItemName.style.display = "none";  // 非表示
    }
}

// レシピを追加
function addItem() {
    const form = document.getElementById("modalItemForm");
    const itemSelect = document.getElementById("itemSelect");
    const newItemNameInput = document.getElementById("newItemName");

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const selectedItem = itemSelect.value;
    const itemName = selectedItem === "new" ? newItemNameInput.value : selectedItem;
    const content = form.content.value || 0;
    const amountUsage = form.amountUsage.value || 0;

    const selectedStock = stocks.find(stock => stock.itemName === itemName);
    const unitPrice = selectedStock ? selectedStock.unitPrice : 0;
    const amountFee = unitPrice * amountUsage;

    const newItem = {
        id: `${itemName}-${Date.now()}`, // 一意のID
        itemName,
        content,
        unitPrice,
        amountUsage,
        amountFee
    };

    tempRecipeItems.push(newItem);

    const table = document.getElementById("recipeTable").querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.setAttribute('data-item-id', newItem.id); // 行に一意のIDを設定

    // チェックボックスのセルを追加
    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "selectRow";
    selectCell.appendChild(checkbox);
    newRow.appendChild(selectCell);

    // アイテムの内容を各セルに追加
    Object.values(newItem).forEach((value, index) => {
        if (index === 0) return; // IDをスキップ
        const td = document.createElement("td");
        td.textContent = value;
        newRow.appendChild(td);
    });

    table.appendChild(newRow);
    calculateTotal();

    form.reset();
    form.classList.remove('was-validated');
    $('#addItemModal').modal('hide');
}








document.addEventListener('DOMContentLoaded', () => {
    const recipeForm = document.getElementById('recipeForm');
    const saveRecipeBtn = document.getElementById('saveRecipeBtn');
    const modalItemForm = document.getElementById('modalItemForm');
    const recipeNameInput = document.getElementById('recipeNameInput');
    const recipeImageInput = document.getElementById('recipeImage');

    // Save Recipeボタンが押された時にバリデーションを実施
    saveRecipeBtn.addEventListener('click', function(event) {
        event.preventDefault();

        // フォームのバリデーションをチェック
        if (recipeForm.checkValidity()) {
            recipeForm.classList.add('was-validated');
            submitRecipe();  // バリデーションが通った場合のみsubmitRecipe関数を呼び出す
        } else {
            recipeForm.classList.add('was-validated');
        }
    });

    // モーダル内のAdd Recipeボタン押下時のバリデーション
    modalItemForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!modalItemForm.checkValidity()) {
            modalItemForm.classList.add('was-validated');
        } else {
            addRecipe();
        }
    });

    // レシピデータの送信処理
    function submitRecipe() {
        const recipeName = recipeNameInput.value;
        const recipeImage = recipeImageInput.files[0];

        const formData = new FormData();
        formData.append('recipeName', recipeName);
        formData.append('recipeImage', recipeImage);
        formData.append('items', JSON.stringify(tempRecipeItems)); // アイテムリストを文字列に変換して送信

        // ローディングスピナーを表示
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = 'flex'; // スピナーを表示

        // レシピ名とアイテム、画像をサーバーに送信
        fetch('/recipes', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Recipe submitted successfully:', data);
            window.location.href = '/recipes/recipeHome';  // 成功したらリダイレクト
        })
        .catch((error) => {
            console.error('Error during recipe submission:', error);
            spinner.style.display = 'none';  // ローディングスピナーを非表示にする
        });
    }
});


 // Enterキーでフォームが送信されないように設定
 document.addEventListener('DOMContentLoaded', () => {
    const recipeForm = document.getElementById('recipeForm');
    const modalItemForm = document.getElementById('modalItemForm');

    // recipeFormでEnterキーによる送信を防止
    recipeForm.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });

    // modalItemFormでEnterキーによる送信を防止
    modalItemForm.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });
});