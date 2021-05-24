import {Config, Tag} from "./model";
import ConfigHolder from "./ConfigHolder";
import {Post} from './Post';

export default abstract class DataSource extends ConfigHolder {
    protected constructor(config: Config) {
        super(config);
    }

    public abstract getPosts(): Post[];
    public abstract getTags(): Tag[];
    public abstract getPostsByTag(tag: Tag): Post[];
}
