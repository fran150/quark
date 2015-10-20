ko.extenders.blockable = function(target, defaultMessage) {
    target.blocked = ko.observable('');

    target.block = function(message) {
        var msg = message || defaultMessage;
        target.blocked(msg);
    }

    target.unblock = function() {
        target.blocked('');
    }

    //return the original observable
    return target;
};
