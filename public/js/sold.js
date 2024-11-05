// ページに渡された recipes データを取得して保存
const recipesData = JSON.parse(document.getElementById('recipesData').textContent);

// COGSを計算する関数
function calculateCOGS(recipe) {
    if (!recipe || !recipe.items) return 0; // recipeやitemsが存在しない場合は0を返す
    // 各itemのamountFeeを合計（amountFeeがundefinedの場合は0として計算）
    return recipe.items.reduce((acc, item) => acc + (parseFloat(item.amountFee) || 0), 0);
}

// ProductNameが選択された時にCOGSを更新し、再計算を行う
function updateCOGS() {
    const selectedProductName = document.querySelector('select[name="productName"]').value;
    const selectedRecipe = recipesData.find(recipe => recipe.recipeName === selectedProductName);
    
    // COGSの値を更新
    const updatedCOGS = calculateCOGS(selectedRecipe);
    document.getElementById('cogs').value = updatedCOGS;

    // COGSが更新された後に総計を再計算
    calculateTotals();
}

// 合計を計算する関数
function calculateTotals() {
    const sales = Math.floor(parseFloat(document.getElementById('sales').value) || 0);
    const salesCommission = Math.floor(parseFloat(document.getElementById('salesCommission').value) || 0);
    const transferFee = Math.floor(parseFloat(document.getElementById('transferFee').value) || 0);
    const shippingFee = Math.floor(parseFloat(document.getElementById('shippingFee').value) || 0);
    const cogs = Math.floor(parseFloat(document.getElementById('cogs').value) || 0);

    // Operating Expenses の計算
    const operatingExpenses = salesCommission + transferFee + shippingFee;
    document.getElementById('expenses').value = operatingExpenses;

    // Gross Profit と Net Profit の計算
    const grossProfit = sales - cogs;
    const netProfit = grossProfit - operatingExpenses;
    const netRatio = sales ? Math.floor((netProfit / sales) * 100) : 0;

    // 結果を表示（小数点以下を切り捨て）
    document.getElementById('grossProfit').textContent = Math.floor(grossProfit);
    document.getElementById('netProfit').textContent = Math.floor(netProfit);
    document.getElementById('netRatio').textContent = netRatio;
}

// 初期読み込み時にCOGSを設定
document.addEventListener('DOMContentLoaded', () => {
    const selectedProductName = document.querySelector('select[name="productName"]').value;
    const initialRecipe = recipesData.find(recipe => recipe.recipeName === selectedProductName);
    const initialCOGS = calculateCOGS(initialRecipe);
    document.getElementById('cogs').value = initialCOGS;

    // 初期読み込み時に総計を計算
    calculateTotals();
});

// 各フィールドの変更時に自動で合計を計算
document.getElementById('sales').addEventListener('input', calculateTotals);
document.getElementById('salesCommission').addEventListener('input', calculateTotals);
document.getElementById('transferFee').addEventListener('input', calculateTotals);
document.getElementById('shippingFee').addEventListener('input', calculateTotals);
document.querySelector('select[name="productName"]').addEventListener('change', updateCOGS);
