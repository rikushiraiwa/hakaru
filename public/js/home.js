// データを整形
const salesLabels = salesByMonth.map(item => item._id);  // 月ごとのラベル
const salesData = salesByMonth.map(item => item.totalSales);  // 売上データ
const expenseData = expensesByMonth.map(item => item.totalExpense);  // 経費データ


// グラフの作成
const ctx = document.getElementById('salesExpenseChart').getContext('2d');
const salesExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: salesLabels,  // 月ごとのラベル
        datasets: [
            {
                label: '売上',
                data: salesData,  // 売上データ
                backgroundColor: 'rgba(255, 206, 86, 0.8)',  // 売上の色
                borderWidth: 1
            },
            {
                label: '経費',
                data: expenseData,  // 経費データ
                backgroundColor: 'rgba(75, 192, 192, 0.8)',  // 経費の色
                borderWidth: 1
            }
        ]
    },
    options: {
        responsive: true,  // レスポンシブ対応
        maintainAspectRatio: false,  // アスペクト比を維持しない
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
