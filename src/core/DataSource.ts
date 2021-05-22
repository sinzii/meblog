import {Config, IPost, Tag} from "./model";
import ConfigHolder from "./ConfigHolder";

export default abstract class DataSource extends ConfigHolder {
    protected constructor(config: Config) {
        super(config);
    }

    public abstract getPosts(): IPost[];
    public abstract getTags(): Tag[];
    public abstract getPostsByTag(tag: Tag): IPost[];
}
