define(['quark'], function($$) {
    describe('Core - Behaviours Tests', function() {
        $$.routing.config
            .on('/test/', 'test')
                .when({
                    top: 'TopController'
                })
                .when('/prueba1/{param1}/{param2}', 'one', {
                    test: 'Controller1'
                })
                .when('/prueba2/{param3}', 'two', {
                    holder1: 'Controller2',
                    holder2: 'Controller3'
                });

        it ('Must Parse Route correctly and combine with \"any\" controllers', function() {
            $$.routing.route.parse('/prueba1/Hola/Mundo');
            var route = $$.routing.route.current();

            expect(route.file).toBe('/test/');
            expect($$.isDefined(route.components)).toBe(true);
            expect($$.isDefined(route.components.top)).toBe(true);
            expect($$.isDefined(route.components.test)).toBe(true);
            expect(route.params.param1).toBe('Hola');
            expect(route.params.param2).toBe('Mundo');
            expect(route.url).toBe('/prueba1/{param1}/{param2}');
        });

        it ('Must Parse Route 2 correctly and combine with \"any\" controllers', function() {
            $$.routing.route.parse('/prueba2/Hola/');
            var route = $$.routing.route.current();

            expect(route.file).toBe('/test/');
            expect($$.isDefined(route.components)).toBe(true);
            expect($$.isDefined(route.components.top)).toBe(true);
            expect($$.isDefined(route.components.holder1)).toBe(true);
            expect($$.isDefined(route.components.holder2)).toBe(true);
            expect(route.url).toBe('/prueba2/{param3}');
        });

        it ('Must Get Route 1', function() {
            expect($$.routing.route.get('test/one').name).toBe('test/one');
        });
    });

});
