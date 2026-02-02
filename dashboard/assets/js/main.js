// Main Application Logic
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏠 Laplace Immo Dashboard Initialized');

    // Initialize dark mode
    initDarkMode();

    // Setup event listeners
    setupEventListeners();

    // Load initial data
    await loadInitialData();

    // Initialize components
    await initializeComponents();
});

// Setup Event Listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            toggleDarkMode();
            updateThemeIcons();
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToElement(targetId);
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', throttle(() => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('h-16');
            navbar.classList.remove('h-20');
            navbar.classList.add('shadow-xl');
        } else {
            navbar.classList.add('h-20');
            navbar.classList.remove('h-16');
            navbar.classList.remove('shadow-xl');
        }
    }, 100));
}

// Load Initial Data
async function loadInitialData() {
    try {
        const health = await api.checkHealth();
        console.log('API Health:', health);
        const modelInfo = await api.getModelInfo();
        console.log('Model Info:', modelInfo);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Erreur de connexion à l\'API. Vérifiez que le serveur est démarré.');
    }
}

// Initialize Components
async function initializeComponents() {
    // Load Prediction Form
    await initPredictionForm();

    // Load Analytics Section
    const analyticsContainer = document.getElementById('charts-container');
    if (analyticsContainer) {
        try {
            const response = await fetch('components/analytics.html');
            analyticsContainer.innerHTML = await response.text();
            await loadAnalyticsData();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    // Load Model Performance Section
    const modelContainer = document.getElementById('model-performance-container');
    if (modelContainer) {
        try {
            const response = await fetch('components/model-performance.html');
            modelContainer.innerHTML = await response.text();
            await loadModelPerformanceData();
        } catch (error) {
            console.error('Error loading model performance:', error);
        }
    }

    // Initialize Map
    realEstateMap.init();
}

// Initialize Prediction Form
async function initPredictionForm() {
    const container = document.getElementById('prediction-form-container');
    if (!container) return;

    try {
        const response = await fetch('components/prediction-form.html');
        const html = await response.text();
        container.innerHTML = html;

        // Load Smart Input Component
        const smartContainer = document.getElementById('smart-input-container');
        if (smartContainer) {
            const smartResponse = await fetch('components/smart-input.html');
            const smartHtml = await smartResponse.text();
            smartContainer.innerHTML = smartHtml;
            initSmartModeEvents();
        }

        setupFormHandlers();
    } catch (error) {
        console.error('Error loading prediction form:', error);
    }
}

// Helper to set neighborhood from map
function setNeighborhood(neighborhood) {
    const select = document.querySelector('select[name="Neighborhood"]');
    if (select) {
        select.value = neighborhood;
        select.dispatchEvent(new Event('change'));
        scrollToElement('predict');
        showSuccess(`Quartier sélectionné : ${neighborhood}`);
    }
}

// Setup Form Handlers for Multi-step
function setupFormHandlers() {
    const form = document.getElementById('house-prediction-form');
    if (!form) return;

    // Helper for range value display
    const rangeInput = form.querySelector('input[name="OverallQual"]');
    if (rangeInput) {
        rangeInput.addEventListener('input', (e) => {
            const display = document.getElementById('val-OverallQual');
            if (display) display.textContent = `${e.target.value}/10`;
        });
    }

    let currentStep = 1;
    const totalSteps = 2;

    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-prediction');
    const progressBar = document.getElementById('form-progress-bar');
    const progressText = document.getElementById('progress-text');
    const resetBtn = document.getElementById('form-reset-btn');
    const stepBtns = document.querySelectorAll('.step-btn');

    function updateStep(newStep) {
        // Update Progress Bar
        if (progressBar) {
            const width = (newStep / totalSteps) * 100;
            progressBar.style.width = `${width}%`;
        }
        if (progressText) {
            progressText.textContent = `Étape ${newStep} sur ${totalSteps}`;
        }

        // Hide all steps
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`form-step-${i}`);
            if (stepEl) stepEl.classList.add('hidden');

            const stepBtn = document.querySelector(`.step-btn[data-step="${i}"]`);
            if (stepBtn) {
                const circle = stepBtn.querySelector('div');
                circle.classList.remove('bg-brand-600', 'text-white', 'shadow-xl', 'shadow-brand-500/20');
                circle.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-400');
            }
        }

        // Show current step
        const currentStepEl = document.getElementById(`form-step-${newStep}`);
        if (currentStepEl) currentStepEl.classList.remove('hidden');

        const activeBtn = document.querySelector(`.step-btn[data-step="${newStep}"]`);
        if (activeBtn) {
            const circle = activeBtn.querySelector('div');
            circle.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-400');
            circle.classList.add('bg-brand-600', 'text-white', 'shadow-xl', 'shadow-brand-500/20');
        }

        prevBtn.classList.toggle('hidden', newStep === 1);
        nextBtn.classList.toggle('hidden', newStep === totalSteps);
        submitBtn.classList.toggle('hidden', newStep < totalSteps);

        currentStep = newStep;

        // Scroll to top of form for clarity
        const formContainer = document.getElementById('prediction-form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        gsap.from(`#form-step-${newStep}`, {
            duration: 0.5,
            y: 20,
            opacity: 0,
            ease: 'power2.out'
        });
    }

    // Step button clicks
    stepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseInt(btn.dataset.step);
            updateStep(step);
        });
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) updateStep(currentStep + 1);
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) updateStep(currentStep - 1);
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            updateStep(1);
            showSuccess('Formulaire réinitialisé.');
        });
    }

    // Toggle Advanced Fields Logic
    const toggleAdvancedBtn = document.getElementById('toggle-advanced-fields');
    const advancedContainer = document.getElementById('advanced-fields-container');
    const toggleIcon = document.getElementById('advanced-toggle-icon');

    if (toggleAdvancedBtn && advancedContainer) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isHidden = advancedContainer.classList.contains('hidden');
            if (isHidden) {
                advancedContainer.classList.remove('hidden');
                gsap.from(advancedContainer, { height: 0, opacity: 0, duration: 0.5, ease: 'power2.out' });
                if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
            } else {
                gsap.to(advancedContainer, {
                    height: 0,
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: () => {
                        advancedContainer.classList.add('hidden');
                        advancedContainer.style.height = 'auto'; // Reset for next open
                        advancedContainer.style.opacity = '1';
                    }
                });
                if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const integerFields = [
            'MSSubClass', 'OverallQual', 'OverallCond', 'YearBuilt', 'YearRemodAdd',
            '1stFlrSF', '2ndFlrSF', 'LowQualFinSF', 'GrLivArea', 'FullBath',
            'HalfBath', 'BedroomAbvGr', 'KitchenAbvGr', 'TotRmsAbvGrd', 'Fireplaces',
            'WoodDeckSF', 'OpenPorchSF', 'EnclosedPorch', '3SsnPorch', 'ScreenPorch',
            'PoolArea', 'MiscVal', 'MoSold', 'YrSold', 'LotArea'
        ];

        const floatFields = ['TotalBsmtSF', 'GarageArea', 'MasVnrArea', 'LotFrontage', 'BsmtFinSF1', 'BsmtFinSF2', 'BsmtUnfSF', 'GarageCars'];

        integerFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '') {
                data[field] = Math.round(Number(data[field]));
            }
        });

        floatFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '') {
                data[field] = parseFloat(data[field]);
            }
        });

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="flex items-center"><svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Calcul...</span>';

        try {
            const result = await api.predict(data);
            showPredictionResult(result);
            showSuccess('Prédiction réussie !');
        } catch (error) {
            console.error('Prediction failed:', error);
            showError('Erreur : ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Générer l\'IA Estimation';
        }
    });
}

