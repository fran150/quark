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
        rename = require('gulp-rename'),
        clean = require('gulp-clean'),
        replace = require('gulp-replace'),
        uglify = require('gulp-uglify'),
        htmlreplace = require('gulp-html-replace'),
        gulpCopy = require('gulp-copy');

// Copies the component object
gulp.task('component', function () {
    return gulp.src('./src/quark-component.html')
        .pipe(gulp.dest('./dist/'));
});

// Copies the default validators
gulp.task('validators', function () {
    return gulp.src('./src/validators/validators.js')
        .pipe(rename('quark-validators.js'))
        .pipe(gulp.dest('./dist/'));
});

// Copies the require configurator
gulp.task('require.configurator', function () {
    return gulp.src('./src/require.configurator.js')
        .pipe(gulp.dest('./dist/'));
});

// Copies the require configuration
gulp.task('require.conf', function () {
    return gulp.src('./src/quark.require.conf.js')
        .pipe(gulp.dest('./dist/'));
});

// Concatenates together all required .js files, minifies them generating the normal lib and minified lib
gulp.task('js', function () {
    return gulp.src([
        './src/wrap.start',
        './src/init.js',
        './src/libs/utils.js',
        './src/libs/knockout-extensions.js',
        './src/libs/knockout-bindings.js',
        './src/libs/signals.js',
        './src/libs/locks.js',
        './src/libs/web.js',
        './src/libs/ajax.js',
        './src/errors.js',
        './src/core.js',
        './src/behaviours.js',
        './src/quark-component.js',
        './src/import-export.js',
        './src/content-bindings.js',
        './src/page-bindings.js',
        './src/routing.js',
        './src/default-locationFinder.js',
        './src/namespaces.js',
        './src/ko-preprocessors.js',
        './src/libs/validation.js',
        './src/wrap.end'
        ])
        .pipe(concat('quark.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(rename('quark.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'))
});

// Removes all files from ./dist/
gulp.task('clean', function() {
    return gulp.src('./dist/**/*', { read: false })
        .pipe(clean());
});

gulp.task('default', ['clean', 'js', 'component', 'validators', 'require.configurator', 'require.conf'], function(callback) {
    callback();
    console.log('\nPlaced optimized files in ' + chalk.magenta('dist/\n'));
});
