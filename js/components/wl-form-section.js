/**
 * WL-Form-Section Web Component
 * Uitklapbare sectie voor formulieren
 */

class WLFormSection extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'collapsed', 'section-id'];
    }

    constructor() {
        super();
        this._collapsed = false;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'collapsed') {
            this._collapsed = this.hasAttribute('collapsed');
            this.updateCollapsedState();
        }
        if (name === 'title' && this.querySelector('.section-title-text')) {
            this.querySelector('.section-title-text').textContent = newValue;
        }
    }

    get collapsed() {
        return this._collapsed;
    }

    set collapsed(value) {
        this._collapsed = value;
        if (value) {
            this.setAttribute('collapsed', '');
        } else {
            this.removeAttribute('collapsed');
        }
        this.updateCollapsedState();
    }

    render() {
        const title = this.getAttribute('title') || 'Sectie';
        const sectionId = this.getAttribute('section-id') || '';

        // Bewaar de originele content
        const content = this.innerHTML;

        this.innerHTML = `
            <div class="section-header" role="button" tabindex="0" aria-expanded="${!this._collapsed}">
                <h3 class="section-title">
                    <span class="section-title-text">${title}</span>
                </h3>
                <div class="section-toggle" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </div>
            </div>
            <div class="section-content" ${sectionId ? `data-section-id="${sectionId}"` : ''}>
                ${content}
            </div>
        `;
    }

    setupEvents() {
        const header = this.querySelector('.section-header');
        if (header) {
            header.addEventListener('click', () => this.toggle());
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }
    }

    toggle() {
        this.collapsed = !this.collapsed;
        this.dispatchEvent(new CustomEvent('section-toggle', {
            detail: { collapsed: this.collapsed },
            bubbles: true
        }));
    }

    updateCollapsedState() {
        const header = this.querySelector('.section-header');
        if (header) {
            header.setAttribute('aria-expanded', !this._collapsed);
        }
    }

    expand() {
        this.collapsed = false;
    }

    collapse() {
        this.collapsed = true;
    }
}

customElements.define('wl-form-section', WLFormSection);

export default WLFormSection;
