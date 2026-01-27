/**
 * Overview View Module
 */

window.Views.overview = {
    template: () => `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stat Card 1 -->
            <div class="glass p-6 rounded-2xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                        <i data-lucide="trending-up" class="w-6 h-6"></i>
                    </div>
                    <span class="text-sm font-medium text-slate-500">Precision (R²)</span>
                </div>
                <div class="text-3xl font-bold font-display tracking-tight">91.2%</div>
                <div class="mt-2 text-xs flex items-center gap-1 text-emerald-500">
                    <i data-lucide="chevron-up" class="w-3 h-3"></i>
                    <span>+2.4% vs last version</span>
                </div>
            </div>

            <!-- Stat Card 2 -->
            <div class="glass p-6 rounded-2xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <i data-lucide="dollar-sign" class="w-6 h-6"></i>
                    </div>
                    <span class="text-sm font-medium text-slate-500">Avg. Market Price</span>
                </div>
                <div class="text-3xl font-bold font-display tracking-tight">$180,921</div>
                <div class="mt-2 text-xs flex items-center gap-1 text-slate-400">
                    <span>Ames, Iowa Dataset</span>
                </div>
            </div>

            <!-- Stat Card 3 -->
            <div class="glass p-6 rounded-2xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                        <i data-lucide="activity" class="w-6 h-6"></i>
                    </div>
                    <span class="text-sm font-medium text-slate-500">Error (RMSE)</span>
                </div>
                <div class="text-3xl font-bold font-display tracking-tight">$26,033</div>
                <div class="mt-2 text-xs text-slate-400">
                    Root Mean Squared Error
                </div>
            </div>

            <!-- Stat Card 4 -->
            <div class="glass p-6 rounded-2xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                        <i data-lucide="database" class="w-6 h-6"></i>
                    </div>
                    <span class="text-sm font-medium text-slate-500">Total Samples</span>
                </div>
                <div class="text-3xl font-bold font-display tracking-tight">1,460</div>
                <div class="mt-2 text-xs text-slate-400">
                    Propriétés en base 2010
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="glass p-8 rounded-3xl">
                <h3 class="text-lg font-bold mb-6">Price Distribution</h3>
                <div id="price-dist-chart" class="h-80 w-full"></div>
            </div>
            
            <div class="glass p-8 rounded-3xl">
                <h3 class="text-lg font-bold mb-6">Top Neighborhoods by Value</h3>
                <div id="nb-avg-chart" class="h-80 w-full"></div>
            </div>
        </div>
    `,

    init: async () => {
        if (window.lucide) window.lucide.createIcons();

        // Show loading
        const distChart = document.getElementById('price-dist-chart');
        const nbChart = document.getElementById('nb-avg-chart');
        if (distChart) distChart.innerHTML = '<div class="flex items-center justify-center h-full"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>';
        if (nbChart) nbChart.innerHTML = '<div class="flex items-center justify-center h-full"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>';

        try {
            // Fetch stats from API
            const overview = await HouseAPI.getStatsOverview();
            const neighborhoods = await HouseAPI.getNeighborhoodStats();

            // Initialize Charts
            window.Views.overview.initCharts(overview, neighborhoods);
        } catch (err) {
            console.error("Failed to init overview data:", err);
            if (window.UIUtils) {
                window.UIUtils.showError('price-dist-chart', err.message);
                window.UIUtils.showError('nb-avg-chart', err.message);
            }
        }
    },

    initCharts: (overview, neighborhoods) => {
        // Price Distribution Chart
        const distChart = echarts.init(document.getElementById('price-dist-chart'));
        distChart.setOption({
            tooltip: { trigger: 'axis' },
            grid: { top: 20, right: 20, bottom: 40, left: 60 },
            xAxis: {
                type: 'category',
                data: ['<100k', '100-150k', '150-200k', '200-250k', '250-300k', '>300k'],
                axisLine: { show: false }
            },
            yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed', opacity: 0.1 } } },
            series: [{
                data: [150, 450, 380, 220, 150, 110], // In real app, build from overview data
                type: 'bar',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#3b82f6' },
                        { offset: 1, color: '#1d4ed8' }
                    ]),
                    borderRadius: [8, 8, 0, 0]
                }
            }]
        });

        // Neighborhood Chart (Top 5)
        const sortedNB = [...neighborhoods].sort((a, b) => b.avg_price - a.avg_price).slice(0, 5);
        const nbChart = echarts.init(document.getElementById('nb-avg-chart'));
        nbChart.setOption({
            tooltip: { trigger: 'axis' },
            grid: { top: 20, right: 20, bottom: 40, left: 100 },
            xAxis: { type: 'value', axisLine: { show: false }, splitLine: { show: false } },
            yAxis: { type: 'category', data: sortedNB.map(n => n.Neighborhood), axisLine: { show: false } },
            series: [{
                data: sortedNB.map(n => n.avg_price),
                type: 'bar',
                label: { show: true, position: 'right', formatter: '${value}' },
                itemStyle: {
                    color: '#6366f1',
                    borderRadius: [0, 8, 8, 0]
                }
            }]
        });

        // Responsive charts
        window.addEventListener('resize', () => {
            distChart.resize();
            nbChart.resize();
        });
    }
};
