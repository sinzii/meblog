export type Tag = string;

export interface IPost {
    title: string,
    slug: string,
    publishedAt: Date | string,
    tags: Tag[] | string,
    excerpt: string,
    body: string
}

export interface Config {
    rootDir: string,
    baseUrl: string,
    baseContext: string,
    siteName: string,
    siteDescription: string,
    devMode?: boolean,
    dateTimeFormat: string,
    dateFormat: string,
    postUrlStyle: PostUrlStyle,
    [otherOption: string]: any
}

export enum PostUrlStyle {
    POST_SLUG, // ../posts/hello-world.html
    POSTS_YEAR_MONTH_SLUG, // ../posts/2021/05/hello-world.html
    POSTS_YEAR_SLUG, // ../posts/2021/hello-world.html
    YEAR_MONTH_SLUG, // ../2021/05/hello-world.html
    YEAR_SLUG, // ../2021/hello-world.html
    SLUG, // ../hello-world.html
}
