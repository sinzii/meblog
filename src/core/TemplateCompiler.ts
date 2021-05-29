import File from 'vinyl';
import path from 'path';
import pug from 'pug';
import through from 'through2';
import ConfigHolder from "./ConfigHolder";
import DataSource from "./DataSource";
import logger from 'gulplog';
import {Post} from './Post';


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

        const compiled = template({
            ...config,
            templateName,
            ...data,
            formatDateTime: this.formatDateTime.bind(this),
            formatDate: this.formatDate.bind(this),
            rootUrl: this.rootUrl.bind(this),
            url: this.url.bind(this),
            postUrl: this.postUrl.bind(this),
            postRootUrl: this.postRootUrl.bind(this)
        });

        return Buffer.from(compiled);
    }



    public pugPosts(posts: Post[]) {
        const compilePugTemplate = this.compilePugTemplate.bind(this);
        const postPartialPath = this.postPartialPath.bind(this);

        return through.obj(function (file, enc, cb) {
            logger.info('Compiling template', file.basename);

            if (file.path.endsWith('post.pug')) {
                for (const post of posts) {
                    this.push(new File({
                        base: file.base,
                        path: path.join(file.base, postPartialPath(post)),
                        contents: compilePugTemplate(file, {post})
                    }));
                }
            }

            cb();
        });
    }

    public pug() {
        const config = this.config;
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
                const latestPosts = config.latestPosts || 5;
                file.path = file.path.replace('.pug', '.html');
                file.contents = compilePugTemplate(file, {
                        posts: dataSource.getPosts(),
                        latestPosts: dataSource.getPosts().slice(0, latestPosts)
                    }
                );
                cb(null, file);
            }
        });
    }
}

