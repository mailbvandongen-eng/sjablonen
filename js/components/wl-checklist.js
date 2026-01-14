/**
 * WL-Checklist Web Component
 * Checkbox lijst voor mandaat checklists
 */

class WLChecklist extends HTMLElement {
    static get observedAttributes() {
        return ['editable'];
    }

    constructor() {
        super();
        this._items = [];
        this._editable = true;
    }

    connectedCallback() {
        this._editable = !this.hasAttribute('readonly');
        this.render();
    }

    get items() {
        return this._items;
    }

    set items(value) {
        this._items = value || [];
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="checklist">
                ${this._items.map((item, index) => this.renderItem(item, index)).join('')}
            </div>
        `;

        this.setupEvents();
    }

    renderItem(item, index) {
        const valueClass = item.waarde === true ? 'approved' : item.waarde === false ? 'rejected' : '';
        const valueText = item.waarde === true ? 'Ja' : item.waarde === false ? 'Nee' : '-';

        return `
            <div class="checklist-item" data-index="${index}">
                <div class="checklist-content">
                    <div class="checklist-label">${item.item}</div>
                    ${item.rol ? `<div class="checklist-role">Verantwoordelijk: ${item.rol}</div>` : ''}
                </div>
                <div class="checklist-select">
                    ${this._editable ? `
                        <button type="button" class="approval-btn ${valueClass}" data-field="waarde">
                            ${valueText}
                        </button>
                    ` : `
                        <span class="badge ${item.waarde === true ? 'badge-approved' : item.waarde === false ? 'badge-draft' : ''}">${valueText}</span>
                    `}
                </div>
            </div>
        `;
    }

    setupEvents() {
        // Approval button clicks
        this.querySelectorAll('.approval-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.checklist-item');
                const index = parseInt(item.dataset.index);
                const currentValue = this._items[index].waarde;

                // Cycle through: null -> true -> false -> null
                if (currentValue === null || currentValue === undefined) {
                    this._items[index].waarde = true;
                } else if (currentValue === true) {
                    this._items[index].waarde = false;
                } else {
                    this._items[index].waarde = null;
                }

                this.render();
                this.dispatchChange();
            });
        });
    }

    dispatchChange() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: { items: this._items },
            bubbles: true
        }));
    }

    getData() {
        return this._items;
    }

    setData(items) {
        this.items = items;
    }

    // Bereken hoeveel items zijn afgevinkt
    getProgress() {
        const total = this._items.length;
        const completed = this._items.filter(item => item.waarde === true).length;
        return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }
}

customElements.define('wl-checklist', WLChecklist);

export default WLChecklist;
