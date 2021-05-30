import {Post} from './Post';

export default abstract class PostParser {
    /**
     * From markdown file to Post
     * @param filePath
     * @param separator
     */
    abstract parse(filePath: string, separator?: string): Post;

    /**
     * Extract slug from file path
     * - Remove special character & spaces
     * - Only accept: a-zA-Z0-9_-
     *
     * @param filePath
     */
    abstract extractSlug(filePath: string): string;
}
