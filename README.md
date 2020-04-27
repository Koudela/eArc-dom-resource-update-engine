# eArc-dom-resource-update-engine

Lightweight dependency free dom update engine fo the 
[earc framework](https://github.com/Koudela/eArc-core).  

Fetching or updating server side resources on user input is a common task. Updating
the dom on fetching resources as well. As parts of your app get entangled in the
javascript the server side loses the single source of truth. Now one must know
both to understand the app, the client and the server side of the app. Some may
try to pull the whole truth to the client side and build one-page apps driven by 
restfull interfaces. This package empowers you to go the other way round. It gives
a client side html-data-attribute based interface to you. If you use this interface 
well, you can write complex dynamic apps without writing a single line of javascript 
code.

## Table of contents

 - [Install](#install)
 - [Bootstrap](#bootstrap)
 - [Configure](#configure)
 - [Basic usage](#basic-usage)
    - [The data update id](#the-data-update-id)
    - [The data update events](#the-data-update-events)
    - [The data update resources](#the-data-update-resources)
    - [The update directive](#the-update-directive)
    - [Fetching attributes](#fetching-attributes)
 - [Advanced usage](#advanced-usage)
 - [Releases](#releases)
    - [Release 0.0](#release-00) 

## Install

```
$ composer require earc/router
```

## Bootstrap:

Register the file `vendor/earc/dom-resource-update-engine/src/dom-resource-update-engine.js`
in your asset pipeline or copy/link it to your web directory and import it in your
web-page.

```html
<script type="text/javascript" src="/js/dom-resource-update-engine.js"></script>
``` 

Call at the last line of your pages body the `init()` function of the `domResourceUpdateEngine`.

```html
        // ...
        <script>domResourceUpdateEngine.init();</script>
    </body>
</html>
```

You are ready to go.

## Configuration

Most of the time you don't need to configure this package. The other cases are 
discussed in the [TODO](#) section.

## Basic usage

The dom resource update engine is based on three html-data-attributes:

1. `data-update-id`
2. `data-update-events`
3. `data-update-resources`

and one json based directive ***update-directive***.

The `data-update-id` provides the element identifiers for the engine. 

The `data-update-events` bind javascript events to pre-defined and user-defined 
engine actions.

The `data-update-resources` attribute binds actions to resource calls.

The ***update-directive*** uses the element identifiers and the pre-defined engine
actions to update the dom.

### The data update id

The value of the `data-update-id` attribute is the identifier of the html element.
You can name it whatever you like.

### The data update events

The syntax of the `data-update-events` attribute is a json object, containing
javascript event types as property names. For example `click` or `submit` are
valid property names. The properties hold objects with `data-update-ids` as
property names. The values are arrays of action names.

The syntax translates to an event-listener attached to the current element for
every event type. If an event triggers the listener it runs the actions on
the element with the corresponding `data-update-id`.

You can use the `~` as abbreviated id for the current element.

```html
<button data-update-events='{ "click": { "target-element": ["user-defined-action"] }}' 
>click me!</button>
<div data-update-id='target-element'>... to run an user defined action on me.</div>
```

Hints: 
1. Please note the json notation only accepts double quotes.
2. The eventlisters are attached as soon as `init()` is called or after their
html-fragment is added to the dom.

### The data update resources

`data-update-resources` are json objects as well. The property names are 
urls that will be called. The values are arrays naming the actions that triggers
the url call.

There are two actions that have a special meaning for the `data-update-resources`
notation. 
1. `load` triggers one call as soon as the event-listeners are attached.
2. If `submit` is run on a form element the forms' data is send using the method
of the form.

```html
<form 
        method="POST"
        data-update-id='my-form' 
        data-update-resources='{ "/the/url/called/on/submit":["submit"] }'
>
    // ...
    <button data-update-events='{ "click": { "my-form": ["submit"] }}'>submit it!</button>
</form>
```

Hints: 
1. The javascript `load` *event* does **not** trigger the `load` *action*. Neither 
does the `load` *action* trigger the `load` *event*. 
2. The javascript `submit` *event* does **not** trigger  the `submit` *action*. 
Neither does the `submit` *action* trigger the `submit` *event*.
3. If you listen to the `submit` *event* `preventDefault()` is called upon it, preventing
the form from being submitted regularly. 

## The update directive

The server called by the data update resource has a response. The response has
to be a json object. The parameter names are `data-upload-ids`. The values are
objects with parameter names referencing on of the following pre-defined actions:

- `replace`: Replaces the element by the value interpreted as html.
- `update`: Replaces the children of the element by the value interpreted as html.
- `delete`: Deletes the element.
- `beforebegin`: Inserts the value interpreted as html before the element.
- `afterbegin`: Inserts the value interpreted as html before the first child.
- `beforeend`: Inserts the value interpreted as html after the last child.
- `afterend`: Inserts the value interpreted as html after the element.

```js
{ "data-update-id-of-the-elment": { "update": "<div>This divs will replace the children</div><div>...</div>"}]
```

There are two special elements that are bound to one special action:

```js
{ 
    "console": { "log": "This string will be printed to the console."},
    "error": { "throw": "An error will be thrown. This is its message."},
    "an-element": { "replace": "an-element will not be replaced as the error kills the script" }
}
```

## Fetching attributes

To be able to send data without forms `data-update-resources` can fetch attributes. 
Use the hash `#` to replace an url segment with an attribute of the same element
followed by the attributes name. To fetch the content of the attribute of another
element prefix the hash with the elements' html id additionally. 

```html


<span class="form user-content" id="getMyAttribute">...</span>
<input 
        type="number"  
        value=""        
        data-update-ressources='{ "/url/path/#value/getMyAttribute#class": ["user-defined-action"]}'
/>
```

Hints: 
1. The url part replaced by the attributes content has to start and end with a slash 
or has to be the last part of an url starting with a slash.
2. If the attribute is empty or does not exist the part of the url is replaced by
the *string* `null`.


## TODO Advanced usage documentation:

UPDATE-DIRECTIVE: { "Tmpl:Instance::ID|~": { action: "[HTML]"|<|>}, ... }

data-update-events="{ click: { "Tmpl:Instance:ID"|~ : [action1, action2, ...]|*, ...}, ...}"

data-update-filter="[action1, action2]"

data-update-id="Tmpl:Instance::ID"

data-update-resources="{ "URL"|"URL/elm-id#attrName/#otherAttr": [action1, action2]|*,...}"

data-update-directives="UPDATE-DIRECTIVE"

ID-MAPPING: { "oldId" : { action|* : { id: "newId", action: "newAction" }}}
