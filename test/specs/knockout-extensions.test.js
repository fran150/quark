define(['quark', 'knockout'], function($$, ko) {
    describe('KO Extensions', function() {

        function Test() {
            this.observable = ko.observable();
            this.observableArray = ko.observableArray();
            this.computed = ko.computed(function() { return true; });
            this.pureComputed = ko.pureComputed(function() { return true; });
        }

        var o = { surname: 'Doe', name: 'John', age: undefined, street: { name: 'Some', number: 1234, floor: null }};

        var test = new Test();

        it('Must return true if its an observableArray', function() {
            expect(ko.isObservableArray(test.observable)).toBe(false);
            expect(ko.isObservableArray(test.observableArray)).toBe(true);
        });

        it('Must return true if its a computed', function() {
            expect(ko.isObservableArray(test.observable)).toBe(false);
            expect(ko.isComputed(test.computed)).toBe(true);
            expect(ko.isComputed(test.pureComputed)).toBe(true);
        });
    });
});
