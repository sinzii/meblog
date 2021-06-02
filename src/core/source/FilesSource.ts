import fs from 'fs';
import path from 'path';
import glob from 'glob';
import logger from 'gulplog';
import ansi from 'ansi-colors';

import DataSource from './DataSource';
import {Config, IPost, Tag} from '../model';
import {Post} from '../post/Post';
import PostParser from '../post/PostParser';
import MarkdownPostParser from '../post/MarkdownPostParser';
import FileUtils from '../util/FileUtils';

export default class FilesSource extends DataSource {
    private readonly postsDirectoryPath: string;
    private readonly dataDirectoryPath: string;
    private readonly separator: string;
    private readonly postParser: PostParser;
    private readonly postLayouts: string[];

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
        this.dataDirectoryPath = path.resolve(this.postsDirectoryPath, '../cache');
        this.separator = separator;
        this.postParser = new MarkdownPostParser();
        this.postLayouts = this.getLayouts();
    }

    get postsJsonPath(): string {
        return path.join(this.dataDirectoryPath, 'posts.json');
    }

    get tagsJsonPath(): string {
        return path.join(this.dataDirectoryPath, 'tags.json');
    }

    private getLayouts(): string[] {
        return glob
            .sync(path.join(this.config.rootDir, './templates/posts/*.pug'))
            .map(file => FileUtils.basenameWithoutExt(file));
    }

    private filterInvalidPostLayout(post: Post): boolean {
        if (!this.postLayouts.includes(post.layout)) {
            logger.info(`Post ${ansi.green(post.title)}\
 has ${ansi.red(`invalid layout \"${post.layout}\" will be ignored`)}`)

            return false;
        }

        return true;
    }

    private getSourcePostPaths(): string[] {
        return glob.sync(`${this.postsDirectoryPath}/**/*.md`);
    }

    private hasAnyChanges(): boolean {
        if (!fs.existsSync(this.postsJsonPath)) {
            logger.debug('Cache data is not found');
            return true;
        }
        const postsJsonLastModifiedAt = fs.statSync(this.postsJsonPath).mtimeMs;

        const files = this.getSourcePostPaths();
        for (const filePath of files) {
            const lastModifiedAt = fs.statSync(filePath).mtimeMs;

            if (lastModifiedAt > postsJsonLastModifiedAt) {
                logger.info('New post change at file:', filePath);
                return true;
            }
        }

        return false;
    }

    private parse(): { posts: Post[], tags: Tag[] } {
        const files = this.getSourcePostPaths();

        const posts: Post[] = this.parsePostsFromPaths(files);

        const tags = posts.flatMap(p => p.tags).filter(t => t);

        // sorting the posts, newer post will appear first
        posts.sort(
            (p1, p2) =>
                p2.publishedAt.getTime() - p1.publishedAt.getTime()
        );

        return {
            posts: posts,
            tags: Array.from(new Set(tags))
        };
    }

    private parsePosts(force = false): void {
        let shouldParse = false;
        if (force || this.hasAnyChanges()) {
            shouldParse = true;
        }

        if (!shouldParse) {
            return;
        }

        const result = this.parse();

        this.cacheData(result);
    }

    private cacheData({posts, tags}) {
        const jsonPrettySpace = this.config.devMode ? 2 : 0;
        if (!fs.existsSync(this.dataDirectoryPath)) {
            fs.mkdirSync(this.dataDirectoryPath);
        }

        fs.writeFileSync(
            this.postsJsonPath,
            JSON.stringify(posts, null, jsonPrettySpace)
        );

        fs.writeFileSync(
            this.tagsJsonPath,
            JSON.stringify(tags, null, jsonPrettySpace)
        );
    }

    private filterUnpublishedPosts(filePath: string): boolean {
        return !FileUtils.basename(filePath).startsWith('__');
    }

    public parsePostsFromPaths(filePaths: string[]): Post[] {
        return filePaths
            .filter(file => this.filterUnpublishedPosts(file))
            .filter(file => fs.existsSync(file))
            .map(file => this.postParser.parse(file, this.separator))
            .filter(p => p.title && p.publishedAt && p.slug)
            .filter(p => this.filterInvalidPostLayout(p));
    }

    public loadData(force = false): void {
        this.parsePosts(force);

        delete require.cache[this.postsJsonPath];
        delete require.cache[this.tagsJsonPath];

        const jsonPosts = require(this.postsJsonPath) as IPost[];
        this.posts = jsonPosts.map(p => new Post(p));
        this.tags = require(this.tagsJsonPath) as Tag[];
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
