const path = require('path');
const gulp = require('gulp');
const del = require('del');
const through = require('through2');
const File = require('vinyl');

const browserSync = require('browser-sync').create();

const scss = require('gulp-sass');
const defaultPug = require('pug');


const posts = require('./src/data/posts.json');
const tags = require('./src/data/tags.json');

function pugData(data) {
    return {
        baseUrl: '',
        ...data
    }
}

function compilePugTemplate(file, data) {
    const template = defaultPug.compile(String(file.contents), {
        pretty: mode !== 'prod',
        filename: file.path
    });

    const compiled = template(pugData(data));

    return new Buffer(compiled);
}

function pug() {
    return through.obj(function compilePug(file, enc, cb) {
        console.log('compiling', file.path);

        if (file.path.endsWith('post.pug')) {
            for (const post of posts) {
                this.push(new File({
                    base: file.base,
                    path: path.join(file.base, `posts/${post.slug}.html`),
                    contents: compilePugTemplate(file, {post})
                }));
            }
            cb();
        } else if (file.path.endsWith('tag.pug')) {
            for (const tag in tags) {
                this.push(new File({
                    base: file.base,
                    path: path.join(file.base, `tags/${tag}.html`),
                    contents: compilePugTemplate(file, { tag, posts: tags[tag] })
                }));
            }
            cb();
        } else {
            file.path = file.path.replace('.pug', '.html');
            file.contents = compilePugTemplate(file, {posts});
            cb(null, file);
        }
    });
}

let mode = 'dev';
const getOutputDir = (_mode) => {
    if (!_mode) _mode = mode;

    return _mode === 'prod' ? './docs' : './dev';
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
       .pipe(pug())
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
