/* ==========================================================================
   AUTHENTICATION — UNIVERSITY OF SRI JAYEWARDENEPURA (js/components/auth.js)
   ========================================================================== */

// Loaded sequentially via script tags — no import/export used.

window.DocTrackAuth = {
    render(container) {
        container.innerHTML = `
            <div class="auth-wrapper" id="auth-wrapper">
                <!-- Brand strip -->
                <div class="auth-brand">
                    <div class="auth-brand-icon">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div class="auth-brand-text">
                        <span class="auth-brand-title">DocTrack</span>
                        <span class="auth-brand-sub">University of Sri Jayewardenepura</span>
                    </div>
                </div>

                <!-- Login card -->
                <div class="auth-card glass-panel" id="login-form-panel">
                    <div class="auth-header">
                        <div class="auth-logo">
                            <i class="fa-solid fa-lock-open"></i>
                        </div>
                        <h2 class="auth-title">Secure Access Portal</h2>
                        <p class="auth-subtitle">Enter your credentials to access the document tracking system.</p>
                    </div>

                    <div class="auth-form">
                        <div class="form-group">
                            <label for="username">User ID / Index Number</label>
                            <div class="input-wrapper">
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="e.g. AS2023376"
                                    value="AS2023376"
                                    autocomplete="off"
                                    required
                                >
                                <i class="fa-solid fa-user"></i>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="user-role">Access Permission Level</label>
                            <div class="input-wrapper">
                                <select id="user-role">
                                    <option value="Administrator">Administrator / Registrar</option>
                                    <option value="Department Officer">Department Officer</option>
                                    <option value="Viewer / Stakeholder">Viewer / External Auditor</option>
                                </select>
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                        </div>

                        <button type="button" class="auth-submit-btn" id="btn-submit-auth">
                            <i class="fa-solid fa-right-to-bracket"></i>
                            Sign In
                        </button>
                    </div>

                    <div class="auth-footer-note">
                        <i class="fa-solid fa-circle-info"></i>
                        University document management — internal use only.
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        document.getElementById('btn-submit-auth').addEventListener('click', () => {
            const username = document.getElementById('username').value.trim();
            const role = document.getElementById('user-role').value;

            if (!username) {
                alert('Please enter a valid User ID / Index Number.');
                return;
            }

            // Always log in to the university domain
            window.DocTrackStore.login(username, role, 'university');
        });

        // Allow Enter key to submit
        document.getElementById('username').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btn-submit-auth').click();
            }
        });
    }
};
