import config from './config';
import SiteGenerator from './src/core/SiteGenerator';

// be default dev mode is on
config.devMode = true;

const args = require('minimist')(process.argv.slice(2));

new SiteGenerator(config, args).initTasks();
