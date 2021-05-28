import Parser from './Parser';
import MarkdownIt from 'markdown-it';
import emoji from 'markdown-it-emoji';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import footnote from 'markdown-it-footnote';
import abbr from 'markdown-it-abbr';
import twemoji from 'twemoji';
import hljs from 'highlight.js';

export default class MarkdownItParser extends Parser {
    private md: MarkdownIt;

    private highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }

    private twemoji(token, idx) {
        return twemoji.parse(token[idx].content);
    }

    private initParser() {
        if (this.md) {
            return;
        }

        this.md = new MarkdownIt('default', {
            html: true,
            typographer: true,
            highlight: this.highlight.bind(this),
        });

        this.md
            .use(emoji)
            .use(footnote)
            .use(abbr)
            .use(sup)
            .use(sub);

        this.md.renderer.rules.emoji = this.twemoji.bind(this);
    }

    parse(content: string): string {
        this.initParser();

        return this.md.render(content);
    }
}
