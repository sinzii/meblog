const fs = require('fs');
const path = require('path');
const glob = require('glob');
const marked = require('marked');
const faker = require('faker');

const POSTS_GLOB = path.join(__dirname, '../../posts/**/*.md');
const SEPARATOR = "---";
const parse = () => {
    const files = glob.sync(POSTS_GLOB);

    const posts = [];
    const tagNames = [];
    for (const filePath of files) {
        const content = fs.readFileSync(filePath).toString();
        const parts = content.split(SEPARATOR);

        const meta = JSON.parse(parts.shift());
        meta.publishedAt = new Date(meta.publishedAt);
        meta.tags = meta.tags.split(",").map(t => t.trim());
        tagNames.push(...meta.tags);

        if (!meta.slug) {
            meta.slug = faker.helpers.slugify(meta.title).toLowerCase();
        }

        const excerpt = parts.shift().trim();
        const body = parts.join(SEPARATOR).trim();

        posts.push({
            ...meta,
            excerpt,
            body: marked(body)
        });
    }

    // sorting the posts, newer post will appear first
    posts.sort((p1, p2) => p2.publishedAt.getTime() - p1.publishedAt.getTime());

    const tagPool = [...new Set(tagNames)];
    const tags = {};
    for (const tag of tagPool) {
        tags[tag] = posts.filter(p => p.tags.includes(tag)).map(p => p.slug);
    }

    const postsPath = path.join(__dirname, '../../data/posts.json');
    const tagsPath = path.join(__dirname, '../../data/tags.json');

    fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
    fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2));
}

parse();
