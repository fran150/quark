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

function clearFields(unmapped) {
    for (var i in unmapped) {
        if (unmapped[i] === null || unmapped[i] === undefined) {
            delete unmapped[i];
        }
        else if (typeof unmapped[i] === "object") {
            clearFields(unmapped[i]);
        }
    }

    return unmapped;
}

// Transform the model into JSON using knockout-mapping, if a field is null or undefined it deletes it.
ko.getJson = function (model) {
    var unmapped = komapping.toJS(model);

    unmapped = clearFields(unmapped);

    var result = komapping.toJSON(unmapped);

    result = result.replace(/\/Date\(\d+\)/g, function (a) { return '\\' + a + '\\'; });

    return result;
}

ko.extenders.blockable = function(target, message) {
    target.blocked = ko.observable('');

    target.block = function() {
        target.blocked(message);
    }

    target.unblock = function() {
        target.blocked('');
    }

    //return the original observable
    return target;
};
