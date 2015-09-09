define(['knockout', 'quark'], function(ko, $$) {
    describe('Miscelaneas', function() {
        describe('Pruebas de call', function() {
            var callback = function(param1, param2) {
                param1 = param1 || '';
                param2 = param2 || '';
                return param1 + ' ' + param2;
            }

            var undefinedCallback = undefined;

            it('Must call the specified callback passing the two parameters', function() {
                var result = $$.call(callback, 'Hola', 'Mundo');
                expect(result).toBe('Hola Mundo');
            });

            it('Must do nothing if the specified callback is undefined', function() {
                var result = $$.call(undefinedCallback, 'Hola', 'Mundo');
                expect(result).toBe(undefined);
            });

            it('Must do nothing if the specified callback is not a function', function() {
                var result = $$.call('NoMeLlame', 'Hola', 'Mundo');
                expect(result).toBe(undefined);
            });

            it('Must do nothing if the specified callback observable is not a function', function() {
                var result = $$.call(ko.observable('Prueba'), 'Hola', 'Mundo');
                expect(result).toBe(undefined);
            });

            it('Must be able to call a function inside an observable', function() {
                var result = $$.call(ko.observable(callback), 'Hola', 'Mundo');
                expect(result).toBe('Hola Mundo');
            });

            it('Must be able to call with less than defined params', function() {
                var result = $$.call(callback, 'Hola');
                expect(result).toBe('Hola ');
            });

            it('Must be able to call with no params', function() {
                var result = $$.call(callback);
                expect(result).toBe(' ');
            });

            it('Must throw error if callback is observable', function() {
                var fn = function() { $$.call(ko.observable(ko.observable('test')), 'Hola', 'Mundo'); }
                expect(fn).toThrow('Callback can not be an observable');
            });
        });

        describe('Pruebas de makeDate', function() {
            var date = new Date();

            it('Must return a valid date object when called with a valid string', function() {
                expect($$.makeDate('01/01/2014')).toEqual(new Date('01/01/2014'));
            });

            it('Must return undefined when called with an invalid string', function() {
                expect($$.makeDate('qweqwe')).toEqual(undefined);
            });

            it('Must return today when called with an invalid string and set useToday param', function() {
                var result = $$.makeDate('qweqwe', true);
                expect(date.getDay()).toEqual(result.getDay());
                expect(date.getMonth()).toEqual(result.getMonth());
                expect(date.getYear()).toEqual(result.getYear());
            });
        });
    });
});
