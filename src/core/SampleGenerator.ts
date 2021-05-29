import {Post} from './Post';
import moment from 'moment';
import logger from 'gulplog';

const fs = require('fs');
const path = require('path');
const faker = require('faker');
const glob = require('glob');
const _ = require('lodash');
const del = require('del');

const TAG_POOL = [
    'programming', 'coding', 'engineering', 'life',
    'thoughts', 'random', 'opinion', 'DIY', 'stuff'
];
const SAMPLE_MD_FILES = glob.sync(path.join(__dirname, '../sample/**/*.md'));
const SAMPLE_MD_CACHE = {};

const heading = (min = 3, max = 8) => {
    const titleLength = faker.datatype.number({min, max});
    return faker.lorem.sentence(titleLength).replace('.', '');
}

const paragraphs = () => {
    const numberOfParagraphs = faker.datatype.number({min: 3, max: 12});

    const content = [];
    for (let index = 0; index < numberOfParagraphs; index += 1) {
        content.push(faker.lorem.paragraph(faker.datatype.number({
            min: 1,
            max: 5
        })));
    }

    return content.join('\n\n');
}

const pickSampleMd = () => {
    const randomFile = faker.random.arrayElement(SAMPLE_MD_FILES);

    if (SAMPLE_MD_CACHE[randomFile]) {
        return SAMPLE_MD_CACHE[randomFile];
    }

    const content = fs.readFileSync(randomFile).toString();
    SAMPLE_MD_CACHE[randomFile] = content;

    return content;
}

const markdownBody = () => {
    let body = '';
    const numberOfHeading = faker.datatype.number({min: 3, max: 12});

    for (let index = 0; index < numberOfHeading; index += 1) {
        body += `## ${heading()}\n`;
        body += paragraphs();
        body += '\n\n';
    }

    return body;
}


export default class SampleGenerator {
    public post(): Post {
        const post = new Post();
        post.title = heading();
        post.slug = faker.helpers
            .slugify(post.title)
            .toLowerCase();

        post.publishedAt = faker.date.past();

        post.tags = faker.random.arrayElements(
            TAG_POOL,
            faker.datatype.number({min: 1, max: 3})
        );

        post.body = pickSampleMd();

        post.excerpt = faker.lorem.sentence(
            faker.datatype.number({min: 20, max: 35})
        );

        post.markdown = this.toMarkdown(post);

        return post;
    }

    public emptyPost(): Post {
        const post = new Post();
        post.title = '';
        post.slug = '';
        post.publishedAt = new Date();
        post.tags = [];
        post.body = '';
        post.excerpt = '';

        post.markdown = this.toMarkdown(post);

        return post;
    }

    private toMarkdown(post: Post): string {
        const meta = _.pick(post, ['title', 'slug']);
        meta.publishedAt = post.publishedAt.toISOString();
        meta.tags = post.tags.join(", ");
        meta.excerpt = post.excerpt;

        return `---
${Object.keys(meta).map(prop => `${prop}: ${meta[prop]}`).join('\n')}
---
${post.body}
`;
    }

    public posts(numberOfPost = 10): Post[] {
        return [...Array(numberOfPost)].map(() => this.post());
    }

    public generateMarkdownPostsAndSave(numberOfPost = 10,
                                        dirPath: string): void {
        if (fs.existsSync(dirPath)) {
            del.sync(path.join(dirPath, './*'));
        } else {
            fs.mkdirSync(dirPath);
        }

        const posts = this.posts(numberOfPost);
        posts.forEach((post) => {
            const filePath = path.join(dirPath, post.publishedMonth, post.sampleFileName);
            const monthPath = path.dirname(filePath);
            if (!fs.existsSync(monthPath)) {
                fs.mkdirSync(monthPath, {recursive: true});
            }

            fs.writeFileSync(filePath, post.markdown);
        });
    }

    public generateEmptyMarkdownPostAndSave(dirPath: string): void {
        const post = this.emptyPost();

        const name = 'draft';
        let _try = 0;
        const pickASampleName = (): string => {
            const suffix = _try > 0 ? `-${_try}` : '';
            const tryName = `${name}${suffix}.md`;
            const filePath = path.join(dirPath, post.publishedMonth, tryName);

            if (fs.existsSync(filePath)) {
                _try += 1;
                return pickASampleName();
            }

            return filePath
        }

        const filePath = pickASampleName();
        const monthPath = path.dirname(filePath);
        if (!fs.existsSync(monthPath)) {
            fs.mkdirSync(monthPath, {recursive: true});
        }

        fs.writeFileSync(filePath, post.markdown);

        const postDirName = path.basename(dirPath);
        logger.info(
            ansi.green('A new draft has been generated successfully at:'),
            ansi.blue(`./${postDirName}/${filePath.replace(dirPath, '')}`)
        );
    }
}
