import File from 'vinyl';
import * as _ from 'lodash';
import * as path from 'path';
import pug from 'pug';
import through from 'through2';
import ConfigHolder from "./ConfigHolder";
import DataSource from "./DataSource";
import moment from 'moment';

export default class TemplateCompiler extends ConfigHolder {
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        super(dataSource.config);

        this.dataSource = dataSource;
    }

    compilePugTemplate(file: File, data: any) {
        const template = pug.compile(String(file.contents), {
            pretty: this.config.devMode,
            filename: file.path
        });

        const config = this.config;
        const templateName = file.basename.replace(file.extname, '');

        const compiled = template({
            ..._.pick(config, [
                'baseUrl', 'baseContext',
                'siteName', 'siteDescription'
            ]),
            templateName,
            ...data,
            formatDateTime(date: Date) {
                return moment(date).format(config.dateTimeFormat)
            },
            formatDate(date: Date) {
                return moment(date).format(config.dateFormat)
            },
            rootUrl(path) {
                const {baseUrl = '', baseContext = ''} = config;
                let url = path;

                if (baseContext) {
                    url = `/${baseContext}${path}`
                }

                if (baseUrl) {
                    url = baseUrl + url;
                }

                return url;
            },
            url(path: string) {
                const {baseContext = ''} = config;
                return `${baseContext}${path}`;
            }
        });

        return Buffer.from(compiled);
    }

    pug() {
        const compilePugTemplate = this.compilePugTemplate.bind(this);
        const dataSource = this.dataSource;

        return through.obj(function (file, enc, cb) {
            console.log('compiling', file.path);

            if (file.path.endsWith('post.pug')) {
                for (const post of dataSource.getPosts()) {
                    this.push(new File({
                        base: file.base,
                        path: path.join(file.base, `posts/${post.slug}.html`),
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