function showPredictionResult(result) {
    const resultElement = document.getElementById('prediction-result');
    const priceValue = document.getElementById('predicted-price-value');

    if (!resultElement || !priceValue) return;

    // Correct path for the new API version
    const price = result.predictions && result.predictions[0]
        ? result.predictions[0].predicted_price
        : (result.predicted_price || 0);

    resultElement.classList.remove('hidden');
    animateCounter(priceValue, price);

    // Smooth scroll to result
    setTimeout(() => {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Load Analytics Data
async function loadAnalyticsData() {
    try {
        const overview = await api.getStatsOverview();
        const statsMapping = {
            'stat-total-props': 'total_properties',
            'stat-avg-price': 'avg_price',
            'stat-max-price': 'max_price',
            'stat-median-price': 'median_price'
        };

        Object.entries(statsMapping).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) {
                if (key.includes('price')) {
                    el.textContent = formatCurrency(overview[key]);
                } else {
                    animateCounter(el, overview[key]);
                }
            }
        });

        const distribution = await api.getPriceDistribution();
        createPriceDistributionChart('price-dist-chart', distribution);

        const neighborhoods = await api.getNeighborhoodStats();
        const topNb = neighborhoods.sort((a, b) => b.property_count - a.property_count).slice(0, 10);
        const ctxNb = document.getElementById('neighborhood-chart');
        if (ctxNb) {
            new Chart(ctxNb, {
                type: 'bar',
                data: {
                    labels: topNb.map(n => n.Neighborhood),
                    datasets: [{
                        label: 'Prix Moyen ($)',
                        data: topNb.map(n => n.avg_price),
                        backgroundColor: '#2563eb80',
                        borderColor: '#2563eb',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { callback: value => formatCurrency(value) } } }
                }
            });
        }
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Load Model Performance Data
async function loadModelPerformanceData() {
    try {
        const info = await api.getModelInfo();
        const comparison = await api.getModelComparison();

        // Update main metrics from top model (ranked by RMSE)
        if (comparison && comparison.length > 0) {
            const topModel = comparison[0];

            const r2Display = document.getElementById('metric-r2-display');
            if (r2Display) {
                const r2Val = (topModel.r2 * 100).toFixed(1);
                const [intPart, decPart] = r2Val.split('.');
                r2Display.innerHTML = `${intPart}<span class="text-3xl">.${decPart}%</span>`;
            }

            const rmseDisplay = document.getElementById('metric-rmse-display');
            if (rmseDisplay) rmseDisplay.textContent = formatCurrency(topModel.rmse);

            const maeDisplay = document.getElementById('metric-mae-display');
            if (maeDisplay) maeDisplay.textContent = formatCurrency(topModel.mae);
        }

        // Feature Importance (if available)
        if (info.feature_importance) {
            const features = Object.entries(info.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            createFeatureImportanceChart('feature-importance-chart', features.map(f => f[0]), features.map(f => f[1]));
        }

        // Comparison Table Rendering
        const tableBody = document.getElementById('model-comparison-body');
        if (tableBody && comparison) {
            tableBody.innerHTML = comparison.map((item, index) => {
                const isWinner = index === 0;
                return `
                <tr class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td class="py-6 px-4">
                        <div class="flex items-center space-x-3">
                            <span class="w-8 h-8 rounded-lg ${isWinner ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center font-bold text-xs">${index + 1}</span>
                            <span class="font-bold text-slate-700 dark:text-slate-300">${item.model}</span>
                        </div>
                    </td>
                    <td class="py-6 px-4 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-400">$${Math.round(item.rmse).toLocaleString()}</td>
                    <td class="py-6 px-4 text-center">
                        <span class="px-3 py-1 rounded-full ${isWinner ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} text-[10px] font-black">${(item.r2 * 100).toFixed(1)}%</span>
                    </td>
                    <td class="py-6 px-4 text-center font-mono text-xs text-slate-500">$${Math.round(item.mae).toLocaleString()}</td>
                    <td class="py-6 px-4 text-right">
                        ${isWinner ? '<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Actif</span>' : '<span class="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Candidat</span>'}
                    </td>
                </tr>
            `}).join('');
        }

        const paramsDisplay = document.getElementById('model-params-display');
        if (paramsDisplay) paramsDisplay.textContent = JSON.stringify(info.parameters, null, 4);
    } catch (error) {
        console.error('Error loading model performance data:', error);
    }
}

// --- SMART MODE HANDLERS ---

function initSmartModeEvents() {
    const toggleBtn = document.getElementById('toggle-smart-mode');
    const smartContainer = document.getElementById('smart-input-container');
    const analyzeBtn = document.getElementById('analyze-description-btn');
    const autoFillBtn = document.getElementById('auto-fill-btn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = smartContainer.classList.contains('hidden');
            smartContainer.classList.toggle('hidden');
            toggleBtn.innerHTML = isHidden ?
                '<span class="w-2 h-2 rounded-full bg-slate-400"></span><span class="text-[10px] font-black uppercase tracking-widest">Retour au Formulaire Classique</span>' :
                '<span class="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span><span class="text-[10px] font-black uppercase tracking-widest">Passer en Mode Conversationnel (IA)</span>';
        });
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyzeDescription);
    }

    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', handleAutoFill);
    }
}

