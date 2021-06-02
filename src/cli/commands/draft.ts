import { CommandModule } from 'yargs';
import { run } from '../meblog';
import logger from 'gulplog';

export default {
    command: 'draft',
    describe: 'Generate a empty draft post',
    handler: (args) => {
        run(args, ['newDraft']).catch((err: Error) => {
            logger.error(err);
        });
    },
} as CommandModule;
