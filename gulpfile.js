const gulp = require('gulp');
const scss = require('gulp-sass');
const pug = require('gulp-pug');
const del = require('del');
const browserSync = require('browser-sync').create();

let mode = 'dev';
const getOutputDir = (_mode) => {
    if (!_mode) _mode = mode;

    return _mode === 'prod' ? './dist' : './dev';
}

gulp.task('enable-prod', (done) => {
    mode = 'prod';
    done();
});

gulp.task('clean-dev', (done) => {
    del([getOutputDir('dev') + '/*']);
    done();
});

gulp.task('generate-pages', () => {
   return gulp.src('./src/templates/pages/**/*.pug')
       .pipe(pug({
           verbose: true,
           pretty: mode !== 'prod'
       }))
       .pipe(gulp.dest(getOutputDir()))
       .pipe(browserSync.stream());
});

gulp.task('generate-css', () => {
    return gulp.src('./src/styles/main.scss')
        .pipe(scss({
            includePaths: ['./node_modules', './src/styles'],

        }))
        .pipe(gulp.dest(getOutputDir()))
        .pipe(browserSync.stream());
})

gulp.task('serve', gulp.series('clean-dev', 'generate-pages', 'generate-css', (done) => {
    browserSync.init({
        server: {
            baseDir: getOutputDir()
        }
    });

    gulp.watch('./src/styles/**/*.scss', gulp.series('generate-css'));
    gulp.watch('./src/templates/**/*.pug', gulp.series('generate-pages'));
    done();
}));
