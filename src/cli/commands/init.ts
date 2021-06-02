import path from 'path';
import fs from 'fs';
import { CommandModule } from 'yargs';
import logger from 'gulplog';
import gulp from 'gulp';
import through from 'through2';
import File from 'vinyl';
import ansi from 'ansi-colors';

const DEFAULT_TEMPLATE_NAME = 'meblog';

const getProjectTemplatePath = (template = DEFAULT_TEMPLATE_NAME) => {
    const projectTemplatePath = path.join(
        __dirname,
        `../../../templates/${template}`,
    );

    if (!fs.existsSync(projectTemplatePath)) {
        throw new Error(
            `Project template ${ansi.red(template)} is not existed`,
        );
    }

    return projectTemplatePath;
};

const getProjectPath = (args) => {
    const { outdir, name } = args;
    return path.resolve(process.cwd(), outdir || name);
};

const isInitInCurrentDir = (args) => {
    return process.cwd() === getProjectPath(args);
};

const customizeOnCopying = (destination, args) => {
    const { name: projectName } = args;

    const hasPackageJsonFile = fs.existsSync(
        path.join(destination, 'package.json'),
    );

    return through.obj(function (file: File, enc, cb) {
        if (file.basename === 'package.json') {
            if (hasPackageJsonFile) {
                cb();
                return;
            } else {
                // Update project name in package.json
                const packageJson = JSON.parse(file.contents.toString());
                packageJson.name = projectName;

                file.contents = Buffer.from(
                    JSON.stringify(packageJson, null, 2),
                );
            }
        }

        cb(null, file);
    });
};

const copyProjectTemplateToTargetPath = (src, destination, args) => {
    gulp.src(`${src}/**/*`, { dot: true })
        .pipe(customizeOnCopying(destination, args))
        .pipe(gulp.dest(destination));
};

const initProject = (args) => {
    const { template, name: projectName } = args;

    logger.info(
        `Initializing the project with name ${ansi.blue(projectName)}\
 using template ${ansi.blue(template)}`,
    );

    const projectTemplatePath = getProjectTemplatePath(template);
    const projectPath = getProjectPath(args);
    copyProjectTemplateToTargetPath(projectTemplatePath, projectPath, args);

    const initCurrentDir = isInitInCurrentDir(args);

    logger.info(ansi.green('Project initialization succeed'));
    const steps = [
        `\t${ansi.green('meblog')} ${ansi.blue('sample')}: ${ansi.cyan(
            'To generate sample posts',
        )}\n`,
        `\t${ansi.green('meblog')} ${ansi.blue('serve')}: ${ansi.cyan(
            'To start development server',
        )}`,
    ];

    if (!initCurrentDir) {
        steps.unshift(
            `\t${ansi.green('cd')} ${ansi.blue(
                `${path.basename(projectPath)}`,
            )}\n`,
        );
    }

    logger.info(
        `\nNext steps:
${steps.join('')}
`,
    );
};

export default {
    command: 'init [name]',
    describe: 'Init the project',
    builder: (yargs) => {
        yargs
            .positional('name', {
                type: 'string',
                describe: 'Project name',
            })
            .option('template', {
                type: 'string',
                describe: 'Project template name, default: meblog',
                alias: 't',
            })
            .option('outdir', {
                type: 'string',
                describe: 'Customize output directory',
                alias: 'o',
            })
            .check((args) => {
                // if name and ourdir is not provided
                // the project will be initialized in current dir
                // with the name of current folder name.
                if (!args['name'] && !args['outdir']) {
                    args['outdir'] = '.';
                }

                const initCurrentDir = isInitInCurrentDir(args);
                if (initCurrentDir) {
                    args['name'] = path.basename(process.cwd());
                }

                const { name } = args;
                if (!name) {
                    throw new Error('Project name is required');
                }
                if (name.length < 3) {
                    throw new Error(`Project name "${name}" is too short`);
                }

                if (!args['template']) {
                    args['template'] = DEFAULT_TEMPLATE_NAME;
                }

                return true;
            });
    },
    handler: initProject,
} as CommandModule;
