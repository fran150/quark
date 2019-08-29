import Signals from 'signals';

/**
 * Locks allows to register functions that will not be called inmediately but
 * will wait until the lock opens.
 * Once the lock is open all function all called.
 * If the lock is open when a function is registered then it will be called
 * inmediately.
 * @param {boolean} unlocked Indicates if the lock must be created unlocked
 */
function SyncLock(unlocked) {
  // Is the signal dispatched (and unlocked)
  let dispatched = unlocked || false;
  // Signal to notify the unlocking and call all functions
  const signal = new Signals();

  /**
   * Lock effectively blocking all function calls
   */
  this.lock = function() {
    dispatched = false;
  };

  /**
   * Unlocks the object without triggering the attached functions
   */
  this.force = function() {
    dispatched = true;
  };

  /**
   * Unlock calling all blocked functions
   */
  this.unlock = function() {
    dispatched = true;
    signal.dispatch();
  };

  /**
   * Returns if the lock is opened
   * @return {boolean} True if the lock is closed
   */
  this.isLocked = function() {
    return !dispatched;
  };

  /**
   * Call the specified function when unlocked
   * @param {function} callback Function to call when the lock is opened
   */
  this.call = function(callback) {
    // If is alredy unlocked call inmediately
    if (dispatched) {
      callback();
    } else {
      // If not is unlocked add a listener to the unlock signal.
      signal.addOnce(function() {
        // When unlocked call the function and remove the listener from
        // the signal
        dispatched = true;
        callback();
      });
    }
  };

  // Dispose locks
  this.dispose = function() {
    signal.dispose();
  };
};

export default SyncLock;
