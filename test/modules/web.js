define(['quark', 'jquery', 'knockout'], function($$, $, ko) {
    describe('Web - UI Block Tests', function() {
        var body;
        var test;

        describe('Testing over an element', function() {
            beforeEach(function(done) {
                body = $(document).find('body');
                $('<div id=\'test\'></div>').appendTo(body);
                test = $(body).find('#test');
                $$.block('Loading...', test);
                setTimeout(function() {
                    done();
                }, 1000);
            });

            afterEach(function() {
                $(test).remove();
            });

            it('Must show a blocking message', function() {
                var blocked = $(test).find('.blockUI');
                expect(blocked.length).toBeGreaterThan(0);
            });

            it('Must unblock the element', function(done) {
                $$.unblock(test);
                setTimeout(function() {
                    var blocked = $(test).find('.blockUI');
                    expect(blocked.length).toBe(0);
                    done();
                }, 1000);
            });
        });

        describe('Testing over entire page', function() {
            beforeEach(function(done) {
                $$.block('Loading...');
                setTimeout(function() {
                    done();
                }, 1000);
            });

            it('Must show a blocking message on entire screen', function() {
                var blocked = $(document).find('.blockUI');
                expect(blocked.length).toBeGreaterThan(0);
            });

            it('Must unblock the entire screen', function(done) {
                $$.unblock();
                setTimeout(function() {
                    var blocked = $(document).find('.blockUI');
                    expect(blocked.length).toBe(0);
                    done();
                }, 1000);
            });
        });

    });

    describe('Web - Cookie Management', function() {
        it ('Must add the cookie for 60 seconds', function() {
            expect(function() { $$.setCookie('test', 'someValue', 60) }).not.toThrow();
        });

        it ('Must get the cookie', function() {
            expect($$.getCookie('test')).toBe('someValue');
        });

        it ('Must clear the cookie', function() {
            expect($$.clearCookie('test'));
            expect($$.getCookie('test')).toBe('');
        });

        it ('The cookie must expire in 2 seconds', function(done) {
            expect(function() { $$.setCookie('exp', 'someValue', 2) }).not.toThrow();
            setTimeout(function() {
                expect($$.getCookie('exp')).toBe('someValue');
            }, 1000);
            setTimeout(function() {
                expect($$.getCookie('exp')).toBe('');
                done();
            }, 2000);
        });
    });

    describe('Web - HTML Text Management', function() {
        var text = '<>&';
        var coded = $$.htmlEncode(text);
        var decoded = $$.htmlDecode(coded);
        it ('Must encode the simbols correctly', function() {
            expect(coded).toBe('&lt;&gt;&amp;');
        });

        it ('Must decode the simbols correctly', function() {
            expect(decoded).toBe(text);
        });

        var long = '01234567890123456789';
        var short = '01234';
        var exact = '0123456789';
        var exactPlus1 = '01234567890';
        var exactLess1 = '012345678';

        it ('Must cut long string to 10 chars and add dots', function() {
            expect($$.limitText(long, 10)).toBe('0123456...');
        });

        it ('Must not cut short string', function() {
            expect($$.limitText(short, 10)).toBe(short);
        });

        it ('Must not cut exact string', function() {
            expect($$.limitText(exact, 10)).toBe(exact);
        });

        it ('Must not cut exact minus 1 char string', function() {
            expect($$.limitText(exactLess1, 10)).toBe(exactLess1);
        });

        it ('Must cut exact plus 1 char string and add dots', function() {
            expect($$.limitText(exactPlus1, 10)).toBe('0123456...');
        });

    });

    function ViewModel() {
        var self = this;

        this.name = ko.observable('Prueba');
    }

    var page;
    var body;
    var test;

    describe('Web - Rebind', function() {
        beforeEach(function() {
            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');

            ko.applyBindings({}, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
        });

        it ('Replace and Bind test', function() {
            $$.replaceAndBind(test, '<input type=\"text\" id=\"binded\" data-bind=\"value: name\" />', new ViewModel());
            var value = $('#binded').val();
            expect(value).toBe('Prueba');
        });
    });

});
