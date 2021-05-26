import File from 'vinyl';
import * as path from 'path';
import pug from 'pug';
import through from 'through2';
import ConfigHolder from "./ConfigHolder";
import DataSource from "./DataSource";
import moment from 'moment';
import logger from 'gulplog';
import {Post} from './Post';
import {PostUrlStyle} from './model';


export default class TemplateCompiler extends ConfigHolder {
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        super(dataSource.config);

        this.dataSource = dataSource;
    }

    private compilePugTemplate(file: File, data: any) {
        const template = pug.compile(String(file.contents), {
            pretty: this.config.devMode,
            filename: file.path
        });

        const config = this.config;
        const templateName = file.basename.replace(file.extname, '');
        const postPartialPath = this.postPartialPath.bind(this);
        const rootUrl = this.rootUrl.bind(this);
        const url = this.url.bind(this);

        const compiled = template({
            ...config,
            templateName,
            ...data,
            formatDateTime(date: Date) {
                return moment(date).format(config.dateTimeFormat)
            },
            formatDate(date: Date) {
                return moment(date).format(config.dateFormat)
            },
            rootUrl,
            url,
            postUrl(post: Post) {
                return url(postPartialPath(post));
            },
            postRootUrl(post: Post) {
                return rootUrl(postPartialPath(post));
            }
        });

        return Buffer.from(compiled);
    }

    private rootUrl(path): string {
        const {baseUrl = '', baseContext = ''} = this.config;
        let url = path;

        if (baseContext) {
            url = `/${baseContext}${path}`
        }

        if (baseUrl) {
            url = baseUrl + url;
        }

        return url;
    }

    private url(path: string): string {
        const {baseContext = ''} = this.config;
        return `${baseContext}${path}`;
    }

    private postPartialPath(post: Post): string {
        const {postUrlStyle} = this.config;
        const defaultPostsDir = 'posts';

        switch (postUrlStyle) {
            case PostUrlStyle.POSTS_YEAR_MONTH_SLUG:
                return `/${defaultPostsDir}/${post.publishedMonth}/${post.slug}.html`;
            case PostUrlStyle.POSTS_YEAR_SLUG:
                return `/${defaultPostsDir}/${post.publishedYear}/${post.slug}.html`;
            case PostUrlStyle.YEAR_MONTH_SLUG:
                return `/${post.publishedMonth}/${post.slug}.html`;
            case PostUrlStyle.YEAR_SLUG:
                return `/${post.publishedYear}/${post.slug}.html`;
            case PostUrlStyle.SLUG:
                return `/${post.slug}.html`;
            case PostUrlStyle.POST_SLUG:
            default:
                return `/${defaultPostsDir}/${post.slug}.html`
        }
    }

    public pug() {
        const compilePugTemplate = this.compilePugTemplate.bind(this);
        const dataSource = this.dataSource;
        const postPartialPath = this.postPartialPath.bind(this);

        return through.obj(function (file, enc, cb) {
            logger.info('Compiling template', file.basename);

            if (file.path.endsWith('post.pug')) {
                for (const post of dataSource.getPosts()) {
                    this.push(new File({
                        base: file.base,
                        path: path.join(file.base, postPartialPath(post)),
                        contents: compilePugTemplate(file, {post})
                    }));
                }
                cb();
            } else if (file.path.endsWith('tag.pug')) {
                for (const tag of dataSource.getTags()) {
                    this.push(new File({
                        base: file.base,
                        path: path.join(file.base, `tags/${tag}.html`),
                        contents: compilePugTemplate(file, {
                            tag,
                            posts: dataSource.getPostsByTag(tag)
                        })
                    }));
                }
                cb();
            } else {
                file.path = file.path.replace('.pug', '.html');
                file.contents = compilePugTemplate(file, {
                        posts: dataSource.getPosts(),
                        latestPosts: dataSource.getPosts().slice(0, 5)
                    }
                );
                cb(null, file);
            }
        });
    }
}

