import PageTemplate from './PageTemplate';
import File from 'vinyl';
import path from 'path';
import { Post } from '../post/Post';

export default class PostTemplate extends PageTemplate {
    render(): File[] {
        return this.renderPosts(this.dataSource.getPosts(this.template.locale));
    }

    renderPosts(posts: Post[]): File[] {
        return posts
            .filter((p) => p.layout === this.templateName)
            .map((p) => this.renderPost(p));
    }

    renderPost(post: Post): File {
        if (!this.template.locale) {
            this.template.locale = post.language;
        }

        return new File({
            base: this.template.base,
            path: path.join(this.template.base, this.postPartialPath(post)),
            contents: this.compile(this.template, { post }),
        });
    }
}
