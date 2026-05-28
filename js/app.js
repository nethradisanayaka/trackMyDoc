/* ==========================================================================
   CENTRAL ROUTER & APPLICATION SERVICE COORDINATOR (js/app.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

class App {
    constructor() {
        this.viewport = document.getElementById('app-viewport');
        this.authContainer = document.getElementById('auth-container');
        this.appContainer = document.getElementById('app-container');
        
        // Active view mapping
        this.routes = {
            'dashboard': window.DocTrackDashboard,
            'documents': window.DocTrackDocumentManager,
            'tracking': window.DocTrackTracking,
            'analytics': window.DocTrackAnalytics,
            'notifications': window.DocTrackNotifications
        };
        
        this.currentRoute = 'dashboard';
    }

    /**
     * Bootstrap application shell
     */
    init() {
        // Bind URL hash routing listeners
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Listen to global state notifications for toast alerts
        window.DocTrackStore.subscribe('toast_alert', (notif) => this.showToast(notif));
        
        // Listen to authorization status changes
        window.DocTrackStore.subscribe('auth_status', (user) => this.handleAuthStatus(user));
        
        // Bind UI shell global events
        this.bindShellEvents();
        
        // Check local storage or state session
        const session = localStorage.getItem('doctrack_session');
        if (session) {
            const user = JSON.parse(session);
            window.DocTrackStore.login(user.username, user.role, user.domain);
        } else {
            this.handleAuthStatus(null);
        }
    }

    /**
     * Toggles Guest vs. Authenticated Workspaces
     */
    handleAuthStatus(user) {
        if (user) {
            localStorage.setItem('doctrack_session', JSON.stringify(user));
            
            // Adjust Shell Info
            document.getElementById('profile-name').textContent = user.username;
            document.getElementById('profile-role').textContent = user.role.toUpperCase();
            document.getElementById('header-avatar').textContent = user.username.charAt(0).toUpperCase();
            
            this.updateDomainBadge();
            
            this.authContainer.classList.add('hidden');
            this.appContainer.classList.remove('hidden');
            
            // Default routing redirect
            if (!window.location.hash || window.location.hash === '#login') {
                window.location.hash = '#dashboard';
            } else {
                this.handleRouting();
            }
            this.updateSidebarNotifCount();
        } else {
            localStorage.removeItem('doctrack_session');
            this.appContainer.classList.add('hidden');
            this.authContainer.classList.remove('hidden');
            
            window.DocTrackAuth.render(this.authContainer);
            window.DocTrackAuth.init();
        }
    }

    /**
     * Router dispatcher based on window location hash
     */
    handleRouting() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        const targetComponent = this.routes[hash];
        
        if (targetComponent) {
            // Update Active Nav Item CSS
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            const navLink = document.getElementById(`nav-${hash}`);
            if (navLink) navLink.classList.add('active');
            
            this.currentRoute = hash;
            
            // Clear search filter when routing
            document.getElementById('global-search').value = '';
            
            // Render and initialize the view
            targetComponent.render(this.viewport);
            targetComponent.init();
        } else {
            console.warn(`Route not found: ${hash}`);
            window.location.hash = '#dashboard';
        }
    }

    /**
     * Update active organization domain header badge
     */
    updateDomainBadge() {
        const activeDomain = window.DocTrackStore.getCurrentDomain();
        const badge = document.getElementById('domain-badge');
        const badgeName = document.getElementById('active-domain-name');
        
        badgeName.textContent = activeDomain.name;
        
        // Remove existing theme classes and assign new domain highlights
        badge.className = 'domain-selector-badge';
        badge.classList.add(activeDomain.themeClass);
        
        // Set dynamic SVG icons
        const icon = badge.querySelector('i');
        icon.className = 'fa-solid';
        icon.classList.add(activeDomain.icon);
    }

    updateSidebarNotifCount() {
        const notifBadge = document.getElementById('nav-notif-count');
        const headerDot = document.getElementById('header-notif-dot');
        const count = window.DocTrackStore.state.notifications.length;
        
        if (count > 0) {
            notifBadge.textContent = count;
            notifBadge.classList.remove('hidden');
            headerDot.classList.remove('hidden');
        } else {
            notifBadge.classList.add('hidden');
            headerDot.classList.add('hidden');
        }
    }

    /**
     * Binds general header/sidebar events
     */
    bindShellEvents() {
        // Logout trigger
        document.getElementById('btn-logout').addEventListener('click', () => {
            window.DocTrackStore.logout();
        });

        // Quick create redirection
        document.getElementById('btn-quick-create').addEventListener('click', () => {
            window.location.hash = '#documents';
            setTimeout(() => {
                const docNameInput = document.getElementById('doc-name');
                if (docNameInput) docNameInput.focus();
            }, 100);
        });

        // Active Domain Badge shift
        document.getElementById('domain-badge').addEventListener('click', () => {
            // Log out user back to domain selector screen to switch environments
            window.DocTrackStore.logout();
        });

        // Bell notification tray route
        document.getElementById('btn-trigger-notif').addEventListener('click', () => {
            window.location.hash = '#notifications';
        });

        // Live Document Global Filtering
        document.getElementById('global-search').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.publishGlobalSearch(query);
        });

        // Listen to state alerts to keep numbers synchronous
        window.DocTrackStore.subscribe('notifications_update', () => this.updateSidebarNotifCount());
        window.DocTrackStore.subscribe('domain_changed', () => this.updateDomainBadge());
    }

    publishGlobalSearch(query) {
        // Delegate filter events to active view if supported
        if (this.currentRoute === 'dashboard' && window.DocTrackDashboard.filterList) {
            window.DocTrackDashboard.filterList(query);
        } else if (this.currentRoute === 'documents' && window.DocTrackDocumentManager.filterList) {
            window.DocTrackDocumentManager.filterList(query);
        }
    }

    /**
     * Show custom dynamic toast popup triggers
     */
    showToast(notif) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${notif.type}`;
        
        let icon = 'fa-info-circle';
        if (notif.type === 'delay') icon = 'fa-triangle-exclamation';
        if (notif.type === 'create') icon = 'fa-circle-plus';
        if (notif.type === 'transition') icon = 'fa-route';
        
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <div class="toast-content">
                <strong>${notif.type.toUpperCase()}</strong>
                <p style="font-size: 12px; margin-top: 2px;">${notif.message}</p>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Remove toast automatically after timeout
        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }
}

// Bootstrap Application on content load
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
