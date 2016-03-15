// Signals.js wrapper, returns a signal.
$$.signal = function() {
    return new signals.Signal();
}

// Removes all listener from the signal.
$$.signalClear = function(signal) {
    signal.removeAll();
}
