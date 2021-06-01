import gulp from 'gulp';
import path from 'path';
import del from 'del';
import BS, {BrowserSyncInstance} from 'browser-sync';
import logger from 'gulplog';
import ansi from 'ansi-colors';
import DataSource from './source/DataSource';
import FilesSource from './source/FilesSource';
import TemplateRenderer from './template/TemplateRenderer';
import SampleGenerator from './SampleGenerator';
import RssGenerator from './RssGenerator';
import {Config} from './model';
import ConfigHolder from './ConfigHolder';
import {EventEmitter} from 'events';
import StringUtils from './util/StringUtils';

const DEV_PORT = 3000;

export default class SiteGenerator extends ConfigHolder {
    private dataSource: DataSource;
    private compiler: TemplateRenderer;
    private generator: SampleGenerator;
    private eventEmitter: EventEmitter;
    private browserSync: BrowserSyncInstance;
    private args: any;

    constructor(config: Config, args: any) {
        super(config);
        this.args = args;
        this.generator = new SampleGenerator();
        this.eventEmitter = new EventEmitter();
        this.browserSync = BS.create('meblog');

        this.registerEvents();
    }

    private registerEvents() {
        if (typeof this.config.eventRegister === 'function') {
            this.config.eventRegister.call(this, this.eventEmitter);
        }
    }

    /**
     * We might call init compiler again over times
     * because of postsDirPath might be changed due
     * to the changing of environment (dev or prod).
     */
    private initCompiler() {
        this.dataSource = new FilesSource(this.config, this.postsDirPath);
        this.compiler = new TemplateRenderer(this.dataSource);
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

    async logOutputDir(): Promise<void> {
        logger.info('Output directory:', ansi.blue(this.outputRelativeDirectory));
    }

    async clean(): Promise<void> {
        del.sync([this.outputDirectory])
    }

    async cleanCache(): Promise<void> {
        del.sync(['./data']);
    }

    async cleanPosts(): Promise<void> {
        del.sync(`${this.postsDirPath}/*`);
    }

    loadData() {
        this.initCompiler();
        this.dataSource.loadData();
    }

    renderTemplates(templateGlob: string, renderFn): Promise<void> {
        return new Promise(resolve => {
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
            this.compiler.renderPages()
        );
    }

    async generatePosts(): Promise<void> {
        await this.renderTemplates(
            './templates/posts/*.pug',
            this.compiler.renderPosts()
        );
    }

    async generateTags(): Promise<void> {
        await this.renderTemplates(
            './templates/tags/tag.pug',
            this.compiler.renderTags()
        );
    }

    async generateTemplates(): Promise<void> {
        await this.runSeries([
            'generatePages',
            'generatePosts',
            'generateTags'
        ]);
    }

    async generateRssFeed(): Promise<void> {
        const rssGenerator = new RssGenerator(this.dataSource);
        rssGenerator.generate(this.outputDirectory);
    }

    copyAssets(): Promise<void> {
        return new Promise(resolve => {
            gulp.src('./assets/**/*')
                .pipe(gulp.dest(this.outputDirectory))
                .on('end', resolve);
        })
    }

    async onServe(): Promise<void> {
        this.browserSync.init({
            server: {
                baseDir: this.outputRelativeDirectory
            },
            port: DEV_PORT
        });

        gulp.watch('./templates/**/*.pug', gulp.series('generatePages'));
        gulp.watch('./assets/**/*', gulp.series('copyAssets', (done) => {
            this.browserSync.reload();
            done();
        }));

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

        const postUrls = posts.map(p => this.postRootUrl(p));
        logger.info(`[POST UPDATED] ${postUrls.join(', ')}`);
    }

    async generateSamplePosts(): Promise<void> {
        const generator = new SampleGenerator();
        const numberOfPosts = Number(this.args['number-of-posts']) || 10;
        generator.generateMarkdownPostsAndSave(numberOfPosts, this.postsDirPath);
    }

    async prod(): Promise<void> {
        this.config.devMode = false;
    }

    async dev(): Promise<void> {
        this.config.devMode = true;
        this.config.baseUrl = `http://localhost:${DEV_PORT}`;
        this.config.baseContext = '';
    }

    async newPost(): Promise<void> {
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
        })
    }

    async build(): Promise<void> {
        await this.runSeries([
            'logOutputDir', 'clean', 'copyAssets',
            'loadData', 'generateTemplates', 'generateRssFeed'
        ]);
    }

    async serve(): Promise<void> {
        await this.runSeries(['build', 'onServe']);
    }

    private wrap(func) {
        return async function () {
            logger.debug(`[BEFORE] ${func.name}`);
            this.eventEmitter.emit(`BEFORE:${func.name}`);

            await func.call(this);

            logger.debug(`[AFTER] ${func.name}`);
            this.eventEmitter.emit(`AFTER:${func.name}`);
        }
    }

    private registerTask(func) {
        gulp.task(
            func.name,
            this.wrap(func).bind(this)
        );
    }

    public initTasks() {
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
            this.generateSamplePosts,
            this.newPost,
            this.onServe,
            this.build,
            this.serve
        ];

        tasks.forEach(t => this.registerTask(t));
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
