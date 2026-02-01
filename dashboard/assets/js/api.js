// API Configuration and Communication Layer
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : window.location.origin; // Emploi de l'origine actuelle en production

class HousePriceAPI {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = 'API request failed';

                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
                    } else {
                        errorMessage = errorData.detail;
                    }
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Health Check
    async checkHealth() {
        return await this.request('/health');
    }

    // Get Model Info
    async getModelInfo() {
        return await this.request('/model/info');
    }

    // Single Prediction
    async predict(houseData) {
        return await this.request('/predict', {
            method: 'POST',
            body: JSON.stringify(houseData)
        });
    }

    // Batch Prediction
    async predictBatch(housesData) {
        return await this.request('/predict/batch', {
            method: 'POST',
            body: JSON.stringify(housesData)
        });
    }

    // Get API Root Info
    async getInfo() {
        return await this.request('/');
    }

    // Dataset Statistics
    async getStatsOverview() {
        return await this.request('/api/stats/overview');
    }

    async getNeighborhoodStats() {
        return await this.request('/api/stats/neighborhoods');
    }

    async getPriceDistribution(bins = 20) {
        return await this.request(`/api/stats/price-distribution?bins=${bins}`);
    }

    async getModelComparison() {
        return await this.request('/model/comparison');
    }

    async parseDescription(description) {
        return await this.request('/api/model/parse-description', {
            method: 'POST',
            body: JSON.stringify({ description })
        });
    }

    async getDefaults() {
        return await this.request('/api/stats/defaults');
    }
}

// Create global API instance
const api = new HousePriceAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HousePriceAPI, api };
}
