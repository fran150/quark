// Node modules
var fs = require('fs'),
        vm = require('vm'),
        merge = require('deeply'),
        chalk = require('chalk'),
        es = require('event-stream');

// Gulp and plugins
var gulp = require('gulp'),
        rjs = require('gulp-requirejs-bundler-quark'),
        concat = require('gulp-concat'),
        rename = require('gulp-rename'),
        clean = require('gulp-clean'),
        replace = require('gulp-replace'),
        uglify = require('gulp-uglify'),
        htmlreplace = require('gulp-html-replace'),
        gulpCopy = require('gulp-copy');

// Removes all files from ./dist/
gulp.task('clean', function() {
    return gulp.src('./dist/**/*', { read: false })
        .pipe(clean());
});

// Waits for clean concatenates together all required .js files, minifies them generating the
// normal quark.js and minified quark.min.js
gulp.task('js', ['clean'], function () {
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
        './src/tracker.js',
        './src/import-export.js',
        './src/content-bindings.js',
        './src/page-bindings.js',
        './src/controller-provider.js',
        './src/routing.js',
        './src/default-locationFinder.js',
        './src/default-urlGenerator.js',
        './src/namespaces.js',
        './src/ko-preprocessors.js',
        './src/libs/validation.js',
        './src/services.js',
        './src/wrap.end'
        ])
        .pipe(concat('quark.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(rename('quark.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'))
});

// Waits for clean and moves support files to dist folder
gulp.task('libs', ['clean'], function () {
    return gulp.src([
            './src/quark-component.html',
            './src/require.configurator.js',
            './src/quark.require.conf.js',
            './src/testing.helper.js'
        ])
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['clean', 'js', 'libs'], function(callback) {
    callback();
    console.log('\nPlaced optimized files in ' + chalk.magenta('dist/\n'));
});
