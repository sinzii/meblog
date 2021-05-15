const fs = require('fs');
const path = require('path');
const moment = require('moment');
const faker = require('faker');
const marked = require('marked');
const glob = require('glob');

const TAG_POOL = ['programming', 'coding', 'engineering', 'life', 'thoughts', 'random', 'opinion', 'DIY', 'stuff'];
const SAMPLE_MD_FILES = glob.sync(path.join(__dirname, '../sample/**/*.md'));
const SAMPLE_MD_CACHE = {};

const heading = (min=3, max=12) => {
    const titleLength = faker.datatype.number({min, max});
    return faker.lorem.sentence(titleLength).replace('.', '');
}

const paragraphs = () => {
    const numberOfParagraphs = faker.datatype.number({min: 3, max: 12});

    const content = [];
    for (let index = 0; index < numberOfParagraphs; index += 1) {
        content.push(faker.lorem.paragraph(faker.datatype.number({min: 1, max: 5})));
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

const post = () => {
    const title = heading();
    const tagCount = faker.datatype.number({min: 1, max: 3});
    const tags = faker.random.arrayElements(TAG_POOL, tagCount)

    return {
        title,
        slug: faker.helpers.slugify(title).toLowerCase(),
        publishedAt: moment(faker.date.past()).format('MMM DD, YYYY - HH:mm'),
        tags,
        excerpt: faker.lorem.sentence(faker.datatype.number({min: 20, max: 35})),
        body: marked(pickSampleMd())
    }
};

const posts = (numberOfPost=1, save=true) => {
    const posts = [];
    for (let index = 0; index < numberOfPost; index += 1) {
        posts.push(post());
    }

    if (save) {
        const filePath = path.join(__dirname, '../data/posts.json');
        fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
    }

    return posts;
}

const tags = (save=true) => {
    const posts = require('../data/posts.json');
    const tags = {};
    for (const tag of TAG_POOL) {
        tags[tag] = posts.filter(p => p.tags.includes(tag));
    }

    if (save) {
        const tagFilePath = path.join(__dirname, '../data/tags.json');
        fs.writeFileSync(tagFilePath, JSON.stringify(tags, null, 2));
    }

    return tags;
}


posts(100);
tags();

// pickSampleMd();
