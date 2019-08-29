/**
 * The service context allows to share, if required, the same service between
 * components as a singleton as a way to share data if required.
 */
function ServiceContext() {
  const services = {};

  /**
   * Gets the service with the specified name and class from the service
   * context. If the service is not in the context it creates a new one
   * so other components can use it.
   * @param {string} name Name of the service
   * @param {any} ServiceClass Class of the service to get
   * @return {any} Requested service
   */
  this.get = function(name, ServiceClass) {
    if (services[name]) {
      return services[name];
    } else {
      const service = new ServiceClass(self);
      services[name] = service;
      return service;
    }
  };
}

/**
 * Extracts the service context from the object passed to the component
 * if the a context was not passed to the component it creates a new one
 * @param {any} params Parameters received by the component
 * @return {ServiceContext} If the user passed a service context via parameters
 * to the context returns the received context, if not it creates and return a
 * new one.
 */
export default function(params) {
  if (params && params.context && params.context instanceof ServiceContext) {
    return params.context;
  } else {
    return new ServiceContext();
  }
}
