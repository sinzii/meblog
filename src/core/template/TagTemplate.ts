import PageTemplate from './PageTemplate';
import {Tag} from '../model';
import StringUtils from '../util/StringUtils';
import File from 'vinyl';
import path from "path";

export default class TagTemplate extends PageTemplate {
    render(): File[] {
        return this.getTags().map(tag => this.renderTag(tag));
    }

    getTags(): Tag[] {
        const {predefinedTags = ''} = this.config;

        return StringUtils.collectTags(
            [predefinedTags, this.dataSource.getTags()]
        );
    }

    renderTag(tag: Tag): File {
        return new File({
            base: this.template.base,
            path: path.join(this.template.base, `tags/${tag}.html`),
            contents: this.compile(this.template, {
                tag,
                postsByTag: this.dataSource.getPostsByTag(tag)
            })
        })
    }
}
