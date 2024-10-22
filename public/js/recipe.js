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
function addRecipe() {
    const form = document.getElementById("modalRecipeForm"); // モーダル内のフォーム
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
    $('#addRecipeModal').modal('hide');
}







document.addEventListener('DOMContentLoaded', () => {
    const recipeForm = document.getElementById('recipeForm');
    const saveRecipeBtn = document.getElementById('saveRecipeBtn');
    const modalRecipeForm = document.getElementById('modalRecipeForm');
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
    modalRecipeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!modalRecipeForm.checkValidity()) {
            modalRecipeForm.classList.add('was-validated');
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
            window.location.href = '/recipeHome';  // 成功したらリダイレクト
        })
        .catch((error) => {
            console.error('Error during recipe submission:', error);
            spinner.style.display = 'none';  // ローディングスピナーを非表示にする
        });
    }
});







document.addEventListener('DOMContentLoaded', () => {
    const editRecipeForm = document.getElementById('editRecipeForm');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const modalRecipeForm = document.getElementById('modalRecipeForm');
    const recipeNameInput = document.getElementById('recipeNameInput');
    const recipeImageInput = document.getElementById('recipeImage');

    // Save Changesボタンが押された時にバリデーションを実施
    saveChangesBtn.addEventListener('click', function(event) {
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
    modalRecipeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!modalRecipeForm.checkValidity()) {
            modalRecipeForm.classList.add('was-validated');
        } else {
            addRecipe();  // バリデーションが成功した場合のみアイテムを追加
        }
    });

    // レシピデータの保存処理
    function submitEditedRecipe() {
        const recipeId = document.getElementById('recipeData').getAttribute('data-recipe-id');
        const recipeName = recipeNameInput.value;
        const recipeImage = recipeImageInput.files[0];

        // テーブル内のアイテムを取得
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
            formData.append('recipeImage', recipeImage);  // 画像ファイルが選択されている場合に追加
        }
        formData.append('items', JSON.stringify(updatedItems));

        // ローディングスピナーを表示
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = 'flex';  // スピナーを表示

        // サーバーに更新リクエストを送信
        fetch(`/recipes/${recipeId}?_method=PUT`, {
            method: 'POST',  // PUTメソッドをサポートしないため、POSTでエミュレート
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log('Recipe updated successfully:', data);
            window.location.href = '/recipeHome';  // 成功後にrecipeHomeにリダイレクト
        })
        .catch((error) => {
            console.error('Error:', error);
            spinner.style.display = 'none';  // エラーが発生した場合はスピナーを非表示にする
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
        window.location.href = '/recipeHome';
    })
    .catch(error => {
        console.error('Error during recipe deletion:', error);
        alert('Failed to delete recipe. Please try again.');
    });
}



