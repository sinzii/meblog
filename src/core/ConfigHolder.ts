import {Config} from "./model";

export default class ConfigHolder {
    private readonly _config: Config;

    constructor(config: Config) {
        if (!config) {
            throw new Error("Missing config");
        }

        this._config = config;
    }

    get config(): Config {
        return this._config;
    }
}
