'use strict';

// “gulp-imagemin” (optimisation des images)npm i
// “gulp-uncss” (suppression des CSS non utilisés)
// "gulp-deploy-git"

/**
 * Gulp modules
 */

const gulp = require('gulp');
const terser = require('gulp-terser');
const pump = require('pump');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const csscomb = require('gulp-csscomb');
const cssbeautify = require('gulp-cssbeautify');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const rename = require('gulp-rename');
const livereload = require('gulp-livereload');
const imagemin = require('gulp-imagemin');
const uncss = require('gulp-uncss');
const critical = require('gulp-critical-css');

/**
 * Paths
 */

const core    = './';

const src     = './src';
const lib     = './lib';
const dist    = './dist';
const demo    = './demo';

const vendors = './vendors';

/**
 * CSS treatments
 */

gulp.task('sass', function () {
	return gulp.src([ src + '/sass/kbox.scss', src + '/sass/demo.scss' ])
	  	.pipe(sourcemaps.init())
	  	.pipe(sass().on('error', sass.logError))
	  	.pipe(sourcemaps.write('./'))
	  	.pipe(gulp.dest(lib + '/css'))
		.pipe(livereload());
});

gulp.task('css', function () {
	return gulp.src(lib + '/css/**/*.css')
		.pipe(csscomb())
		.pipe(cssbeautify( { indent : '  ' } ))
		.pipe(autoprefixer())
		.pipe(critical())
		.pipe(gulp.dest(dist + '/css'))
		.pipe(gulp.dest(demo + '/css'))
		.pipe(livereload());
});

gulp.task('minify-css', function () {
	return gulp.src(dist + '/css/*.css')
		.pipe(csso())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(dist + '/css/'))
		.pipe(livereload());
});

gulp.task('critical', function() {
	return  gulp.src('./index.html')
	.pipe(critical.generate({
		base: './dist',
		dest: 'index-critical.html',
		inline: true,
		width: 320,
		height: 480,
		minify: true
	}))
	.pipe(gulp.dest(dist));
});

/**
 * JS treatments
 */

gulp.task('uglify', function (cb) {
	pump([
			gulp.src([
				src + '/js/kbox.js'
			]),
			terser(),
			rename({
				suffix: '.min'
			}),
			gulp.dest(lib + '/js/')
		],
		cb
	);
});

gulp.task('concat', function(){
  return gulp.src([
    lib + '/js/kbox.min.js',
  ])
  .pipe(sourcemaps.init())
  .pipe(concat('kbox.min.js'))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(dist + '/js'))
	.pipe(gulp.dest(demo + '/js'))
  .pipe(livereload());
});

gulp.task('concat-pack', function(){
	return gulp.src([
		lib + '/js/velocity.min.js',
		lib + '/js/kbox.min.js',
	])
	.pipe(sourcemaps.init())
	.pipe(concat('kbox.pack.min.js'))
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest(dist + '/js'))
	.pipe(gulp.dest(demo + '/js'))
	.pipe(livereload());
});

/**
 * Images
 */

gulp.task('img', function () {
	return gulp.src(src + '/assets/img/*.{png,jpg,jpeg,gif,svg}')
	.pipe(imagemin())
	.pipe(gulp.dest(dist + '/assets/img'));
});

gulp.task('default', [ 'uglify', 'concat', 'concat-pack' ]);

gulp.task('dev', ['sass']);
gulp.task('prod', ['sass', 'css', 'uglify', 'concat', 'concat-pack']);

gulp.task('watch', function () {
	livereload.listen();
	gulp.watch(src + '/sass/**/*.scss', ['sass']);
	gulp.watch([
		src + '/js/app.config.js',
		src + '/js/app.form.js',
		src + '/js/app.init.js'
	], ['uglify', 'concat']);
});