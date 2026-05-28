/* ==========================================================================
   ALERTS & PROCESSING NOTIFICATIONS COMPONENT (js/components/notifications.js)
   ========================================================================== */

// Loaded sequentially via script tags in HTML

window.DocTrackNotifications = {
    render(container) {
        const notifs = window.DocTrackStore.state.notifications;
        
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
                <div class="glass-panel" style="padding: 24px; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <h2 style="font-size: 1.5rem; display:flex; align-items:center; gap:12px;">
                            <i class="fa-solid fa-bell" style="color: var(--accent-secondary);"></i> Asynchronous Queue Messages
                        </h2>
                        <p style="color: #64748b; font-size:13px; margin-top:4px;">Simulated RabbitMQ consumer logs tracking background microservice delays and operational exceptions.</p>
                    </div>
                    
                    <button class="btn btn-delete-row" id="btn-clear-all-notif" style="padding: 8px 16px; font-size:12px; font-weight:600;" ${notifs.length === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash-can"></i> Flush Queue
                    </button>
                </div>

                <div class="glass-panel" style="padding: 28px;">
                    <div class="activity-list" id="notifications-list-feed" style="padding:0;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.renderNotifications(window.DocTrackStore.state.notifications);

        // Bind clear all button action
        const flushBtn = document.getElementById('btn-clear-all-notif');
        if (flushBtn) {
            flushBtn.addEventListener('click', () => {
                window.DocTrackStore.clearAllNotifications();
            });
        }

        // Subscribe to global window.DocTrackStore updates
        this.unsubscribeState = window.DocTrackStore.subscribe('notifications_update', (notifs) => {
            this.renderNotifications(notifs);
            if (flushBtn) {
                flushBtn.disabled = notifs.length === 0;
            }
        });
    },

    renderNotifications(notifs) {
        const feed = document.getElementById('notifications-list-feed');
        if (!feed) return;

        if (notifs.length === 0) {
            feed.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 60px 0;">
                    <div style="font-size: 3rem; margin-bottom: 16px; opacity:0.15;"><i class="fa-solid fa-envelope-open-text"></i></div>
                    <h3 style="color:#94a3b8; font-size:16px;">Queue Empty</h3>
                    <p style="font-size: 12px; margin-top: 4px;">No active background delay warnings or processing alerts recorded.</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = notifs.map(notif => {
            let itemClass = 'status-change';
            let icon = 'fa-info';
            if (notif.type === 'delay') {
                itemClass = 'delayed';
                icon = 'fa-triangle-exclamation';
            }
            if (notif.type === 'create') {
                itemClass = 'created';
                icon = 'fa-plus';
            }
            if (notif.type === 'transition') {
                itemClass = 'status-change';
                icon = 'fa-right-left';
            }

            const timeStr = new Date(notif.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

            return `
                <div class="activity-item" style="border-bottom: 1px solid var(--border-color); padding: 20px 16px; border-radius: 0; align-items: center; justify-content: space-between;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div class="activity-icon ${itemClass}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="activity-details">
                            <span style="font-size: 14px; font-weight: 500; color: white;">${notif.message}</span>
                            <div class="activity-meta" style="margin-top:4px;">
                                <span class="activity-doc-id">${notif.docId}</span> &bull; 
                                <span>${timeStr}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn-delete-row" style="padding: 6px; border-radius: 50%; width: 28px; height: 28px; display:flex; align-items:center; justify-content:center;" onclick="window.__appStore.clearNotification('${notif.id}')" title="Acknowledge & Clear">
                        <i class="fa-solid fa-check" style="font-size: 10px;"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
};
