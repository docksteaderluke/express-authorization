// gulp.js
// author: Luke Docksteader
// created: 2015-06-26
// description: Gulp configuration file
'use strict'

var gulp = require('gulp')
  , eslint = require('gulp-eslint')
  , plumber = require('gulp-plumber')

gulp.task('lint', function () {
    // Note: To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
//     return gulp.src(['./**/*.js'])
    var lintJs = gulp
      .src([ 'lib/*.js' ])
      .pipe(plumber())
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failOnError())

    return lintJs
})

gulp.task('default', [ 'lint' ])