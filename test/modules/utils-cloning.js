define(['knockout', 'quark'], function(ko, $$) {
    var gizmo = {
        name: 'Gizmo Caca',
        count: 5,
        price: 100.50,
        type: 'Mogway',
        tags: [
            'Mogway',
            'Gremlin',
            'Do Not Feed After 12'
        ]
    }

    var observableGizmo = {
        name: ko.observable('Gizmo Caca'),
        count: ko.observable(5),
        price: ko.observable(100.50),
        type: ko.observable('Mogway'),
        tags: ko.observableArray([
            'Mogway',
            'Gremlin',
            'Do Not Feed After 12'
        ])
    }

    var mixedGizmo = {
        name: 'Gizmo Caca',
        count: ko.observable(5),
        price: 100.50,
        type: 'Mogway',
        tags: [
            'Mogway',
            'Gremlin',
            'Do Not Feed After 12'
        ],
        brothers: ko.observableArray(['stripe', 'mohak'])
    }

    describe('Simple Clone Tests', function() {
        var stripe = $$.clone(gizmo);

        it('Cloned and souce object must be equals', function() {
            expect(stripe).toEqual(gizmo);
        });

        it('Cloned and source object must not refer to the same object', function() {
            expect(stripe === gizmo).toBe(false);
        });

        it ('Changing cloned object must not afect the original object', function() {
            stripe.type = 'Gremlin';
            expect(stripe.type).toBe('Gremlin');
            expect(gizmo.type).toBe('Mogway');
        });
    });

    describe('Observable Clone Tests', function() {
        var observableStripe = $$.cloneObservable(gizmo);
        var mohawk = $$.cloneObservable(observableGizmo);

        it('Cloned and souce object must be equals', function() {
            expect(mohawk.name()).toEqual(observableGizmo.name());
            expect(mohawk.count()).toEqual(observableGizmo.count());
            expect(mohawk.price()).toEqual(observableGizmo.price());
            expect(mohawk.type()).toEqual(observableGizmo.type());
            expect(mohawk.tags()).toEqual(observableGizmo.tags());
        });

        it('Cloned and source object must not refer to the same object', function() {
            expect(mohawk.name === observableGizmo.name).toBe(false);
            expect(mohawk.count === observableGizmo.count).toBe(false);
            expect(mohawk.price === observableGizmo.price).toBe(false);
            expect(mohawk.type === observableGizmo.type).toBe(false);
            expect(mohawk.tags === observableGizmo.tags).toBe(false);
        });


        it ('Changing cloned object must not afect the original object', function() {
            mohawk.type('Gremlin');
            expect(mohawk.type()).toBe('Gremlin');
            expect(observableGizmo.type()).toBe('Mogway');
        });

        it('Cloned observable and simple souce object must be equals', function() {
            expect(observableStripe.name()).toEqual(gizmo.name);
            expect(observableStripe.count()).toEqual(gizmo.count);
            expect(observableStripe.price()).toEqual(gizmo.price);
            expect(observableStripe.type()).toEqual(gizmo.type);
            expect(observableStripe.tags()).toEqual(gizmo.tags);
        });

    });

    describe('Mixed Clone Tests', function() {
        var mohawk = $$.cloneMixed(mixedGizmo);

        it('Cloned and souce object must be equals', function() {
            expect(mohawk.name).toEqual(mixedGizmo.name);
            expect(mohawk.count()).toEqual(mixedGizmo.count());
            expect(mohawk.price).toEqual(mixedGizmo.price);
            expect(mohawk.type).toEqual(mixedGizmo.type);
            expect(mohawk.tags).toEqual(mixedGizmo.tags);
            expect(mohawk.brothers()).toEqual(mixedGizmo.brothers());
        });
    });


});
