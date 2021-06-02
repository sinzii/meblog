import {assert} from 'chai';
import path from 'path';

import MarkdownPostParser from '../../../src/core/post/MarkdownPostParser';

describe('MarkdownPostParser', function () {
    const parser = new MarkdownPostParser();

    it('should parse a post file with extra props', function () {
        const testFile = path.join(
            __dirname,
            'test-posts',
            `sa@mple     post-for pars$$ing.md`,
        );

        const post = parser.parse(testFile);
        assert.equal(post.slug, 'samplepost-forparsing');
        assert.isNull(post.publishedAt);
        assert.isEmpty(post.tags);
        assert.isEmpty(post.excerpt);
        assert.equal(post['prop1'], 'value 1');
        assert.equal(post['prop with space'], 'is valid');
        assert.equal(post['prop'], 'will be trim off');
        assert.isEmpty(post['prop with no value']);
        assert.notProperty(post, 'this prop will be ignored');
    });
});
