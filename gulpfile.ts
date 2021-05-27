import * as gulp from 'gulp';
import * as path from 'path';
import * as del from 'del';
import BS from 'browser-sync';
import scss from 'gulp-sass';
import logger from 'gulplog';

import FilesSource from "./src/core/FilesSource";
import TemplateCompiler from "./src/core/TemplateCompiler";
import config from './config';
import SampleGenerator from './src/core/SampleGenerator';
import DataSource from './src/core/DataSource';
import RssGenerator from './src/core/RssGenerator';

const browserSync = BS.create();
const DEV_PORT = 3000;

// be default dev mode is on
config.devMode = true;

const argv = require('minimist')(process.argv.slice(2));

class SiteGenerator {
    private dataSource: DataSource;
    private compiler: TemplateCompiler;
    private generator: SampleGenerator;

    constructor() {
        this.generator = new SampleGenerator();
    }

    /**
     * We might call init compiler again over times
     * because of postsDirPath might be changed due
     * to the changing of environment (dev or prod).
     */
    private initCompiler() {
        this.dataSource = new FilesSource(config, this.postsDirPath);
        this.compiler = new TemplateCompiler(this.dataSource);
    }

    private loadData() {
        if (this.dataSource instanceof FilesSource) {
            this.dataSource.loadData();
        }
    }

    get outputDirectory() {
        return config.devMode ? './dev' : './docs';
    }

    get postsDirPath() {
        const outDir = argv['outDir'];
        if (outDir) {
            return path.resolve(__dirname, outDir);
        }

        return path.join(__dirname, config.devMode ? 'posts-dev' : 'posts');
    }

    clean(done) {
        del.sync([this.outputDirectory])
        done();
    }

    cleanCache(done) {
        del.sync(['./data']);
        done();
    }

    cleanPosts(done) {
        del.sync(`${this.postsDirPath}/*`);
        done();
    }

    generatePages() {
        this.initCompiler();
        this.loadData();

        return gulp.src('./src/templates/pages/**/*.pug')
            .pipe(this.compiler.pug())
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    generateRssFeed(done) {
        this.initCompiler();
        this.loadData();

        const rssGenerator = new RssGenerator(this.dataSource);
        rssGenerator.generate(this.outputDirectory);
        done();
    }

    generateCss() {
        return gulp.src('./src/scss/main.scss')
            .pipe(scss())
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    copyAssets() {
        return gulp.src('./assets/**/*')
            .pipe(gulp.dest(this.outputDirectory));
    }

    generateJs() {
        return gulp.src('./src/js/*.js')
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    dev(done) {
        browserSync.init({
            server: {
                baseDir: this.outputDirectory
            },
            port: DEV_PORT
        });

        gulp.watch('./src/scss/**/*.scss', gulp.series('generateCss'));
        gulp.watch('./src/js/**/*.js', gulp.series('generateJs'));
        gulp.watch('./src/templates/**/*.pug', gulp.series('generatePages'));
        gulp.watch('./assets/**/*', gulp.series('copyAssets', (done) => {
            browserSync.reload();
            done();
        }));

        this.initCompiler();
        const watcher = gulp.watch(this.postsDirPath + '/**/*.md');
        watcher
            .on('change', this.onUpdateMarkdownPost.bind(this))
            .on('add', this.onUpdateMarkdownPost.bind(this));

        done();
    }

    private onUpdateMarkdownPost(path: string): void {
        if (!(this.dataSource instanceof FilesSource)) {
            logger.info("Not support compile posts from local files");
            return;
        }

        const posts = this.dataSource.parsePostsFromPaths([path]);

        gulp.src('./src/templates/pages/post.pug')
            .pipe(this.compiler.pugPosts(posts))
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());

        const postUrls = posts.map(p => this.compiler.postRootUrl(p));

        logger.info(`[POST UPDATED] ${postUrls.join(', ')}`);
    }

    generateSamplePosts(done) {
        const generator = new SampleGenerator();
        const numberOfPosts = Number(argv['numberOfPosts']) || 10;
        generator.generateMarkdownPostsAndSave(numberOfPosts, this.postsDirPath);

        done();
    }

    onProd(done) {
        config.devMode = false;

        done();
    }

    onDev(done) {
        config.devMode = true;
        config.baseUrl = `http://localhost:${DEV_PORT}`;
        config.baseContext = '';

        done();
    }

    newPost(done) {
        const generator = new SampleGenerator();
        generator.generateEmptyMarkdownPostAndSave(this.postsDirPath);
        done();
    }

    initTasks() {
        gulp.task('prod', this.onProd.bind(this));
        gulp.task('dev', this.onDev.bind(this));
        gulp.task('clean', this.clean.bind(this));
        gulp.task('cleanPosts', this.cleanPosts.bind(this));
        gulp.task('cleanCache', this.cleanCache.bind(this));
        gulp.task('copyAssets', this.copyAssets.bind(this));
        gulp.task('generatePages', this.generatePages.bind(this));
        gulp.task('generateRssFeed', this.generateRssFeed.bind(this));
        gulp.task('generateCss', this.generateCss.bind(this));
        gulp.task('generateJs', this.generateJs.bind(this));
        gulp.task('generateSamplePosts', this.generateSamplePosts.bind(this));
        gulp.task('newPost', this.newPost.bind(this));
        gulp.task('build', gulp.series(
            'clean', 'copyAssets',
            'generatePages', 'generateRssFeed',
            'generateCss', 'generateJs'
        ));
        gulp.task('serve', gulp.series('build', this.dev.bind(this)));
    }
}

new SiteGenerator().initTasks();
