import path from 'path';
import moment from 'moment';
import 'moment-timezone';
import { Post } from './post/Post';
import { Config, PostUrlStyle, Tag } from './model';
import i18n from "i18n";

export default class ConfigHolder {
    private readonly _config: Config;

    constructor(config: Config) {
        if (!config) {
            throw new Error('Missing config');
        }

        this._config = config;
    }

    get config(): Config {
        return this._config;
    }

    public rootUrl(urlPath: string, locale?: string): string {
        const { baseUrl = '' } = this.config;
        let url = this.url(urlPath, locale);

        if (baseUrl) {
            url = baseUrl + url;
        }

        return url;
    }

    public url(urlPath: string, locale?: string): string {
        let localePath = locale;
        if (this.isDefaultLocale(locale)) {
            localePath = '';
        }

        const { baseContext = '' } = this.config;
        return path.join('/', baseContext, localePath, urlPath);
    }

    public postPartialPath(post: Post): string {
        const { postUrlStyle } = this.config;
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
            case PostUrlStyle.POSTS_SLUG:
            default:
                return `/${defaultPostsDir}/${post.slug}.html`;
        }
    }

    postUrl(post: Post): string {
        return this.url(this.postPartialPath(post), post.language);
    }

    postRootUrl(post: Post): string {
        return this.rootUrl(this.postPartialPath(post), post.language);
    }

    tagUrl(tag: Tag, locale?: string): string {
        return this.url(`/tags/${tag}.html`, locale);
    }

    tagRootUrl(tag: Tag, locale?: string): string {
        return this.rootUrl(`/tags/${tag}.html`, locale);
    }

    formatDateTime(date: Date, locale?: string): string {
        return moment(date)
            .locale(locale || this.config.defaultLocale)
            .format(this.getDateTimeFormat(locale));
    }

    formatDate(date: Date, locale?: string): string {
        return moment(date)
            .locale(locale || this.config.defaultLocale)
            .format(this.getDateFormat(locale));
    }

    public getI18nFallbackToConfig(name: string, locale?: string): string {
        locale = locale || this.config.defaultLocale;

        if (!this.config.locales.includes(locale)) {
            return this.config[name];
        }

        const currentLocale = i18n['locale'];

        try {
            if (currentLocale !== locale) {
                i18n.setLocale(locale);
            }

            const format = i18n.__(name);
            return format === name
                ? this.config[name]
                : format;
        } finally {
            if (currentLocale !== locale) {
                i18n.setLocale(currentLocale);
            }
        }
    }

    getDateTimeFormat(locale?: string): string {
        return this.getI18nFallbackToConfig('dateTimeFormat', locale);
    }

    getDateFormat(locale?: string): string {
        return this.getI18nFallbackToConfig('dateFormat', locale);
    }

    formatRFC822DateTime(date: Date): string {
        return moment(date).tz('UTC').format('ddd, DD MMM YYYY HH:mm:ss ZZ');
    }

    isDefaultLocale(locale: string): boolean {
        return !locale || locale === this.config.defaultLocale;
    }
}
