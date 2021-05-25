import {Post} from "./Post";

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

const heading = (min = 3, max = 12) => {
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

        post.body = faker.datatype.boolean()
            ? pickSampleMd()
            : markdownBody();

        post.excerpt = faker.lorem.sentence(
            faker.datatype.number({min: 20, max: 35})
        );

        return post;
    }

    private toMarkdownPost(post: Post): string {
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

    public markdownPost(): string {
        return this.toMarkdownPost(this.post());
    }

    public posts(numberOfPost = 10): Post[] {
        return [...Array(numberOfPost)].map(() => this.post());
    }

    public markdownPosts(numberOfPost = 10): string[] {
        return this.posts(numberOfPost).map(this.toMarkdownPost);
    }

    public generateMarkdownPostsAndSave(numberOfPost = 10,
                                        dirPath: string = ''): void {
        if (fs.existsSync(dirPath)) {
            del.sync(path.join(dirPath, './*'));
        } else {
            fs.mkdirSync(dirPath);
        }

        const posts = this.markdownPosts(numberOfPost);
        posts.forEach((content, index) => {
            const filePath = path.join(dirPath, `${index + 1}.md`);
            fs.writeFileSync(filePath, content);
        });
    }
}
