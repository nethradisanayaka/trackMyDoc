/* ==========================================================================
   REACTIVE STATE MANAGEMENT & MOCK MICROSERVICES STORE (js/store.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

class Store {
    constructor() {
        this.listeners = new Map();
        
        // Root global state keys
        this.state = {
            currentUser: null, // Logged in user details { username, role, domain }
            currentDomainId: 'university', // Default domain environment
            departments: [], // Current departments in action
            workflows: [], // Configured SOC workflows
            documents: [], // Local documents database
            notifications: [], // Asynchronous events/reminders (RabbitMQ simulation)
            historyLogs: [] // Detailed audit/movement tracking records
        };
    }

    /**
     * Subscribe component listeners to state change topics
     */
    subscribe(topic, callback) {
        if (!this.listeners.has(topic)) {
            this.listeners.set(topic, new Set());
        }
        this.listeners.get(topic).add(callback);
        
        // Return unsubscribe trigger
        return () => {
            this.listeners.get(topic).delete(callback);
        };
    }

    /**
     * Publish notifications to all listening component controllers
     */
    publish(topic, data) {
        if (this.listeners.has(topic)) {
            this.listeners.get(topic).forEach(callback => callback(data));
        }
    }

    /**
     * Seeds state dynamically when domain (e.g. University -> Logistics) shifts
     * Highlights "increased adaptability across industries"
     */
    initializeDomain(domainId) {
        const domainData = window.DocTrackMockData[domainId] || window.DocTrackMockData.university;
        this.state.currentDomainId = domainId;
        this.state.departments = JSON.parse(JSON.stringify(domainData.departments));
        this.state.workflows = JSON.parse(JSON.stringify(domainData.workflows));
        this.state.documents = JSON.parse(JSON.stringify(domainData.documents));
        
        // Pre-populate global notifications queue with delay indicators
        this.state.notifications = this.state.documents
            .filter(doc => doc.status === 'Delayed')
            .map(doc => ({
                id: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
                docId: doc.id,
                docName: doc.name,
                type: 'delay',
                message: `Bottleneck Alert: Document stalled in ${this.getDepartmentName(doc.currentStage)} for 72+ hours.`,
                timestamp: new Date().toISOString()
            }));

        // Flatten history audit trails for dashboard logging
        this.state.historyLogs = [];
        this.state.documents.forEach(doc => {
            doc.timeline.forEach(event => {
                this.state.historyLogs.push({
                    id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
                    docId: doc.id,
                    docName: doc.name,
                    stage: event.stage,
                    status: event.status,
                    officer: event.officer,
                    timestamp: event.timestamp,
                    comment: event.comment
                });
            });
        });
        
        // Sort history by reverse chronological order
        this.state.historyLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        this.publish('state_changed', this.state);
        this.publish('domain_changed', domainId);
    }

    getCurrentDomain() {
        return window.DocTrackMockData[this.state.currentDomainId];
    }

    getDepartmentName(deptId) {
        const dept = this.state.departments.find(d => d.id === deptId);
        return dept ? dept.name : deptId;
    }

    /* ==========================================================================
       AUTHENTICATION SERVICE ACTIONS
       ========================================================================== */
    
    login(username, role, domainId) {
        this.state.currentUser = { username, role, domain: domainId };
        this.initializeDomain(domainId);
        this.publish('auth_status', this.state.currentUser);
        return true;
    }

    logout() {
        this.state.currentUser = null;
        this.publish('auth_status', null);
    }

    /* ==========================================================================
       DOCUMENT & WORKFLOW SERVICE ACTIONS
       ========================================================================== */

    addDocument(name, workflowId, priority, metadata = {}) {
        const workflow = this.state.workflows.find(w => w.id === workflowId);
        if (!workflow || workflow.stages.length === 0) return null;
        
        const docId = `DOC-2026-${this.state.currentDomainId.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const initialStage = workflow.stages[0];
        
        const newDoc = {
            id: docId,
            name: name,
            workflowId: workflowId,
            priority: priority,
            status: 'Active',
            currentStage: initialStage,
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            metadata: metadata,
            timeline: [
                {
                    stage: initialStage,
                    status: 'Active',
                    officer: this.state.currentUser ? this.state.currentUser.username : 'Registrar Officer',
                    timestamp: new Date().toISOString(),
                    comment: 'Document created and lifecycle initialized.'
                }
            ]
        };

        this.state.documents.unshift(newDoc);
        
        // Add audit trail event
        this.state.historyLogs.unshift({
            id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
            docId: docId,
            docName: name,
            stage: initialStage,
            status: 'Active',
            officer: this.state.currentUser ? this.state.currentUser.username : 'Registrar Officer',
            timestamp: new Date().toISOString(),
            comment: 'Document created and workflow initialized.'
        });

        // Trigger Notification alert (RabbitMQ Event Simulation)
        this.addNotification({
            docId: docId,
            docName: name,
            type: 'create',
            message: `New document registration completed: ${name}. Entered stage: ${this.getDepartmentName(initialStage)}.`
        });

        this.publish('state_changed', this.state);
        return newDoc;
    }

    /**
     * Interactive scan step modifier
     * Simulates scanning a QR/Barcode to shift document stage
     */
    transitionDocument(docId, nextStageId, status = 'Active', comment = '') {
        const doc = this.state.documents.find(d => d.id === docId);
        if (!doc) return false;

        const oldStage = doc.currentStage;
        
        // Close last timeline node
        const activeNode = doc.timeline.find(t => t.stage === oldStage && t.status === 'Active');
        if (activeNode) {
            activeNode.status = 'Completed';
            activeNode.timestamp = new Date().toISOString();
        }

        // Update document parameters
        doc.currentStage = nextStageId;
        doc.status = status;
        doc.lastUpdate = new Date().toISOString();

        // Create new active stage node in document
        doc.timeline.push({
            stage: nextStageId,
            status: status,
            officer: this.state.currentUser ? this.state.currentUser.username : 'Duty Personnel',
            timestamp: new Date().toISOString(),
            comment: comment || `Scanned and routed to ${this.getDepartmentName(nextStageId)}.`
        });

        // Insert into global audit history
        this.state.historyLogs.unshift({
            id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
            docId: docId,
            docName: doc.name,
            stage: nextStageId,
            status: status,
            officer: this.state.currentUser ? this.state.currentUser.username : 'Duty Personnel',
            timestamp: new Date().toISOString(),
            comment: comment || `Scanned and routed to ${this.getDepartmentName(nextStageId)}.`
        });

        // Trigger notifications and evaluate bottlenecks
        if (status === 'Delayed') {
            this.addNotification({
                docId: docId,
                docName: doc.name,
                type: 'delay',
                message: `Bottleneck Alert: Document stalled in ${this.getDepartmentName(nextStageId)} for 72+ hours.`
            });
        } else {
            this.addNotification({
                docId: docId,
                docName: doc.name,
                type: 'transition',
                message: `Document transitioned from ${this.getDepartmentName(oldStage)} to ${this.getDepartmentName(nextStageId)}.`
            });
        }

        this.publish('state_changed', this.state);
        return true;
    }

    addWorkflow(name, stages) {
        const wfId = `wf-${name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;
        const newWorkflow = {
            id: wfId,
            name: name,
            stages: stages
        };
        this.state.workflows.push(newWorkflow);
        this.publish('state_changed', this.state);
        return newWorkflow;
    }

    deleteWorkflow(wfId) {
        this.state.workflows = this.state.workflows.filter(w => w.id !== wfId);
        this.publish('state_changed', this.state);
    }

    /* ==========================================================================
       NOTIFICATION ENGINE ACTIONS
       ========================================================================== */

    addNotification({ docId, docName, type, message }) {
        const newNotif = {
            id: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
            docId,
            docName,
            type,
            message,
            timestamp: new Date().toISOString()
        };
        this.state.notifications.unshift(newNotif);
        this.publish('notifications_update', this.state.notifications);
        this.publish('toast_alert', newNotif);
    }

    clearNotification(id) {
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
        this.publish('notifications_update', this.state.notifications);
    }

    clearAllNotifications() {
        this.state.notifications = [];
        this.publish('notifications_update', this.state.notifications);
    }

    /* ==========================================================================
       ANALYTICS & KPI METRICS CALCULATOR
       ========================================================================== */

    getAnalyticsSummary() {
        const docs = this.state.documents;
        const total = docs.length;
        const active = docs.filter(d => d.status === 'Active' || d.status === 'Under Review').length;
        const delayed = docs.filter(d => d.status === 'Delayed').length;
        const completed = docs.filter(d => d.status === 'Completed').length;
        
        // Calculate dynamic loads representing departments
        const departmentLoads = this.state.departments.map(dept => {
            const docCount = docs.filter(d => d.currentStage === dept.id && d.status !== 'Completed').length;
            const percentage = Math.min(100, Math.round((docCount / (total || 1)) * 100) + dept.load);
            return {
                id: dept.id,
                name: dept.name,
                docCount,
                loadPercentage: percentage
            };
        });

        // Detect processing bottlenecks
        const bottlenecks = docs.filter(d => d.status === 'Delayed').map(doc => {
            return {
                id: doc.id,
                name: doc.name,
                stage: this.getDepartmentName(doc.currentStage),
                duration: '76 hours', // Realistic bottleneck metric
                priority: doc.priority
            };
        });

        return {
            total,
            active,
            delayed,
            completed,
            departmentLoads,
            bottlenecks
        };
    }
}

const store = new Store();
window.DocTrackStore = store;
window.__appStore = store;
