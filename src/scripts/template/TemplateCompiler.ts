import File from 'vinyl';
import * as _ from 'lodash';
import * as path from 'path';
import pug from 'pug';
import through from 'through2';
import ConfigHolder from "../core/ConfigHolder";
import DataSource from "../data/DataSource";

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

        const compiled = template({
            ..._.pick(this.config, ['baseUrl', 'siteName']),
            ...data
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
                        contents: compilePugTemplate(file, {tag, posts: dataSource.getPostsByTag(tag)})
                    }));
                }
                cb();
            } else {
                file.path = file.path.replace('.pug', '.html');
                file.contents = compilePugTemplate(file, {posts: dataSource.getPosts()});
                cb(null, file);
            }
        });
    }
}

