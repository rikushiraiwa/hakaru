
function calculateProfits() {
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const cogs = parseFloat(document.getElementById('cogs').value) || 0;
    const expenses = parseFloat(document.getElementById('expenses').value) || 0;

    // Gross Profit 計算
    const grossProfit = revenue - cogs;

    // Net Profit 計算
    const netProfit = grossProfit - expenses;

    // Ratio 計算
    const netRatio = revenue !== 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;

    // 計算結果を表示
    document.getElementById('grossProfit').textContent = grossProfit.toFixed(2);
    document.getElementById('netProfit').textContent = netProfit.toFixed(2);
    document.getElementById('netRatio').textContent = netRatio;
}