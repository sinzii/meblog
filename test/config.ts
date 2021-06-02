import {Config, PostUrlStyle} from '../src/core/model';

export default {
    baseUrl: 'https://meblog.sinzii.me',
    baseContext: '',
    siteName: 'meblog',
    siteDescription: 'A DIY blog engine',
    dateTimeFormat: 'DD/MM/YYYY - HH:mm',
    dateFormat: 'DD/MM/YYYY',
    postUrlStyle: PostUrlStyle.SLUG,
    me: {
        fullname: 'Your Name',
        nickname: '@meblog',
        github: 'https://github.com/sinzii/meblog',
    },
    latestPosts: 5,
} as Config;
