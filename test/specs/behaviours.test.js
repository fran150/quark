define(['quark'], function($$) {
    describe('Core - Behaviours Tests', function() {
        var countMe = {
            id: 0
        }

        var dontCountMe = {
            someProperty: 'Test'
        }

        $$.behaviour.define('counter', function(object) {
            if (!$$.isDefined(object.id)) {
                throw 'To apply this behaviour to the object it must have an id property.';
            }

            object.increase = function() {
                object.id++;
            }

            object.decrease = function() {
                object.id--;
            }
        });

        $$.behaviour.apply('counter', countMe);

        it('Must add the count behaviour to the valid object', function() {
            countMe.increase();
            expect(countMe.id).toBe(1);
        });

        it('Must know that the object has the behaviour', function() {
            var hasIt = $$.behaviour.has('counter', countMe);
            expect(hasIt).toBe(true);
        });

        it('Must havent got the behaviour', function() {
            var hasIt = $$.behaviour.has('counter', dontCountMe);
            expect(hasIt).toBe(false);
        });
    });
});
