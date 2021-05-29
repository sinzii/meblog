import {CommandModule} from 'yargs';
import {run} from '../meblog';

export default {
    command: 'draft',
    describe: 'Generate a empty draft post',
    handler: args => {
        run(args, ['newPost']);
    }
} as CommandModule;


