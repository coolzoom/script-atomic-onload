/**
 * Script loading is difficult thanks to IE. We need callbacks to fire
 * immediately following the script's execution, with no other scripts
 * running in between. If other scripts on the page are able to run
 * between our script and its callback, bad things can happen, such as
 * `jQuery.noConflict` not being called in time, resulting in plugins
 * latching onto our version of jQuery, etc.
 *
 * For IE<10 we use a relatively well-documented 'preloading' strategy,
 * which ensures that the script is ready to execute *before* appending
 * it to the DOM. That way when it is finally appended, it is
 * executed immediately.
 *
 * References:
 * 1. http://www.html5rocks.com/en/tutorials/speed/script-loading/
 * 2. http://blog.getify.com/ie11-please-bring-real-script-preloading-back/
 * 3. https://github.com/jrburke/requirejs/issues/526
 * 4. https://connect.microsoft.com/IE/feedback/details/729164/ie10-dynamic-script-element-fires-loaded-readystate-prematurely
 */
var _pendingScripts = {},
    _scriptCounter = 0;

function loadScript(src, callback, thisValue) {
    thisValue = thisValue || this;

    var script = document.createElement('script');

    if (script.readyState && !('async' in script)) {
        // This section is only for IE<10. Some other old browsers may
        // satisfy the above condition and enter this branch, but we don't
        // support those browsers anyway.

        var id = _scriptCounter++,
            isReady = { loaded: true, complete: true },
            isComplete = { complete: true },
            inserted = false,
            done = false;

        // Attach the handler before setting src, otherwise we might
        // miss events (consider that IE could fire them synchronously
        // upon setting src, for example).
        script.onreadystatechange = function() {
            if (!inserted && isReady[script.readyState]) {
                inserted = true;
                // Get the first script element, we're just going to use it
                // as a reference for where to insert ours. Do NOT try to do
                // this just once at the top and then re-use the same script
                // as a reference later. Some weird loaders *remove* script
                // elements after the browser has executed their contents,
                // so the same reference might not have a parentNode later.
                var firstScript = document.getElementsByTagName('script')[0];

                // Append the script to the DOM, triggering execution.
                firstScript.parentNode.insertBefore(script, firstScript);
            }
            // It's possible for readyState to be 'complete' immediately
            // after we insert (and execute) the script in the branch
            // above. So check readyState again here and react without
            // waiting for another onreadystatechange.
            if (!done && isComplete[script.readyState]) {
                done = true;
                script.onreadystatechange = null;
                _pendingScripts[id] = void 0;
                if (callback) {
                  callback.call(thisValue);
                }
            }

        };

        // Since we're not appending the script to the DOM yet, the
        // reference to our script element might get garbage collected
        // when this function ends, without onreadystatechange ever being
        // fired. This has been witnessed to happen. Adding it to
        // `_pendingScripts` ensures this can't happen.
        _pendingScripts[id] = script;

        // This triggers a request for the script, but its contents won't
        // be executed until we append it to the DOM.
        script.src = src;

        // In some cases, the readyState is already 'loaded' immediately
        // after setting src. It's a lie! Don't append to the DOM until
        // the onreadystatechange event says so.
    } else {
        // This section is for modern browsers, including IE10+.
        script.onload = function() {
            script.onload = null;
            if (callback) {
              callback.call(thisValue);
            }
        };
        script.async = true;
        script.charset = 'utf-8';
        script.src = src;
        // Get the first script element, we're just going to use it
        // as a reference for where to insert ours. Do NOT try to do
        // this just once at the top and then re-use the same script
        // as a reference later. Some weird loaders *remove* script
        // elements after the browser has executed their contents,
        // so the same reference might not have a parentNode later.
        var firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);
    }
};

module.exports = loadScript;
