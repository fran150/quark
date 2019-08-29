import ko from 'knockout';
import './ko-extensions';
import './ko-preprocessors';
import './content-bindings';
import './import-export';
import './quark-component';

import AssociativeObservable from './associative-observable';
import canBe from './can-be';
import componentFunction from './component-function';
import cookies from './cookies';
import errorSignal from './errors';
import is from './is';
import Lock from './lock';
import parametersFunction from './parameters-function';
import routing from './routing';
import serviceContext from './service-context';
import Tracker from './tracker';
import url from './url';
import utils from './utils';

window.ko = ko;

// Registers empty as a default empty component
ko.components.register('empty', {
  template: ' ',
});

/**
 * Quark
 */
function Quark() {
  let started = false;

  this.AssociativeObservable = AssociativeObservable;

  this.canBe = canBe;
  this.component = componentFunction;
  this.cookies = cookies;
  this.errorSignal = errorSignal;
  this.is = is;
  this.Lock = Lock;
  this.parameters = parametersFunction;
  this.routing = routing;
  this.serviceContext = serviceContext;
  this.url = url;
  this.utils = utils;

  this.Tracker = Tracker;

  this.start = function(model) {
    if (!started) {
      ko.applyBindings(model);
      started = true;
    }
  };

  this.isStarted = function() {
    return started;
  };
};

export default new Quark();
