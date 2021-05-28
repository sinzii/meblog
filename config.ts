import {Config, PostUrlStyle} from './src/core/model';

export default {
    rootDir: __dirname,
    baseUrl: 'https://meblog.sinzii.me',
    baseContext: '',
    siteName: 'meblog',
    siteDescription: 'A DIY blog engine',
    dateTimeFormat: 'DD/MM/YYYY - HH:mm',
    dateFormat: 'DD/MM/YYYY',
    postUrlStyle: PostUrlStyle.POST_SLUG
} as Config
