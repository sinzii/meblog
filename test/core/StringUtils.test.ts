import {assert} from 'chai';
import StringUtils from '../../src/core/util/StringUtils';

describe('StringUtils', function () {
    it('should collect tags from a string', function () {
        const tags = StringUtils.collectTags(
            'hello world,   this\'s meblog      world'
        );
        assert.deepEqual(
            tags,
            ['hello', 'world', 'this\'s', 'meblog']
        )
    });

    it('should collect tags from an array', function () {
        const tags = StringUtils.collectTags([
            'this is a random string        for tags',
            'new    random tags',
            'will',
            'be',
            'added'
        ]);

        assert.deepEqual(
            tags,
            [
                'this', 'is', 'a', 'random', 'string', 'for',
                'tags', 'new', 'will', 'be', 'added'
            ]
        );
    });

    it('should collect tags from a combination of string, number, array', function () {
        const tags = StringUtils.collectTags([
            'this is a       random',
            'string',
            // @ts-ignore
            123123,
            // @ts-ignore
            ['will', 'be', 'added']
        ]);

        assert.deepEqual(
            tags,
            [
                'this', 'is', 'a', 'random', 'string',
                '123123', 'will', 'be', 'added'
            ]
        );
    });

    it('should collect tags from nested array', function () {
        const tags = StringUtils.collectTags([
            'this is a random',
            // @ts-ignore
            [['string'], 'will', ['be', ['added']]]
        ]);

        assert.deepEqual(
            tags,
            [
                'this', 'is', 'a', 'random', 'string',
                'will', 'be', 'added'
            ]
        );
    });
});
