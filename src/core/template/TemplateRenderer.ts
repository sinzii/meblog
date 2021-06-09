import path from 'path';
import File from 'vinyl';
import stream from 'stream';
import ConfigHolder from '../ConfigHolder';
import DataSource from '../source/DataSource';
import logger from 'gulplog';
import { Post } from '../post/Post';
import PageTemplate from '../template/PageTemplate';
import PostTemplate from '../template/PostTemplate';
import TagTemplate from '../template/TagTemplate';
import GulpUtils from '../util/GulpUtils';

export default class TemplateRenderer extends ConfigHolder {
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        super(dataSource.config);

        this.dataSource = dataSource;
    }

    private render(Template: typeof PageTemplate, locale?: string): stream.Transform {
        const dataSource = this.dataSource;

        return GulpUtils.through(function (file, enc, cb) {
            file.locale = locale;
            const template: PageTemplate = new Template(dataSource, file);

            logger.debug('Render template', template.templateName);

            try {
                const files: File[] = template.render();
                files.forEach((file) => this.push(file));

                cb();
            } catch (e) {
                cb(GulpUtils.error(e));
            }
        });
    }

    public renderTags(locale?: string): stream.Transform {
        return this.render(TagTemplate, locale);
    }

    public renderPosts(locale?: string): stream.Transform {
        return this.render(PostTemplate, locale);
    }

    public renderPages(locale?: string): stream.Transform {
        return this.render(PageTemplate, locale);
    }

    public renderSpecifiedPosts(posts: Post[]): stream.Transform {
        const dataSource = this.dataSource;

        return GulpUtils.through(function (file, enc, cb) {
            const template: PostTemplate = new PostTemplate(dataSource, file);

            logger.debug('Render template', template.templateName);

            try {
                const files: File[] = template.renderPosts(posts);

                files.forEach((file) => this.push(file));

                cb();
            } catch (e) {
                cb(GulpUtils.error(e));
            }
        });
    }
}
