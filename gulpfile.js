// Node modules
var fs = require('fs'), 
        vm = require('vm'), 
        merge = require('deeply'), 
        chalk = require('chalk'), 
        es = require('event-stream');

// Gulp and plugins
var gulp = require('gulp'), 
        rjs = require('gulp-requirejs-bundler'), 
        concat = require('gulp-concat'), 
        clean = require('gulp-clean'),
        replace = require('gulp-replace'), 
        uglify = require('gulp-uglify'), 
        htmlreplace = require('gulp-html-replace'),
        jsdoc = require('gulp-jsdoc'),
        gulpCopy = require('gulp-copy');

// Config
var requireJsRuntimeConfig = vm.runInNewContext(fs.readFileSync('src/app/require.config.js') + '; require;'),
    requireJsOptimizerConfig = merge(requireJsRuntimeConfig, {
        out: 'quark.js',
        baseUrl: './src',
        include: [
            'core'
        ],
        exclude: [
            'jquery',
            'knockout',
            'knockout-mapping',
            'blockui',
            'accounting-js'
        ],
        "wrap": {
            "startFile": "src/wrap.start",
            "endFile": "src/wrap.end"
        },
        bundles: {
            // If you want parts of the site to load on demand, remove them from the 'include' list
            // above, and group them into bundles here.
            // 'bundle-name': [ 'some/module', 'another/module' ],
            // 'another-bundle-name': [ 'yet-another-module' ]
        }
    });
    
gulp.task('jsdoc', function() {
    return gulp.src("./src/*.js")
        .pipe(jsdoc('./dist/docs'));
});    

// Discovers all AMD dependencies, concatenates together all required .js files, minifies them
gulp.task('component', function () {
    return gulp.src('./src/quark-component.html')
        .pipe(gulp.dest('./dist/'));
});


// Discovers all AMD dependencies, concatenates together all required .js files, minifies them
gulp.task('js', function () {
    // r.js inserts this lines on build, we must delete them
    var target = 'require.config({\n  "bundles": {}\n});';
    var target2 = 'define("utils", function(){});';
    var target3 = 'define("knockout-extensions", function(){});';
    var target4 = 'define("knockout-validators", function(){});';
    
    return rjs(requireJsOptimizerConfig)
        /*.pipe(replace(target, ''))
        .pipe(replace(target2, ''))
        .pipe(replace(target3, ''))
        .pipe(replace(target4, ''))
        .pipe(uglify({ preserveComments: 'some' }))*/
        .pipe(gulp.dest('./dist/'));
});

// Discovers all AMD dependencies, concatenates together all required .js files, minifies them
gulp.task('js-debug', function () {
    // r.js inserts this lines on build, we must delete them
    var target = 'require.config({\n  "bundles": {}\n});';
    var target2 = 'define("utils", function(){});';
    var target3 = 'define("knockout-extensions", function(){});';
    var target4 = 'define("knockout-validators", function(){});';
    
    requireJsOptimizerConfig.out = "quark-debug.js";
    
    return rjs(requireJsOptimizerConfig)
        .pipe(replace(target, ''))
        .pipe(replace(target2, ''))
        .pipe(replace(target3, ''))
        .pipe(replace(target4, ''))
        .pipe(gulp.dest('./dist/'));
});

// Removes all files from ./dist/
gulp.task('clean', function() {
    return gulp.src('./dist/**/*', { read: false })
        .pipe(clean());
});

gulp.task('debug', ['js-debug'], function(callback) {
    callback();
    console.log('\nPlaced debug files in ' + chalk.blue('dist/\n'));
});

gulp.task('default', ['component', 'js'], function(callback) {
    callback();
    console.log('\nPlaced optimized files in ' + chalk.magenta('dist/\n'));
});
