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
    const formContainer = document.getElementById('prediction-form-container');
    if (formContainer) {
        try {
            const response = await fetch('components/prediction-form.html');
            formContainer.innerHTML = await response.text();
            setupFormHandlers();
        } catch (error) {
            console.error('Error loading prediction form:', error);
        }
    }

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
    const totalSteps = 3;

    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-prediction');
    const steps = document.querySelectorAll('.step-item');

    function updateStep(newStep) {
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`form-step-${i}`);
            if (stepEl) stepEl.classList.add('hidden');

            const stepItem = document.querySelector(`.step-item[data-step="${i}"]`);
            if (stepItem) {
                const circle = stepItem.querySelector('div');
                circle.classList.replace('bg-brand-600', 'bg-slate-100');
                circle.classList.replace('dark:bg-slate-700', 'bg-slate-100');
                circle.classList.replace('text-white', 'text-slate-400');
            }
        }

        const currentStepEl = document.getElementById(`form-step-${newStep}`);
        if (currentStepEl) currentStepEl.classList.remove('hidden');

        const currentStepItem = document.querySelector(`.step-item[data-step="${newStep}"]`);
        if (currentStepItem) {
            const circle = currentStepItem.querySelector('div');
            circle.classList.replace('bg-slate-100', 'bg-brand-600');
            circle.classList.add('text-white');
        }

        prevBtn.classList.toggle('hidden', newStep === 1);
        nextBtn.classList.toggle('hidden', newStep === totalSteps);
        submitBtn.classList.toggle('hidden', newStep < totalSteps);

        currentStep = newStep;

        gsap.from(`#form-step-${newStep}`, {
            duration: 0.5,
            x: 20,
            opacity: 0,
            ease: 'power2.out'
        });
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) updateStep(currentStep + 1);
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) updateStep(currentStep - 1);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const numericFields = [
            'LotArea', 'YearBuilt', 'OverallQual', 'OverallCond',
            'GrLivArea', 'TotalBsmtSF', 'TotRmsAbvGrd', 'FullBath', 'HalfBath',
            'GarageCars', 'GarageArea', 'MSSubClass', 'YearRemodAdd',
            '1stFlrSF', '2ndFlrSF', 'LowQualFinSF', 'BedroomAbvGr',
            'KitchenAbvGr', 'Fireplaces', 'WoodDeckSF', 'OpenPorchSF',
            'EnclosedPorch', '3SsnPorch', 'ScreenPorch', 'PoolArea',
            'MiscVal', 'MoSold', 'YrSold'
        ];

        numericFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '') {
                data[field] = Number(data[field]);
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
    resultElement.classList.remove('hidden');
    animateCounter(priceValue, result.predicted_price);
    setTimeout(() => scrollToElement('prediction-result'), 100);
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
        if (info.feature_importance) {
            const mockFeatureNames = ['OverallQual', 'GrLivArea', '1stFlrSF', 'TotalBsmtSF', 'GarageCars', 'LotArea', 'YearBuilt', 'YearRemodAdd', 'FullBath', 'OverallCond'];
            createFeatureImportanceChart('feature-importance-chart', mockFeatureNames, info.feature_importance);
        }
        const paramsDisplay = document.getElementById('model-params-display');
        if (paramsDisplay) paramsDisplay.textContent = JSON.stringify(info.parameters, null, 4);
    } catch (error) {
        console.error('Error loading model performance data:', error);
    }
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
