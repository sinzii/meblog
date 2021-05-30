import {IPost, Tag} from '../model';
import moment from 'moment';
import logger from 'gulplog';
import ansi from 'ansi-colors';

export class Post {
    title: string;
    slug: string;
    publishedAt: Date;
    tags: Tag[];
    excerpt: string;
    body: string;
    markdown: string;

    constructor(post?: IPost) {
        this.copyInto(post);
    }

    copyInto(post?: IPost) {
        if (!post) {
            return;
        }

        this.convertPublishedDate(post);

        if (typeof post.tags === 'string') {
            post.tags = post.tags.split(/[\s,]/gm)
                .filter(t => t)
                .map(t => t.trim());
        }

        Object.assign(this, post);
    }

    private convertPublishedDate(post: IPost) {
        if (post.publishedAt instanceof Date) {
            return;
        }

        const date = new Date(String(post.publishedAt));
        if (isNaN(date.getTime())) {
            logger.error(`${ansi.red('Invalid date')} ${ansi.green(post.publishedAt)} from post ${ansi.green(post.title)},\ this post will be ignore from showing`);
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
