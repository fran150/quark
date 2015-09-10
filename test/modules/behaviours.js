define(['quark'], function($$) {
    describe('Core - Behaviours Tests', function() {
        var countMe = {
            id: 0
        }

        var dontCountMe = {
            someProperty: 'Test'
        }

        $$.behaviour('counter', function(object) {
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

        it('Must add the count behaviour to the valid object', function() {
            $$.behave(countMe, 'counter');
            countMe.increase();
            expect(countMe.id).toBe(1);
        });

        it('Must know that the object has the behaviour', function() {
            var hasIt = $$.hasBehaviour(countMe, 'counter');
            expect(hasIt).toBe(true);
        });

        it('Must not allow to add the behaviour', function() {
            var fn = function() { $$.behave(dontCountMe, 'counter'); }
            expect(fn).toThrow('To apply this behaviour to the object it must have an id property.');
        });

        it('Must havent got the behaviour', function() {
            var hasIt = $$.hasBehaviour(dontCountMe, 'counter');
            expect(hasIt).toBe(false);
        });
    });
});
