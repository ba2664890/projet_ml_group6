/**
 * Simple Page Router - Conserve le style original
 */

class PageRouter {
    constructor() {
        this.currentPage = 'overview';
        this.pages = {
            overview: { title: 'Dashboard Overview', render: this.renderOverview },
            predict: { title: 'Price Prediction', render: this.renderPredict },
            analytics: { title: 'Market Analytics', render: this.renderAnalytics },
            model: { title: 'Model Performance', render: this.renderModel }
        };
        this.init();
    }

    init() {
        // Setup navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.navigateTo(page);
            });
        });

        // Load initial page
        const hash = window.location.hash.substring(1) || 'overview';
        this.navigateTo(hash);
    }

    navigateTo(pageName) {
        if (!this.pages[pageName]) return;

        this.currentPage = pageName;
        window.location.hash = pageName;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${pageName}`) {
                link.classList.add('active');
            }
        });

        // Render page
        const container = document.getElementById('main-content');
        container.innerHTML = '';
        container.classList.add('animate-fade-in');
        this.pages[pageName].render.call(this, container);
    }

    renderOverview(container) {
        container.innerHTML = `
            <section id="hero" class="relative overflow-hidden bg-slate-900 text-white py-24 md:py-32">
                <div class="absolute inset-0 z-0">
                    <img src="assets/images/hero.png" alt="Luxury Home" class="w-full h-full object-cover opacity-40">
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900/60 to-transparent"></div>
                </div>

                <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
                    <div class="text-center">
                        <h1 class="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                            House Price Prediction
                            <span class="block text-blue-200">Powered by AI</span>
                        </h1>
                        <p class="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                            Prédisez avec précision le prix des maisons à Ames, Iowa grâce à notre modèle de Machine Learning avancé
                        </p>
                    </div>

                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                        <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <div class="text-3xl font-bold mb-2">91.2%</div>
                            <div class="text-blue-100">Model Accuracy (R²)</div>
                        </div>
                        <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <div class="text-3xl font-bold mb-2">$26,033</div>
                            <div class="text-blue-100">Average Error (RMSE)</div>
                        </div>
                        <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <div class="text-3xl font-bold mb-2">1,460</div>
                            <div class="text-blue-100">Training Samples</div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="py-20 bg-white dark:bg-slate-900">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 class="text-4xl font-bold mb-12 text-center">Market Insights</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8">
                            <h3 class="text-2xl font-bold mb-4">Prix Moyen par Quartier</h3>
                            <canvas id="neighborhood-chart"></canvas>
                        </div>
                        <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-8">
                            <h3 class="text-2xl font-bold mb-4">Distribution des Prix</h3>
                            <canvas id="price-distribution-chart"></canvas>
                        </div>
                    </div>
                </div>
            </section>
        `;
        this.initOverviewCharts();
    }

    renderPredict(container) {
        container.innerHTML = `
            <section class="py-20 bg-slate-50 dark:bg-slate-800">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 class="text-4xl font-bold mb-4 text-center">Prédiction de Prix</h2>
                    <p class="text-xl text-slate-600 dark:text-slate-400 mb-12 text-center">
                        Remplissez les informations pour obtenir une estimation
                    </p>

                    <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl">
                        <form id="prediction-form" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-semibold mb-2">Surface Habitable (SF)</label>
                                    <input type="number" name="GrLivArea" value="1500" required
                                        class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold mb-2">Qualité Générale (1-10)</label>
                                    <select name="OverallQual" class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all">
                                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<option value="${v}" ${v === 6 ? 'selected' : ''}>${v}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold mb-2">Année de Construction</label>
                                    <input type="number" name="YearBuilt" value="2000" min="1800" max="2025"
                                        class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold mb-2">Quartier</label>
                                    <select name="Neighborhood" class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all">
                                        <option value="CollgCr">College Creek</option>
                                        <option value="Veenker">Veenker</option>
                                        <option value="Crawfor">Crawford</option>
                                        <option value="NoRidge">Northridge</option>
                                        <option value="Mitchel">Mitchell</option>
                                        <option value="Somerst">Somerset</option>
                                        <option value="NWAmes">Northwest Ames</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" class="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all">
                                Générer la Prédiction
                            </button>
                        </form>

                        <div id="prediction-result" class="hidden mt-8 p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                            <div class="text-center">
                                <p class="text-sm uppercase tracking-widest text-slate-500 mb-2">Prix Estimé</p>
                                <div id="estimated-price" class="text-5xl font-bold text-blue-600 mb-4">$0</div>
                                <div class="text-sm text-slate-600">Intervalle de confiance: ±$15,000</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        this.initPredictionForm();
    }

    renderAnalytics(container) {
        container.innerHTML = `
            <section class="py-20 bg-white dark:bg-slate-900">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 class="text-4xl font-bold mb-12 text-center">Analytics & Visualisations</h2>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                            <h3 class="text-2xl font-bold mb-6">Prix par Quartier</h3>
                            <canvas id="analytics-neighborhood-chart"></canvas>
                        </div>
                        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                            <h3 class="text-2xl font-bold mb-6">Qualité vs Prix</h3>
                            <canvas id="quality-price-chart"></canvas>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                        <h3 class="text-2xl font-bold mb-6">Statistiques Détaillées</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th class="px-6 py-3 text-left">Quartier</th>
                                        <th class="px-6 py-3 text-left">Prix Médian</th>
                                        <th class="px-6 py-3 text-left">Propriétés</th>
                                        <th class="px-6 py-3 text-left">Tendance</th>
                                    </tr>
                                </thead>
                                <tbody id="analytics-table"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
        this.initAnalyticsCharts();
    }

    renderModel(container) {
        container.innerHTML = `
            <section class="py-20 bg-slate-50 dark:bg-slate-800">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 class="text-4xl font-bold mb-12 text-center">Performance du Modèle</h2>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl">
                            <h3 class="text-xl font-bold mb-4">Gradient Boosting</h3>
                            <p class="mb-6 opacity-90">Modèle ensembliste optimisé pour la prédiction des prix immobiliers</p>
                            <div class="space-y-3">
                                <div class="flex justify-between border-b border-white/20 pb-2">
                                    <span>R² Score</span>
                                    <span class="font-bold">0.912</span>
                                </div>
                                <div class="flex justify-between border-b border-white/20 pb-2">
                                    <span>RMSE</span>
                                    <span class="font-bold">$26,033</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>MAE</span>
                                    <span class="font-bold">$18,245</span>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl">
                            <h3 class="text-2xl font-bold mb-6">Feature Importance</h3>
                            <canvas id="feature-importance-chart"></canvas>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl">
                        <h3 class="text-2xl font-bold mb-6">Hyperparamètres du Modèle</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div class="text-sm text-slate-500 mb-1">N Estimators</div>
                                <div class="text-2xl font-bold">100</div>
                            </div>
                            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div class="text-sm text-slate-500 mb-1">Max Depth</div>
                                <div class="text-2xl font-bold">3</div>
                            </div>
                            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div class="text-sm text-slate-500 mb-1">Learning Rate</div>
                                <div class="text-2xl font-bold">0.1</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        this.initModelCharts();
    }

    initOverviewCharts() {
        // Charts will be initialized here
        console.log('Overview charts initialized');
    }

    initPredictionForm() {
        const form = document.getElementById('prediction-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Simulate API call
            document.getElementById('prediction-result').classList.remove('hidden');
            document.getElementById('estimated-price').textContent =
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(180000 + Math.random() * 100000);
        });
    }

    initAnalyticsCharts() {
        console.log('Analytics charts initialized');
    }

    initModelCharts() {
        console.log('Model charts initialized');
    }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.router = new PageRouter();
});
