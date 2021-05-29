import * as path from 'path';
import * as del from 'del';
import * as fs from 'fs';
import * as _ from 'lodash';
import SampleGenerator from '../../src/core/SampleGenerator';
import FilesSource from '../../src/core/FilesSource';
import config from '../config';
import {assert} from 'chai';
import {assertPost} from './helper';
import * as sinon from 'sinon';
import {glob} from 'glob';


describe('FilesSource', function () {
    const generator = new SampleGenerator();
    const numberOfPosts = 1;
    const postsDir = path.join(__dirname, '../posts-test');
    const dataDir = path.join(__dirname, '../data');
    let dataSource;

    const assertLoadedData = () => {
        assert.equal(dataSource.getPosts().length, numberOfPosts);
        dataSource.getPosts().forEach(assertPost);
        const tags = dataSource.getPosts().flatMap(p => p.tags);
        assert.isTrue(_.isEqual(tags, dataSource.getTags()));
        assert.isTrue(fs.existsSync(dataDir));
    };

    before(function () {
        generator.generateMarkdownPostsAndSave(
            numberOfPosts,
            postsDir
        );

        dataSource = new FilesSource(config, postsDir)
    });

    it('should load data from posts dir', function () {
        del.sync(dataDir);

        const parseSpy = sinon.spy(dataSource, 'parse');

        dataSource.loadData();

        assert.isTrue(parseSpy.calledOnce);

        assertLoadedData();
    });

    it('should load data from cache', function () {
        const parseSpy = sinon.spy(dataSource, "parse");

        dataSource.loadData();

        assert.isTrue(parseSpy.notCalled);

        assertLoadedData();
    });

    it('should load data from posts by force', function () {
        const parseSpy = sinon.spy(dataSource, "parse");

        dataSource.loadData(true);

        assert.isTrue(parseSpy.calledOnce);

        assertLoadedData();
    });

    it('should reload data on post changing', function () {
        const posts = glob.sync(postsDir + '/**/*.md');
        const firstFile = posts[0];

        // change the modified time of the file
        fs.utimesSync(firstFile, new Date(), new Date());

        const parseSpy = sinon.spy(dataSource, "parse");

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
    })
});
