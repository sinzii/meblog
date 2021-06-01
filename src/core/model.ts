import {EventEmitter} from 'events';

export type Tag = string;

export interface IPost {
    title: string,
    slug: string,
    publishedAt: Date | string,
    tags: Tag[] | string,
    excerpt: string,
    body: string
}

interface EventRegister {
    (eventEmitter: EventEmitter): void
}

export interface Config {
    rootDir?: string,
    baseUrl: string,
    baseContext: string,
    siteName: string,
    siteDescription: string,
    devMode?: boolean,
    dateTimeFormat: string,
    dateFormat: string,
    postUrlStyle?: PostUrlStyle,
    eventRegister?: EventRegister;
    [otherOption: string]: any
}

export enum PostUrlStyle {
    POSTS_SLUG = 'POSTS_SLUG', // ../posts/hello-world.html
    POSTS_YEAR_MONTH_SLUG = 'POSTS_YEAR_MONTH_SLUG', // ../posts/2021/05/hello-world.html
    POSTS_YEAR_SLUG = 'POSTS_YEAR_SLUG', // ../posts/2021/hello-world.html
    YEAR_MONTH_SLUG = 'YEAR_MONTH_SLUG', // ../2021/05/hello-world.html
    YEAR_SLUG = 'YEAR_SLUG', // ../2021/hello-world.html
    SLUG = 'SLUG', // ../hello-world.html
}
