import fs from 'fs';
import path from 'path';
import i18n from 'i18n';
import ConfigHolder from './ConfigHolder';
import DataSource from './source/DataSource';
import { Post } from './post/Post';
export default class RssGenerator extends ConfigHolder {
    private readonly dataSource: DataSource;
    constructor(dataSource: DataSource) {
        super(dataSource.config);
        this.dataSource = dataSource;
    }

    public generate(outputDir: string, locale: string): void {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filePath = path.join(outputDir, './rss.xml');
        const content = this.generateRssContent(locale);
        fs.writeFileSync(filePath, content);
    }

    private generateRssContent(locale: string) {
        return (
            '<rss version="2.0">' +
            '<channel>' +
            `<title>${this.getI18nFallbackToConfig('siteName', locale)}</title>` +
            `<link>${this.config.baseUrl}</link>` +
            `<description>${this.getI18nFallbackToConfig('siteDescription', locale)}</description>` +
            (locale ? `<language>${locale}</language>` : '') +
            this.generateItemFeeds(locale) +
            '</channel>' +
            '</rss>'
        );
    }

    private generateItemFeeds(locale: string): string {
        return this.dataSource
            .getPosts(locale)
            .map((p) => this.getItemFeed(p))
            .join('');
    }

    private getItemFeed(post: Post): string {
        const postUrl = this.postRootUrl(post);
        return (
            '<item>' +
            `<title>${post.title}</title>` +
            `<link>${postUrl}</link>` +
            `<description><![CDATA[${post.excerpt}]]></description>` +
            `<guid>${postUrl}</guid>` +
            `<pubDate>${this.formatRFC822DateTime(
                post.publishedAt,
            )}</pubDate>` +
            this.getItemCategories(post) +
            '</item>'
        );
    }

    private getItemCategories(post: Post) {
        return post.tags.map((tag) => `<category>${tag}</category>`).join('');
    }
}
