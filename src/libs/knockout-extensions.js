// Clears and refill the observable with the original value to force notify update.
ko.observable.fn.refresh = function() {
    var value = this();
    $$.undefine(this);
    this(value);
}

// Check if it's an observable array
ko.isObservableArray = function(elem) {
    if (ko.isObservable(elem) && elem.indexOf !== undefined) {
        return true;
    }

    return false;
}

// Check if it's a computed observable
ko.isComputed = function (instance) {
    if ((instance === null) || (instance === undefined) || (instance.__ko_proto__ === undefined)) return false;
    if (instance.__ko_proto__ === ko.dependentObservable) return true;
    return ko.isComputed(instance.__ko_proto__); // Walk the prototype chain
}

ko.mapToJS = function(observable) {
    return komapping.toJS(komapping.fromJS(observable));
}

ko.mapFromJS = function(observable) {
    return komapping.fromJS(komapping.toJS(observable));
}

ko.tryBlock = function(observable, message) {
    if (observable.block) {
        observable.block(message);
    }
}

ko.tryUnblock = function(observable) {
    if (observable.unblock) {
        observable.unblock();
    }
}
