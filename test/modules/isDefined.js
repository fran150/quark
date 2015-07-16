define(['../../dist/quark.js'], function($$) {
  describe('Pruebas de isDefined', function() {
    var definido = 'Hola'
    var noDefinido;
    var vacio = '';
    var nulo = null;

    it('Devuelve verdadero para un elemento definido', function() {
        expect($$.isDefined(definido)).toEqual(true);
    });
    
    it('Devuelve falso para un elemento no definido', function() {
        expect($$.isDefined(noDefinido)).toEqual(false);    
    });

    it('String vacio es definido', function() {
        expect($$.isDefined(vacio)).toEqual(true);    
    });
    
    it('Null es definido', function() {
        expect($$.isDefined(nulo)).toEqual(true);    
    });    
  });

});
