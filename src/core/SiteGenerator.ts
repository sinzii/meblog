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
import i18n from 'i18n';
import DataSource from './source/DataSource';
import FilesSource from './source/FilesSource';
import TemplateRenderer from './template/TemplateRenderer';
import SampleGenerator from './SampleGenerator';
import RssGenerator from './RssGenerator';
import { Config } from './model';
import ConfigHolder from './ConfigHolder';
import Emittery from 'emittery';
import StringUtils from './util/StringUtils';
import { Arguments } from 'yargs';
import stream from 'stream';
import GulpUtils from './util/GulpUtils';

const DEV_PORT = 3000;
const DEFAULT_LOCALE = 'en';

export default class SiteGenerator extends ConfigHolder {
    private dataSource: DataSource;
    private renderer: TemplateRenderer;
    private generator: SampleGenerator;
    private eventEmitter: Emittery;
    private browserSync: BrowserSyncInstance;
    private args: Arguments;

    constructor(config: Config, args: Arguments) {
        super(config);
        this.args = args;
        this.generator = new SampleGenerator();
        this.eventEmitter = new Emittery();
        this.browserSync = BS.create('meblog');

        this.registerEvents();
        this.setupI18n();
    }

    private setupI18n(): void {
        if (!this.config.defaultLocale) {
            this.config.defaultLocale = DEFAULT_LOCALE;
        }

        let {locales = []} = this.config;


        if (typeof locales === 'string') {
            locales = [locales];
        }

        if (!locales.includes(this.config.defaultLocale)) {
            locales.push(this.config.defaultLocale);
        }

        this.config.locales = locales;

        i18n.configure({
            locales,
            directory: path.join(this.config.rootDir, './i18n'),
            defaultLocale: this.config.defaultLocale,
            autoReload: false,
            updateFiles: !!this.args['auto-update-i18n-files'],
        });
    }

    private registerEvents() {
        if (typeof this.config.eventRegister === 'function') {
            this.eventEmitter.clearListeners();
            this.config.eventRegister.call(this, this.eventEmitter);
        }
    }

