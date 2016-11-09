// Locks allows to define functions that will not be called inmediately but will wait until when
// an event occurs unlocking the calls.
// Once the functions are called they are cleared from the waiting list.
function SyncLock(unlocked) {
    var self = this;

    // Is the signal dispatched (and unlocked)
    var dispatched = unlocked || false;
    // Signal to notify the unlocking and call all functions
    var signal = $$.signal();

    // Lock effectively blocking all function calls
    this.lock = function() {
        dispatched = false;
    }

    // Unlocks the object without triggering the attached functions
    this.force = function() {
        dispatched = true;
    }

    // Unlock calling all blocked functions
    this.unlock = function() {
        dispatched = true;
        signal.dispatch();
    }

    // Is this lock locked
    this.isLocked = function() {
        return !dispatched;
    }

    // Call the specified function when unlocked
    this.call = function(callback) {
        // If is alredy unlocked call inmediately
        if (dispatched) {
            callback();
        } else {
            // If not is unlocked add a listener to the unlock signal.
            signal.addOnce(function() {
                // When unlocked call the function and remove the listener from the signal
                dispatched = true;
                callback();
            });
        }
    }

    // Dispose locks
    this.dispose = function() {
        $$.signalClear(signal);
    }
}

// Returns a lock
$$.lock = function(unlocked) {
    return new SyncLock(unlocked || false);
}

// Blocks execution of the function until the specified lock unlocks
$$.wait = function(lock, callback) {
    lock.call(callback);
}
