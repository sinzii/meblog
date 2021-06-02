import path from 'path';
import del from 'del';
import fs from 'fs';
import _ from 'lodash';
import SampleGenerator from '../../src/core/SampleGenerator';
import FilesSource from '../../src/core/source/FilesSource';
import config from '../config';
import { assert } from 'chai';
import { assertPost } from './helper';
import sinon from 'sinon';
import { glob } from 'glob';

config.rootDir = path.join(process.cwd(), 'test');

describe('FilesSource', function () {
    const generator = new SampleGenerator();
    const numberOfPosts = 10;
    const postsDir = path.join(config.rootDir, './posts-test');
    const dataDir = path.join(config.rootDir, './cache');
    let dataSource: FilesSource;

    const assertLoadedData = () => {
        assert.equal(dataSource.getPosts().length, numberOfPosts);
        dataSource.getPosts().forEach(assertPost);
        const tags = dataSource.getPosts().flatMap((p) => p.tags);
        assert.isTrue(_.isEqual(new Set(tags), new Set(dataSource.getTags())));
        assert.isTrue(fs.existsSync(dataDir));
    };

    before(function () {
        generator.generateMarkdownPostsAndSave(numberOfPosts, postsDir);

        sinon
            .stub(FilesSource.prototype, 'getLayouts' as any)
            .returns(['post']);

        dataSource = new FilesSource(config, postsDir);
    });

    it('should load data from posts dir', function () {
        del.sync(dataDir);

        const parseSpy = sinon.spy(FilesSource.prototype, 'parse' as any);

        dataSource.loadData();

        assert.isTrue(parseSpy.calledOnce);

        assertLoadedData();
    });

    it('should load data from cache', function () {
        const parseSpy = sinon.spy(FilesSource.prototype, 'parse' as any);

        dataSource.loadData();

        assert.isTrue(parseSpy.notCalled);

        assertLoadedData();
    });

    it('should load data from posts by force', function () {
        const parseSpy = sinon.spy(FilesSource.prototype, 'parse' as any);

        dataSource.loadData(true);

        assert.isTrue(parseSpy.calledOnce);

        assertLoadedData();
    });

    it('should reload data on post changing', function () {
        const posts = glob.sync(postsDir + '/**/*.md');
        const firstFile = posts[0];

        // change the modified time of the file
        fs.utimesSync(firstFile, new Date(), new Date());

        const parseSpy = sinon.spy(FilesSource.prototype, 'parse' as any);

        dataSource.loadData();

        assert.isTrue(parseSpy.calledOnce);

        assertLoadedData();
    });

    after(function () {
        del.sync(postsDir);
        del.sync(dataDir);
    });

    afterEach(function () {
        sinon.restore();
    });
});
