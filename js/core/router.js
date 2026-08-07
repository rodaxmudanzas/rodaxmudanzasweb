/**
 * ==========================================================
 * RODAX Marketplace
 * Archivo : js/core/router.js
 * Módulo  : Router
 * ----------------------------------------------------------
 * Responsabilidad:
 * Gestionar la navegación interna de los paneles RODAX.
 * ==========================================================
 */

(function (window) {
    "use strict";

    if (!window.RODAX) {
        console.error(
            "[RODAX Router] rodax.js debe cargarse antes que router.js"
        );
        return;
    }

    const routes = new Map();

    let currentRoute = null;

    window.RODAX.router = {

        register: function (name, config) {

            if (
                typeof name !== "string" ||
                !name.trim()
            ) {
                return false;
            }

            routes.set(
                name.trim(),
                Object.assign({}, config || {})
            );

            return true;
        },

        has: function (name) {
            return routes.has(name);
        },

        getCurrent: function () {
            return currentRoute;
        },

        list: function () {
            return Array.from(routes.keys());
        },

        go: async function (name, params) {

            if (!routes.has(name)) {

                console.error(
                    `[RODAX Router] Ruta inexistente: ${name}`
                );

                return false;
            }

            const previousRoute = currentRoute;

            const route = routes.get(name);

            try {

                if (
                    typeof route.beforeEnter === "function"
                ) {
                    const permitido =
                        await route.beforeEnter(
                            params || {},
                            previousRoute
                        );

                    if (permitido === false) {
                        return false;
                    }
                }

                currentRoute = name;

                window.RODAX.state.set(
                    "router.current",
                    name
                );

                if (
                    typeof route.enter === "function"
                ) {
                    await route.enter(
                        params || {},
                        previousRoute
                    );
                }

                if (
                    window.RODAX.events &&
                    typeof window.RODAX.events.emit === "function"
                ) {
                    window.RODAX.events.emit(
                        "router:changed",
                        {
                            from: previousRoute,
                            to: name,
                            params: params || {}
                        }
                    );
                }

                return true;

            } catch (error) {

                currentRoute = previousRoute;

                console.error(
                    `[RODAX Router] Error entrando en "${name}":`,
                    error
                );

                return false;
            }
        }
    };

})(window);