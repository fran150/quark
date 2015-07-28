!function(e,n){"function"==typeof define&&define.amd?define(["knockout","jquery","knockout-mapping","accounting-js","blockui"],n):(e.komapping=ko.mapping,e.$$=n(e.ko,e.$,e.komapping,e.accounting))}(this,function(e,n,t,i){function a(){var i=this;this.clientErrorHandlers={},this.serverErrorHandlers={},this.isDefined=function(e){return"undefined"==typeof e?!1:!0},this.redirect=function(e){return window.location.href=e,!0},this.clone=function(e){return jQuery.extend(!0,{},e)},this.cloneObservable=function(e){return t.fromJS(t.toJS(e))},this.replaceAndBind=function(n,t,i){n.html(t),e.cleanNode(n.get(0)),e.applyBindings(i,n.get(0))},this.block=function(e,t){t||(t="Procesando...");var i={message:t,css:{border:"none",padding:"5px",backgroundColor:"#000","-webkit-border-radius":"5px","-moz-border-radius":"5px",opacity:.7,color:"#fff"},baseZ:5e3};e?n(e).block(i):n.blockUI(i)},this.unblock=function(e){e?n(e).unblock():n.unblockUI()},this.getParam=function(e){var n=void 0,t=[];return location.search.substr(1).split("&").forEach(function(i){t=i.split("="),t[0]===e&&(n=decodeURIComponent(t[1]))}),n},this.isString=function(e){return"string"==typeof e||e instanceof String?!0:!1},this.isInt=function(e){return Number(e)===e&&e%1===0},this.isNumeric=function(e){return e===Number(e)&&e%1!==0},this.isArray=function(e){return n.isArray(e)},this.isObject=function(e){return null!==e&&"object"==typeof e?!0:!1},this.isFunction=function(e){return null!==e&&"function"==typeof e?!0:!1},this.setCookie=function(e,n,t){var i=new Date;if(void 0!==t){i.setTime(i.getTime()+1e3*t);var a="expires="+i.toUTCString();document.cookie=e+"="+n+"; "+a}else document.cookie=e+"="+n+"; "},this.getCookie=function(e){for(var n=e+"=",t=document.cookie.split(";"),i=0;i<t.length;i++){for(var a=t[i];" "===a.charAt(0);)a=a.substring(1);if(0===a.indexOf(n))return a.substring(n.length,a.length)}return""},this.ajax=function(e,t,a,r,o,s,d,l){var u="",c="Guardando...";i.isDefined(t)&&null!==t&&(i.isObject(t)?(i.isDefined(t.target)&&(u=t.target),i.isDefined(t.message)&&(c=t.message)):c=t,i.block(u,c));var f={};r&&(f={access_token:i.getCookie("token")}),n.ajax({url:e,type:o,cache:!1,data:s,async:a,success:d,headers:f,error:function(n,a,r){var o=!1;if(i.isDefined(t)&&null!==t&&i.unblock(u),i.isDefined(l)&&(o=l()),!o)if(n.status>=500&&n.status<600){for(handlerName in i.serverErrorHandlers)if(i.serverErrorHandlers[handlerName](e,JSON.parse(n.responseText))){o=!0;break}}else for(handlerName in i.clientErrorHandlers)if(i.clientErrorHandlers[handlerName](e,n,a,r)){o=!0;break}}})},this.htmlEncode=function(e){return e?jQuery("<div />").text(e).html():""},this.htmlDecode=function(e){return e?n("<div />").html(e).text():""},this.limitText=function(e,n){return i.isInt(n)?6>n&&(n=6):n=6,i.isString(e)?(e.length>n&&(e=e.substr(0,n-3)+"..."),e):""},this.components=function(e,n,t){n.childs={};for(var a in e)n.childs[a]={},n.childs[a].load=function(a,r){n[a](r),n.childs[a].loaded=!0,i.isDefined(r.childs)?(n.childs[a].ready=!1,r.parent=n,r.parentState=n.childs[a]):(n.childs[a].ready=!0,i.isDefined(r.ready)&&r.ready());for(var o in e)if(!n.childs[o].loaded)return;for(var o in e)if(!n.childs[o].ready)return;i.isDefined(t)&&t(),i.isFunction(n.ready)&&n.ready(),i.isDefined(n.parent)&&(n.parentState.ready=!0,n.parent.childReady())},n.childs[a].loaded=!1,n.childReady=function(){for(var a in e)if(!n.childs[a].ready)return;i.isDefined(t)&&t(),i.isFunction(n.ready)&&n.ready(),i.isDefined(n.parent)&&(n.parentState.ready=!0,n.parent.childReady())},n[a]=e[a]},this.parameters=function(n,t,a){for(var r in n)a[r]=n[r],i.isDefined(t[r])&&(e.isObservable(a[r])&&e.isObservable(t[r])?a[r]=t[r]:e.isObservable(a[r])&&!e.isObservable(t[r])?a[r](t[r]):!e.isObservable(a[r])&&e.isObservable(t[r])?a[r]=t[r]():e.isObservable(a[r])||e.isObservable(t[r])||(a[r]=t[r]))},this.inject=function(n,t){for(var a in n)if(i.isDefined(t[a])){var r;r=e.isObservable(n[a])?n[a]():n[a],e.isObservable(t[a])?t[a](r):t[a]=r}},this.call=function(e){if(i.isDefined(e)){var n=Array.prototype.slice.call(arguments,1);return e.apply(n)}return!0}}function r(e,t,i,a,r){var o=t(),d=!1;if(s.isArray(o))for(var l=0;l<o.length;l++)o[l].hasError()||(d=!0);else d=o.hasError();d?n(e).addClass("has-error"):n(e).removeClass("has-error")}function o(e){var n=function(){return{nodes:e.$componentTemplateNodes}};return n}a.prototype.dispose=function(){};var s=new a;return e.mapping=t,e.validators={},e.validate=function(n,t){var i=!0;for(var a in n){var r=n[a];e.isObservable(r)&&r.validatable&&(r.validate(t)||(i=!1))}return i},e.validationReset=function(n){for(var t in n){var i=n[t];e.isObservable(i)&&i.validatable&&i.validationReset()}},e.observable.fn.validation=function(n,t,i){return this.validatable=n,this.validationConfig={},this.validationConfig=t,this.hasError=e.observable(),this.validationMessage=e.observable(),i&&(this.parent=i,i.validationSummary||(i.validationSummary=e.observableArray())),this},e.observable.fn.validationReset=function(){var e=this;this.validatable&&(this.hasError(!1),this.validationMessage(""),this.parent&&this.parent.validationSummary.remove(function(n){return n.name===e.validatable}))},e.observable.fn.validateValue=function(n){this.validationReset();for(var t in this.validationConfig){var i=this.validationConfig[t];if(e.validators[t]){var a=e.validators[t](this,i);if(!a.validate(n))return this.parent&&this.parent.validationSummary.push({name:this.validatable,message:this.validationMessage()}),!1}}return!0},e.observable.fn.validate=function(e){return e&&!this.subscription&&(this.subscription=this.subscribe(this.validateValue,this)),this.validateValue(this())},e.isObservableArray=function(n){return e.isObservable(n)&&void 0!==n.indexOf?!0:!1},e.getJson=function(n){var i=t.toJS(n);for(var a in i)null===i[a]||void 0===i[a]?delete i[a]:"object"==typeof i[a]&&e.getJson(i[a]);var r=t.toJSON(i);return r=r.replace(/\/Date\(\d+\)/g,function(e){return"\\"+e+"\\"})},e.bindingHandlers.onBind={init:function(n,t,i,a,r){var o=e.unwrap(t());o(n,a,r)}},e.bindingHandlers.formGroupError={init:function(e,n,t,i,a){r(e,n,t,i,a)},update:function(e,n,t,i,a){r(e,n,t,i,a)}},e.bindingHandlers.rowSelect={update:function(n,t,i,a,r){var o=e.unwrap(t()),s=function(){return{success:o.isSelected(a)}};e.bindingHandlers.css.update(n,s,i,a,r);var d=function(){return o.select};e.bindingHandlers.click.init(n,d,i,a,r)}},e.bindingHandlers.numericValue={init:function(n,t){var a=t(),r=e.pureComputed({read:function(){return s.isDefined(a())?i.formatNumber(a(),2,".",","):void 0},write:function(e){var n=a(),t=i.unformat(e,",");isNaN(t)&&(t=e),t!==n?a(i.toFixed(t,2)):e!==n.toString()&&a.valueHasMutated()}});e.applyBindingsToNode(n,{value:r})}},e.bindingHandlers.moneyValue={init:function(n,t){var a=t(),r=e.pureComputed({read:function(){return i.formatMoney(a(),"$ ",2,".",",")},write:function(e){var n=a(),t=i.unformat(e,",");isNaN(t)&&(t=e),t!==n?a(i.toFixed(t,2)):e!==n.toString()&&a.valueHasMutated()}});e.applyBindingsToNode(n,{value:r})}},e.bindingHandlers.vm={init:function(n,t,i,a,r){var o;o=e.unwrap(t());var d;if(s.isString(o)?d=o:s.isObject(o)&&(s.isString(o.property)&&(d=o.property),s.isDefined(o.model)&&(a=o.model)),!s.isString(d))throw"El valor del binding vm debe ser un string con el nombre de la propiedad del objeto donde se debe cargar el viewmodel del componente anidado";if(!s.isDefined(a.childs))throw"El objeto especificado no tiene la propiedad childs. Esto probablemente se deba a que no uso la funcion .components de quark para definir las propiedades en donde el binding vm debe asignar el viewmodel";if(!s.isDefined(a.childs[d]))throw"El objeto especificado no tiene una propiedad de nombre "+o+". Verifique que el objeto contenga una propiedad definida con el metodo .components a la que apunta este binding vm.";a.childs[d].load(d,r.$child)}},e.virtualElements.allowedBindings.vm=!0,e.bindingHandlers.call={init:function(n,t,i,a,r){var o=e.unwrap(t());o()}},e.virtualElements.allowedBindings.call=!0,e.bindingHandlers.inject={init:function(n,t,i,a,r){var o=e.unwrap(t()),d=r.$child,l=a;s.isObject(o)&&s.isDefined(o.data)&&s.isDefined(o.target)&&(d=o.target,l=o.data),s.inject(l,d)}},e.virtualElements.allowedBindings.inject=!0,e.bindingProvider.instance.preprocessNode=function(e){var n=function(n){var t=e.nodeValue.match(n);if(t){var i=document.createComment("ko "+t[1]),a=document.createComment("/ko");return e.parentNode.insertBefore(i,e),e.parentNode.replaceChild(a,e),[i,a]}return!1};if(8===e.nodeType){var t;return t=n(/^\s*(vm\s*:[\s\S]+)/),t=t?t:n(/^\s*(call\s*:[\s\S]+)/),t=t?t:n(/^\s*(inject\s*:[\s\S]+)/)}},e.bindingHandlers.componentShadyDom={init:function(n,t,i,a,r){var s=o(r);return e.bindingHandlers.template.init(n,s,i,r.$parent,r.$parentContext)},update:function(n,t,i,a,r){var s=o(r);return e.bindingHandlers.template.update(n,s,i,r.$parent,r.$parentContext)}},e.virtualElements.allowedBindings.componentShadyDom=!0,e.bindingHandlers.modelExporter={init:function(n,t,i,a,r){var o=function(){for(var e=Array(),n=0;n<r.$parentContext.$componentTemplateNodes.length;n++){var t=r.$parentContext.$componentTemplateNodes[n];if(8===t.nodeType){var i=t.nodeValue.indexOf("vm:")>-1;i&&e.push(t),i=t.nodeValue.indexOf("call:")>-1,i&&e.push(t),i=t.nodeValue.indexOf("inject:")>-1,i&&e.push(t)}}return{nodes:e,"if":e.length>0}},s=r.$parentContext.$parentContext.extend({$child:r.$parent});return e.bindingHandlers.template.init(n,o,i,r.$parent,s)},update:function(n,t,i,a,r){var o=function(){for(var e=Array(),n=0;n<r.$parentContext.$componentTemplateNodes.length;n++){var t=r.$parentContext.$componentTemplateNodes[n];if(8===t.nodeType){var i=t.nodeValue.indexOf("vm:")>-1;i&&e.push(t),i=t.nodeValue.indexOf("call:")>-1,i&&e.push(t),i=t.nodeValue.indexOf("inject:")>-1,i&&e.push(t)}}return{nodes:e,"if":e.length>0}},s=r.$parentContext.$parentContext.extend({$child:r.$parent});return e.bindingHandlers.template.update(n,o,i,r.$parent,s)}},e.virtualElements.allowedBindings.modelExporter=!0,e.bindingHandlers.content={init:function(t,i,a,r,o){var d=e.unwrap(i()),l=function(){return s.isInt(d)?{nodes:o.$componentTemplateNodes.slice(d)}:{nodes:n(o.$componentTemplateNodes).filter(d)}};return e.bindingHandlers.template.init(t,l,a,o.$parent,o.$parentContext)},update:function(t,i,a,r,o){var d=e.unwrap(i()),l=function(){return s.isInt(d)?{nodes:o.$componentTemplateNodes.slice(d)}:{nodes:n(o.$componentTemplateNodes).filter(d)}};return e.bindingHandlers.template.update(t,l,a,o.$parent,o.$parentContext)}},e.virtualElements.allowedBindings.content=!0,e.bindingHandlers.hasContent={init:function(t,i,a,r,o){var s=e.unwrap(i()),d=function(){return n(o.$componentTemplateNodes).filter(s).length>0};return e.bindingHandlers["if"].init(t,d,a,o,o)}},e.virtualElements.allowedBindings.hasContent=!0,e.bindingHandlers.hasNotContent={init:function(t,i,a,r,o){var s=e.unwrap(i()),d=function(){return n(o.$componentTemplateNodes).filter(s).length>0};return e.bindingHandlers.ifnot.init(t,d,a,o,o)}},e.virtualElements.allowedBindings.hasNotContent=!0,e.validators.required=function(e,n){return this.validate=function(t){return e.validationReset(),t?!0:(e.hasError(!0),e.validationMessage((n.message||"El campo {0} es obligatorio").replace("{0}",e.validatable)),!1)},this},e.validators.length=function(e,n){return this.validate=function(t){e.validationReset();var i=0;return t&&(i=t.length),n.min&&i<n.min?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe tener al menos {1} caracteres").replace("{0}",e.validatable).replace("{1}",n.min).replace("{2}",n.max)),!1):n.max&&i>n.max?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe tener como maximo {2} caracteres").replace("{0}",e.validatable).replace("{1}",n.min).replace("{2}",n.max)),!1):!0},this},e.validators.numero=function(e,n){return this.validate=function(t){return e.validationReset(),""!==t&&isNaN(t)?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe ser un numero valido").replace("{0}",e.validatable)),!1):!0},this},e.validators.entero=function(e,n){return this.validate=function(t){return e.validationReset(),""!==t&&s.isInt(t)?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe ser un numero entero valido").replace("{0}",e.validatable)),!1):!0},this},e.validators.fecha=function(e,n){return this.validate=function(t){e.validationReset();var i=/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;return""===t||i.test(t)?!0:(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe ser una fecha valida").replace("{0}",e.validatable)),!1)},this},"function"==typeof define&&define.amd&&define("knockout",function(){return e}),s});