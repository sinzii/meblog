import gulp from 'gulp';
import path from 'path';
import del from 'del';
import BS, { BrowserSyncInstance } from 'browser-sync';
import cleanCss from 'gulp-clean-css';
import autoprefixer from 'gulp-autoprefixer';
import scss from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import logger from 'gulplog';
import ansi from 'ansi-colors';
import DataSource from './source/DataSource';
import FilesSource from './source/FilesSource';
import TemplateRenderer from './template/TemplateRenderer';
import SampleGenerator from './SampleGenerator';
import RssGenerator from './RssGenerator';
import { Config } from './model';
import ConfigHolder from './ConfigHolder';
import { EventEmitter } from 'events';
import StringUtils from './util/StringUtils';
import { Arguments } from 'yargs';
import stream from 'stream';

const DEV_PORT = 3000;

export default class SiteGenerator extends ConfigHolder {
    private dataSource: DataSource;
    private compiler: TemplateRenderer;
    private generator: SampleGenerator;
    private eventEmitter: EventEmitter;
    private browserSync: BrowserSyncInstance;
    private args: Arguments;

    constructor(config: Config, args: Arguments) {
        super(config);
        this.args = args;
        this.generator = new SampleGenerator();
        this.eventEmitter = new EventEmitter();
        this.browserSync = BS.create('meblog');

        this.registerEvents();
    }

    private registerEvents() {
        if (typeof this.config.eventRegister === 'function') {
            this.eventEmitter.removeAllListeners();
            this.config.eventRegister.call(this, this.eventEmitter);
        }
    }

    private initCompiler() {
        this.dataSource = new FilesSource(this.config, this.postsDirPath);
        this.compiler = new TemplateRenderer(this.dataSource);
    }

    get outputRelativeDirectory(): string {
        const outDir = this.args['outdir'] as string;
        if (outDir) {
            return outDir;
        }

        return this.config.devMode ? './dev' : './docs';
    }

    get outputDirectory(): string {
        return path.resolve(this.config.rootDir, this.outputRelativeDirectory);
    }

    get postsDirPath(): string {
        return path.join(this.config.rootDir, 'posts');
    }

    async logOutputDir(): Promise<void> {
        logger.info(
            'Output directory:',
            ansi.blue(this.outputRelativeDirectory),
        );
    }

    async clean(): Promise<void> {
        del.sync([this.outputDirectory]);
    }

    async cleanCache(): Promise<void> {
        del.sync(['./cache']);
    }

    async cleanPosts(): Promise<void> {
        del.sync(`${this.postsDirPath}/*`);
    }

    loadData(): void {
        this.initCompiler();
        this.dataSource.loadData();
    }

    renderTemplates(
        templateGlob: string,
        renderFn: stream.Transform,
    ): Promise<void> {
        return new Promise((resolve) => {
            gulp.src(templateGlob)
                .pipe(renderFn)
                .pipe(gulp.dest(this.outputDirectory))
                .on('end', resolve)
                .pipe(this.browserSync.stream());
        });
    }

    async generatePages(): Promise<void> {
        await this.renderTemplates(
            './templates/pages/**/*.pug',
            this.compiler.renderPages(),
        );
    }

    async generatePosts(): Promise<void> {
        await this.renderTemplates(
            './templates/posts/*.pug',
            this.compiler.renderPosts(),
        );
    }

    async generateTags(): Promise<void> {
        await this.renderTemplates(
            './templates/tags/tag.pug',
            this.compiler.renderTags(),
        );
    }

    async generateTemplates(): Promise<void> {
        await this.runSeries([
            'generatePages',
            'generatePosts',
            'generateTags',
        ]);
    }

    async generateRssFeed(): Promise<void> {
        const rssGenerator = new RssGenerator(this.dataSource);
        rssGenerator.generate(this.outputDirectory);
    }

    async generateCss(): Promise<void> {
        return new Promise((resolve) => {
            let stream = gulp.src('./scss/main.scss', {
                allowEmpty: true,
            });

            if (this.config.devMode) {
                stream = stream.pipe(sourcemaps.init());
            }

            stream = stream.pipe(scss().on('error', scss.logError));

            if (this.config.devMode) {
                stream = stream.pipe(sourcemaps.write());
            } else {
                stream = stream.pipe(autoprefixer()).pipe(cleanCss());
            }

            return stream
                .pipe(gulp.dest(this.outputDirectory))
                .on('end', resolve)
                .pipe(this.browserSync.stream());
        });
    }

