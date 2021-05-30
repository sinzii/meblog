import gulp from 'gulp';
import path from 'path';
import del from 'del';
import cleanCss from 'gulp-clean-css';
import autoprefixer from 'gulp-autoprefixer'
import BS from 'browser-sync';
import scss from 'gulp-sass';
import logger from 'gulplog';
import ansi from 'ansi-colors';

import DataSource from './source/DataSource';
import FilesSource from './source/FilesSource';
import TemplateCompiler from './TemplateCompiler';
import SampleGenerator from './SampleGenerator';
import RssGenerator from './RssGenerator';
import {Config} from './model';
import ConfigHolder from './ConfigHolder';

const browserSync = BS.create();
const DEV_PORT = 3000;

export default class SiteGenerator extends ConfigHolder {
    private dataSource: DataSource;
    private compiler: TemplateCompiler;
    private generator: SampleGenerator;
    private args: any;

    constructor(config: Config, args: any) {
        super(config);
        this.args = args;
        this.generator = new SampleGenerator();
    }

    /**
     * We might call init compiler again over times
     * because of postsDirPath might be changed due
     * to the changing of environment (dev or prod).
     */
    private initCompiler() {
        this.dataSource = new FilesSource(this.config, this.postsDirPath);
        this.compiler = new TemplateCompiler(this.dataSource);
    }

    private loadData() {
        if (this.dataSource instanceof FilesSource) {
            this.dataSource.loadData();
        }
    }

    get outputRelativeDirectory() {
        const outDir = this.args['outdir'];
        if (outDir) {
            return outDir;
        }

        return this.config.devMode ? './dev' : './docs';
    }

    get outputDirectory() {
        return path.resolve(
            this.config.rootDir,
            this.outputRelativeDirectory
        );
    }

    get postsDirPath() {
        return path.join(this.config.rootDir, 'posts');
    }

    logOutputDir(done) {
        logger.info('Output directory:', ansi.blue(this.outputRelativeDirectory));
        done();
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

        return gulp.src('./theme/templates/pages/**/*.pug')
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
        let stream =
            gulp.src('./theme/scss/main.scss')
                .pipe(scss());

        if (!this.config.devMode) {
            stream = stream
                .pipe(autoprefixer())
                .pipe(cleanCss());
        }

        return stream
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    copyAssets() {
        return gulp.src('./assets/**/*')
            .pipe(gulp.dest(this.outputDirectory));
    }

    generateJs() {
        return gulp.src('./theme/js/*.js')
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

        gulp.watch('./theme/scss/**/*.scss', gulp.series('generateCss'));
        gulp.watch('./theme/js/**/*.js', gulp.series('generateJs'));
        gulp.watch('./theme/templates/**/*.pug', gulp.series('generatePages'));
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
            logger.info('Not support compile posts from local files');
            return;
        }

        const posts = this.dataSource.parsePostsFromPaths([path]);

        gulp.src('./theme/templates/pages/post.pug')
            .pipe(this.compiler.pugPosts(posts))
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());

        const postUrls = posts.map(p => this.postRootUrl(p));

        logger.info(`[POST UPDATED] ${postUrls.join(', ')}`);
    }

    generateSamplePosts(done) {
        const generator = new SampleGenerator();
        const numberOfPosts = Number(this.args['number-of-posts']) || 10;
        generator.generateMarkdownPostsAndSave(numberOfPosts, this.postsDirPath);

        done();
    }

    onProd(done) {
        this.config.devMode = false;

        done();
    }

    onDev(done) {
        this.config.devMode = true;
        this.config.baseUrl = `http://localhost:${DEV_PORT}`;
        this.config.baseContext = '';

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
        gulp.task('logOutputDir', this.logOutputDir.bind(this));
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
            'logOutputDir', 'clean', 'copyAssets',
            'generatePages', 'generateRssFeed',
            'generateCss', 'generateJs'
        ));
        gulp.task('serve', gulp.series('build', this.dev.bind(this)));
    }

    public run(tasks: string[]) {
        gulp.series(tasks)(function (err) {
            if (err) {
                logger.error(err);
                process.exit(1);
            }
        });
    }
}
