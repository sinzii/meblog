import { run } from '../meblog';
import { CommandModule } from 'yargs';
import logger from 'gulplog';

export default {
    command: 'sample',
    describe: 'Generate sample posts',
    builder: (yargs) => {
        yargs.option('number-of-posts', {
            type: 'number',
            alias: 'n',
            describe: 'Number of posts to generate, default: 10',
        });
    },
    handler: (args) => {
        run(args, ['generateSamplePosts']).catch((err: Error) => {
            logger.error(err);
        });
    },
} as CommandModule;
