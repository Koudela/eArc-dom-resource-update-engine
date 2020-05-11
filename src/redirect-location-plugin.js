function RedirectLocationPlugin(element, ev, argv, response) {
    'use strict';

    if (null === response) {
        response = ev.detail;
    }

    if (null === response) {
        location.href = argv[0];
    } else if (response.ok) {
        response.text().then(resource => { location.href = resource.toString(); });
    } else {
        // do nothing
    }
}
