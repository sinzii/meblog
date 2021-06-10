import { CommandModule } from 'yargs';
import { run } from '../meblog';
import logger from 'gulplog';

export default {
    command: 'serve',
    describe: 'Start local development server',
    builder: (yargs) => {
        yargs
            .option('no-open', {
                type: 'boolean',
                alias: 'n',
                describe: "Don't open browser automatically on serve",
            })
            .option('port', {
                type: 'number',
                alias: 'p',
                describe: 'Customize serving port, default: 3000',
            })
            .option('auto-update-i18n-files',  {
                type: 'boolean',
                alias: 'i',
                describe: 'Auto update missing translations in i18n files, default: false'
            });
    },
    handler: (args) => {
        run(args, ['cleanCache', 'serve']).catch((err: Error) => {
            logger.error(err);
        });
    },
} as CommandModule;
