import Parser from './Parser';
import MarkdownIt from 'markdown-it';
import emoji from 'markdown-it-emoji';
import hljs from 'highlight.js';

export default class MarkdownItParser extends Parser {
    private md: MarkdownIt;

    private highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }

    private initParser() {
        if (this.md) {
            return;
        }

        this.md = new MarkdownIt('default', {
            html: true,
            highlight: this.highlight,
        });

        this.md.use(emoji);
    }

    parse(content: string): string {
        this.initParser();

        return this.md.render(content);
    }
}
