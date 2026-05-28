/* ==========================================================================
   PERFORMANCE MONITORING & ANALYTICS CHARTS COMPONENT (js/components/analytics.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

window.DocTrackAnalytics = {
    render(container) {
        const stats = window.DocTrackStore.getAnalyticsSummary();
        const activeDomain = window.DocTrackStore.getCurrentDomain();
        
        container.innerHTML = `
            <div class="analytics-layout">
                <!-- Secondary Metrics Cards Grid -->
                <div class="analytics-metrics-grid">
                    <div class="glass-panel metric-card success">
                        <div class="metric-card-header">
                            <span>SLA Compliance Rate</span>
                            <i class="fa-solid fa-square-poll-vertical"></i>
                        </div>
                        <span class="metric-card-value">91.4%</span>
                        <span class="metric-card-trend trend-up">
                            <i class="fa-solid fa-arrow-trend-up"></i> +2.3% from last month
                        </span>
                    </div>

                    <div class="glass-panel metric-card warning">
                        <div class="metric-card-header">
                            <span>Active System Load</span>
                            <i class="fa-solid fa-gauge-high"></i>
                        </div>
                        <span class="metric-card-value">${stats.active} Docs</span>
                        <span class="metric-card-trend trend-down">
                            <i class="fa-solid fa-arrow-trend-down"></i> -1.4% vs capacity limits
                        </span>
                    </div>

                    <div class="glass-panel metric-card process">
                        <div class="metric-card-header">
                            <span>Avg Processing Velocity</span>
                            <i class="fa-solid fa-stopwatch"></i>
                        </div>
                        <span class="metric-card-value">22.8 Hrs</span>
                        <span class="metric-card-trend trend-up">
                            <i class="fa-solid fa-arrow-trend-up"></i> -3.5 hours reduction (improved)
                        </span>
                    </div>
                </div>

                <!-- High-Fidelity SVG Charts Section -->
                <div class="charts-grid">
                    <!-- Chart 1: Processing Times (SVG Column/Bar) -->
                    <div class="glass-panel chart-card">
                        <div class="chart-header">
                            <h3><i class="fa-solid fa-chart-column"></i> Target SLA vs Simulated Clearance (Hours)</h3>
                            <div class="chart-legend">
                                <span class="legend-item"><span class="legend-dot" style="background: var(--accent-secondary);"></span> Target SLA</span>
                                <span class="legend-item"><span class="legend-dot" style="background: var(--accent-primary);"></span> Real Clearance</span>
                            </div>
                        </div>
                        <div class="chart-viewport" id="chart-viewport-times">
                            <!-- SVG Rendered programmatically -->
                        </div>
                    </div>

                    <!-- Chart 2: Department Workload (Vertical Progress Panel) -->
                    <div class="glass-panel chart-card">
                        <div class="chart-header">
                            <h3><i class="fa-solid fa-server"></i> Departmental Active Operations Load (%)</h3>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:16px; width:100%;" id="chart-viewport-workload">
                            <!-- Rendered dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Bottlenecks Grid panel -->
                <div class="glass-panel" style="padding: 28px;">
                    <div class="panel-title" style="padding: 0 0 20px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                        <h3><i class="fa-solid fa-circle-radiation" style="color: var(--accent-danger);"></i> Bottleneck & Stalled Records Ledger</h3>
                        <span class="badge badge-danger">${stats.bottlenecks.length} Active Delays</span>
                    </div>
                    
                    <div class="bottlenecks-list" id="analytics-bottlenecks-ledger">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.renderTimesChart();
        this.renderWorkloadPanel();
        this.renderBottleneckLedger();

        // Subscribe to global window.DocTrackStore updates
        this.unsubscribeState = window.DocTrackStore.subscribe('state_changed', () => {
            this.renderTimesChart();
            this.renderWorkloadPanel();
            this.renderBottleneckLedger();
        });
    },

    /**
     * Draws a responsive, premium SVG column bar chart
     */
    renderTimesChart() {
        const viewport = document.getElementById('chart-viewport-times');
        if (!viewport) return;

        const depts = window.DocTrackStore.state.departments;
        if (depts.length === 0) return;

        const width = 450;
        const height = 240;
        const paddingLeft = 32;
        const paddingBottom = 28;
        const paddingTop = 12;
        const paddingRight = 12;
        
        const chartW = width - paddingLeft - paddingRight;
        const chartH = height - paddingTop - paddingBottom;
        
        // Find max value to calibrate y-axis scales
        const maxVal = Math.max(...depts.map(d => Math.max(d.targetTime, Math.round(d.targetTime * 1.35))), 80);
        
        let svg = `<svg class="svg-chart" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
        
        // Definitions for gradients
        svg += `
            <defs>
                <linearGradient id="gradient-sla" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-secondary)"/>
                    <stop offset="100%" stop-color="rgba(99, 102, 241, 0.2)"/>
                </linearGradient>
                <linearGradient id="gradient-clearance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-primary)"/>
                    <stop offset="100%" stop-color="rgba(16, 185, 129, 0.2)"/>
                </linearGradient>
            </defs>
        `;

        // Horizontal Grid guidelines
        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = paddingTop + (chartH / gridLines) * i;
            const val = Math.round(maxVal - (maxVal / gridLines) * i);
            
            // Draw grid line
            svg += `<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" class="chart-grid-line"/>`;
            // Draw y-axis label ticks
            svg += `<text x="${paddingLeft - 8}" y="${y + 4}" class="chart-label-text" text-anchor="end">${val}h</text>`;
        }

        // Draw columns bar loops
        const numBars = depts.length;
        const barSpacing = chartW / numBars;
        const barW = barSpacing * 0.35; // Column thickness
        
        depts.forEach((dept, idx) => {
            const startX = paddingLeft + idx * barSpacing + barSpacing * 0.15;
            
            // Calculate height ratios safely
            const targetH = (dept.targetTime / maxVal) * chartH;
            // Simulated realistic clearance times (some higher, some lower than SLA)
            let simulatedTime = dept.targetTime;
            if (dept.id === 'finance' || dept.id === 'insurance' || dept.id === 'customs') {
                simulatedTime = Math.round(dept.targetTime * 1.45); // bottlenecked
            } else {
                simulatedTime = Math.round(dept.targetTime * 0.85); // faster
            }
            const clearanceH = (simulatedTime / maxVal) * chartH;
            
            const targetY = paddingTop + chartH - targetH;
            const clearanceY = paddingTop + chartH - clearanceH;

            // Render columns
            // 1. Target SLA Column (Violet/Indigo)
            svg += `
                <g class="chart-bar-group" style="cursor:pointer;">
                    <rect x="${startX}" y="${targetY}" width="${barW}" height="${targetH}" rx="4" fill="url(#gradient-sla)" class="chart-bar"/>
                    <title>${dept.name} SLA: ${dept.targetTime} hours</title>
                </g>
            `;
            
            // 2. Real/Simulated Clearance Column (Green)
            svg += `
                <g class="chart-bar-group" style="cursor:pointer;">
                    <rect x="${startX + barW + 4}" y="${clearanceY}" width="${barW}" height="${clearanceH}" rx="4" fill="url(#gradient-clearance)" class="chart-bar chart-bar-alt"/>
                    <title>${dept.name} Simulated Avg: ${simulatedTime} hours</title>
                </g>
            `;

            // Draw x-axis Labels
            const labelX = startX + barW + 2;
            const shortName = dept.name.replace(' Office', '').replace(' Department', '').replace(' Coordinator', '').substring(0, 10);
            svg += `
                <text x="${labelX}" y="${height - 8}" class="chart-label-text" text-anchor="middle" font-weight="500">${shortName}..</text>
            `;
        });

        // Bottom structural border line
        svg += `<line x1="${paddingLeft}" y1="${paddingTop + chartH}" x2="${width - paddingRight}" y2="${paddingTop + chartH}" class="chart-axis-line"/>`;
        svg += `</svg>`;

        viewport.innerHTML = svg;
    },

    /**
     * Renders beautiful custom departmental workload bar segments
     */
    renderWorkloadPanel() {
        const viewport = document.getElementById('chart-viewport-workload');
        if (!viewport) return;

        const summary = window.DocTrackStore.getAnalyticsSummary();
        
        viewport.innerHTML = summary.departmentLoads.map(dept => {
            // Determine color accents dynamically based on workload threshold limit
            let colorVar = 'var(--accent-secondary)';
            if (dept.loadPercentage > 75) colorVar = 'var(--accent-danger)';
            else if (dept.loadPercentage > 50) colorVar = 'var(--accent-warning)';

            return `
                <div class="flex-column" style="width:100%; gap:6px;">
                    <div class="flex-between" style="font-size:13px;">
                        <span style="font-weight: 500; color: white;">${dept.name}</span>
                        <span style="font-weight: 700; color: ${colorVar};">${dept.loadPercentage}% Load (${dept.docCount} Active)</span>
                    </div>
                    <div style="width:100%; height:8px; background:var(--bg-base); border-radius:4px; overflow:hidden; border:1px solid var(--border-color);">
                        <div style="width:${dept.loadPercentage}%; height:100%; background:${colorVar}; border-radius:4px; transition: width 0.5s ease-out;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderBottleneckLedger() {
        const container = document.getElementById('analytics-bottlenecks-ledger');
        if (!container) return;

        const summary = window.DocTrackStore.getAnalyticsSummary();
        if (summary.bottlenecks.length === 0) {
            container.innerHTML = `
                <div class="empty-workflow-message">
                    All document systems clear. SLA timelines matching targeted benchmarks perfectly.
                </div>
            `;
            return;
        }

        container.innerHTML = summary.bottlenecks.map(b => {
            return `
                <div class="bottleneck-row glass-panel">
                    <div class="bottleneck-info">
                        <h4>${b.name}</h4>
                        <span>Active Office: <strong>${b.stage}</strong> &bull; Priority: <strong style="text-transform:uppercase; color: ${b.priority === 'high' ? 'var(--accent-danger)' : 'var(--accent-warning)'};">${b.priority}</strong></span>
                    </div>
                    <div class="bottleneck-stat">
                        <span class="bottleneck-duration">${b.duration} Delayed</span>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="window.location.hash='#tracking?doc=${b.id}'">
                            <i class="fa-solid fa-spinner"></i> Resolve Route
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
};
