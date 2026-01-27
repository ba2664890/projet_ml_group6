/**
 * Prediction View Module
 */

// Initialize Views object if not exists
if (!window.Views) window.Views = {};

window.Views.predict = {
    template: () => `
        <div class="max-w-4xl mx-auto">
            <div class="glass p-8 rounded-3xl mb-8">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                        <i data-lucide="home" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">Property Details</h3>
                        <p class="text-sm text-slate-500">Provide the main characteristics of the property.</p>
                    </div>
                </div>

                <form id="prediction-form" class="space-y-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Living Area (SF)</label>
                            <input type="number" name="GrLivArea" value="1500" required
                                class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-border focus:ring-2 focus:ring-primary outline-none transition-all">
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Overall Quality (1-10)</label>
                            <select name="OverallQual" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-border focus:ring-2 focus:ring-primary outline-none transition-all">
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<option value="${v}" ${v === 6 ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Year Built</label>
                            <input type="number" name="YearBuilt" value="2000"
                                class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-border focus:ring-2 focus:ring-primary outline-none transition-all">
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Neighborhood</label>
                            <select id="nb-select" name="Neighborhood" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-border focus:ring-2 focus:ring-primary outline-none transition-all">
                                <option value="CollgCr">College Creek</option>
                                <option value="Veenker">Veenker</option>
                                <option value="Crawfor">Crawford</option>
                                <option value="NoRidge">Northridge</option>
                                <option value="Mitchel">Mitchell</option>
                            </select>
                        </div>
                    </div>

                    <!-- Hidden defaults for complex model -->
                    <div id="hidden-features"></div>

                    <button type="submit" class="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <i data-lucide="zap" class="w-5 h-5"></i>
                        Generate AI Valuation
                    </button>
                </form>
            </div>

            <!-- Result Card -->
            <div id="prediction-result" class="hidden glass p-8 rounded-3xl border-primary/20 bg-primary/5 animate-fade-in">
                <div class="flex flex-col items-center text-center">
                    <span class="text-slate-500 font-medium mb-2 uppercase tracking-widest text-xs">Estimated Market Value</span>
                    <div id="estimated-price" class="text-5xl font-display font-bold text-primary mb-4">$0.00</div>
                    <div id="confidence-bar" class="w-full max-w-xs h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div class="h-full bg-emerald-500" style="width: 85%"></div>
                    </div>
                    <p class="text-sm text-slate-500">Confidence Score: 85%</p>
                </div>
            </div>
        </div>
    `,

    init: () => {
        if (window.lucide) window.lucide.createIcons();

        const form = document.getElementById('prediction-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Add required dummy fields for the Ames model if not provided
            const fullData = {
                MSSubClass: 60, MSZoning: 'RL', LotArea: 10000, Street: 'Pave',
                LotShape: 'Reg', LandContour: 'Lvl', Utilities: 'AllPub', LotConfig: 'Inside',
                LandSlope: 'Gtl', Condition1: 'Norm', Condition2: 'Norm', BldgType: '1Fam',
                HouseStyle: '2Story', OverallCond: 5, YearRemodAdd: 2000, RoofStyle: 'Gable',
                RoofMatl: 'CompShg', Exterior1st: 'VinylSd', Exterior2nd: 'VinylSd',
                ExterQual: 'TA', ExterCond: 'TA', Foundation: 'PConc', Heating: 'GasA',
                HeatingQC: 'Ex', CentralAir: 'Y', '1stFlrSF': 1000, '2ndFlrSF': 500,
                LowQualFinSF: 0, BsmtFullBath: 1, BsmtHalfBath: 0, FullBath: 2, HalfBath: 1,
                BedroomAbvGr: 3, KitchenAbvGr: 1, KitchenQual: 'TA', TotRmsAbvGrd: 7,
                Functional: 'Typ', Fireplaces: 1, WoodDeckSF: 0, OpenPorchSF: 0,
                EnclosedPorch: 0, '3SsnPorch': 0, ScreenPorch: 0, PoolArea: 0, MiscVal: 0,
                MoSold: 5, YrSold: 2010, SaleType: 'WD', SaleCondition: 'Normal',
                ...data
            };

            try {
                const btn = form.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Calculating...';

                const response = await HouseAPI.predict(fullData);

                const resultDiv = document.getElementById('prediction-result');
                const priceDiv = document.getElementById('estimated-price');

                resultDiv.classList.remove('hidden');
                priceDiv.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(response.predicted_price);

                // Show success toast
                if (window.UIUtils) {
                    window.UIUtils.showToast('Prédiction générée avec succès!', 'success');
                }

                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="zap" class="w-5 h-5"></i> Generate AI Valuation';
                if (window.lucide) window.lucide.createIcons();

                resultDiv.scrollIntoView({ behavior: 'smooth' });
            } catch (err) {
                if (window.UIUtils) {
                    window.UIUtils.showToast('Erreur: ' + err.message, 'error');
                } else {
                    alert("Error calling prediction API: " + err.message);
                }
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="zap" class="w-5 h-5"></i> Generate AI Valuation';
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }
};
