import path from "path";
import fs from "fs";
import logger from 'gulplog';
import SiteGenerator from '../core/SiteGenerator';
import {Config} from '../core/model';
import ansi from 'ansi-colors';

export const loadConfig = (args: any): Config => {
    const cwd = process.cwd();
    let configFile = args['config'] || './config.js';
    const configFilePath = path.resolve(cwd, configFile);
    if (!fs.existsSync(configFilePath)) {
        throw new Error('config.js file is required');
    }

    logger.info('Load config file from:', ansi.blue(configFile));

    const config = require(configFilePath);
    config.rootDir = process.cwd();
    config.devMode = true;

    return config;
}

export const run = (args: any, tasks: string[]) => {
    const config = loadConfig(args);
    const generator = new SiteGenerator(config, args);
    generator.initTasks();
    generator.run(tasks);
}
