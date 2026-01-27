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

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToElement(targetId);

            // Close mobile menu if open
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', throttle(() => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }

        lastScroll = currentScroll;
    }, 100));
}

// Load Initial Data
async function loadInitialData() {
    try {
        // Check API health
        const health = await api.checkHealth();
        console.log('API Health:', health);

        // Get model info
        const modelInfo = await api.getModelInfo();
        console.log('Model Info:', modelInfo);

        // Update UI with model info
        updateModelInfo(modelInfo);

    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Erreur de connexion à l\'API. Vérifiez que le serveur est démarré.');
    }
}

// Update Model Info in UI
function updateModelInfo(modelInfo) {
    // Update stats in hero section if available
    if (modelInfo.parameters) {
        console.log('Model parameters loaded:', modelInfo.parameters);
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
            console.log('Prediction form loaded');
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
            console.log('Analytics loaded');
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
            console.log('Model performance loaded');
        } catch (error) {
            console.error('Error loading model performance:', error);
        }
    }

    // Initialize Map
    initInteractiveMap();
}

// Setup Form Handlers for Multi-step
function setupFormHandlers() {
    const form = document.getElementById('house-prediction-form');
    if (!form) return;

    let currentStep = 1;
    const totalSteps = 3;

    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-prediction');
    const steps = document.querySelectorAll('.step-item');

    function updateStep(newStep) {
        // Hide all steps
        for (let i = 1; i <= totalSteps; i++) {
            document.getElementById(`form-step-${i}`).classList.add('hidden');
            steps[i - 1].querySelector('span').classList.replace('bg-blue-600', 'bg-slate-200');
            steps[i - 1].querySelector('span').classList.replace('text-white', 'text-slate-500');
            steps[i - 1].querySelector('span').classList.remove('dark:bg-blue-600');
        }

        // Show current step
        document.getElementById(`form-step-${newStep}`).classList.remove('hidden');
        steps[newStep - 1].querySelector('span').classList.replace('bg-slate-200', 'bg-blue-600');
        steps[newStep - 1].querySelector('span').classList.replace('text-slate-500', 'text-white');

        // Update buttons
        prevBtn.classList.toggle('hidden', newStep === 1);
        nextBtn.classList.toggle('hidden', newStep === totalSteps);
        submitBtn.classList.toggle('hidden', newStep < totalSteps);

        currentStep = newStep;

        // Animate transition
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

        // Data casting
        const numericFields = [
            'LotArea', 'YearBuilt', 'OverallQual', 'OverallCond',
            'GrLivArea', 'TotalBsmtSF', 'TotRmsAbvGrd', 'FullBath', 'HalfBath',
            'GarageCars', 'GarageArea', 'MSSubClass', 'YearRemodAdd',
            'first_flr_sf', 'second_flr_sf', 'LowQualFinSF', 'BedroomAbvGr',
            'KitchenAbvGr', 'Fireplaces', 'WoodDeckSF', 'OpenPorchSF',
            'EnclosedPorch', 'three_season_porch', 'ScreenPorch', 'PoolArea',
            'MiscVal', 'MoSold', 'YrSold'
        ];

        numericFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '') {
                data[field] = Number(data[field]);
            }
        });

        // Optional fields that should be null if empty
        const optionalFields = ['LotFrontage', 'Alley', 'MasVnrType', 'MasVnrArea', 'BsmtQual', 'BsmtCond', 'BsmtExposure', 'BsmtFinType1', 'BsmtFinSF1', 'BsmtFinType2', 'BsmtFinSF2', 'BsmtUnfSF', 'BsmtFullBath', 'BsmtHalfBath', 'Electrical', 'FireplaceQu', 'GarageType', 'GarageYrBlt', 'GarageFinish', 'GarageQual', 'GarageCond', 'PoolQC', 'Fence', 'MiscFeature'];

        optionalFields.forEach(field => {
            if (!data[field] || data[field] === '') {
                data[field] = null;
            }
        });

        // Show loading state
        console.log('Sending prediction payload:', data);
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
            submitBtn.innerHTML = 'Calculer le prix';
        }
    });
}

function showPredictionResult(result) {
    const resultElement = document.getElementById('prediction-result');
    const priceValue = document.getElementById('predicted-price-value');

    resultElement.classList.remove('hidden');
    animateCounter(priceValue, result.predicted_price);

    // Smooth scroll to result
    setTimeout(() => {
        scrollToElement('prediction-result');
    }, 100);
}

// Load Analytics Data
async function loadAnalyticsData() {
    try {
        // Overview Stats
        const overview = await api.getStatsOverview();
        const totalProps = document.getElementById('stat-total-props');
        if (totalProps) animateCounter(totalProps, overview.total_properties);

        const avgPrice = document.getElementById('stat-avg-price');
        if (avgPrice) avgPrice.textContent = formatCurrency(overview.avg_price);

        const maxPrice = document.getElementById('stat-max-price');
        if (maxPrice) maxPrice.textContent = formatCurrency(overview.max_price);

        const medianPrice = document.getElementById('stat-median-price');
        if (medianPrice) medianPrice.textContent = formatCurrency(overview.median_price);

        // Price Distribution Chart
        const distribution = await api.getPriceDistribution();
        createPriceDistributionChart('price-dist-chart', distribution);

        // Neighborhood Chart
        const neighborhoods = await api.getNeighborhoodStats();
        // Take top 10 neighborhoods by volume
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
                        backgroundColor: '#10b98180',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
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

        // Render Feature Importance
        if (info.feature_importance) {
            // Note: In simplified version we use generic names if names not provided by API
            // For now, let's just show top 10 values
            const mockFeatureNames = [
                'OverallQual', 'GrLivArea', 'TotalBsmtSF', '2ndFlrSF',
                'BsmtFinSF1', 'LotArea', '1stFlrSF', 'YearBuilt',
                'GarageCars', 'OverallCond'
            ];

            createFeatureImportanceChart('feature-importance-chart', mockFeatureNames, info.feature_importance);
        }

        // Render Params
        const paramsDisplay = document.getElementById('model-params-display');
        if (paramsDisplay) {
            paramsDisplay.textContent = JSON.stringify(info.parameters, null, 4);
        }

    } catch (error) {
        console.error('Error loading model performance data:', error);
    }
}

// Initialize Interactive Map
function initInteractiveMap() {
    const mapElement = document.getElementById('map-container');
    if (!mapElement) return;

    // Center on Ames, Iowa
    const amesCoords = [42.0308, -93.6319];
    const map = L.map('map-container').setView(amesCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Mock neighborhood coordinates for demonstration
    const neighborhoodCoords = {
        "CollgCr": [42.02, -93.68],
        "OldTown": [42.03, -93.61],
        "Edwards": [42.02, -93.66],
        "Somerst": [42.05, -93.64],
        "NridgHt": [42.06, -93.65]
    };

    Object.entries(neighborhoodCoords).forEach(([name, coords]) => {
        L.circle(coords, {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.5,
            radius: 500
        }).addTo(map).bindPopup(`<b>Quartier: ${name}</b><br>Zone résidentielle populaire.`);
    });
}

// Export for debugging
window.app = {
    api,
    storage,
    formatCurrency,
    formatNumber,
    showSuccess,
    showError
};

console.log('✅ Dashboard ready! Access app utilities via window.app');
