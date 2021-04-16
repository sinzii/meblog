const gulp = require('gulp');
const scss = require('gulp-sass');
const browserSync = require('browser-sync').create();

gulp.task('scss', () => {
    return gulp.src('./src/styles/main.scss')
        .pipe(scss())
        .pipe(gulp.dest('./src'))
        .pipe(browserSync.stream());
})

gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: './src'
        }
    });

    gulp.watch('./src/styles/*.scss', gulp.series('scss'));
});
