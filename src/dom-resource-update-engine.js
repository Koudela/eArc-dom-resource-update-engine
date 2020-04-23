'use strict'
let domResourceUpdateEngine = {};

((exposedObject) => {
    let cache = {
        updateElms: {},
        updateParentElms: {},
        updateFilter: {},
        mapping: {},

        getId: function(elm) {
            return elm.getAttribute('data-update-id');
        },

        getParentId: function(id) {
            return id.split('::', 1)[0];
        },

        isParentId: function(id) {
            return id.indexOf('::') === -1;
        },

        getFilter: function(elm) {
            return this.JSONParse(elm.getAttribute('data-update-filter'));
        },

        getResources: function(elm) {
            return this.JSONParse(elm.getAttribute('data-update-resources'));
        },

        getDirective: function(elm) {
            return this.JSONParse(elm.getAttribute('data-update-directive'));
        },

        getEvents: function(elm) {
            return this.JSONParse(elm.getAttribute('data-update-events'));
        },

        JSONParse: function(text) {
            return text ? JSON.parse(text) : text;
        },

        hasAction: function(id, action) {
            if ('~' === id) {
                return true;
            }

            if (!this.updateFilter.hasOwnProperty(id)) {
                throw Error("The data-update-id `"+id+"` was never imported.")
            }

            return 0 === Object.keys(this.updateFilter[id]).length || this.updateFilter[id].hasOwnProperty(action);
        },

        map: function(id, action) {
            let mapAction = (mapping, id, action) => {
                return [
                    '~' === mapping.id ? id : mapping.id,
                    '~' === mapping.action ? action : mapping.action
                ];
            }

            let mapId = (mapping, id, action) => {
                if (this.mapping.hasOwnProperty(action)) {
                    return mapAction(mapping[id], id, action);
                } else if (this.mapping.hasOwnProperty('*')) {
                    return mapAction(mapping['*'], id, action);
                }
            }

            if (this.mapping.hasOwnProperty(id)) {
                return mapId(this.mapping[id], id, action);
            } else if (this.mapping.hasOwnProperty('*')) {
                return mapId(this.mapping['*'], id, action);
            }

            return [id, action];
        },

        getUpdateElements: function(elm, updateId) {
            if ('~' === updateId) {
                return [elm];
            }

            if (this.isParentId(updateId)) {
                return this.updateParentElms[updateId];
            }

            let updateElms = {};
            updateElms[updateId] = this.updateElms[updateId];

            return updateElms;
        },

        registerIdsAndFilter: function(root) {
            root.querySelectorAll('[data-update-id]').forEach((elm) => {
                const id = this.getId(elm);
                const parentId = this.getParentId(id);
                const filter = this.getFilter(elm);

                this.updateElms[id] = elm;

                if (!this.updateParentElms.hasOwnProperty(parentId)) {
                    this.updateParentElms[parentId] = {};
                }
                this.updateParentElms[parentId][id] = elm;

                this.updateFilter[id] = {};
                if (Array.isArray(filter)) {
                    filter.forEach((action) => {
                        this.updateFilter[id][action] = true;
                    });
                }
            });
        },

        unregisterElement: function(elm) {
            const id = this.getId(elm);
            if (null !== id) {
                delete this.updateElms[id];
                delete this.updateParentElms[this.getParentId(id)][id];
                delete this.updateFilter[id];
            }
        },

        unregisterDOM: function(root) {
            root.querySelectorAll('[data-update-id]').forEach(this.unregisterElement);
        }
    }


    let registerEvents = function(root) {
        root.querySelectorAll('[data-update-events]').forEach((elm) => {

            const json = cache.getEvents(elm);
            let actions = {};

            let addAction = (eventType, updateId, action) => {
                if (!actions[eventType].hasOwnProperty(updateId)) {
                    actions[eventType][updateId] = {}
                }
                actions[eventType][updateId][action] = true;
            }

            if (json) {
                for (const [eventType, subJson] of Object.entries(json)) {
                    actions[eventType] = {};
                    for (const [updateId, value] of Object.entries(subJson)) {
                        if (Array.isArray(value)) {
                            value.forEach((action) => {
                                addAction(eventType, updateId, action);
                            });
                        } else if ('*' === value) {
                            addAction(eventType, updateId, '*');
                        }
                    }
                }
            }

            for (const [eventType, value] of Object.entries(actions)) {
                if (null !== value) {
                    for (const [updateId, actionTypes] of Object.entries(value)) {
                        if (null !== actionTypes) {
                            let targetElms = cache.getUpdateElements(elm, updateId),
                                targetActionTypes = actionTypes.hasOwnProperty('*') ? null : actionTypes;

                            for (const [, targetElm] of Object.entries(targetElms)) {
                                if (eventType === 'load') {
                                    processEvent(targetElm, targetActionTypes);
                                }
                                elm.addEventListener(eventType, (ev) => {
                                    if ('submit' === eventType) {
                                        ev.preventDefault();
                                    }
                                    processEvent(targetElm, targetActionTypes);
                                });
                            }
                        }
                    }
                }
            }
        });
    }

    let processEvent = function(elm, actionTypes) {
        const updateDirective = cache.getDirective(elm);

        if (updateDirective) {
            processUpdateDirective(elm, updateDirective);
        }

        const resources = cache.getResources(elm);

        if (resources) {
            for (const [url, actions] of Object.entries(resources)) {
                if ('*' === actions) {
                    processFetch(elm, url);

                    return;
                }
                const id = cache.getId(elm);
                for (const action of actions) {
                    if (cache.hasAction(id, action) && (null === actionTypes || actionTypes.hasOwnProperty(action))) {
                        processFetch(elm, url);

                        return;
                    }
                }
            }
        }
    }

    let processFetch = function(elm, url) {
        let init = 'form' !== elm.nodeName.toLowerCase() ? null : {
            method: elm.getAttribute('method'),
            body: new FormData(elm)
        };
        fetch(url, init).then((response) => {
            response.text().then((text) => {
                processUpdateDirective(elm, cache.JSONParse(text));
            });
        });
    }

    let processUpdateDirective = function(elm, json) {
        for (let [updateId, value] of Object.entries(json)) {
            for (let [action, html] of Object.entries(value)) {
                [updateId, action] = cache.map(updateId, action);
                if ('console' === updateId && 'log' === action) {
                    console.log(html);
                }
                else if ('error' === updateId && 'throw' === action) {
                    throw new Error(html.toString());
                }
                else if (cache.hasAction(updateId, action)) {
                    let targetElms = cache.getUpdateElements(elm, updateId);
                    for (const [,targetElm] of Object.entries(targetElms)) {
                        let htmlArg = '<' === html || '>' === html ? elm.innerHTML : html;
                        if ('>' === html) {
                            cache.unregisterDOM(elm);
                            elm.innerHTML = '';
                        }
                        updateDOM(targetElm, action, htmlArg);
                    }
                }
            }
        }
    }

    let updateDOM = function(elm, action, html) {
        let placeboRoot = document.createElement('div');
        switch (action) {
            case 'submit':
                processEvent(elm, ['submit']);
                break;
            case 'delete':
                cache.unregisterDOM(elm);
                cache.unregisterElement(elm);
                elm.parentNode.removeChild(elm);
                break;
            case 'replace':
                cache.unregisterDOM(elm);
                cache.unregisterElement(elm);
                placeboRoot.innerHTML = html;
                registerInnerDOM(placeboRoot);
                while (placeboRoot.firstChild) {
                    elm.parentNode.insertBefore(placeboRoot.firstChild, elm);
                }
                elm.parentNode.removeChild(elm);
                break;
            case 'update':
                cache.unregisterDOM(elm);
                elm.innerHTML = html;
                registerInnerDOM(elm);
                break;
            default:
                placeboRoot.innerHTML = html;
                registerInnerDOM(placeboRoot);

                switch (action) {
                    case 'beforebegin':
                        while (placeboRoot.firstChild) {
                            elm.parentNode.insertBefore(placeboRoot.firstChild, elm);
                        }
                        break;
                    case 'afterbegin':
                        while (placeboRoot.firstChild) {
                            elm.insertBefore(placeboRoot.firstChild, elm.firstChild);
                        }
                        break;
                    case 'beforeend':
                        while (placeboRoot.firstChild) {
                            elm.insertBefore(placeboRoot.firstChild, null);
                        }
                        break;
                    case 'afterend':
                        while (placeboRoot.firstChild) {
                            elm.parentNode.insertBefore(placeboRoot.firstChild, elm.nextSibling);
                        }
                        break;
                }
        }
    }


    let registerInnerDOM = function(root) {
        cache.registerIdsAndFilter(root);
        registerEvents(root);
    }

    exposedObject.init = function(mapping) {
        if (null !== mapping && typeof mapping === 'object') {
            cache.mapping = mapping;
        }
        cache.registerIdsAndFilter(document)
        registerEvents(document);
    }

})(domResourceUpdateEngine)
