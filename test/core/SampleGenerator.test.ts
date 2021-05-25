import SampleGenerator from '../../src/core/SampleGenerator';
import {assert} from 'chai';
import * as path from 'path';
import * as del from 'del';
import glob from 'glob';
import {assertPost} from './helper';

const generator = new SampleGenerator();

describe('SampleGenerator', function () {
    it('should generate a post', function () {
        const post = generator.post();

        assertPost(post);
    });

    it('should generate posts', function () {
        const numberOfPost = 20;
        const posts = generator.posts(numberOfPost);

        assert.equal(posts.length, numberOfPost);
        posts.forEach(assertPost);
    });

    it('should generate a markdown post content', function () {
        const content = generator.markdownPost();
        assert.typeOf(content, 'string');

        const lines = content.split('\n');
        assert.isTrue(lines[0] === '---');
        assert.isTrue(lines[1].startsWith('title: '));
        assert.isTrue(lines[2].startsWith('slug: '));
        assert.isTrue(lines[3].startsWith('publishedAt: '));
        assert.isTrue(lines[4].startsWith('tags: '));
        assert.isTrue(lines[5].startsWith('excerpt: '));
        assert.isTrue(lines[6] === '---');
        assert.typeOf(lines[7], 'string');
    });

    it('should generate markdown post and save', function () {
        const numberOfFiles = 10;
        const dirPath = path.join(__dirname, '../post-dev');
        generator.generateMarkdownPostsAndSave(numberOfFiles, dirPath);

        const files = glob.sync(dirPath + '/*.md');
        assert.equal(files.length, numberOfFiles);

        del.sync(dirPath);
    });
});
