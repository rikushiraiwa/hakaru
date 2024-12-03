document.addEventListener('DOMContentLoaded', () => {
    const recipeData = typeof recipe !== 'undefined' ? recipe : { items: [] };
    const stockData = typeof stocks !== 'undefined' ? stocks : [];

    tempRecipeItems = recipeData.items.map((item, index) => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const amountUsage = parseFloat(item.amountUsage) || 0;

        return {
            ...item,
            id: `${item.itemName}-${index}`, // 一意のID
            amountFee: unitPrice * amountUsage // 使用料金を計算
        };
    });


    renderTable();
    calculateTotal(); // 合計の計算
});




// テーブルを描画する関数
function renderTable() {
    const tableBody = document.querySelector('#recipeTable tbody');
    tableBody.innerHTML = ''; // 既存のテーブル内容をクリア

    tempRecipeItems.forEach(item => {
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-item-id', item.id);

        // チェックボックスのセルを追加
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'selectRow';
        selectCell.appendChild(checkbox);
        newRow.appendChild(selectCell);

        // 明示的に各プロパティを順番に追加
        const itemNameCell = document.createElement('td');
        itemNameCell.textContent = item.itemName;
        newRow.appendChild(itemNameCell);

        const contentCell = document.createElement('td');
        contentCell.textContent = item.content;
        newRow.appendChild(contentCell);

        const unitPriceCell = document.createElement('td');
        unitPriceCell.textContent = item.unitPrice;
        newRow.appendChild(unitPriceCell);

        const amountUsageCell = document.createElement('td');
        amountUsageCell.textContent = item.amountUsage;
        newRow.appendChild(amountUsageCell);

        const amountFeeCell = document.createElement('td');
        amountFeeCell.textContent = item.amountFee;
        newRow.appendChild(amountFeeCell);

        tableBody.appendChild(newRow);
    });
}





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
    const total = tempRecipeItems.reduce((sum, item) => sum + (item.amountFee || 0), 0);
    document.getElementById('totalValue').innerText = Math.round(total);
}


function toggleNewItemField() {
    const itemSelect = document.getElementById("itemSelect");
    const newItemName = document.getElementById("newItemName");
    const unitPriceField = document.getElementById("unitPriceField");

    if (itemSelect.value === "new") {
        newItemName.style.display = "block"; // 新しいアイテム名フィールドを表示
        unitPriceField.style.display = "block"; // 単価入力フィールドを表示
    } else {
        newItemName.style.display = "none";  // 非表示
        unitPriceField.style.display = "none"; // 非表示
    }
}


// 一時的にレシピアイテムを保存するための配列
let tempRecipeItems = [];

// 新しいアイテムを追加
function addItem() {
    const form = document.getElementById("modalItemForm");
    const itemSelect = document.getElementById("itemSelect");
    const newItemNameInput = document.getElementById("newItemName");
    const unitPriceInput = document.getElementById("unitPriceInput");

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const selectedItem = itemSelect.value;
    const itemName = selectedItem === "new" ? newItemNameInput.value : selectedItem;
    const content = form.content.value || "";
    const amountUsage = parseFloat(form.amountUsage.value) || 0;

    // 単価の設定
    let unitPrice = 0;
    if (selectedItem === "new") {
        unitPrice = parseFloat(unitPriceInput.value) || 0; // 新しいアイテムの場合、手入力値を使用
    } else {
        const selectedStock = stocks.find(stock => stock.itemName === itemName);
        unitPrice = selectedStock ? selectedStock.unitPrice : 0; // 既存アイテムの場合、Stockから取得
    }

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

    renderTable(); // テーブルを再描画
    calculateTotal();

    form.reset();
    form.classList.remove('was-validated');
    $('#addItemModal').modal('hide');
}


// レシピデータの保存処理
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
            submitEditedRecipe(); // バリデーションが成功した場合、編集を保存する処理を実行
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
                addItem(); // バリデーションが成功した場合のみアイテムを追加
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
        formData.append('items', JSON.stringify(tempRecipeItems)); // tempRecipeItemsを使用

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


// 削除の確認
function confirmDeleteRecipe() {
    if (!confirm("本当にこのレシピを削除しますか？この操作は取り消せません。")) {
        return;
    }    

    const recipeId = document.getElementById('recipeData').getAttribute('data-recipe-id');

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
            window.location.href = '/recipes/recipeHome';
        })
        .catch(error => {
            console.error('Error during recipe deletion:', error);
            alert('削除に失敗しました。もう一度お試しください。');
        });
        
}



$('#addItemModal').on('hidden.bs.modal', function () {
    document.body.removeAttribute('aria-hidden'); // フォーカスが他の要素に移るようにする
});