    private initRenderer() {
        this.dataSource = new FilesSource(this.config, this.postsDirPath);
        this.renderer = new TemplateRenderer(this.dataSource);
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

    public getOutputDirectory(locale?: string): string {
        const outdir = this.outputDirectory;
        if (this.isDefaultLocale(locale)) {
            return outdir;
        }

        return path.join(this.outputDirectory, locale);
    }

    get postsDirPath(): string {
        return path.join(this.config.rootDir, 'posts');
    }

    private logOutputDir(): void {
        logger.info(
            'Output directory:',
            ansi.blue(this.outputRelativeDirectory),
        );
    }

    async clean(): Promise<void> {
        del.sync([this.outputDirectory]);
    }

    async cleanCache(): Promise<void> {
        logger.info(ansi.green('Cleaning cache'));
        del.sync(['./cache']);
    }

    async cleanPosts(): Promise<void> {
        del.sync(`${this.postsDirPath}/*`);
    }

    loadData(): void {
        logger.info(ansi.green('Loading posts'));
        this.initRenderer();
        this.dataSource.loadData();
    }

    private _renderTemplates(
        templateGlob: string,
        renderFn: (locale?: string) => stream.Transform,
        locale?: string
    ): Promise<void> {
        return new Promise((resolve) => {
            gulp.src(templateGlob, {allowEmpty: true})
                .pipe(GulpUtils.handleStreamError())
                .pipe(renderFn(locale))
                .pipe(gulp.dest(this.getOutputDirectory(locale)))
                .on('end', resolve);
        });
    }

    async renderTemplates(
        templateGlob: string,
        renderFn: (locale?: string) => stream.Transform,
    ): Promise<void> {
        for (const locale of this.config.locales) {
            i18n.setLocale(locale);
            await this._renderTemplates(templateGlob, renderFn, locale);
        }
    }

    async generatePages(): Promise<void> {
        logger.info(ansi.green('Rendering pages'));
        await this.renderTemplates(
            './templates/pages/**/*.pug',
            this.renderer.renderPages.bind(this.renderer),
        );
    }

    async generatePosts(): Promise<void> {
        logger.info(ansi.green('Rendering posts'));
        await this.renderTemplates(
            './templates/posts/*.pug',
            this.renderer.renderPosts.bind(this.renderer),
        );
    }

    async generateTags(): Promise<void> {
        logger.info(ansi.green('Rendering tags'));
        await this.renderTemplates(
            './templates/tags/tag.pug',
            this.renderer.renderTags.bind(this.renderer),
        );
    }

    async generateTemplates(): Promise<void> {
        await this.runSeries([
            'generatePages',
            'generatePosts',
            'generateTags',
            'reloadBrowser',
        ]);
    }

    async generateRssFeed(): Promise<void> {
        logger.info(ansi.green('Generating RSS feed'));
        const rssGenerator = new RssGenerator(this.dataSource);

        for (const locale of this.config.locales) {
            i18n.setLocale(locale);
            rssGenerator.generate(this.getOutputDirectory(locale), locale);
        }
    }

    async generateCss(): Promise<void> {
        logger.info(ansi.green('Generating CSS'));
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
        logger.info(ansi.green('Copying assets'));
        return new Promise((resolve) => {
            gulp.src('./assets/**/*', {allowEmpty: true})
                .pipe(gulp.dest(this.outputDirectory))
                .on('end', resolve);
        });
    }

    reloadConfig(): void {
        logger.info(ansi.green('Reloading config'));
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
        logger.info(ansi.green('Starting local development server'));
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
        gulp.watch('./scss/**/*.@(scss|sass)', gulp.series('generateCss'));
        gulp.watch(
            './templates/pages/**/*.pug',
            gulp.series('generatePages', 'reloadBrowser'),
        );
        gulp.watch(
            './templates/posts/**/*.pug',
            gulp.series('generatePosts', 'reloadBrowser'),
        );
        gulp.watch(
            './templates/tags/**/*.pug',
            gulp.series('generateTags', 'reloadBrowser'),
        );
        gulp.watch(
            [
                './templates/**/*.pug',
                '!./templates/pages/**/*.pug',
                '!./templates/posts/**/*.pug',
                '!./templates/tags/**/*.pug',
            ],
            gulp.series('generateTemplates', 'reloadBrowser'),
        );

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

        gulp.src('./templates/posts/*.pug', {allowEmpty: true})
            .pipe(GulpUtils.handleStreamError())
            .pipe(this.renderer.renderSpecifiedPosts(posts))
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(this.browserSync.stream());

        const postUrls = posts.map((p) => this.postRootUrl(p));
        logger.info(`[POST UPDATED] ${postUrls.join(', ')}`);
    }

    async generateSamplePosts(): Promise<void> {
        logger.info(ansi.green('Generating sample posts'));
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
        logger.info(ansi.green('Generating a draft'));
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
        logger.info(ansi.green('Start building'));
        this.logOutputDir();
        await this.runSeries([
            'clean',
            'copyAssets',
            'loadData',
            'generateTemplates',
            'generateRssFeed',
            'generateCss',
        ]);
        logger.info(ansi.green("Build's completed"));
    }

    async serve(): Promise<void> {
        await this.runSeries(['dev', 'build', 'onServe']);
    }

    private wrap(func) {
        return async function () {
            const funcCapitalized = StringUtils.capitalize(func.name);
            logger.debug(`[BEFORE] ${funcCapitalized}`);
            await this.eventEmitter.emitSerial(`BEFORE:${funcCapitalized}`);

            await func.call(this);

            logger.debug(`[AFTER] ${funcCapitalized}`);
            await this.eventEmitter.emitSerial(`AFTER:${funcCapitalized}`);
        };
    }

    private registerTask(func) {
        gulp.task(func.name, this.wrap(func).bind(this));
    }

    public initTasks(): void {
        const tasks = [
            this.prod,
            this.dev,
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

    public async run(tasks: string[]): Promise<void> {
        await this.runSeries(tasks);
    }
}
