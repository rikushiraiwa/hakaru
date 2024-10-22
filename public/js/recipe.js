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
    const form = document.getElementById("recipeForm");
    const selectedItem = form.itemSelect.value;  // ドロップダウンで選択された値を取得
    let itemName = selectedItem;

    // 新しいアイテムが入力された場合
    if (selectedItem === "new") {
        itemName = document.getElementById("newItemName").value;  // 新しいアイテムの名前を取得
    }

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
    document.getElementById("newItemName").style.display = "none"; // 新しいアイテム入力欄を非表示に戻す
    $('#addRecipeModal').modal('hide');
}






document.addEventListener('DOMContentLoaded', () => {
    const saveRecipeBtn = document.getElementById('saveRecipeBtn');
    const recipeNameInput = document.getElementById('recipeNameInput');
    const recipeImageInput = document.getElementById('recipeImage');

    // Save Recipeボタンが押された時にバリデーションを実施
    saveRecipeBtn.addEventListener('click', function(event) {
        let isValid = true;

        // Recipe Nameが入力されていない場合
        if (!recipeNameInput.value) {
            recipeNameInput.classList.add('is-invalid');
            isValid = false;
        } else {
            recipeNameInput.classList.remove('is-invalid');
        }

        // Recipe Imageが選択されていない場合
        if (!recipeImageInput.files.length) {
            recipeImageInput.classList.add('is-invalid');
            isValid = false;
        } else {
            recipeImageInput.classList.remove('is-invalid');
        }

        // バリデーションがすべてOKの場合、レシピを保存
        if (isValid) {
            submitRecipe();  // バリデーションが通った場合のみsubmitRecipe関数を呼び出す
        }
    });

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
            // ローディングスピナーを非表示にする
            spinner.style.display = 'none';
        });
    }
});






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

    // ローディングスピナーを表示
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'flex'; // スピナーを表示

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
        // エラーが発生した場合はスピナーを非表示にする
        spinner.style.display = 'none';
    });
}




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



