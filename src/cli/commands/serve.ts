import {CommandModule} from 'yargs';
import {run} from '../meblog';
import logger from 'gulplog';

export default {
    command: 'serve',
    describe: 'Start local development server',
    handler: args => {
        logger.info('Starting local development server');
        run(args, ['cleanCache', 'dev', 'serve']);
    }
} as CommandModule;
