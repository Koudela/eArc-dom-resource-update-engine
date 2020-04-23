# eArc-dom-resource-update-engine

## Bootstrap:

```js
domResourceUpdateEngine.init();
```


## TODO Documentation:

    actions = ['replace', 'update', 'beforebegin', 'afterbegin', 'beforeend', 'afterend', 'delete']
    + ['submit', 'load'];
    + ['log', 'throw'];
    specialIds = ['console', 'error']


UPDATE-DIRECTIVE: { "Tmpl:Instance:ID|~": { action: "[HTML]"|<|>}, ... }

data-update-events="{ click: { "Tmpl:Instance:ID"|~ : [action1, action2, ...]|*, ...}, ...}"

data-update-filter="[action1, action2]"

data-update-id="Tmpl:Instance:ID"

data-update-resources="{ "URL": [action1, action2]|*,...}"

data-update-directives="UPDATE-DIRECTIVE"

...ERROR-REPORTING

...console.log

...throw

ID-MAPPING: { "oldId" : { action|* : { id: "newId", action: "newAction" }}}
