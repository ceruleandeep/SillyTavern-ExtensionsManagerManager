import { sortExtensionsByName, sortExtensionsByEnabled, sortExtensionsByUpdate } from '../utils/sort.js';
import { settingsKey, SORT_OPTIONS } from '../consts.js';

/**
 * Create the sort controls for the extensions dialog
 * TODO: get the default extension order from core UI
 * TODO: if sorting by update available, re-sort as updates are checked
 * TODO: refactor control labels into constants and use i18n
 *
 * @returns {HTMLDivElement}
 */
export function createSortControls() {
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];
    const container = document.createElement('div');
    container.classList.add('emma--sort-controls');

    const select = document.createElement('select');
    select.classList.add('text_pole');

    const options = [
        { value: 'load', text: 'Original Order' },
        { value: 'display', text: 'Display Name' },
        { value: 'name', text: 'Internal Name' },
        { value: 'type', text: 'Local/Global' },
        { value: 'enabled', text: 'Enabled/Disabled' },
        { value: 'update', text: 'Update Available' },
    ];

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });

    // Set initial value from settings
    select.value = settings.sortOrder || SORT_OPTIONS.LOAD_ORDER;

    const applySort = () => {
        const extensionsContainer = container.closest('.marginBot10');
        if (!extensionsContainer) return;

        const extensions = Array.from(extensionsContainer.querySelectorAll('.extension_block'));

        // Add original order index if not already present
        extensions.forEach((ext, index) => {
            if (!ext.hasAttribute('data-original-order')) {
                ext.setAttribute('data-original-order', index);
            }
        });
        const parent = extensions[0]?.parentElement;
        if (!parent) return;

        extensions.sort((a, b) => {
            const orderA = parseInt(a.dataset.originalOrder) || 0;
            const orderB = parseInt(b.dataset.originalOrder) || 0;
            const aGlobal = !!a.querySelector('.fa-server');
            const bGlobal = !!b.querySelector('.fa-server');
            switch (select.value) {
                case 'load':
                    return orderA - orderB;
                case 'display':
                    return sortExtensionsByName(a, b);
                case 'name':
                    return (a.dataset.name || '').localeCompare(b.dataset.name || '');
                case 'type':
                    return aGlobal === bGlobal ? sortExtensionsByName(a, b) : (aGlobal ? -1 : 1);
                case 'enabled':
                    return sortExtensionsByEnabled(a, b);
                case 'update':
                    return sortExtensionsByUpdate(a, b);
                default:
                    return 0; // Keep original order
            }
        });

        // Clear and re-append in new order
        extensions.forEach(ext => ext.remove());
        extensions.forEach(ext => parent.appendChild(ext));
    };

    // Apply initial sort
    setTimeout(() => applySort(), 0);

    select.addEventListener('change', () => {
        // Save the new sort order
        settings.sortOrder = select.value;
        context.saveSettingsDebounced();
        applySort();
    });

    const label = document.createElement('label');
    label.textContent = 'Sort by: ';
    label.appendChild(select);

    container.appendChild(label);
    return container;
}
