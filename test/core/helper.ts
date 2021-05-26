import {assert} from "chai";
import {Post} from '../../src/core/Post';

const postProperties = [
    'title',
    'slug',
    'publishedAt',
    'tags',
    'excerpt',
    'body',
    'markdown'
]

export const assertPost = post => {
    assert.instanceOf(post, Post);
    postProperties.forEach(prop => {
        assert.property(post, prop);
    });
}
