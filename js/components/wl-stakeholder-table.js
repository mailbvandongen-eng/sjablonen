/**
 * WL-Stakeholder-Table Web Component
 * Dynamische tabel voor stakeholders met akkoord/geïnformeerd status
 */

class WLStakeholderTable extends HTMLElement {
    static get observedAttributes() {
        return ['editable', 'type'];
    }

    constructor() {
        super();
        this._data = [];
        this._editable = true;
        this._type = 'akkoord'; // 'akkoord' of 'geinformeerd'
    }

    connectedCallback() {
        this._editable = this.hasAttribute('editable');
        this._type = this.getAttribute('type') || 'akkoord';
        this.render();
    }

    get data() {
        return this._data;
    }

    set data(value) {
        this._data = value || [];
        this.render();
    }

    render() {
        const statusLabel = this._type === 'akkoord' ? 'Akkoord' : 'Geïnformeerd';
        const statusKey = this._type === 'akkoord' ? 'akkoord' : 'geinformeerd';

        this.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 20%">Team / Rol</th>
                            <th style="width: 20%">Naam</th>
                            <th style="width: 25%">Email</th>
                            <th style="width: 15%">${statusLabel}</th>
                            ${this._editable ? '<th style="width: 20%">Acties</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${this._data.map((row, index) => this.renderRow(row, index, statusKey)).join('')}
                    </tbody>
                </table>
            </div>
            ${this._editable ? `
                <button type="button" class="btn btn-secondary btn-sm add-row-btn">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                    </svg>
                    Rij toevoegen
                </button>
            ` : ''}
        `;

        this.setupEvents();
    }

    renderRow(row, index, statusKey) {
        const statusValue = row[statusKey];
        let statusBtnClass = '';
        let statusText = '-';

        if (statusValue === true) {
            statusBtnClass = 'approved';
            statusText = 'Ja';
        } else if (statusValue === false) {
            statusBtnClass = 'rejected';
            statusText = 'Nee';
        }

        return `
            <tr data-index="${index}">
                <td>
                    ${this._editable
                        ? `<input type="text" class="form-input" value="${row.team || ''}" data-field="team" placeholder="Team/Rol">`
                        : row.team || '-'
                    }
                </td>
                <td class="input-cell">
                    ${this._editable
                        ? `<input type="text" value="${row.naam || ''}" data-field="naam" placeholder="Naam">`
                        : row.naam || '-'
                    }
                </td>
                <td class="input-cell">
                    ${this._editable
                        ? `<input type="email" value="${row.email || ''}" data-field="email" placeholder="email@westland.nl">`
                        : row.email || '-'
                    }
                </td>
                <td class="approval-cell">
                    ${this._editable
                        ? `<button type="button" class="approval-btn ${statusBtnClass}" data-field="${statusKey}">${statusText}</button>`
                        : statusText
                    }
                </td>
                ${this._editable ? `
                    <td>
                        <div class="row-actions">
                            <button type="button" class="btn-icon delete" title="Verwijderen" data-action="delete">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                ` : ''}
            </tr>
        `;
    }

    setupEvents() {
        // Input changes
        this.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const row = e.target.closest('tr');
                const index = parseInt(row.dataset.index);
                const field = e.target.dataset.field;
                this._data[index][field] = e.target.value;
                this.dispatchChange();
            });
        });

        // Approval button clicks
        this.querySelectorAll('.approval-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const index = parseInt(row.dataset.index);
                const field = e.target.dataset.field;
                const currentValue = this._data[index][field];

                // Cycle through: null -> true -> false -> null
                if (currentValue === null || currentValue === undefined) {
                    this._data[index][field] = true;
                } else if (currentValue === true) {
                    this._data[index][field] = false;
                } else {
                    this._data[index][field] = null;
                }

                this.render();
                this.dispatchChange();
            });
        });

        // Delete button
        this.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const index = parseInt(row.dataset.index);
                this.removeRow(index);
            });
        });

        // Add row button
        const addBtn = this.querySelector('.add-row-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addRow());
        }
    }

    addRow() {
        const statusKey = this._type === 'akkoord' ? 'akkoord' : 'geinformeerd';
        const newRow = {
            team: '',
            naam: '',
            email: '',
            [statusKey]: null
        };
        this._data.push(newRow);
        this.render();
        this.dispatchChange();

        // Focus op eerste input van nieuwe rij
        const lastRow = this.querySelector('tbody tr:last-child input');
        if (lastRow) lastRow.focus();
    }

    removeRow(index) {
        if (this._data.length > 1) {
            this._data.splice(index, 1);
            this.render();
            this.dispatchChange();
        }
    }

    dispatchChange() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: { data: this._data },
            bubbles: true
        }));
    }

    getData() {
        return this._data;
    }

    setData(data) {
        this.data = data;
    }
}

customElements.define('wl-stakeholder-table', WLStakeholderTable);

export default WLStakeholderTable;
