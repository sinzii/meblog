import {Config, Post, Tag} from "../core/model";
import ConfigHolder from "../core/ConfigHolder";

export default abstract class DataSource extends ConfigHolder {
    protected constructor(config: Config) {
        super(config);
    }

    public abstract getPosts(): Post[];
    public abstract getTags(): Tag[];
    public abstract getPostsByTag(tag: Tag): Post[];
}
