import fs from 'fs';
import path from 'path';

export default class FileUtils {
    static readFile(filePath: string): string {
        FileUtils.checkExists(filePath);
        return fs.readFileSync(filePath).toString();
    }

    static isExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    static checkExists(filePath: string): void {
        if (!FileUtils.isExists(filePath)) {
            throw new Error(`${filePath} is not existed`);
        }
    }

    static basename(filePath: string, ext?: string): string {
        return path.basename(filePath, ext);
    }

    static basenameWithoutExt(filePath: string): string {
        return FileUtils.basename(filePath, FileUtils.ext(filePath));
    }

    static ext(filePath: string): string {
        return path.extname(filePath);
    }
}
