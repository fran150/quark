// Locks allows to define functions that will not be called inmediately but will wait until when
// an event occurs unlocking the calls.
// Once the functions are called they are cleared from the waiting list.
function SyncLock() {
    var self = this;

    // Is the signal dispatched (and unlocked)
    var dispatched = false;
    // Signal to notify the unlocking and call all functions
    var signal = $$.signal();

    // Lock effectively blocking all function calls
    this.lock = function() {
        dispatched = false;
        signal.dispatch();
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
            signal.add(function() {
                // When unlocked call the function and remove the listener from the signal
                dispatched = true;
                callback();
                // TODO: This might not work, the remove must be with "this" or something alike
                signal.remove(callback);
            });
        }
    }
}

// Returns a lock
$$.lock = function() {
    return new SyncLock();
}

// Blocks execution of the function until the specified lock unlocks
$$.wait = function(lock, callback) {
    lock.call(callback);
}

// Returns if the lock is locked or not
$$.isLocked = function(lock) {
    return lock.isLocked();
}
