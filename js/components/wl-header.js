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
                    <a href="#/formulieren" data-route="/formulieren">Mijn Formulieren</a>
                </nav>
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
    }
}

customElements.define('wl-header', WLHeader);

export default WLHeader;
