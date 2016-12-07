define(['quark'], function($$) {
    describe('Utils - \'Is\' Functions Test', function() {
        describe('isDefined', function() {
            it('Must return false on undefined', function() {
                expect($$.isDefined(undefined)).toBe(false);
            });

            it('Must return true on null', function() {
                expect($$.isDefined(null)).toBe(true);
            });

            it('Must return true on 0', function() {
                expect($$.isDefined(0)).toBe(true);
            });

            it('Must return true on empty', function() {
                expect($$.isString('')).toBe(true);
            });

            it('Must return true on valid string', function() {
                expect($$.isString('Valido')).toBe(true);
            });
        });

        describe('isString', function() {
            it('Must return false on undefined', function() {
                expect($$.isString(undefined)).toBe(false);
            });

            it('Must return false on numbers', function() {
                expect($$.isString(123)).toBe(false);
                expect($$.isString(123.23)).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isString(null)).toBe(false);
            });

            it('Must return false on object', function() {
                expect($$.isString({ hola: 'mundo' })).toBe(false);
            });

            it('Must return true on empty', function() {
                expect($$.isString('')).toBe(true);
            });

            it('Must return true on valid string', function() {
                expect($$.isString('Valido')).toBe(true);
            });
        });

        describe('isInt', function() {
            it('Must return false on undefined', function() {
                expect($$.isInt(undefined)).toBe(false);
            });

            it('Must return false on decimals', function() {
                expect($$.isInt(123.23)).toBe(false);
            });

            it('Must return true with decimals in 0', function() {
                expect($$.isInt(123.00)).toBe(true);
            });

            it('Must return false on null', function() {
                expect($$.isInt(null)).toBe(false);
            });

            it('Must return false on integer string', function() {
                expect($$.isInt('123')).toBe(false);
            });

            it('Must return true on integer', function() {
                expect($$.isInt(123)).toBe(true);
            });
        });

        describe('isNumeric', function() {
            it('Must return false on undefined', function() {
                expect($$.isNumeric(undefined)).toBe(false);
            });

            it('Must return true on decimals', function() {
                expect($$.isNumeric(123.23)).toBe(true);
            });

            it('Must return true with integers', function() {
                expect($$.isNumeric(123)).toBe(true);
            });

            it('Must return true with 0 decimals', function() {
                expect($$.isNumeric(123.000)).toBe(true);
            });

            it('Must return false on null', function() {
                expect($$.isNumeric(null)).toBe(false);
            });

            it('Must return false on integer string', function() {
                expect($$.isNumeric('123')).toBe(false);
            });

            it('Must return false on decimal string', function() {
                expect($$.isNumeric('123.12')).toBe(false);
            });

            it('Must return true on decimals', function() {
                expect($$.isNumeric(1234.02)).toBe(true);
            });
        });

        describe('isDecimal', function() {
            it('Must return false on undefined', function() {
                expect($$.isDecimal(undefined)).toBe(false);
            });

            it('Must return true on decimals', function() {
                expect($$.isDecimal(123.23)).toBe(true);
            });

            it('Must return false with integers', function() {
                expect($$.isDecimal(123)).toBe(false);
            });

            it('Must return false with 0 decimals', function() {
                expect($$.isDecimal(123.000)).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isDecimal(null)).toBe(false);
            });

            it('Must return false on integer string', function() {
                expect($$.isDecimal('123')).toBe(false);
            });

            it('Must return false on decimal string', function() {
                expect($$.isDecimal('123.12')).toBe(false);
            });

            it('Must return true on decimals', function() {
                expect($$.isDecimal(1234.02)).toBe(true);
            });
        });

        describe('isArray', function() {
            it('Must return false on undefined', function() {
                expect($$.isArray(undefined)).toBe(false);
            });

            it('Must return false on numbers', function() {
                expect($$.isArray(123.23)).toBe(false);
            });

            it('Must return false with strings', function() {
                expect($$.isArray('hola')).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isArray(null)).toBe(false);
            });

            it('Must return false on object', function() {
                expect($$.isArray({ pepe: 'hola' })).toBe(false);
            });

            it('Must return true on empty array', function() {
                expect($$.isArray([])).toBe(true);
            });

            it('Must return true on valid array', function() {
                expect($$.isArray(['gizmo', 'caca'])).toBe(true);
            });
        });

        describe('isObject', function() {
            it('Must return false on undefined', function() {
                expect($$.isObject(undefined)).toBe(false);
            });

            it('Must return false on numbers', function() {
                expect($$.isObject(123.23)).toBe(false);
            });

            it('Must return false with strings', function() {
                expect($$.isObject('hola')).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isObject(null)).toBe(false);
            });

            it('Must return true on object', function() {
                expect($$.isObject({ pepe: 'hola' })).toBe(true);
            });

            it('Must return true on empty object', function() {
                expect($$.isObject({})).toBe(true);
            });

            it('Must return false on empty array', function() {
                expect($$.isObject([])).toBe(false);
            });

            it('Must return false on valid array', function() {
                expect($$.isObject(['gizmo', 'caca'])).toBe(false);
            });

            it('Must return false on function', function() {
                expect($$.isObject(function() { })).toBe(false);
            });
        });

        describe('isFunction', function() {
            var testClass = function() {
                this.gizmo = 'caca';
            }

            var obj = new testClass();

            it('Must return false on undefined', function() {
                expect($$.isFunction(undefined)).toBe(false);
            });

            it('Must return false on numbers', function() {
                expect($$.isFunction(123.23)).toBe(false);
            });

            it('Must return false with strings', function() {
                expect($$.isFunction('hola')).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isFunction(null)).toBe(false);
            });

            it('Must return false on inline object', function() {
                expect($$.isFunction({ pepe: 'hola' })).toBe(false);
            });

            it('Must return false on constructed object', function() {
                expect($$.isFunction(obj)).toBe(false);
            });


            it('Must return true on constructor', function() {
                expect($$.isFunction(testClass)).toBe(true);
            });

            it('Must return false on empty array', function() {
                expect($$.isFunction([])).toBe(false);
            });

            it('Must return false on valid array', function() {
                expect($$.isFunction(['gizmo', 'caca'])).toBe(false);
            });

            it('Must return true on function', function() {
                expect($$.isFunction(function() { })).toBe(true);
            });
        });

        describe('isDate', function() {
            it('Must return false on undefined', function() {
                expect($$.isDate(undefined)).toBe(false);
            });

            it('Must return false on numbers', function() {
                expect($$.isDate(123.23)).toBe(false);
            });

            it('Must return false with string dates', function() {
                expect($$.isDate('11/05/2015')).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isDate(null)).toBe(false);
            });

            it('Must return true on valid date', function() {
                expect($$.isDate(new Date())).toBe(true);
            });

            it('Must return true on invalid date', function() {
                expect($$.isDate(new Date('99/99/9999'))).toBe(true);
            });
        });

        describe('isValidDate', function() {
            it('Must return false on undefined', function() {
                expect($$.isValidDate(undefined)).toBe(false);
            });

            it('Must return false on numbers', function() {
                expect($$.isValidDate(123.23)).toBe(false);
            });

            it('Must return false with string dates', function() {
                expect($$.isValidDate('11/05/2015')).toBe(false);
            });

            it('Must return false on null', function() {
                expect($$.isValidDate(null)).toBe(false);
            });

            it('Must return true on valid date', function() {
                expect($$.isValidDate(new Date())).toBe(true);
            });

            it('Must return false on invalid date', function() {
                var date = new Date('99/99/9999');
                expect($$.isValidDate(date)).toEqual(false);
            });
        });
    });
});
