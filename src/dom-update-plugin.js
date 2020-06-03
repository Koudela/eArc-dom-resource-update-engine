function DomUpdatePlugin(element, ev, argv, response) {
    'use strict';

    let init = function() {
        if (null === response && ev.hasOwnProperty('detail')) {
            response = ev.detail;
        }

        if (null === response) {
            const resource = element.getAttribute('data-resource');

            processResource(resource);
        } else if (response.ok) {
            response.text().then(resource => processResource(resource));
        } else {
            // do nothing
        }
    }

    let processResource = function(resource) {
        let json;

        try {
            json = JSON.parse(resource.toString());
        } catch (e) {
            return processHTML(resource);
        }

        processUpdateDirective(json);
    }

    let transformHTML = function(elm, htmlArg) {
        let html = '<' === htmlArg || '>' === htmlArg ? elm.innerHTML : htmlArg;

        if ('>' === htmlArg) {
            elm.innerHTML = '';
        }

        return html;
    }

    let processHTML = function(html) {
        const action = argv.length > 0 ? argv[0] : 'update';
        const selector = argv.length > 1 ? argv[1] : '~';
        const targets = '~' === selector ? [element] : document.querySelectorAll(selector);

        html = transformHTML(element, html);
        targets.forEach(elm => updateDOM(elm, action, html));
    }

    let updateDOM = function(elm, action, html) {
        let placeboRoot = document.createElement('div');
        switch (action) {
            case 'attributes':
                break;
            case 'css':
                break;
            case 'delete':
                elm.parentNode.removeChild(elm);
                break;
            case 'replace':
                placeboRoot.innerHTML = html;
                while (placeboRoot.firstChild) {
                    elm.parentNode.insertBefore(placeboRoot.firstChild, elm);
                }
                elm.parentNode.removeChild(elm);
                break;
            case 'update':
                elm.innerHTML = html;
                break;
            default:
                placeboRoot.innerHTML = html;

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

    let processUpdateDirective = function(json) {
        let selector = json.hasOwnProperty('selector') ? json.selector : '~',
            action = json.hasOwnProperty('action') ? json.action : 'update';

        if (!json.hasOwnProperty('html')) {
            throw new Error('The resource json is no valid update directive.');
        }

        if ('console' === selector && 'log' === action) {
            window['con'+'sole'].log(json.html);
        }
        else if ('error' === selector && 'throw' === action) {
            throw new Error(json.html.toString());
        }
        else {
            const targets = '~' === selector ? [element] : document.querySelectorAll(selector);
            const html = transformHTML(element, json.html);

            targets.forEach(elm => updateDOM(elm, action, html));
        }
    }

    init();
}
