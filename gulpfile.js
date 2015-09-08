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
        jsdoc = require('gulp-jsdoc'),
        gulpCopy = require('gulp-copy');

// Copies the component object
gulp.task('component', function () {
    return gulp.src('./src/quark-component.html')
        .pipe(gulp.dest('./dist/'));
});

// Copies the default validators
gulp.task('validators', function () {
    return gulp.src('./src/validators/validators.js')
        .pipe(rename('quark.validators.js'))
        .pipe(gulp.dest('./dist/'));
});

// Concatenates together all required .js files, minifies them generating the normal lib and minified lib
gulp.task('js', function () {
    return gulp.src([
        './src/wrap.start',
        './src/init.js',
        './src/libs/utils.js',
        './src/core.js',
        './src/core-ko.js',
        './src/libs/web.js',
        './src/libs/ajax.js',
        './src/libs/knockout-extensions.js',
        './src/libs/knockout-bindings.js',
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

gulp.task('default', ['clean', 'js', 'component', 'validators'], function(callback) {
    callback();
    console.log('\nPlaced optimized files in ' + chalk.magenta('dist/\n'));
});
