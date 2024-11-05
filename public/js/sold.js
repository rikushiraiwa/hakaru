// ページに渡された recipes データを取得して保存
const recipesData = JSON.parse(document.getElementById('recipesData').textContent);

// ProductNameが選択された時に対応するamountFeeの合計をCOGSに設定
function updateCOGS() {
    const selectedProductName = document.querySelector('select[name="productName"]').value;
    const selectedRecipe = recipesData.find(recipe => recipe.recipeName === selectedProductName);

    // COGSにamountFeeの合計を設定（小数点以下切り捨て）
    document.getElementById('cogs').value = selectedRecipe && selectedRecipe.totalAmountFee ? Math.floor(selectedRecipe.totalAmountFee) : 0;
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
    const netProfit = grossProfit- operatingExpenses;
    const netRatio = sales ? Math.floor((netProfit / sales) * 100) : 0;

    // 結果を表示（小数点以下を切り捨て）
    document.getElementById('grossProfit').textContent = Math.floor(grossProfit);
    document.getElementById('netProfit').textContent = Math.floor(netProfit);
    document.getElementById('netRatio').textContent = netRatio;
}

// 各フィールドの変更時に自動で合計を計算
document.getElementById('sales').addEventListener('input', calculateTotals);
document.getElementById('salesCommission').addEventListener('input', calculateTotals);
document.getElementById('transferFee').addEventListener('input', calculateTotals);
document.getElementById('shippingFee').addEventListener('input', calculateTotals);
document.querySelector('select[name="productName"]').addEventListener('change', updateCOGS);
