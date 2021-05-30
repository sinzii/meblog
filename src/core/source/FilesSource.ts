import fs from 'fs';
import path from 'path';
import glob from 'glob';
import logger from 'gulplog';

import DataSource from './DataSource';
import {Config, IPost, Tag} from '../model';
import {Post} from '../post/Post';
import Renderer from '../markdown/Renderer';
import MarkdownItRenderer from '../markdown/MarkdownItRenderer';

export default class FilesSource extends DataSource {
    private readonly postsDirectoryPath: string;
    private readonly dataDirectoryPath: string;
    private readonly separator: string;
    private readonly mdRenderer: Renderer;

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
        this.separator = separator;
        this.mdRenderer = new MarkdownItRenderer();
    }

    get postsJsonPath(): string {
        return path.join(this.dataDirectoryPath, 'posts.json');
    }

    get tagsJsonPath(): string {
        return path.join(this.dataDirectoryPath, 'tags.json');
    }

    private getSourcePostPaths(): string[] {
        return glob.sync(`${this.postsDirectoryPath}/**/*.md`);
    }

    private hasAnyChanges(): boolean {
        if (!fs.existsSync(this.postsJsonPath)) {
            logger.info('data/posts.json is not existed');
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

    private parseMarkdownPost(filePath: string): Post {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Markdown post is not existed at ${filePath}`);
        }

        let content = fs.readFileSync(filePath).toString();

        const post: any = {};
        post.markdown = content;
        post.slug = this.extractFileName(filePath);

        let separatorCounter = 0;
        const metaLines: string[] = [];

        while (true) {
            const index = content.indexOf('\n');
            if (index < 0) {
                break;
            }

            const line = content.substring(0, index).trim();

            content = content.substring(index + 1);

            if (line === this.separator) {
                separatorCounter += 1;

                if (separatorCounter === 2) {
                    post.body = this.mdRenderer.render(content);
                    break;
                } else {
                    continue;
                }
            }

            if (separatorCounter <= 1) {
                metaLines.push(line);
            }
        }

        metaLines.forEach(line => {
            const colonIndex = line.indexOf(':');
            const metaName = line.substring(0, colonIndex).trim();
            const metaValue = line.substring(colonIndex + 1).trim();

            post[metaName] = metaValue;
        });

        return new Post(post);
    }

    private parse(): { posts: Post[], tags: Tag[] } {
        const files = this.getSourcePostPaths();

        const posts: Post[] = files
            .map(file => this.parseMarkdownPost(file))
            .filter(p => p.title && p.publishedAt && p.slug);

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

        const {posts, tags} = this.parse();

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

    public parsePostsFromPaths(filePaths: string[]): Post[] {
        return filePaths
            .filter(file => fs.existsSync(file))
            .map(file => this.parseMarkdownPost(file));
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

    private extractFileName(filePath: string) {
        const fileName = path.basename(filePath, '.md');

        return fileName.replace(/[^\w-]*/gm, '');
    }
}
