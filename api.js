// API related functions

import { EXTENSION_NAME, settingsKey } from './consts.js';
const t = SillyTavern.getContext().t;

let apiAvailable = false;

export function isAPIAvailable() {
    return apiAvailable;
}

export async function checkAPIAvailable() {
    apiAvailable = await probeAPI();
    return apiAvailable;
}

async function probeAPI() {
    try {
        const context = SillyTavern.getContext();
        const response = await fetch('/api/plugins/emma/probe', {
            method: 'GET',
            headers: context.getRequestHeaders(),
        });
        return response.status === 204;
    } catch (error) {
        console.debug(`[${EXTENSION_NAME}]`, t`API probe failed`, error);
        return false;
    }
}

export async function getEditorsList() {
    const context = SillyTavern.getContext();

    try {
        const response = await fetch('/api/plugins/emma/editors', {
            headers: context.getRequestHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch editors');
        }

        return await response.json();
    } catch (error) {
        console.debug(`[${EXTENSION_NAME}]`, t`Failed to fetch editors`, error);
        throw error;
    }
}

function tryParse(errorText) {
    try {
        return JSON.parse(errorText);
    } catch (parseError) {
        return undefined;
    }
}

export async function openExtensionWithAPI(extensionName, editor) {
    const context = SillyTavern.getContext();
    const response = await fetch('/api/plugins/emma/open', {
        method: 'POST',
        headers: context.getRequestHeaders(),
        body: JSON.stringify({
            editor: editor || 'code',
            extensionName: extensionName.replace(/^\//, ''), // Remove leading slash
        }),
    });

    if (!response.ok) {
        // Try to get error details from response
        const errorText = await response.text();
        const errorData = tryParse(errorText);
        const title = errorData?.error || t`Failed to open extension`;
        const message = errorData?.details || errorText;
        toastr.error(message, title);
        throw new Error('API call failed');
    }
}

export async function createNewExtension(name, displayName, author, email) {
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];

    try {
        const response = await fetch('/api/plugins/emma/create', {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({
                name,
                display_name: displayName,
                author,
                email,
                githubUsername: settings.githubUsername || undefined,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errorData = tryParse(errorText);
            const title = errorData?.error || t`Failed to create extension`;
            const message = errorData?.details || errorText;
            toastr.error(message, title);
            return;
        }

        const { path, manifestData } = await response.json();
        toastr.success(t`New extension "${manifestData.display_name}" awaits, ${manifestData.author}`, t`Extension creation successful`);
        console.debug(`[${EXTENSION_NAME}]`, t`Extension "${manifestData.display_name}" installed at ${path}`);

        return manifestData;
    } catch (error) {
        console.error(`[${EXTENSION_NAME}]`, t`Failed to create extension`, error);
        toastr.error(t`Failed to create extension`);
        throw error;
    }
}
