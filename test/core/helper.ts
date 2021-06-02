import { assert } from 'chai';
import { Post } from '../../src/core/post/Post';

const postProperties = [
    'title',
    'slug',
    'publishedAt',
    'tags',
    'excerpt',
    'body',
    'markdown',
];

export const assertPost = (post: Post): void => {
    assertPostProperties(post);

    assert.isNotEmpty(post.title);
    assert.isTrue(post.publishedAt instanceof Date);
    assert.isNotEmpty(post.excerpt);
    assert.isNotEmpty(post.body);
    assert.isNotEmpty(post.markdown);
};

export const assertPostProperties = (post: Post): void => {
    assert.instanceOf(post, Post);
    postProperties.forEach((prop) => {
        assert.property(post, prop);
    });
};
