/**
 * UI Utilities for Loading States and Error Handling
 */

const UIUtils = {
    // Show loading spinner
    showLoading: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16">
                <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-slate-500 font-medium">Chargement des données...</p>
            </div>
        `;
    },

    // Show error message
    showError: (containerId, message) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="alert-circle" class="w-8 h-8 text-red-600 dark:text-red-400"></i>
                </div>
                <p class="text-red-600 dark:text-red-400 font-medium mb-2">Erreur de chargement</p>
                <p class="text-sm text-slate-500">${message}</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    // Show toast notification
    showToast: (message, type = 'info') => {
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-amber-500'
        };

        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Debounce function for performance
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export globally
window.UIUtils = UIUtils;
