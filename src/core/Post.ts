import {IPost, Tag} from "./model";
import * as faker from 'faker';

export class Post {
    title: string;
    slug: string;
    publishedAt: Date;
    tags: Tag[];
    excerpt: string;
    body: string;

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

        if (!post.slug) {
            post.slug = faker.helpers.slugify(post.title);
        }

        Object.assign(this, post);
    }
}
