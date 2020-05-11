function DispatchEventPlugin(element, ev, argv, response) {
    'use strict';

    let init = function() {
        const type = argv.length > 0 ? argv[0] : 'update';
        const selector = argv.length > 1 ? argv[1] : '~';
        const bubbles = argv.length > 2 ? 'true' === argv[2] : true;
        const cancelable = argv.length > 3 ? 'true' === argv[3] : true;

        if ('~' === selector) {
            dispatchEvent(element, type, bubbles, cancelable);

        } else {
            document.querySelectorAll(selector)
                .forEach(elm => dispatchEvent(elm, type, bubbles, cancelable));
        }
    }

    let dispatchEvent = function(elm, type, bubbles, cancelable) {
        const event = new Event(type, {
            detail: response,
            bubbles: bubbles,
            cancelable: cancelable
        });

        elm.dispatchEvent(event);
    }

    init();
}
