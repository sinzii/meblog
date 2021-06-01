import pug from 'pug';
import File from 'vinyl';
import DataSource from '../source/DataSource';
import ConfigHolder from '../ConfigHolder';

export default class Template extends ConfigHolder {
    protected dataSource: DataSource;
    protected template: File;

    constructor(dataSource: DataSource, template: File) {
        super(dataSource.config);
        this.dataSource = dataSource;
        this.template = template;
    }

    render(): File[] {
        const output: File = this.template.clone();
        output.path = output.path.replace(output.extname, '.html');
        output.contents = this.compile(output);

        return [output];
    }

    get templateName(): string {
        return Template.getTemplateName(this.template);
    }

    static getTemplateName(file: File): string {
        return file.basename.replace(file.extname, '');
    }

    protected compile(file: File, data?: any): Buffer {
        const options = {
            pretty: this.config.devMode,
            filename: file.path
        };

        const pugFn = pug.compile(String(file.contents), options);

        const compiled = pugFn({
            ...this.config,
            ...data,
            posts: this.dataSource.getPosts(),
            tags: this.dataSource.getTags(),
            templateName: this.templateName,
            formatDateTime: this.formatDateTime.bind(this),
            formatDate: this.formatDate.bind(this),
            rootUrl: this.rootUrl.bind(this),
            url: this.url.bind(this),
            postUrl: this.postUrl.bind(this),
            postRootUrl: this.postRootUrl.bind(this)
        });

        return Buffer.from(compiled);
    }
}
