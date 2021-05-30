import PostParser from './PostParser';
import {Post} from './Post';
import FileUtils from '../util/FileUtils';
import Renderer from '../markdown/Renderer';
import MarkdownItRenderer from '../markdown/MarkdownItRenderer';

export default class MarkdownPostParser extends PostParser {
    private readonly mdRenderer: Renderer;

    constructor() {
        super();
        this.mdRenderer = new MarkdownItRenderer();
    }

    public parse(filePath: string, separator: string = '---'): Post {
        const post: any = {};
        let content = FileUtils.readFile(filePath);
        if (!content) {
            return new Post();
        }

        post.markdown = content;
        post.slug = this.extractSlug(filePath);

        let separatorCounter = 0;
        const metaLines: string[] = [];

        while (true) {
            const index = content.indexOf('\n');
            if (index < 0) {
                break;
            }

            const line = content.substring(0, index).trim();

            content = content.substring(index + 1);

            if (line === separator) {
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

    public extractSlug(filePath: string): string {
        const fileName = FileUtils.basename(filePath, FileUtils.ext(filePath));

        return fileName.replace(/[^\w-]*/gm, '');
    }
}
