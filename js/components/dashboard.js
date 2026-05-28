/* ==========================================================================
   MAIN DASHBOARD COMPONENT (js/components/dashboard.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

window.DocTrackDashboard = {
    render(container) {
        const stats = window.DocTrackStore.getAnalyticsSummary();
        const activeDomain = window.DocTrackStore.getCurrentDomain();
        
        container.innerHTML = `
            <div class="dashboard-layout">
                <!-- Welcome hero banner -->
                <div class="welcome-banner">
                    <div class="welcome-content">
                        <h2>Welcome back, ${window.DocTrackStore.state.currentUser ? window.DocTrackStore.state.currentUser.username : 'User'}</h2>
                        <p>Managing document tracking pipelines for <strong>${activeDomain.name}</strong>. The platform is running smoothly using reactive microservice modules.</p>
                    </div>
                </div>

                <!-- Summary KPI Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card glass-panel">
                        <div class="kpi-icon total">
                            <i class="fa-solid fa-folder-tree"></i>
                        </div>
                        <div class="kpi-data">
                            <span class="kpi-title">Total Records</span>
                            <span class="kpi-value" id="kpi-total">${stats.total}</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card glass-panel">
                        <div class="kpi-icon active">
                            <i class="fa-solid fa-spinner"></i>
                        </div>
                        <div class="kpi-data">
                            <span class="kpi-title">Active Tracks</span>
                            <span class="kpi-value" id="kpi-active">${stats.active}</span>
                        </div>
                    </div>

                    <div class="kpi-card glass-panel">
                        <div class="kpi-icon delayed">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </div>
                        <div class="kpi-data">
                            <span class="kpi-title">Stalled Tracks</span>
                            <span class="kpi-value" id="kpi-delayed">${stats.delayed}</span>
                        </div>
                    </div>

                    <div class="kpi-card glass-panel">
                        <div class="kpi-icon bottlenecks">
                            <i class="fa-solid fa-circle-exclamation"></i>
                        </div>
                        <div class="kpi-data">
                            <span class="kpi-title">Bottlenecks</span>
                            <span class="kpi-value" id="kpi-bottlenecks">${stats.bottlenecks.length}</span>
                        </div>
                    </div>
                </div>

                <!-- Secondary Split Section -->
                <div class="dashboard-split">
                    <!-- Left column: Interactive Database List -->
                    <div class="glass-panel table-panel">
                        <div class="panel-title">
                            <h3><i class="fa-solid fa-table-list"></i> Document Repositories</h3>
                            <span class="badge badge-process" id="lbl-records-count">${window.DocTrackStore.state.documents.length} Files</span>
                        </div>
                        <div class="table-wrapper">
                            <table class="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Document ID</th>
                                        <th>Document Name</th>
                                        <th>Active Office</th>
                                        <th>Status</th>
                                        <th>Last Scan</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="dashboard-docs-body">
                                    <!-- Rendered dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right Column: Shortcuts and Feed -->
                    <div class="flex-column gap-24">
                        <!-- Fast Actions Grid -->
                        <div class="glass-panel actions-card">
                            <h3 style="font-size: 1.1rem; margin-bottom: 16px;"><i class="fa-solid fa-bolt"></i> Operations</h3>
                            <div class="actions-grid">
                                <button class="action-item" onclick="window.location.hash='#documents'">
                                    <div class="action-item-icon"><i class="fa-solid fa-folder-plus"></i></div>
                                    <div>
                                        <strong style="display:block; font-size: 13px;">Create Document</strong>
                                        <span style="font-size: 11px; color:#64748b;">Generate QR/Barcode & Workflow</span>
                                    </div>
                                </button>
                                <button class="action-item" onclick="window.location.hash='#tracking'">
                                    <div class="action-item-icon"><i class="fa-solid fa-barcode"></i></div>
                                    <div>
                                        <strong style="display:block; font-size: 13px;">Barcode Scanner</strong>
                                        <span style="font-size: 11px; color:#64748b;">Simulate scan & transition stage</span>
                                    </div>
                                </button>
                                <button class="action-item" onclick="window.location.hash='#analytics'">
                                    <div class="action-item-icon"><i class="fa-solid fa-chart-simple"></i></div>
                                    <div>
                                        <strong style="display:block; font-size: 13px;">Performance Analytics</strong>
                                        <span style="font-size: 11px; color:#64748b;">Verify delays & workloads</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Global Audit Feed -->
                        <div class="glass-panel" style="flex-grow: 1;">
                            <div class="panel-title">
                                <h3><i class="fa-solid fa-timeline"></i> Dynamic Audit Trail</h3>
                            </div>
                            <div class="activity-list" id="dashboard-audit-feed">
                                <!-- Rendered dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.renderDocumentsTable(window.DocTrackStore.state.documents);
        this.renderAuditLogs(window.DocTrackStore.state.historyLogs);
        
        // Subscribe to window.DocTrackStore updates to keep lists live
        this.unsubscribeState = window.DocTrackStore.subscribe('state_changed', (state) => {
            const stats = window.DocTrackStore.getAnalyticsSummary();
            
            // Re-update counter text nodes safely
            const totalVal = document.getElementById('kpi-total');
            const activeVal = document.getElementById('kpi-active');
            const delayVal = document.getElementById('kpi-delayed');
            const bottleVal = document.getElementById('kpi-bottlenecks');
            const countLabel = document.getElementById('lbl-records-count');
            
            if (totalVal) totalVal.textContent = stats.total;
            if (activeVal) activeVal.textContent = stats.active;
            if (delayVal) delayVal.textContent = stats.delayed;
            if (bottleVal) bottleVal.textContent = stats.bottlenecks.length;
            if (countLabel) countLabel.textContent = `${state.documents.length} Files`;
            
            this.renderDocumentsTable(state.documents);
            this.renderAuditLogs(state.historyLogs);
        });
    },

    renderDocumentsTable(docs) {
        const tbody = document.getElementById('dashboard-docs-body');
        if (!tbody) return;
        
        if (docs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #64748b; padding: 40px 0;">
                        No documents registered inside this environment yet.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = docs.map(doc => {
            let statusClass = 'badge-process';
            if (doc.status === 'Completed') statusClass = 'badge-success';
            if (doc.status === 'Delayed') statusClass = 'badge-danger';
            if (doc.status === 'Under Review') statusClass = 'badge-warning';

            const localTimeStr = new Date(doc.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <tr>
                    <td class="doc-id-cell">${doc.id}</td>
                    <td class="doc-name-cell">${doc.name}</td>
                    <td><span style="font-weight: 500;">${window.DocTrackStore.getDepartmentName(doc.currentStage)}</span></td>
                    <td><span class="badge ${statusClass}">${doc.status}</span></td>
                    <td style="color: #94a3b8;">${localTimeStr}</td>
                    <td>
                        <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="window.location.hash='#tracking?doc=${doc.id}'">
                            <i class="fa-solid fa-magnifying-glass"></i> Track
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderAuditLogs(logs) {
        const feed = document.getElementById('dashboard-audit-feed');
        if (!feed) return;

        if (logs.length === 0) {
            feed.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 32px 0; font-size: 12px;">
                    No activities recorded yet.
                </div>
            `;
            return;
        }

        // Display up to 5 events on dashboard panel feed
        const visibleLogs = logs.slice(0, 5);

        feed.innerHTML = visibleLogs.map(log => {
            let iconClass = 'status-change';
            let icon = 'fa-route';
            if (log.status === 'Active' && log.comment.includes('created')) {
                iconClass = 'created';
                icon = 'fa-plus';
            }
            if (log.status === 'Delayed') {
                iconClass = 'delayed';
                icon = 'fa-clock';
            }

            const logTime = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <span style="font-size:13px; font-weight:500;">${log.comment}</span>
                        <div class="activity-meta">
                            <span class="activity-doc-id">${log.docId}</span> &bull; 
                            <span>${logTime}</span> &bull; 
                            <span>By: ${log.officer}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Search filtering delegate called by main search input inside header
     */
    filterList(query) {
        if (!query) {
            this.renderDocumentsTable(window.DocTrackStore.state.documents);
            return;
        }

        const filtered = window.DocTrackStore.state.documents.filter(doc => 
            doc.id.toLowerCase().includes(query) || 
            doc.name.toLowerCase().includes(query) ||
            window.DocTrackStore.getDepartmentName(doc.currentStage).toLowerCase().includes(query) ||
            doc.status.toLowerCase().includes(query)
        );

        this.renderDocumentsTable(filtered);
    }
};
