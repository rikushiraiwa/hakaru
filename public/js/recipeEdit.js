// ページロード時に既存のレシピアイテムをtempRecipeItemsに設定
document.addEventListener('DOMContentLoaded', () => {
    // 各アイテムに一意のIDを追加し、tempRecipeItemsにコピー
    tempRecipeItems = recipe.items.map((item, index) => ({
        ...item,
        id: `${item.itemName}-${index}` // itemNameとインデックスで一意のIDを作成
    }));
    calculateTotal(); // 合計の計算
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
    const form = document.getElementById("modalItemForm"); // モーダル内のフォーム
    const itemSelect = document.getElementById("itemSelect");
    const newItemNameInput = document.getElementById("newItemName");

    // バリデーションが通らない場合
    if (!form.checkValidity()) {
        form.classList.add('was-validated');  // ブートストラップのバリデーションスタイルを適用
        return;  // バリデーションが失敗した場合は追加をキャンセル
    }

    // フォームが有効ならアイテムを追加
    const selectedItem = itemSelect.value;
    const itemName = selectedItem === "new" ? newItemNameInput.value : selectedItem;
    const content = form.content.value || 0;
    const amountUsage = form.amountUsage.value || 0;

    // 選択されたItemNameに対応するUnitPriceをセット
    const selectedStock = stocks.find(stock => stock.itemName === itemName);
    const unitPrice = selectedStock ? selectedStock.unitPrice : 0;
    const amountFee = unitPrice * amountUsage;

    const newItem = {
        itemName,
        content,
        unitPrice: unitPrice || 0,
        amountUsage: amountUsage || 0,
        amountFee: amountFee || 0
    };

    tempRecipeItems.push(newItem);

    // 新しいアイテムをテーブルに追加
    const table = document.getElementById("recipeTable").querySelector("tbody");
    const newRow = document.createElement("tr");

    // チェックボックスのセルを追加
    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "selectRow";
    selectCell.appendChild(checkbox);
    newRow.appendChild(selectCell);

    // 各データセルをテーブルに追加
    Object.values(newItem).forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        newRow.appendChild(td);
    });

    table.appendChild(newRow);

    // 合計を再計算
    calculateTotal();

    // フォームのリセットとモーダルの閉じる処理
    form.reset();
    form.classList.remove('was-validated');
    $('#addItemModal').modal('hide');
}




document.addEventListener('DOMContentLoaded', () => {
    const editRecipeForm = document.getElementById('editRecipeForm');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const modalItemForm = document.getElementById('modalItemForm');
    const recipeNameInput = document.getElementById('recipeNameInput');
    const recipeImageInput = document.getElementById('recipeImage');
    

    // Save Changesボタンが押された時にバリデーションを実施
    saveChangesBtn.addEventListener('click', function(event) {
        console.log('Save Changes button clicked'); // ボタンクリックの確認
        event.preventDefault();

        // バリデーションの確認
        if (editRecipeForm.checkValidity()) {
            editRecipeForm.classList.add('was-validated');
            submitEditedRecipe();  // バリデーションが成功した場合、編集を保存する処理を実行
        } else {
            editRecipeForm.classList.add('was-validated');
        }
    });

    // モーダル内のAdd Recipeボタン押下時のバリデーション
    if (modalItemForm) {
        modalItemForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (!modalItemForm.checkValidity()) {
                modalItemForm.classList.add('was-validated');
            } else {
                addRecipe();  // バリデーションが成功した場合のみアイテムを追加
            }
        });
    }

    // レシピデータの保存処理
    function submitEditedRecipe() {
        const recipeId = document.getElementById('recipeData').getAttribute('data-recipe-id');
        const recipeName = recipeNameInput.value;
        const recipeImage = recipeImageInput.files[0];
    
        const formData = new FormData();
        formData.append('recipeName', recipeName);
        if (recipeImage) {
            formData.append('recipeImage', recipeImage);
        }
        formData.append('items', JSON.stringify(tempRecipeItems));
    
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = 'flex';
    
        fetch(`/recipes/${recipeId}?_method=PUT`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            window.location.href = '/recipes/recipeHome';
        })
        .catch((error) => {
            console.error('Error:', error);
            spinner.style.display = 'none';
        });
    }
    
});



function confirmDeleteRecipe() {
    const recipeId = document.getElementById('recipeData').getAttribute('data-recipe-id');

    // レシピを削除するリクエストをサーバーに送信
    fetch(`/recipes/${recipeId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Recipe deleted successfully:', data);
        // 削除後にrecipeHomeにリダイレクト
        window.location.href = '/recipes/recipeHome';
    })
    .catch(error => {
        console.error('Error during recipe deletion:', error);
        alert('Failed to delete recipe. Please try again.');
    });
}



