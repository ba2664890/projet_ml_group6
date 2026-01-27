/**
 * Simple SPA Router for Laplace Immo Dashboard
 */

class Router {
    constructor() {
        this.views = {
            overview: { title: "Executive Overview", subtitle: "Real-time market insights powered by Machine Learning." },
            predict: { title: "AI Price Prediction", subtitle: "Enter property parameters to get an instant valuation." },
            analytics: { title: "Market Analytics", subtitle: "Deep dive into housing trends and distributions." },
            model: { title: "Model Performance", subtitle: "Analysis of the Gradient Boosting model metrics." }
        };
        this.currentView = null;
        this.container = document.getElementById('view-container');
        this.titleEl = document.querySelector('#view-title h2');
        this.subtitleEl = document.querySelector('#view-title p');
        this.links = document.querySelectorAll('.sidebar-link[data-view]');

        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', () => {
                const view = link.getAttribute('data-view');
                if (view) this.navigate(view);
            });
        });

        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.navigate(e.state.view, false);
            }
        });

        // Load default view (overview)
        this.navigate('overview', false);

        // Setup theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close sidebar when clicking a link on mobile
            this.links.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 1024) {
                        sidebar.classList.remove('open');
                    }
                });
            });
        }
    }

    async navigate(viewId, pushState = true) {
        if (this.currentView === viewId) return;

        const viewInfo = this.views[viewId];
        if (!viewInfo) return;

        // Update UI
        this.currentView = viewId;
        this.titleEl.textContent = viewInfo.title;
        this.subtitleEl.textContent = viewInfo.subtitle;

        // Update Sidebar Active State
        this.links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-view') === viewId);
        });

        // Push to History
        if (pushState) {
            history.pushState({ view: viewId }, viewInfo.title, `#${viewId}`);
        }

        // Load View Content
        this.container.classList.remove('view-enter');
        void this.container.offsetWidth; // Trigger reflow

        try {
            const content = await this.loadViewContent(viewId);
            this.container.innerHTML = content;
            this.container.classList.add('view-enter');

            // Re-initialize dynamic components for this view
            this.initViewComponents(viewId);
        } catch (err) {
            console.error('Error loading view:', err);
            this.container.innerHTML = `<div class="p-8 text-red-500">Error loading view: ${viewId}</div>`;
        }
    }

    async loadViewContent(viewId) {
        // In a real production app, we might fetch HTML fragments.
        // Here we'll call specific initialization functions for each view.
        if (window.Views && window.Views[viewId]) {
            return window.Views[viewId].template();
        }
        return `<div>Content for ${viewId} not found.</div>`;
    }

    initViewComponents(viewId) {
        if (window.Views && window.Views[viewId] && window.Views[viewId].init) {
            window.Views[viewId].init();
        }
    }
}

// Global Views Object to be populated by specific JS files
window.Views = {};

// When everything is loaded, start the router
document.addEventListener('DOMContentLoaded', () => {
    // We need to wait for view scripts to load
    // For this demonstration, we'll manually ensure they are loaded
    const checkViewsLoaded = setInterval(() => {
        if (Object.keys(window.Views).length >= 1) { // Wait for at least overview
            clearInterval(checkViewsLoaded);
            window.router = new Router();
        }
    }, 100);
});
