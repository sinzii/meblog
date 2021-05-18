import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as faker from 'faker';
import marked from 'marked';
import moment from 'moment';
import Debug from 'debug';

import DataSource from "./DataSource";
import {Config, Post, Tag} from "./model";
const debug = Debug("/scripts/data/FilesSource");

export default class FilesSource extends DataSource {
    private readonly postsDirectoryPath: string;
    private readonly dataDirectoryPath: string;
    private readonly separator: string;

    private posts: Post[] = [];
    private tags: Tag[] = [];

    constructor(config: Config,
                postsDirectoryPath: string,
                separator: string = '---') {
        super(config);

        if (!fs.existsSync(postsDirectoryPath)) {
            throw new Error('Post directory path is not existed');
        }

        postsDirectoryPath = postsDirectoryPath.trim();
        if (postsDirectoryPath.endsWith('/')) {
            postsDirectoryPath.slice(0, -1);
        }

        this.postsDirectoryPath = postsDirectoryPath;
        this.dataDirectoryPath = path.resolve(this.postsDirectoryPath, '../data');
        // fs.mkdirSync(this.dataDirectoryPath);
        this.separator = separator;
    }

    get postsJsonPath(): string {
        return path.join(this.dataDirectoryPath, 'posts.json');
    }

    get tagsJsonPath(): string {
        return path.join(this.dataDirectoryPath, 'tags.json');
    }

    private getSourcePostPaths(): string[] {
        return glob.sync(`${this.postsDirectoryPath}/*.md`);
    }

    hasAnyChanges(): boolean {
        if (!fs.existsSync(this.postsJsonPath)) {
            debug("data/posts.json is not existed");
            return true;
        }
        const postsJsonLastModifiedAt = fs.statSync(this.postsJsonPath).mtimeMs;

        const files = this.getSourcePostPaths();
        for (const filePath of files) {
            const lastModifiedAt = fs.statSync(filePath).mtimeMs;

            if (lastModifiedAt > postsJsonLastModifiedAt) {
                debug("New post change at file:", filePath);
                return true;
            }
        }

        return false;
    }

    private parse(): {posts: Post[], tags: Tag[]} {
        const files = this.getSourcePostPaths();

        const posts = [];
        const tags = [];
        for (const filePath of files) {
            const content = fs.readFileSync(filePath).toString();
            const parts = content.split(this.separator);

            const meta = JSON.parse(parts.shift()) as Post;
            meta.publishedAt = new Date(meta.publishedAt);

            if (typeof meta.tags === "string") {
                meta.tags = meta.tags.split(",").map(t => t.trim());
            }

            tags.push(...meta.tags);

            if (!meta.slug) {
                meta.slug = faker.helpers.slugify(meta.title).toLowerCase();
            }

            const excerpt = parts.shift().trim();
            const body = parts.join(this.separator).trim();

            posts.push({
                ...meta,
                excerpt,
                body: marked(body)
            });
        }

        // sorting the posts, newer post will appear first
        posts.sort((p1, p2) => p2.publishedAt.getTime() - p1.publishedAt.getTime());

        return {
            posts: posts,
            tags: Array.from(new Set(tags))
        };
    }

    private parsePosts(force=false): void {
        let shouldParse = false;
        if (force || this.hasAnyChanges()) {
            shouldParse = true;
        }

        if (!shouldParse) {
            return;
        }

        const {posts, tags} = this.parse();

        const jsonPrettySpace = this.config.devMode ? 2 : 0;
        if (!fs.existsSync(this.dataDirectoryPath)) {
            fs.mkdirSync(this.dataDirectoryPath);
        }

        fs.writeFileSync(this.postsJsonPath, JSON.stringify(posts, null, jsonPrettySpace));
        fs.writeFileSync(this.tagsJsonPath, JSON.stringify(tags, null, jsonPrettySpace));
    }

    public loadData(force=false): void {
        this.parsePosts(force);

        this.posts = require(this.postsJsonPath);
        this.tags = require(this.tagsJsonPath);

        this.posts.forEach(p => {
            p.publishedAt = moment(p.publishedAt).format(this.config.dateTimeFormat);
        });
    }

    public getPosts(): Post[] {
        return this.posts;
    }

    public getPostsByTag(tag: Tag): Post[] {
        return this.posts.filter(p => p.tags.includes(tag));
    }

    public getTags(): Tag[] {
        return this.tags;
    }
}
