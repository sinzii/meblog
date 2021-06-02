import File from 'vinyl';
import through from 'through2';
import ConfigHolder from '../ConfigHolder';
import DataSource from '../source/DataSource';
import logger from 'gulplog';
import { Post } from '../post/Post';
import PageTemplate from '../template/PageTemplate';
import PostTemplate from '../template/PostTemplate';
import TagTemplate from '../template/TagTemplate';
import stream from 'stream';

export default class TemplateRenderer extends ConfigHolder {
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
        super(dataSource.config);

        this.dataSource = dataSource;
    }

    public render(Template: typeof PageTemplate): stream.Transform {
        const dataSource = this.dataSource;
        return through.obj(function (file, enc, cb) {
            const template: PageTemplate = new Template(dataSource, file);

            logger.debug('Render template', template.templateName);

            const files: File[] = template.render();
            files.forEach((file) => this.push(file));

            cb();
        });
    }

    public renderTags(): stream.Transform {
        return this.render(TagTemplate);
    }

    public renderPosts(): stream.Transform {
        return this.render(PostTemplate);
    }

    public renderPages(): stream.Transform {
        return this.render(PageTemplate);
    }

    public renderSpecifiedPosts(posts: Post[]): stream.Transform {
        const dataSource = this.dataSource;

        return through.obj(function (file, enc, cb) {
            const template: PostTemplate = new PostTemplate(dataSource, file);

            logger.debug('Render template', template.templateName);

            const files: File[] = template.renderPosts(posts);

            files.forEach((file) => this.push(file));

            cb();
        });
    }
}
