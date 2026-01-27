/**
 * Analytics View Module
 */

window.Views.analytics = {
    template: () => `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="glass p-8 rounded-3xl">
                <h3 class="text-xl font-bold mb-6">Price by Neighborhood</h3>
                <div id="nb-detailed-chart" class="h-[400px] w-full"></div>
            </div>
            <div class="glass p-8 rounded-3xl">
                <h3 class="text-xl font-bold mb-6">Quality vs Price Correlation</h3>
                <div id="qual-price-chart" class="h-[400px] w-full"></div>
            </div>
        </div>
        
        <div class="glass p-8 rounded-3xl">
            <h3 class="text-xl font-bold mb-6">Market Trends Summary</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-slate-500 text-sm border-b border-slate-200 dark:border-slate-800">
                            <th class="pb-4 font-semibold text-slate-700 dark:text-slate-300">Neighborhood</th>
                            <th class="pb-4 font-semibold text-slate-700 dark:text-slate-300">Median Price</th>
                            <th class="pb-4 font-semibold text-slate-700 dark:text-slate-300">Properties</th>
                            <th class="pb-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        </tr>
                    </thead>
                    <tbody id="nb-table-body" class="text-sm">
                        <!-- Table rows injected here -->
                    </tbody>
                </table>
            </div>
        </div>
    `,

    init: async () => {
        try {
            const neighborhoods = await HouseAPI.getNeighborhoodStats();
            window.Views.analytics.initCharts(neighborhoods);
            window.Views.analytics.initTable(neighborhoods);
        } catch (err) {
            console.error("Failed to load analytics:", err);
        }
    },

    initCharts: (neighborhoods) => {
        // Detailed Neighborhood Chart
        const nbChart = echarts.init(document.getElementById('nb-detailed-chart'));
        nbChart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: neighborhoods.map(n => n.Neighborhood), axisLabel: { rotate: 45 } },
            yAxis: { type: 'value' },
            series: [{
                data: neighborhoods.map(n => n.avg_price),
                type: 'line',
                smooth: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                    ])
                },
                lineStyle: { color: '#3b82f6', width: 3 }
            }]
        });

        // Qual vs Price Correlation
        const qualChart = echarts.init(document.getElementById('qual-price-chart'));
        qualChart.setOption({
            tooltip: { trigger: 'item' },
            xAxis: { type: 'value', name: 'Overall Quality (1-10)' },
            yAxis: { type: 'value', name: 'Avg Price' },
            series: [{
                symbolSize: 20,
                data: [
                    [1, 50000], [2, 60000], [3, 85000], [4, 110000], [5, 135000],
                    [6, 160000], [7, 210000], [8, 275000], [9, 360000], [10, 440000]
                ],
                type: 'scatter',
                itemStyle: { color: '#f59e0b' }
            }]
        });
    },

    initTable: (neighborhoods) => {
        const tbody = document.getElementById('nb-table-body');
        tbody.innerHTML = neighborhoods.slice(0, 10).map(n => `
            <tr class="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-4 font-medium">${n.Neighborhood}</td>
                <td class="py-4">$${Math.round(n.median_price).toLocaleString()}</td>
                <td class="py-4">${n.property_count}</td>
                <td class="py-4">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${n.avg_price > 200000 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}">
                        ${n.avg_price > 200000 ? 'Premium' : 'Standard'}
                    </span>
                </td>
            </tr>
        `).join('');
    }
};
