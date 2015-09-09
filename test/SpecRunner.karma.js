var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    //if (/test\/modules\/.*\.js$/.test(file)) {
    if (/test\/modules\/web.js$/.test(file)) {
    //if (/test\/modules\/utils-misc.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
    baseUrl: '/base/',
    deps: tests,
    callback: window.__karma__.start
});
