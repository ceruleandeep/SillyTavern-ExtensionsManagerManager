import { settingsKey, EXTENSION_NAME } from '../consts.js';
import { addPathButtonsToGlobalExtensions, updateNewExtensionButton } from './controls.js';
import { getEditorsList, isAPIAvailable } from '../api.js';

function createInlineDrawer(context) {
    const inlineDrawer = document.createElement('div');
    inlineDrawer.classList.add('inline-drawer');

    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');

    const extensionName = document.createElement('b');
    extensionName.textContent = context.t`${EXTENSION_NAME}`;

    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');

    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');

    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    return { inlineDrawer, inlineDrawerContent };
}

function createEnabledCheckbox(context, settings) {
    const enabledCheckboxLabel = document.createElement('label');
    enabledCheckboxLabel.classList.add('checkbox_label');
    enabledCheckboxLabel.htmlFor = `${settingsKey}-enabled`;

    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.id = `${settingsKey}-enabled`;
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = settings.enabled;

    enabledCheckbox.addEventListener('change', () => {
        settings.enabled = enabledCheckbox.checked;
        context.saveSettingsDebounced();
        updateNewExtensionButton();

        if (!settings.enabled) {
            document.querySelectorAll('.btn_path').forEach(button => button.remove());
        } else {
            addPathButtonsToGlobalExtensions();
        }
    });

    const enabledCheckboxText = document.createElement('span');
    enabledCheckboxText.textContent = context.t`Enabled`;
    enabledCheckboxLabel.append(enabledCheckbox, enabledCheckboxText);

    return enabledCheckboxLabel;
}

async function createEditorSelection(context, settings) {
    const editorContainer = document.createElement('div');

    const editorLabel = document.createElement('label');
    editorLabel.htmlFor = `${settingsKey}-editor`;
    editorLabel.textContent = context.t`Editor`;
    editorContainer.appendChild(editorLabel);

    const editorSelect = document.createElement('select');
    editorSelect.id = `${settingsKey}-editor`;
    editorSelect.classList.add('text_pole');

    try {
        const editors = await getEditorsList();
        
        editors.forEach(editor => {
            const option = document.createElement('option');
            option.value = editor;
            option.textContent = editor;
            option.selected = settings.editor === editor;
            editorSelect.appendChild(option);
        });

        editorSelect.addEventListener('change', () => {
            settings.editor = editorSelect.value;
            context.saveSettingsDebounced();
        });

        editorContainer.appendChild(editorSelect);

        // Only show warning if API was available but failed
        if (isAPIAvailable()) {
            const message = document.createElement('div');
            message.classList.add('warning');
            message.textContent = context.t`Editor API unreachable - using default editor list`;
            editorContainer.appendChild(message);
        }
    } catch (error) {
        console.error(`[${EXTENSION_NAME}]`, context.t`Failed to get editors list`, error);
        const message = document.createElement('div');
        message.classList.add('warning');
        message.textContent = context.t`Failed to get editors list`;
        editorContainer.appendChild(message);
    }

    return editorContainer;
}

function createBasePathInput(context, settings) {
    const basePathLabel = document.createElement('label');
    basePathLabel.htmlFor = `${settingsKey}-basePath`;
    basePathLabel.textContent = context.t`Extensions base path`;

    const basePathInput = document.createElement('input');
    basePathInput.type = 'text';
    basePathInput.id = `${settingsKey}-basePath`;
    basePathInput.classList.add('text_pole');
    basePathInput.value = settings.basePath || '';
    basePathInput.placeholder = '/path/to/SillyTavern/extensions/third-party';

    basePathInput.addEventListener('input', () => {
        settings.basePath = basePathInput.value;
        context.saveSettingsDebounced();
    });

    return { basePathLabel, basePathInput };
}

export async function renderExtensionSettings() {
    const context = SillyTavern.getContext();
    const settingsElementId = `${settingsKey}-settings`;
    const settingsContainer = document.getElementById(settingsElementId) ?? document.getElementById('extensions_settings2');

    if (!settingsContainer) {
        return;
    }

    const settings = context.extensionSettings[settingsKey];
    const { inlineDrawer, inlineDrawerContent } = createInlineDrawer(context);
    settingsContainer.append(inlineDrawer);

    // Add enabled checkbox
    const enabledCheckbox = createEnabledCheckbox(context, settings);
    inlineDrawerContent.appendChild(enabledCheckbox);

    // Add editor selection
    const editorSelection = await createEditorSelection(context, settings);
    inlineDrawerContent.appendChild(editorSelection);

    // Add base path input
    const { basePathLabel, basePathInput } = createBasePathInput(context, settings);
    inlineDrawerContent.append(basePathLabel, basePathInput);
}