async function handleAnalyzeDescription() {
    const inputEl = document.getElementById('smart-description-input');
    const description = inputEl ? inputEl.value : '';
    if (!description) {
        alert('Veuillez entrer une description.');
        return;
    }

    const status = document.getElementById('smart-status');
    if (status) status.classList.remove('hidden');

    try {
        const extracted = await api.parseDescription(description);
        await fillFormWithData(extracted);

        // Hide smart mode and show form with filled data
        document.getElementById('smart-input-container').classList.add('hidden');
        document.getElementById('toggle-smart-mode').innerHTML = '<span class="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span><span class="text-[10px] font-black uppercase tracking-widest">Passer en Mode Conversationnel (IA)</span>';

        showSuccess('Description analysée et formulaire pré-rempli !');
    } catch (error) {
        console.error('Error analyzing description:', error);
        showError('Erreur d\'analyse. Assurez-vous que l\'API est active.');
    } finally {
        if (status) status.classList.add('hidden');
    }
}

async function handleAutoFill() {
    try {
        const defaults = await api.getDefaults();
        await fillFormWithData(defaults);
        showSuccess('Formulaire rempli avec les valeurs moyennes.');
    } catch (error) {
        console.error('Error during auto-fill:', error);
    }
}

async function fillFormWithData(data) {
    const form = document.getElementById('house-prediction-form');
    if (!form) return;

    Object.entries(data).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = value;
            // Trigger range display updates
            if (input.type === 'range') {
                const display = document.getElementById(`val-${key}`);
                if (display) display.textContent = `${value}/10`;
            }
            // Trigger change event
            input.dispatchEvent(new Event('change'));
        }
    });
}

// Export for debugging
window.app = {
    api,
    storage,
    formatCurrency,
    formatNumber,
    showSuccess,
    showError,
    setNeighborhood
};

console.log('✅ Dashboard ready! Access app utilities via window.app');
