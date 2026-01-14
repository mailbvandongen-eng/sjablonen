/**
 * Router - Eenvoudige hash-based router voor single page application
 */

export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        // Luister naar hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    /**
     * Registreer een route
     */
    register(pattern, handler) {
        this.routes[pattern] = handler;
        return this;
    }

    /**
     * Navigeer naar een route
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Haal huidige hash op (zonder #)
     */
    getHash() {
        return window.location.hash.slice(1) || '/';
    }

    /**
     * Parse route parameters uit URL
     */
    parseRoute(hash) {
        for (const pattern in this.routes) {
            const paramNames = [];
            const regexPattern = pattern.replace(/:([^\/]+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/]+)';
            });

            const regex = new RegExp(`^${regexPattern}$`);
            const match = hash.match(regex);

            if (match) {
                const params = {};
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                return {
                    pattern,
                    handler: this.routes[pattern],
                    params
                };
            }
        }

        return null;
    }

    /**
     * Handel huidige route af
     */
    handleRoute() {
        const hash = this.getHash();
        const route = this.parseRoute(hash);

        if (route) {
            this.currentRoute = route;
            route.handler(route.params);
        } else if (this.routes['*']) {
            // Fallback route (404)
            this.routes['*']({ path: hash });
        }
    }

    /**
     * Start de router
     */
    start() {
        this.handleRoute();
        return this;
    }
}

// URL helpers voor formulieren delen
export const UrlHelpers = {
    /**
     * Genereer deelbare URL voor formulier
     */
    generateShareUrl(formType, formId) {
        const base = window.location.href.split('#')[0];
        return `${base}#/form/${formType}/${formId}`;
    },

    /**
     * Kopieer URL naar clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback voor browsers zonder clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },

    /**
     * Parse form ID uit huidige URL
     */
    parseFormUrl() {
        const hash = window.location.hash.slice(1);
        const match = hash.match(/^\/form\/([^\/]+)\/([^\/]+)$/);
        if (match) {
            return { formType: match[1], formId: match[2] };
        }
        return null;
    }
};

export default Router;
