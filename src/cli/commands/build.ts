import { CommandModule } from 'yargs';
import { run } from '../meblog';
import logger from 'gulplog';

export default {
    command: 'build',
    describe: 'Build for production',
    builder: (yargs) => {
        yargs.option('outdir', {
            type: 'string',
            describe: 'Output destination, default ./docs',
            alias: 'o',
        }).argv;
    },
    handler: (args) => {
        run(args, ['cleanCache', 'prod', 'build']).catch((err: Error) => {
            logger.error(err);
        });
    },
} as CommandModule;
