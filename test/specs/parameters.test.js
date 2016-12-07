define(['quark', 'quark-testviewloader'], function($$, Loader) {
    var loader = new Loader();

    beforeAll(function(done) {
        $$.registerComponent('parameters-tester', 'components/parameters/tester.component');
        $$.registerComponent('parameters-tester-page', 'components/parameters/tester.page');

        loader.load('parameters', function() {
            done();
        });
    })

    afterAll(function() {
        loader.reset();
    });

    describe('Parameters', function() {
        it ('Observable param is shared between parent and child', function() {
            var page = loader.models.page;
            expect(page.pageObservable == page.child.observable).toBe(true);
        });

        it ('Not observable param gets the correct value', function() {
            var page = loader.models.page;
            expect(page.child.notObservable == 'Page').toBe(true);
        });

        it ('Not received param has the default value', function() {
            var page = loader.models.page;
            expect(page.child.notReceived() == 'Model').toBe(true);
        });
    });

});
