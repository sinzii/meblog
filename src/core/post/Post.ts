import { IPost, Tag } from '../model';
import moment from 'moment';
import logger from 'gulplog';
import ansi from 'ansi-colors';
import StringUtils from '../util/StringUtils';

export class Post {
    title: string;
    slug: string;
    publishedAt: Date;
    tags: Tag[];
    excerpt: string;
    body: string;
    markdown: string;
    layout?: string;
    url?: string;
    relativeUrl?: string;
    [prop: string]: any;

    constructor(post?: IPost) {
        this.copyInto(post);
    }

    copyInto(post?: IPost) {
        if (!post) {
            return;
        }

        this.convertPublishedDate(post);

        post.tags = StringUtils.collectTags(post.tags);

        if (!post.layout) {
            post.layout = 'post'; // use default layout if does not set one
        }

        Object.assign(this, post);
    }

    private convertPublishedDate(post: IPost): void {
        if (post.publishedAt instanceof Date) {
            return;
        }

        const date = new Date(String(post.publishedAt));
        if (isNaN(date.getTime())) {
            logger.info(`${ansi.red('Invalid date')}\
 ${ansi.green(post.publishedAt)} from post ${ansi.green(post.title)},\
  this post will be ignore from showing`);
            post.publishedAt = null;
            return;
        }

        post.publishedAt = date;
    }

    get publishedMonth(): string {
        return moment(this.publishedAt).format('YYYY/MM');
    }

    get publishedYear(): string {
        return moment(this.publishedAt).format('YYYY');
    }
}
