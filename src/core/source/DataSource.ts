import { Config, Tag } from '../model';
import ConfigHolder from '../ConfigHolder';
import { Post } from '../post/Post';

export default abstract class DataSource extends ConfigHolder {
    protected constructor(config: Config) {
        super(config);
    }

    public abstract loadData(force?: boolean): void;
    public abstract getPosts(locale?: string): Post[];
    public abstract getAllPosts(): Post[];
    public abstract getTags(): Tag[];
    public abstract getPostsByTag(tag: Tag, locale?: string): Post[];
}
