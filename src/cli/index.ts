import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';
import * as commands from './commands';
import {initLogger} from './log';

const cli = () => {
    initLogger();

    yargs(hideBin(process.argv))
        .scriptName('meblog')
        .command(commands.init)
        .command(commands.sample)
        .command(commands.draft)
        .command(commands.serve)
        .command(commands.build)
        .showHelpOnFail(true)
        .help('help', 'Show help instructions')
        .alias('h', 'help')
        .alias('v', 'version')
        .option('config', {
            alias: 'c',
            type: 'string',
            description: 'Config file path',
        })
        .epilog(`More information at: https://github.com/sinzii/meblog`)
        .strictCommands()
        .demandCommand(1)
        .argv;
}

export default cli;

if (require.main === module) {
    cli();
}