    copyAssets(): Promise<void> {
        return new Promise((resolve) => {
            gulp.src('./assets/**/*')
                .pipe(gulp.dest(this.outputDirectory))
                .on('end', resolve);
        });
    }

    reloadConfig(): void {
        const configFilePath = this.args['configFilePath'] as string;
        delete require.cache[configFilePath];
        const newConfig = require(configFilePath);
        Object.assign(this.config, newConfig);

        this.registerEvents();
    }

    reloadBrowser(): void {
        this.browserSync.reload();
    }

    async onServe(): Promise<void> {
        this.browserSync.init({
            server: {
                baseDir: this.outputRelativeDirectory,
            },
            port: (this.args['port'] as number) || DEV_PORT,
            open: this.args['no-open'] ? false : 'local',
        });

        gulp.watch(
            this.args['configFilePath'] as string,
            gulp.series('reloadConfig', 'dev', 'generateTemplates'),
        );

        gulp.watch('./templates/**/*.pug', gulp.series('generateTemplates'));

        gulp.watch('./assets/**/*', gulp.series('copyAssets', 'reloadBrowser'));

        const watcher = gulp.watch(this.postsDirPath + '/**/*.md');
        watcher
            .on('change', this.onUpdateMarkdownPost.bind(this))
            .on('add', this.onUpdateMarkdownPost.bind(this));
    }

    private onUpdateMarkdownPost(path: string): void {
        if (!(this.dataSource instanceof FilesSource)) {
            logger.info('Not support compile posts from local files');
            return;
        }

        const posts = this.dataSource.parsePostsFromPaths([path]);

        gulp.src('./templates/posts/*.pug')
            .pipe(this.compiler.renderSpecifiedPosts(posts))
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(this.browserSync.stream());

        const postUrls = posts.map((p) => this.postRootUrl(p));
        logger.info(`[POST UPDATED] ${postUrls.join(', ')}`);
    }

    async generateSamplePosts(): Promise<void> {
        const generator = new SampleGenerator();
        const numberOfPosts = Number(this.args['number-of-posts']) || 10;
        generator.generateMarkdownPostsAndSave(
            numberOfPosts,
            this.postsDirPath,
        );
    }

    async prod(): Promise<void> {
        this.config.devMode = false;
    }

    async dev(): Promise<void> {
        this.config.devMode = true;
        this.config.baseUrl = `http://localhost:${DEV_PORT}`;
        this.config.baseContext = '';
    }

    async newDraft(): Promise<void> {
        const generator = new SampleGenerator();
        generator.generateEmptyMarkdownPostAndSave(this.postsDirPath);
    }

    private runSeries(tasks: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            gulp.series(tasks)(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async build(): Promise<void> {
        await this.runSeries([
            'logOutputDir',
            'clean',
            'copyAssets',
            'loadData',
            'generateTemplates',
            'generateRssFeed',
            'generateCss',
        ]);
    }

    async serve(): Promise<void> {
        await this.runSeries(['dev', 'build', 'onServe']);
    }

    private wrap(func) {
        return async function () {
            const funcCapitalized = StringUtils.capitalize(func.name);
            logger.debug(`[BEFORE] ${funcCapitalized}`);
            this.eventEmitter.emit(`BEFORE:${funcCapitalized}`);

            await func.call(this);

            logger.debug(`[AFTER] ${funcCapitalized}`);
            this.eventEmitter.emit(`AFTER:${funcCapitalized}`);
        };
    }

    private registerTask(func) {
        gulp.task(func.name, this.wrap(func).bind(this));
    }

    public initTasks(): void {
        const tasks = [
            this.prod,
            this.dev,
            this.logOutputDir,
            this.clean,
            this.cleanPosts,
            this.cleanCache,
            this.copyAssets,
            this.loadData,
            this.generatePages,
            this.generatePosts,
            this.generateTags,
            this.generateTemplates,
            this.generateRssFeed,
            this.generateCss,
            this.generateSamplePosts,
            this.newDraft,
            this.onServe,
            this.reloadConfig,
            this.reloadBrowser,
            this.build,
            this.serve,
        ];

        tasks.forEach((t) => this.registerTask(t));
    }

    public run(tasks: string[]): void {
        gulp.series(tasks)(function (err) {
            if (err) {
                logger.error(err);
                process.exit(1);
            }
        });
    }
}
