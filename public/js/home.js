document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('salesExpenseChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['売上', '経費'],
            datasets: [{
                label: '', // ラベルを空にして凡例を非表示にする
                data: [window.totalSales, window.totalExpenses], // グローバル変数からデータを取得
                backgroundColor: ['rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false // 凡例を非表示にする
                }
            }
        }
    });
});
