import {Config, PostUrlStyle} from "./model";
import moment from 'moment';
import 'moment-timezone';
import {Post} from './post/Post';

export default class ConfigHolder {
    private readonly _config: Config;

    constructor(config: Config) {
        if (!config) {
            throw new Error("Missing config");
        }

        this._config = config;
    }

    get config(): Config {
        return this._config;
    }

    public rootUrl(path): string {
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

    public url(path: string): string {
        const {baseContext = ''} = this.config;
        return `${baseContext}${path}`;
    }

    public postPartialPath(post: Post): string {
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

    postUrl(post: Post): string {
        return this.url(this.postPartialPath(post));
    }

    postRootUrl(post: Post): string {
        return this.rootUrl(this.postPartialPath(post));
    }

    formatDateTime(date: Date): string {
        return moment(date).format(this.config.dateTimeFormat)
    }

    formatDate(date: Date): string {
        return moment(date).format(this.config.dateFormat)
    }

    formatRFC822DateTime(date: Date): string {
        return moment(date).tz('UTC').format('ddd, DD MMM YYYY HH:mm:ss ZZ');
    }
}
