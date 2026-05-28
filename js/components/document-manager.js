/* ==========================================================================
   DOCUMENT REGISTRATION & WORKFLOW CONFIGURATION COMPONENT (js/components/document-manager.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

window.DocTrackDocumentManager = {
    render(container) {
        const workflows = window.DocTrackStore.state.workflows;
        const depts = window.DocTrackStore.state.departments;
        
        container.innerHTML = `
            <div class="doc-manager-layout">
                <!-- Left Column: Document Creator Form -->
                <div class="flex-column gap-24">
                    <div class="glass-panel doc-form-card">
                        <h3 style="font-size: 1.2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <i class="fa-solid fa-file-circle-plus" style="color: var(--accent-secondary);"></i> Register Document
                        </h3>
                        
                        <div class="doc-form">
                            <div class="form-group">
                                <label for="doc-name">Document Title / Subject</label>
                                <div class="input-wrapper">
                                    <input type="text" id="doc-name" placeholder="e.g. Student Research Grant Request" required>
                                    <i class="fa-solid fa-file-signature"></i>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="doc-workflow">Workflow Configuration</label>
                                <div class="input-wrapper">
                                    <select id="doc-workflow">
                                        ${workflows.map(wf => `<option value="${wf.id}">${wf.name}</option>`).join('')}
                                    </select>
                                    <i class="fa-solid fa-route"></i>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="doc-priority">Processing Priority</label>
                                <div class="input-wrapper">
                                    <select id="doc-priority">
                                        <option value="high">High Priority (ASAP)</option>
                                        <option value="medium" selected>Medium Priority (Standard)</option>
                                        <option value="low">Low Priority (Flexible)</option>
                                    </select>
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                </div>
                            </div>

                            <!-- Flexible metadata block -->
                            <div class="metadata-section">
                                <div class="metadata-title">
                                    <h4>Custom SOC Metadata</h4>
                                    <button class="btn" id="btn-add-meta" style="padding: 4px 10px; font-size: 11px;">
                                        <i class="fa-solid fa-plus"></i> Add Field
                                    </button>
                                </div>
                                <div id="meta-fields-container">
                                    <!-- Seed key-value row -->
                                    <div class="metadata-row">
                                        <input type="text" placeholder="Metadata Key (e.g. Index No)" class="meta-key" value="Submitted By">
                                        <input type="text" placeholder="Value (e.g. AS2023376)" class="meta-val" value="${window.DocTrackStore.state.currentUser ? window.DocTrackStore.state.currentUser.username : 'Student'}">
                                        <button class="btn-delete-row" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>

                            <button class="btn btn-primary" id="btn-register-document" style="justify-content: center; padding: 12px; margin-top: 10px;">
                                <i class="fa-solid fa-check"></i> Register and Generate Barcode
                            </button>
                        </div>
                    </div>

                    <!-- Environment Documents list -->
                    <div class="glass-panel" style="padding: 24px;">
                        <h3 style="font-size: 1.1rem; margin-bottom: 16px;"><i class="fa-solid fa-folder-closed"></i> Registered Files</h3>
                        <div class="document-grid-list" id="doc-manager-files-list">
                            <!-- Rendered dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Right Column: Configurable Workflows flow builder -->
                <div class="glass-panel workflow-builder-panel">
                    <div class="panel-title">
                        <h3><i class="fa-solid fa-gears"></i> Workflow Customizer</h3>
                        <button class="btn btn-primary" id="btn-show-workflow-creator" style="padding: 4px 10px; font-size: 11px;">
                            <i class="fa-solid fa-plus"></i> New Pipeline
                        </button>
                    </div>
                    
                    <div class="workflow-builder-container" id="workflow-builder-stage-chain">
                        <!-- Loaded dynamically based on selected dropdown workflow -->
                    </div>

                    <!-- Interactive Workflow Creator Modal/Drawer form (hidden by default) -->
                    <div id="workflow-creator-drawer" class="hidden" style="padding: 24px; border-top: 1px solid var(--border-color); background: rgba(15, 23, 42, 0.4);">
                        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-secondary); margin-bottom: 12px;">Create Service Pipeline</h4>
                        <div class="flex-column gap-12">
                            <div class="form-group">
                                <label style="font-size: 11px;">Pipeline Name</label>
                                <input type="text" id="new-wf-name" placeholder="e.g. Student Board Clearance" style="background: var(--bg-base); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px; color: white;">
                            </div>
                            <div class="form-group">
                                <label style="font-size: 11px;">Select Department Sequencing (Order matters)</label>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;" id="dept-chips-container">
                                    ${depts.map(d => `<button class="btn btn-dept-chip" style="padding: 4px 8px; font-size: 11px;" data-dept-id="${d.id}"><i class="fa-solid fa-plus"></i> ${d.name}</button>`).join('')}
                                </div>
                                <div style="font-size: 11px; color:#64748b;">Selected Path: <strong id="wf-selected-path-text" style="color:var(--accent-secondary);">None</strong></div>
                            </div>
                            <div class="flex-row gap-12" style="margin-top: 8px;">
                                <button class="btn btn-primary" id="btn-save-new-workflow" style="font-size: 12px; padding: 6px 12px;"><i class="fa-solid fa-save"></i> Save Pipeline</button>
                                <button class="btn" id="btn-cancel-new-workflow" style="font-size: 12px; padding: 6px 12px;">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const workflows = window.DocTrackStore.state.workflows;
        const currentPath = [];
        
        this.renderFilesList(window.DocTrackStore.state.documents);
        this.updateWorkflowVisualizer();

        // Bind Workflow dropdown change event
        const workflowDropdown = document.getElementById('doc-workflow');
        if (workflowDropdown) {
            workflowDropdown.addEventListener('change', () => this.updateWorkflowVisualizer());
        }

        // Add flexible metadata fields row
        document.getElementById('btn-add-meta').addEventListener('click', () => {
            const container = document.getElementById('meta-fields-container');
            const row = document.createElement('div');
            row.className = 'metadata-row';
            row.innerHTML = `
                <input type="text" placeholder="Key Name" class="meta-key">
                <input type="text" placeholder="Value" class="meta-val">
                <button class="btn-delete-row" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(row);
        });

        // Register document click action
        document.getElementById('btn-register-document').addEventListener('click', () => {
            const name = document.getElementById('doc-name').value.trim();
            const wfId = document.getElementById('doc-workflow').value;
            const priority = document.getElementById('doc-priority').value;
            
            if (!name) {
                alert('Please provide a document title.');
                return;
            }

            // Gather metadata inputs dynamically
            const metadata = {};
            document.querySelectorAll('.metadata-row').forEach(row => {
                const key = row.querySelector('.meta-key').value.trim();
                const val = row.querySelector('.meta-val').value.trim();
                if (key && val) {
                    metadata[key] = val;
                }
            });

            const doc = window.DocTrackStore.addDocument(name, wfId, priority, metadata);
            if (doc) {
                // Reset inputs
                document.getElementById('doc-name').value = '';
                // Redirect immediately to timeline scan view for the new doc!
                window.location.hash = `#tracking?doc=${doc.id}`;
            }
        });

        // Toggle workflow customizer creator panel
        const creatorDrawer = document.getElementById('workflow-creator-drawer');
        document.getElementById('btn-show-workflow-creator').addEventListener('click', () => {
            creatorDrawer.classList.remove('hidden');
            currentPath.length = 0; // Clear selection
            document.getElementById('wf-selected-path-text').textContent = 'None';
            document.getElementById('new-wf-name').value = '';
            document.querySelectorAll('.btn-dept-chip').forEach(chip => {
                chip.classList.remove('btn-primary');
                chip.querySelector('i').className = 'fa-solid fa-plus';
            });
        });

        // Handle sequencing chips selection
        document.querySelectorAll('.btn-dept-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const deptId = chip.getAttribute('data-dept-id');
                const idx = currentPath.indexOf(deptId);
                
                if (idx > -1) {
                    // Remove from path
                    currentPath.splice(idx, 1);
                    chip.classList.remove('btn-primary');
                    chip.querySelector('i').className = 'fa-solid fa-plus';
                } else {
                    // Append to path
                    currentPath.push(deptId);
                    chip.classList.add('btn-primary');
                    chip.querySelector('i').className = 'fa-solid fa-check';
                }
                
                // Show path text sequence
                if (currentPath.length > 0) {
                    document.getElementById('wf-selected-path-text').textContent = currentPath.map(id => window.DocTrackStore.getDepartmentName(id)).join(' ➔ ');
                } else {
                    document.getElementById('wf-selected-path-text').textContent = 'None';
                }
            });
        });

        // Cancel workflow creation
        document.getElementById('btn-cancel-new-workflow').addEventListener('click', () => {
            creatorDrawer.classList.add('hidden');
        });

        // Save new custom pipeline workflow
        document.getElementById('btn-save-new-workflow').addEventListener('click', () => {
            const name = document.getElementById('new-wf-name').value.trim();
            if (!name) {
                alert('Please enter a pipeline name.');
                return;
            }
            if (currentPath.length === 0) {
                alert('Please select at least one department stage for this workflow.');
                return;
            }

            const newWf = window.DocTrackStore.addWorkflow(name, [...currentPath]);
            
            // Re-render select dropdown
            const workflowDropdown = document.getElementById('doc-workflow');
            workflowDropdown.innerHTML = window.DocTrackStore.state.workflows.map(wf => `<option value="${wf.id}">${wf.name}</option>`).join('');
            workflowDropdown.value = newWf.id;
            
            this.updateWorkflowVisualizer();
            creatorDrawer.classList.add('hidden');
            
            window.DocTrackStore.addNotification({
                docId: 'SYS-WF',
                docName: name,
                type: 'info',
                message: `New Document Workflow created: ${name} with ${currentPath.length} stages.`
            });
        });

        // Subscribe to global window.DocTrackStore updates
        this.unsubscribeState = window.DocTrackStore.subscribe('state_changed', (state) => {
            this.renderFilesList(state.documents);
        });
    },

    renderFilesList(docs) {
        const container = document.getElementById('doc-manager-files-list');
        if (!container) return;

        if (docs.length === 0) {
            container.innerHTML = `
                <div class="empty-workflow-message">
                    No files found inside this environment.
                </div>
            `;
            return;
        }

        container.innerHTML = docs.map(doc => {
            let statusClass = 'badge-process';
            if (doc.status === 'Completed') statusClass = 'badge-success';
            if (doc.status === 'Delayed') statusClass = 'badge-danger';
            if (doc.status === 'Under Review') statusClass = 'badge-warning';

            return `
                <div class="document-item-card glass-panel">
                    <div class="doc-item-title">
                        <h4>${doc.name}</h4>
                        <div class="doc-item-meta">
                            <span class="doc-item-meta-id">${doc.id}</span> &bull; 
                            <span>Office: ${window.DocTrackStore.getDepartmentName(doc.currentStage)}</span>
                        </div>
                    </div>
                    <div class="flex-row gap-12">
                        <span class="badge ${statusClass}">${doc.status}</span>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="window.location.hash='#tracking?doc=${doc.id}'">
                            <i class="fa-solid fa-qrcode"></i> Track
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateWorkflowVisualizer() {
        const visualizer = document.getElementById('workflow-builder-stage-chain');
        if (!visualizer) return;

        const dropdown = document.getElementById('doc-workflow');
        if (!dropdown || !dropdown.value) {
            visualizer.innerHTML = `<div class="empty-workflow-message">Configure and select a workflow configuration to visualize sequence map.</div>`;
            return;
        }

        const selectedWf = window.DocTrackStore.state.workflows.find(w => w.id === dropdown.value);
        if (!selectedWf || selectedWf.stages.length === 0) {
            visualizer.innerHTML = `<div class="empty-workflow-message">Selected workflow contains no department clearance levels.</div>`;
            return;
        }

        let visualHtml = `<h4 style="font-size: 12px; font-weight:700; text-transform: uppercase; color:#64748b; margin-bottom: 8px;"> クリアランス順序 Clearance Progression Chain</h4>`;
        
        selectedWf.stages.forEach((stageId, idx) => {
            const dept = window.DocTrackStore.state.departments.find(d => d.id === stageId) || { name: stageId, targetTime: 24 };
            
            visualHtml += `
                <div class="workflow-stage-block">
                    <div class="workflow-stage-info">
                        <div class="workflow-stage-index">${idx + 1}</div>
                        <div class="workflow-stage-details">
                            <h4>${dept.name}</h4>
                            <span>Target Completion Time: ${dept.targetTime} hours</span>
                        </div>
                    </div>
                    <div class="workflow-stage-actions">
                        <button class="stage-control-btn" title="clearance detail"><i class="fa-solid fa-circle-question"></i></button>
                    </div>
                </div>
            `;

            // Draw line connector if not last element
            if (idx < selectedWf.stages.length - 1) {
                visualHtml += `
                    <div class="workflow-stage-connector">
                        <i class="fa-solid fa-arrow-down"></i>
                    </div>
                `;
            }
        });

        visualizer.innerHTML = visualHtml;
    },

    filterList(query) {
        if (!query) {
            this.renderFilesList(window.DocTrackStore.state.documents);
            return;
        }

        const filtered = window.DocTrackStore.state.documents.filter(doc => 
            doc.id.toLowerCase().includes(query) || 
            doc.name.toLowerCase().includes(query) ||
            window.DocTrackStore.getDepartmentName(doc.currentStage).toLowerCase().includes(query) ||
            doc.priority.toLowerCase().includes(query)
        );

        this.renderFilesList(filtered);
    }
};
