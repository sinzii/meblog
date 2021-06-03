import stream from 'stream';
import through2 from 'through2';
import plumber from 'gulp-plumber';
import PluginError from 'plugin-error';
import logger from 'gulplog';

export default class GulpUtils {
    static through(each: (file, enc, cb) => void): stream.Transform {
        return through2.obj(each);
    }

    static error(e: Error): PluginError {
        return new PluginError('meblog', e);
    }

    static handleStreamError(): stream.Transform {
        return plumber(function (e) {
            logger.error(e);
        });
    }
}
