import { Tag } from '../model';

export default class StringUtils {
    static collectTags(source: string | string[]): Tag[] {
        if (typeof source === 'string') {
            source = [source];
        }

        const tags = source
            .filter((t) => t)
            .flatMap((s) => s)
            .map((s) => String(s))
            .flatMap((s) => s.split(/[\s,]/gm)) // any spaces & comma
            .filter((t) => t);

        return Array.from(new Set(tags));
    }

    static capitalize(str: string): string {
        if (!str) {
            return '';
        }

        return str.charAt(0).toUpperCase() + str.substring(1);
    }

    static trimSlashes(str: string): string {
        if (!str) {
            return '';
        }

        // remove any trailing & starting forward slashes
        return str.replace(/^\/|\/$/gm, '');
    }
}
