// Chart.js Configuration and Utilities

// Default Chart Colors
const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
};

// Chart.js Default Configuration
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#e2e8f0';

// Create Price Distribution Chart
function createPriceDistributionChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Number of Houses',
                data: data.values,
                backgroundColor: chartColors.primary + '80',
                borderColor: chartColors.primary,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Price Distribution',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDarkMode() ? '#334155' : '#e2e8f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create Feature Importance Chart
function createFeatureImportanceChart(canvasId, features, importances) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Sort by importance
    const sorted = features.map((feature, i) => ({
        feature,
        importance: importances[i]
    })).sort((a, b) => b.importance - a.importance).slice(0, 10);

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(item => item.feature),
            datasets: [{
                label: 'Importance',
                data: sorted.map(item => item.importance),
                backgroundColor: generateColorPalette(sorted.length),
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 10 Feature Importance',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: isDarkMode() ? '#334155' : '#e2e8f0'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create Scatter Plot (Actual vs Predicted)
function createScatterPlot(canvasId, actual, predicted) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const data = actual.map((value, i) => ({
        x: value,
        y: predicted[i]
    }));

    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Predictions',
                data: data,
                backgroundColor: chartColors.primary + '60',
                borderColor: chartColors.primary,
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: 'Perfect Prediction',
                data: [
                    { x: Math.min(...actual), y: Math.min(...actual) },
                    { x: Math.max(...actual), y: Math.max(...actual) }
                ],
                type: 'line',
                borderColor: chartColors.danger,
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Actual vs Predicted Prices',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `Actual: ${formatCurrency(context.parsed.x)}, Predicted: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Actual Price'
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Predicted Price'
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Create Line Chart
function createLineChart(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.map((dataset, i) => ({
                label: dataset.label,
                data: dataset.data,
                borderColor: Object.values(chartColors)[i],
                backgroundColor: Object.values(chartColors)[i] + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create Doughnut Chart
function createDoughnutChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColorPalette(labels.length),
                borderWidth: 2,
                borderColor: isDarkMode() ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Chart Theme
function updateChartTheme(chart) {
    if (!chart) return;

    const isDark = isDarkMode();
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#cbd5e1' : '#64748b';

    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    Chart.defaults.color = textColor;

    chart.update();
}

// Export chart functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createPriceDistributionChart,
        createFeatureImportanceChart,
        createScatterPlot,
        createLineChart,
        createDoughnutChart,
        updateChartTheme
    };
}
