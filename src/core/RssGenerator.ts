import * as fs from 'fs';
import * as path from 'path';
import ConfigHolder from './ConfigHolder';
import DataSource from './DataSource';
import {Post} from './Post';
import logger from 'gulplog';

export default class RssGenerator extends ConfigHolder {
    private readonly dataSource: DataSource;
    constructor(dataSource: DataSource) {
        super(dataSource.config);
        this.dataSource = dataSource;
    }

    public generate(outputDir: string) {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, {recursive: true});
        }

        const filePath = path.join(outputDir, './rss.xml');
        const content = this.generateRssContent();
        fs.writeFileSync(filePath, content);
        logger.info('Rss feed generated at:', filePath);
    }

    private generateRssContent() {
        return '<rss version="2.0">' +
    '<channel>' +
        `<title>${this.config.siteName}</title>` +
        `<link>${this.config.baseUrl}</link>` +
        `<description>${this.config.siteDescription}</description>` +
        this.generateItemFeeds() +
    '</channel>' +
'</rss>';
    }

    private generateItemFeeds(): string {
        return this.dataSource
            .getPosts()
            .map(p => this.getItemFeed(p))
            .join('');
    }

    private getItemFeed(post: Post): string {
        const postUrl = this.postRootUrl(post);
        return '<item>' +
    `<title>${post.title}</title>` +
    `<link>${postUrl}</link>` +
    `<description><![CDATA["${post.excerpt}"]]></description>` +
    `<guid>${postUrl}</guid>` +
    `<pubDate>${this.formatRFC822DateTime(post.publishedAt)}</pubDate>` +
            this.getItemCategories(post) +
'</item>';
    }

    private getItemCategories(post: Post) {
        return post.tags.map(tag => `<category>${tag}</category>`).join('');
    }
}
