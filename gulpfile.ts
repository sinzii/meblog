import * as gulp from 'gulp';
import * as path from 'path';
import * as del from 'del';
import BS from 'browser-sync';
import scss from 'gulp-sass';

import FilesSource from "./src/scripts/data/FilesSource";
import TemplateCompiler from "./src/scripts/template/TemplateCompiler";
const browserSync = BS.create();

import config from './config.json';


class SiteGenerator {
    get outputDirectory() {
        return config.devMode ? './dev' : './docs';
    }

    clean(done) {
        del.sync([this.outputDirectory])
        done();
    }

    generatePages() {
        const postsDirPath = path.join(__dirname, 'posts');
        const dataSource = new FilesSource(config, postsDirPath);
        dataSource.loadData();

        const compiler = new TemplateCompiler(dataSource)
        return gulp.src('./src/templates/pages/**/*.pug')
            .pipe(compiler.pug())
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    generateCss() {
        return gulp.src('./src/styles/main.scss')
            .pipe(scss())
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    generateJs() {

    }

    dev(done) {
        browserSync.init({
            server: {
                baseDir: this.outputDirectory
            }
        });

        gulp.watch('./src/styles/**/*.scss', gulp.series('generateCss'));
        gulp.watch('./src/templates/**/*.pug', gulp.series('generatePages'));
        done();
    }

    initTasks() {
        gulp.task('clean', this.clean.bind(this));
        gulp.task('generatePages', this.generatePages.bind(this));
        gulp.task('generateCss', this.generateCss.bind(this));
        gulp.task('generateJs', this.generateJs.bind(this));
        gulp.task('build', gulp.series('clean', 'generatePages', 'generateCss'));
        gulp.task('dev', gulp.series('build', this.dev.bind(this)));
    }
}

new SiteGenerator().initTasks();
