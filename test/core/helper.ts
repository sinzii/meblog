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
    assertPostProperties(post);

    assert.isNotEmpty(post.title);
    assert.isTrue(post.publishedAt instanceof Date)
    assert.isNotEmpty(post.excerpt);
    assert.isNotEmpty(post.body);
    assert.isNotEmpty(post.markdown);
}

export const assertPostProperties = post => {
    assert.instanceOf(post, Post);
    postProperties.forEach(prop => {
        assert.property(post, prop);
    });
}
