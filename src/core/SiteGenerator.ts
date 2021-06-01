import gulp from 'gulp';
import path from 'path';
import del from 'del';
import BS from 'browser-sync';
import logger from 'gulplog';
import ansi from 'ansi-colors';
import DataSource from './source/DataSource';
import FilesSource from './source/FilesSource';
import TemplateCompiler from './TemplateCompiler';
import SampleGenerator from './SampleGenerator';
import RssGenerator from './RssGenerator';
import {Config} from './model';
import ConfigHolder from './ConfigHolder';
import {EventEmitter} from 'events';

const browserSync = BS.create();
const DEV_PORT = 3000;

export default class SiteGenerator extends ConfigHolder {
    private dataSource: DataSource;
    private compiler: TemplateCompiler;
    private generator: SampleGenerator;
    private args: any;
    private eventEmitter: EventEmitter

    constructor(config: Config, args: any) {
        super(config);
        this.args = args;
        this.generator = new SampleGenerator();
        this.eventEmitter = new EventEmitter();

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

    generatePages(): Promise<void> {
        return new Promise(resolve => {
            this.initCompiler();
            this.loadData();

            gulp.src('./templates/pages/**/*.pug')
                .pipe(this.compiler.pug())
                .pipe(gulp.dest(this.outputDirectory))
                .on('end', resolve)
                .pipe(browserSync.stream());
        });
    }

    async generateRssFeed(): Promise<void> {
        this.initCompiler();
        this.loadData();

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
        browserSync.init({
            server: {
                baseDir: this.outputRelativeDirectory
            },
            port: DEV_PORT
        });

        gulp.watch('./templates/**/*.pug', gulp.series('generatePages'));
        gulp.watch('./assets/**/*', gulp.series('copyAssets', (done) => {
            browserSync.reload();
            done();
        }));

        this.initCompiler();
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

        gulp.src('./templates/pages/post.pug')
            .pipe(this.compiler.pugPosts(posts))
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());

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
            'generatePages', 'generateRssFeed'
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
            this.generatePages,
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
