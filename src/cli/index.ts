import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';
import * as commands from './commands';
import {initLogger} from './log';
import {repository, version} from '../../package.json';

export default () => {
    initLogger();

    yargs(hideBin(process.argv))
        .scriptName('meblog')
        .command(commands.init)
        .command(commands.sample)
        .command(commands.draft)
        .command(commands.serve)
        .command(commands.build)
        .showHelpOnFail(true)
        .help('help', 'Show help instructions & exist')
        .alias('h', 'help')
        .version('version', 'Show version number & exist', version)
        .alias('v', 'version')
        .option('config', {
            alias: 'c',
            type: 'string',
            description: 'Config file path',
        })
        .epilog(`More information at: ${repository.url}`)
        .strictCommands()
        .demandCommand(1)
        .argv;
}
