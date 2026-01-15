/**
 * WL-Header Web Component
 * Header met logo en navigatie in Gemeente Westland stijl
 */

class WLHeader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupNavigation();
    }

    render() {
        this.innerHTML = `
            <div class="header-inner">
                <a href="#/" class="logo">
                    <img src="assets/logo-westland.svg" alt="Gemeente Westland" class="logo-img">
                </a>
                <nav>
                    <a href="#/" data-route="/">Overzicht</a>
                    <a href="#/werkvoorraad" data-route="/werkvoorraad">Werkvoorraad</a>
                    <a href="#/formulieren" data-route="/formulieren">Mijn Formulieren</a>
                </nav>
                <div class="header-menu">
                    <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                    <div class="menu-dropdown" id="menu-dropdown">
                        <input type="file" id="global-import-file" accept=".json" style="display: none;">
                        <button class="menu-item" data-action="import">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                            </svg>
                            Importeer JSON
                        </button>
                        <button class="menu-item" data-action="export" id="menu-export" disabled>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                            Exporteer JSON
                        </button>
                        <div class="menu-divider"></div>
                        <a href="IMPLEMENTATIE.md" target="_blank" class="menu-item">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                            Handleiding
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    setupNavigation() {
        // Highlight active nav item
        const updateActiveNav = () => {
            const hash = window.location.hash.slice(1) || '/';
            this.querySelectorAll('nav a').forEach(link => {
                const route = link.getAttribute('data-route');
                if (hash === route || (route !== '/' && hash.startsWith(route))) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        window.addEventListener('hashchange', updateActiveNav);
        updateActiveNav();

        // Setup hamburger menu
        this.setupMenu();
    }

    setupMenu() {
        const toggle = this.querySelector('#menu-toggle');
        const dropdown = this.querySelector('#menu-dropdown');
        const importBtn = this.querySelector('[data-action="import"]');
        const exportBtn = this.querySelector('[data-action="export"]');
        const fileInput = this.querySelector('#global-import-file');

        // Toggle menu
        toggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                dropdown?.classList.remove('open');
            }
        });

        // Import action
        importBtn?.addEventListener('click', () => {
            fileInput?.click();
            dropdown?.classList.remove('open');
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files[0] && window.handleGlobalImport) {
                window.handleGlobalImport(e);
            }
        });

        // Export action
        exportBtn?.addEventListener('click', () => {
            if (window.exportCurrentForm) {
                window.exportCurrentForm();
            }
            dropdown?.classList.remove('open');
        });

        // Enable/disable export based on route
        const updateExportState = () => {
            const hash = window.location.hash.slice(1) || '/';
            const isFormPage = hash.startsWith('/form/') || hash.startsWith('/intake-simple/');
            if (exportBtn) {
                exportBtn.disabled = !isFormPage;
            }
        };

        window.addEventListener('hashchange', updateExportState);
        updateExportState();
    }
}

customElements.define('wl-header', WLHeader);

export default WLHeader;
