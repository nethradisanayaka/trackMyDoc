/* ==========================================================================
   DOCUMENT TIMELINE & INTERACTIVE SCANNER (js/components/tracking.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

window.DocTrackTracking = {
    render(container) {
        const docs = window.DocTrackStore.state.documents;
        
        container.innerHTML = `
            <div class="tracking-layout">
                <!-- Left Column: Interactive QR/Barcode Scanner Simulation -->
                <div class="glass-panel scanner-card">
                    <h3 style="font-size: 1.2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <i class="fa-solid fa-qrcode" style="color: var(--accent-secondary);"></i> Interactive Scanning Simulator
                    </h3>
                    
                    <div class="scanner-viewport-wrapper">
                        <!-- Select Document to scan -->
                        <div class="form-group" style="width:100%;">
                            <label for="scanner-doc-select">Target Document Registry</label>
                            <div class="input-wrapper">
                                <select id="scanner-doc-select" style="padding-left:16px;">
                                    <option value="">-- Choose registered file --</option>
                                    ${docs.map(doc => `<option value="${doc.id}">${doc.id} - ${doc.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Vector Barcode & QR Code outputs -->
                        <div id="vector-labels-panel" class="hidden" style="width: 100%; display: flex; flex-direction: column; gap: 16px; margin: 8px 0;">
                            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:16px; align-items:center;">
                                <div id="label-qr-code" style="width:100px; height:100px; margin:0 auto;"></div>
                                <div id="label-barcode" style="height:70px;"></div>
                            </div>
                        </div>

                        <!-- Simulated Camera Viewfinder -->
                        <div class="scanner-viewfinder" id="viewfinder">
                            <div class="scanner-corner scanner-corner-tl"></div>
                            <div class="scanner-corner scanner-corner-tr"></div>
                            <div class="scanner-corner scanner-corner-bl"></div>
                            <div class="scanner-corner scanner-corner-br"></div>
                            
                            <div class="scanner-laser" id="laser" style="display:none;"></div>
                            
                            <div class="scanner-target-mock" id="scanner-target">
                                <i class="fa-solid fa-camera" style="font-size: 2.2rem; color: rgba(255,255,255,0.15);" id="camera-fallback-icon"></i>
                            </div>
                        </div>

                        <!-- Actions trigger forms -->
                        <div class="scanner-controls">
                            <button class="btn btn-primary" id="btn-scan-trigger" style="justify-content: center; padding: 12px; width:100%;" disabled>
                                <i class="fa-solid fa-barcode"></i> Initiate Laser Scan
                            </button>
                            
                            <!-- Transition Workflow Form (Revealed after successful scan) -->
                            <div id="transition-form-panel" class="hidden" style="border-top:1px solid var(--border-color); padding-top:20px; width:100%; display:flex; flex-direction:column; gap:16px;">
                                <h4 style="font-size:13px; text-transform:uppercase; color:var(--accent-primary);"><i class="fa-solid fa-circle-check"></i> Scanned and Authorized</h4>
                                
                                <div class="form-group">
                                    <label for="route-next-stage">Route Clearance stage</label>
                                    <div class="input-wrapper">
                                        <select id="route-next-stage">
                                            <!-- Dynamically populated based on doc workflow -->
                                        </select>
                                        <i class="fa-solid fa-arrows-spin"></i>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="route-status">Clearance Status Code</label>
                                    <div class="input-wrapper">
                                        <select id="route-status">
                                            <option value="Active">Active (Clearance in progress)</option>
                                            <option value="Completed">Completed (Final Approval reached)</option>
                                            <option value="Delayed">Delayed / Bottleneck Stall</option>
                                            <option value="Under Review">Under Review</option>
                                        </select>
                                        <i class="fa-solid fa-shield"></i>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="route-comment">Audit Log Comments</label>
                                    <div class="input-wrapper">
                                        <input type="text" id="route-comment" placeholder="e.g. Scans cleared at faculty levels.">
                                        <i class="fa-solid fa-comment-medical"></i>
                                    </div>
                                </div>

                                <button class="btn btn-primary" id="btn-execute-route" style="justify-content: center; padding: 10px;">
                                    <i class="fa-solid fa-share-nodes"></i> Dispatch SOC Transition Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Timeline Visuals -->
                <div class="flex-column gap-24">
                    <!-- Metadata card -->
                    <div class="glass-panel" id="timeline-meta-card" style="padding:24px; display:none;">
                        <h4 style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--accent-secondary); margin-bottom:12px;">Active Metadata Record</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;" id="meta-grid-data">
                            <!-- Filled dynamically -->
                        </div>
                    </div>

                    <!-- Timeline audit trail log card -->
                    <div class="glass-panel timeline-card">
                        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <i class="fa-solid fa-timeline" style="color: var(--accent-secondary);"></i> Clearance Audit Trail
                        </h3>
                        
                        <div class="timeline-container" id="timeline-stage-flow">
                            <div class="empty-workflow-message" style="margin-top:24px;">
                                Select a document registry in the scanning simulator to view historical movement timelines.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const select = document.getElementById('scanner-doc-select');
        const trigger = document.getElementById('btn-scan-trigger');
        const viewfinder = document.getElementById('viewfinder');
        const laser = document.getElementById('laser');
        const target = document.getElementById('scanner-target');
        const icon = document.getElementById('camera-fallback-icon');
        const labels = document.getElementById('vector-labels-panel');
        const metaCard = document.getElementById('timeline-meta-card');
        
        let scanning = false;
        
        // Check if a document is requested in the URL hash query params (e.g. #tracking?doc=DOC-2026-UNI-4890)
        const hash = window.location.hash;
        if (hash.includes('?doc=')) {
            const docId = hash.split('?doc=')[1];
            if (docId) {
                select.value = docId;
                this.handleDocSelection(docId);
            }
        }

        // Dropdown selection trigger
        select.addEventListener('change', () => {
            const docId = select.value;
            this.handleDocSelection(docId);
            // Sync URL hash
            if (docId) {
                window.location.hash = `#tracking?doc=${docId}`;
            } else {
                window.location.hash = '#tracking';
            }
        });

        // Dynamic scanner trigger
        trigger.addEventListener('click', () => {
            if (scanning) return;
            scanning = true;
            
            // Set scanning state styles
            viewfinder.className = 'scanner-viewfinder scanning-active';
            laser.style.display = 'block';
            trigger.disabled = true;
            
            // Simulate laser swipe and decode (1.5 seconds delay)
            setTimeout(() => {
                viewfinder.className = 'scanner-viewfinder scanning-success';
                laser.style.display = 'none';
                
                // Show route forms
                document.getElementById('transition-form-panel').classList.remove('hidden');
                
                window.DocTrackStore.addNotification({
                    docId: select.value,
                    docName: window.DocTrackStore.state.documents.find(d => d.id === select.value).name,
                    type: 'info',
                    message: 'Scan successful: Barcode checksum matching authorized ledger.'
                });
                
                scanning = false;
                trigger.disabled = false;
            }, 1200);
        });

        // Dispatch transition button trigger
        document.getElementById('btn-execute-route').addEventListener('click', () => {
            const docId = select.value;
            const nextStage = document.getElementById('route-next-stage').value;
            const status = document.getElementById('route-status').value;
            const comment = document.getElementById('route-comment').value.trim();
            
            if (!nextStage) {
                alert('Please select a target clearance stage.');
                return;
            }

            const success = window.DocTrackStore.transitionDocument(docId, nextStage, status, comment);
            if (success) {
                // Clear forms
                document.getElementById('transition-form-panel').classList.add('hidden');
                document.getElementById('route-comment').value = '';
                
                // Re-sync UI timelines
                this.handleDocSelection(docId);
            }
        });

        // Subscribe to global window.DocTrackStore updates
        this.unsubscribeState = window.DocTrackStore.subscribe('state_changed', () => {
            if (select.value) {
                this.handleDocSelection(select.value);
            }
        });
    },

    handleDocSelection(docId) {
        const trigger = document.getElementById('btn-scan-trigger');
        const target = document.getElementById('scanner-target');
        const labels = document.getElementById('vector-labels-panel');
        const metaCard = document.getElementById('timeline-meta-card');
        const viewfinder = document.getElementById('viewfinder');
        
        // Reset scanner states
        viewfinder.className = 'scanner-viewfinder';
        document.getElementById('transition-form-panel').classList.add('hidden');

        if (!docId) {
            trigger.disabled = true;
            target.innerHTML = `<i class="fa-solid fa-camera" style="font-size: 2.2rem; color: rgba(255,255,255,0.15);"></i>`;
            labels.classList.add('hidden');
            metaCard.style.display = 'none';
            document.getElementById('timeline-stage-flow').innerHTML = `
                <div class="empty-workflow-message" style="margin-top:24px;">
                    Select a document registry in the scanning simulator to view historical movement timelines.
                </div>
            `;
            return;
        }

        const doc = window.DocTrackStore.state.documents.find(d => d.id === docId);
        if (!doc) return;

        trigger.disabled = false;
        
        // Build dynamic SVG QR and Barcodes!
        labels.classList.remove('hidden');
        document.getElementById('label-qr-code').innerHTML = window.DocTrackQR.generateQR(doc.id);
        document.getElementById('label-barcode').innerHTML = window.DocTrackQR.generateBarcode(doc.id);
        
        // Display inside scanner viewfinder
        target.innerHTML = window.DocTrackQR.generateQR(doc.id);

        // Populate dynamic metadata parameters card
        metaCard.style.display = 'block';
        const metaGrid = document.getElementById('meta-grid-data');
        const metaKeys = Object.keys(doc.metadata);
        
        if (metaKeys.length === 0) {
            metaGrid.innerHTML = `<span style="color:#64748b; font-size:12px; grid-column: span 2;">No custom metadata fields registered.</span>`;
        } else {
            metaGrid.innerHTML = metaKeys.map(k => `
                <div class="flex-column" style="border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:6px;">
                    <span style="font-size:11px; color:#64748b; text-transform:uppercase; font-weight:600;">${k}</span>
                    <span style="font-size:13px; font-weight:500; color:white; word-break:break-all;">${doc.metadata[k]}</span>
                </div>
            `).join('');
        }

        // Render dynamic Clearance stage vertical timeline
        this.renderTimeline(doc);

        // Populate route stages selection options from doc workflow pipeline
        const routeSelect = document.getElementById('route-next-stage');
        const workflow = window.DocTrackStore.state.workflows.find(w => w.id === doc.workflowId);
        
        if (workflow) {
            routeSelect.innerHTML = workflow.stages.map(stageId => {
                const isCurrent = stageId === doc.currentStage;
                const name = window.DocTrackStore.getDepartmentName(stageId);
                return `<option value="${stageId}" ${isCurrent ? 'selected' : ''}>${name} ${isCurrent ? '(Current)' : ''}</option>`;
            }).join('');
        }
    },

    renderTimeline(doc) {
        const timelineFlow = document.getElementById('timeline-stage-flow');
        if (!timelineFlow) return;

        const workflow = window.DocTrackStore.state.workflows.find(w => w.id === doc.workflowId);
        if (!workflow) return;

        // Render a combined representation of required sequence stages + recorded audit nodes!
        let timelineHtml = '';

        workflow.stages.forEach(stageId => {
            // Find if there is a timeline log node for this stage
            const eventNode = doc.timeline.find(t => t.stage === stageId);
            const isCurrent = stageId === doc.currentStage;
            const deptName = window.DocTrackStore.getDepartmentName(stageId);
            
            let status = 'Pending';
            let comment = 'Awaiting preceding department clearance sign-off.';
            let officer = '--';
            let timestampStr = '';
            let nodeClass = '';

            if (eventNode) {
                status = eventNode.status;
                comment = eventNode.comment;
                officer = eventNode.officer;
                timestampStr = new Date(eventNode.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                
                if (status === 'Completed') nodeClass = 'completed';
                if (status === 'Active') nodeClass = 'active';
                if (status === 'Delayed') nodeClass = 'delayed';
                if (status === 'Under Review') nodeClass = 'active';
            } else {
                if (isCurrent) {
                    nodeClass = 'active';
                    status = doc.status;
                    comment = 'Scanned and awaiting active processing.';
                }
            }

            let statusClass = 'badge-process';
            if (status === 'Completed') statusClass = 'badge-success';
            if (status === 'Delayed') statusClass = 'badge-danger';
            if (status === 'Under Review') statusClass = 'badge-warning';

            timelineHtml += `
                <div class="timeline-node ${nodeClass}">
                    <div class="timeline-bullet">
                        ${status === 'Completed' ? '<i class="fa-solid fa-check" style="font-size: 8px; color:var(--accent-primary);"></i>' : ''}
                    </div>
                    <div class="timeline-node-content">
                        <div class="timeline-header">
                            <h4>${deptName}</h4>
                            <span class="timeline-time">${timestampStr}</span>
                        </div>
                        <div class="timeline-officer">
                            <span>Officer: <strong>${officer}</strong></span>
                            <span class="badge ${statusClass}">${status}</span>
                        </div>
                        <div class="timeline-comment">${comment}</div>
                    </div>
                </div>
            `;
        });

        timelineFlow.innerHTML = timelineHtml;
    }
};
