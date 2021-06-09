import pug from 'pug';
import File from 'vinyl';
import i18n from 'i18n';
import DataSource from '../source/DataSource';
import ConfigHolder from '../ConfigHolder';
import FileUtils from '../util/FileUtils';

export default class PageTemplate extends ConfigHolder {
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
        return PageTemplate.getTemplateName(this.template);
    }

    static getTemplateName(file: File): string {
        return FileUtils.basenameWithoutExt(file.path);
    }

    protected compile(file: File, data?: { [prop: string]: unknown }): Buffer {
        const options = {
            pretty: this.config.devMode,
            filename: file.path,
        };

        const pugFn = pug.compile(String(file.contents), options);
        const locale = file.locale;

        const templateData = {
            ...this.config,
            ...data,
            allPosts: this.dataSource.getAllPosts(),
            posts: this.dataSource.getPosts(locale),
            tags: this.dataSource.getTags(),
            templateName: this.templateName,
            formatDateTime: this.formatDateTime.bind(this),
            formatDate: this.formatDate.bind(this),
            rootUrl: this.rootUrl.bind(this),
            url: this.url.bind(this),
            postUrl: this.postUrl.bind(this),
            postRootUrl: this.postRootUrl.bind(this),
            tagUrl: this.tagUrl.bind(this),
            tagRootUrl: this.tagRootUrl.bind(this),
            locale
        };

        Object.assign(templateData, this.getI18nUtils());

        const compiled = pugFn(templateData);

        return Buffer.from(compiled);
    }

    protected i18nFnToPickup = [
        '__',
        '__n',
        '__l',
        '__h',
        '__mf',
    ]

    protected getI18nUtils() {
        return this.i18nFnToPickup.reduce((obj, name) => {
            obj[name] = i18n[name].bind(i18n);
            return obj;
        }, {});
    }
}
