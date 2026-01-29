/**
 * Interactive Map Module for Laplace Immo
 * Handles Leaflet initialization, neighborhood markers, and data visualization.
 */

class RealEstateMap {
    constructor(containerId = 'map-container') {
        this.containerId = containerId;
        this.map = null;
        this.markers = L.layerGroup();
        this.baseLayers = {};

        // Coordinates for Ames, Iowa neighborhoods (approximate centroids)
        this.neighborhoodCoords = {
            "CollgCr": [42.018, -93.685],
            "Veenker": [42.041, -93.654],
            "Crawfor": [42.025, -93.642],
            "NoRidge": [42.051, -93.652],
            "Mitchel": [41.992, -93.602],
            "Somerst": [42.052, -93.644],
            "NWAmes": [42.048, -93.633],
            "OldTown": [42.030, -93.614],
            "BrkSide": [42.033, -93.623],
            "Sawyer": [42.033, -93.669],
            "NridgHt": [42.062, -93.655],
            "NAmes": [42.044, -93.614],
            "SawyerW": [42.034, -93.684],
            "IDOTRR": [42.023, -93.621],
            "MeadowV": [41.993, -93.612],
            "Edwards": [42.021, -93.665],
            "Timber": [41.998, -93.653],
            "Gilbert": [42.061, -93.640],
            "StoneBr": [42.060, -93.632],
            "ClearCr": [42.030, -93.676],
            "NPkVill": [42.050, -93.626],
            "Blmngtn": [42.060, -93.642],
            "BrDale": [42.053, -93.618],
            "SWISU": [42.020, -93.650],
            "Blueste": [42.009, -93.646]
        };
    }

    init() {
        const mapElement = document.getElementById(this.containerId);
        if (!mapElement) return;

        // Ames, Iowa center
        const center = [42.0308, -93.6319];

        // Setup Layers
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        });

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        this.map = L.map(this.containerId, {
            center: center,
            zoom: 13,
            layers: [osm]
        });

        this.baseLayers = {
            "Rues (OSM)": osm,
            "Satellite (Esri)": satellite
        };

        L.control.layers(this.baseLayers, { "Quartiers": this.markers }).addTo(this.map);
        this.markers.addTo(this.map);

        // Add Legend
        this.addLegend();

        // External Toggle Link
        const toggleBtn = document.getElementById('map-satellite-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSatellite());
        }

        // Load data
        this.loadData();
    }

    toggleSatellite() {
        if (this.map.hasLayer(this.baseLayers["Satellite (Esri)"])) {
            this.map.removeLayer(this.baseLayers["Satellite (Esri)"]);
            this.map.addLayer(this.baseLayers["Rues (OSM)"]);
        } else {
            this.map.removeLayer(this.baseLayers["Rues (OSM)"]);
            this.map.addLayer(this.baseLayers["Satellite (Esri)"]);
        }
    }

    async loadData() {
        try {
            const stats = await api.getNeighborhoodStats();
            this.renderNeighborhoods(stats);
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    renderNeighborhoods(stats) {
        this.markers.clearLayers();

        stats.forEach(s => {
            const coords = this.neighborhoodCoords[s.Neighborhood];
            if (!coords) return;

            const color = this.getColor(s.avg_price);
            const radius = Math.sqrt(s.property_count) * 100; // Size relative to volume

            const marker = L.circle(coords, {
                color: color,
                fillColor: color,
                fillOpacity: 0.6,
                radius: radius,
                weight: 2
            });

            // Rich Tooltip
            marker.bindPopup(`
                <div class="p-2 space-y-2 min-w-[200px]">
                    <div class="flex items-center justify-between border-b pb-1">
                        <h4 class="font-black text-brand-600 uppercase tracking-widest text-xs">${s.Neighborhood}</h4>
                        <span class="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md text-[10px] font-bold">${s.property_count} Ventes</span>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prix Moyen</p>
                        <p class="text-xl font-black text-slate-900">${this.formatCurrency(s.avg_price)}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-2">
                        <div class="bg-slate-50 p-2 rounded-lg">
                            <p class="text-[8px] font-bold text-slate-400 uppercase">Min</p>
                            <p class="text-xs font-bold text-slate-700">${this.formatCurrency(s.min_price)}</p>
                        </div>
                        <div class="bg-slate-50 p-2 rounded-lg">
                            <p class="text-[8px] font-bold text-slate-400 uppercase">Max</p>
                            <p class="text-xs font-bold text-slate-700">${this.formatCurrency(s.max_price)}</p>
                        </div>
                    </div>
                    <button onclick="app.setNeighborhood('${s.Neighborhood}')" class="w-full mt-2 py-2 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-700 transition-colors">Prédire dans ce quartier</button>
                </div>
            `);

            marker.on('mouseover', function (e) { this.openPopup(); });

            this.markers.addLayer(marker);
        });
    }

    getColor(price) {
        return price > 300000 ? '#1e3a8a' : // Deep Blue
            price > 200000 ? '#2563eb' : // Brand Blue
                price > 150000 ? '#60a5fa' : // Sky Blue
                    price > 100000 ? '#93c5fd' : // Light Blue
                        '#dbeafe';   // Pale Blue
    }

    addLegend() {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl space-y-2');
            const grades = [0, 100000, 150000, 200000, 300000];
            const labels = ['#dbeafe', '#93c5fd', '#60a5fa', '#2563eb', '#1e3a8a'];

            div.innerHTML = '<h5 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Prix Moyen</h5>';
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML += `
                    <div class="flex items-center space-x-2">
                        <i class="w-3 h-3 rounded-full" style="background:${labels[i]}"></i>
                        <span class="text-[10px] font-bold text-slate-700">${grades[i] === 300000 ? '300k$+' : grades[i] / 1000 + 'k$ - ' + grades[i + 1] / 1000 + 'k$'}</span>
                    </div>
                `;
            }
            return div;
        };
        legend.addTo(this.map);
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    }
}

// Global instance
const realEstateMap = new RealEstateMap();
