import Template from './Template';
import File from 'vinyl';
import path from "path";
import {Post} from '../post/Post';

export default class PostTemplate extends Template {
    render(): File[] {
        return this.renderPosts(this.dataSource.getPosts());
    }

    renderPosts(posts: Post[]): File[] {
        return posts
            .filter(p => p.layout === this.templateName)
            .map(p => this.renderPost(p))
    }

    renderPost(post): File {
        return new File({
            base: this.template.base,
            path: path.join(this.template.base, this.postPartialPath(post)),
            contents: this.compile(this.template, {post})
        });
    }
}
