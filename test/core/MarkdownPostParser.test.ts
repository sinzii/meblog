import {assert} from 'chai';
import MarkdownPostParser from '../../src/core/post/MarkdownPostParser';

describe('MarkdownPostParser', function () {
    const parser = new MarkdownPostParser();

    it('should extract slug having spaces', function () {
        const slug = parser.extractSlug('/path/this is file name.md');

        assert.equal(slug, 'thisisfilename');
    });

    it('should extract slug having spaces & special chars', function () {
        const slug = parser.extractSlug('/path/this$-is_file name@.md');

        assert.equal(slug, 'this-is_filename');
    });
});
