function ResourceUpdateEngine(eventTypes, pluginInits) {
    'use strict';

    const plugins = {};

    function Target(element) {
        this.element = element

        let throwError = (message, parentError) => {
            window['con'+'sole'].log(this.element, parentError);
            throw new Error(message);
        }

        let getData = () => {
            let data;

            try {
                data = JSON.parse(this.element.getAttribute('data-update'));
            } catch (e) {
                const message = 'The data `'+this.element.getAttribute('data-update')+
                    '` of the data-update attribute is no valid JSON.';
                throwError(message, this.element, e);
            }

            if (!Array.isArray(data)) {
                const message = 'The data `'+this.element.getAttribute('data-update')+
                    '` of the data-update attribute is not of type Array.'
                throwError(message, this.element, null);
            }

            return data;
        }

        this.processEvent = (ev) => {
            if (this.element.hasAttribute('data-update')) {
                getData().forEach(dataItem =>
                    (new UpdateResource(dataItem, ev, this)).fetch()
                );
            }
        }
    }

    function transformDynamicNotation(dynamicNotationString, separator, Target) {
        function getAttributeValue(elm, attrName) {
            if (null === elm) {
                return null;
            }

            switch (attrName) {
                case 'value':
                    return elm.value;
                case 'checked':
                    return elm.checked ? 1 : 0;
                default:
                    return elm.getAttribute(attrName)
            }
        }

        function processAttributeNotation(str) {
            const hashPos = str.lastIndexOf(separator);

            if (-1 !== hashPos) {
                const identifier = str.substr(hashPos+1).split('!');
                str = processAttributeNotation(str.substr(0, hashPos));
                if (2 === identifier.length)  {
                    const targetElm = identifier[0] ? document.getElementById(identifier[0]) : Target.element
                    const attrContent = getAttributeValue(targetElm, identifier[1]);
                    if (null === attrContent || '' === attrContent) {
                        return str + separator + 'null'
                    }
                    return str + separator + encodeURIComponent(attrContent);
                }

                return str + separator + identifier.join('!');
            }

            return str;
        }

        return processAttributeNotation(dynamicNotationString);
    }

    function PluginExecution(execArray, ev, Target) {
        this.updateEvent = ev;
        this.target = Target;
        this.execArray = execArray

        this.callPlugins = function(response) {
            this.execArray.forEach(argument => {
                const rawArgs = argument.split('!');
                const type = rawArgs.shift();
                const argv = transformDynamicNotation(rawArgs.join('!'), ':', this.target.element)
                    .split(':');

                if (plugins.hasOwnProperty(type)) {
                    plugins[type].forEach(func => {
                        func(this.target.element, this.updateEvent, argv, response);
                    });
                }
            });

            if ('data-update' !== ev.type) {
                this.target.element.dispatchEvent(new Event('data-update', { bubbles: true, detail: response }));
            }
        }
    }

    function UpdateResource(initObject, ev, Target) {
        this.triggerType = initObject.hasOwnProperty('trigger') ? initObject.trigger : 'click';
        this.url = initObject.hasOwnProperty('url') ?
            transformDynamicNotation(initObject.url, '/', Target)
            : null;
        this.exec = new PluginExecution(
            initObject.hasOwnProperty('exec') ? initObject.exec : [],
            ev,
            Target
        );

        this.fetch = function() {
            if (ev.type === this.triggerType) {
                if (null === this.url) {
                    this.exec.callPlugins(null);
                } else {
                    const isForm = 'form' === Target.element.nodeName.toLowerCase();
                    const init = isForm ? {
                        method: Target.element.getAttribute('method'),
                        body: new FormData(Target.element)
                    } : null;

                    fetch(this.url, init).then(response => {
                        this.exec.callPlugins(response);
                    });
                }
            }
        }
    }

    function registerPlugin(UpdateEventType, func) {
        if (!plugins.hasOwnProperty(UpdateEventType)) {
            plugins[UpdateEventType] = [];
        }

        plugins[UpdateEventType].push(func);
    }

    function jsEventIterator(ev) {
        let element = ev.target;

        while (element && element !== document) {
            new Target(element).processEvent(ev);
            element = element.parentElement;
        }
    }

    function registerEvent(type) {
        document.addEventListener(type, jsEventIterator);
    }

    let init = (eventTypes, pluginInits) => {
        this.registerEvent('data-update');

        if (Array.isArray(eventTypes)) {
            eventTypes.forEach(type => {
                this.registerEvent(type);
            });
        }

        if (Array.isArray(pluginInits)) {
            pluginInits.forEach(pluginInit => {
                this.registerPlugin(pluginInit[0], pluginInit[1]);
            });
        }
    }

    function trigger(element, type) {
        (new Target(element)).processEvent(new Event(type, { bubbles: false }))
    }

    this.trigger = trigger;
    this.registerPlugin = registerPlugin;
    this.registerEvent = registerEvent;
    init(eventTypes, pluginInits);
}
