import path from "path";
import fs from "fs";
import {CommandModule} from 'yargs';
import logger from 'gulplog';
import gulp from 'gulp';
import through from 'through2';
import File from 'vinyl';
import ansi from 'ansi-colors';

const DEFAULT_TEMPLATE_NAME = 'meblog';

const getProjectTemplatePath = (template = DEFAULT_TEMPLATE_NAME) => {
    const projectTemplatePath = path.join(
        __dirname, `../../../project-templates/${template}`
    );

    if (!fs.existsSync(projectTemplatePath)) {
        throw new Error(`Project template ${ansi.red(template)} is not existed`);
    }

    return projectTemplatePath;
}

const getProjectPath = (projectName) => {
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
        throw new Error(`Directory ${ansi.blue(projectName)} is already existed`);
    }

    return projectPath;
}

const customizeOnCopying = args => {
    const {
        name: projectName
    } = args;

    return through.obj(function (file: File, enc, cb) {
        // Update project name in package.json
        if (file.basename === 'package.json') {
            const packageJson = JSON.parse(file.contents.toString());
            packageJson.name = projectName;

            file.contents = Buffer.from(JSON.stringify(packageJson, null, 2));
        }

        cb(null, file);
    })
}

const copyProjectTemplateToTargetPath = (src, destination, args) => {
    gulp.src(`${src}/**/*`)
        .pipe(customizeOnCopying(args))
        .pipe(gulp.dest(destination));
}

const initProject = args => {
    const {
        template,
        name: projectName
    } = args;

    logger.info(
        `Initializing the project with name ${ansi.blue(projectName)}\
 at using template ${ansi.blue(template)}`
    );

    const projectTemplatePath = getProjectTemplatePath(template);
    const projectPath = getProjectPath(projectName);
    copyProjectTemplateToTargetPath(projectTemplatePath, projectPath, args);

    logger.info(ansi.green('Project initialization succeed'));
    logger.info(
`\nNext steps:
    1. ${ansi.green('cd')} ${ansi.blue(`${projectName}`)}
    2. ${ansi.green('meblog')} ${ansi.blue('sample')}: ${ansi.cyan('To generate sample posts')}
    3. ${ansi.green('meblog')} ${ansi.blue('serve')}: ${ansi.cyan('To start development server')}
`)
}

export default {
    command: "init <name>",
    describe: "Init the project",
    builder: yargs => {
        yargs
            .positional('name', {
                type: 'string',
                describe: 'Project name'
            })
            .option('template', {
                type: 'string',
                describe: 'Project template name, default: meblog',
                alias: 't'
            })
            .check(args => {
                if (!args['name']) {
                    throw new Error('Project name is required');
                }

                if (!args['template']) {
                    args['template'] = DEFAULT_TEMPLATE_NAME;
                }

                return true;
            });
    },
    handler: initProject
} as CommandModule
