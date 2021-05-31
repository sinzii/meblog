import {Tag} from '../model';

export default class StringUtils {
    static collectTags(source: string|string[]): Tag[] {
        if (typeof source === 'string') {
            source = [source];
        }

        const tags = source
            .flatMap(s => s)
            .map(s => String(s))
            .flatMap(s => s.split(/[\s,]/gm))
            .filter(t => t);

        return Array.from(new Set(tags));
    }
}
