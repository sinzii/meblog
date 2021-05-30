import {IPost, Tag} from "./model";
import moment from 'moment';

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

        if (typeof post.publishedAt === 'string') {
            post.publishedAt = new Date(post.publishedAt);
        }

        if (typeof post.tags === 'string') {
            post.tags = post.tags.split(',').map(t => t.trim());
        }

        Object.assign(this, post);
    }

    get publishedMonth(): string {
        return moment(this.publishedAt).format('YYYY/MM');
    }

    get publishedYear(): string {
        return moment(this.publishedAt).format('YYYY');
    }
}
