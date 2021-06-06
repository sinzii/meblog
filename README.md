# :house_with_garden: meblog

![GitHub](https://img.shields.io/github/license/sinzii/meblog)
![npm](https://img.shields.io/npm/v/meblog)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/sinzii/meblog/Node.js%20CI)

A simple blog engine for personal blogging

Website: [meblog.sinzii.me](https://meblog.sinzii.me)

## Table of contents

-   [Have a quick taste](#have-a-quick-taste)
-   [Features](#features)
-   [Template project structure](#template-project-structure)
-   [How to create new post](#how-to-create-new-post)
-   [Preview your post while editing](#preview-your-post-while-editing)
-   [Configuration](#configuration)
-   [Template variables](#template-variables)
-   [Event hooks](#event-hooks)
-   [Deploy your site on Github](#deploy-your-site-on-github)
-   [Websites built with meblog](#websites-built-with-meblog)
-   [Contribution](#contribution)
-   [License](#license)

## Have a quick taste

```ssh
npm install --save meblog

npx meblog init

npx meblog sample --number-of-posts=20

npx meblog serve
```

## Features

-   Simple and fast as you always want.
-   Edit the code or posts and see the change immediately with the support of browser-sync.
-   Support [different styles of post url](#configuration).
-   Built-in static site generator for pages, posts and tag pages.
-   Built-in RSS feed generator
-   Support event hooks to customize build process
-   Love how simple and powerful `pug` template is? **meblog** is the right tool for you.

## Template project structure

The project makes use of `pug` for templating, `scss` for styling and `gulpjs` for generating the site and automating the process.

-   `templates`: Template files
    -   `templates/pages`: Add new pages here
    -   `templates/posts`: Add new post layout here. By default, `post.pug` will be used as default layout for posts
    -   `templates/tags`:
        -   `templates/tags/tag.pug`: Default tag template for rendering tag pages
-   `scss`: SCSS styling files
    -   `scss/main.scss`: Main entry point of scss files, the engine will generate this file to `main.css` on building.
-   `assets`: Put your images, favicon, and other resources here
-   `posts`: Put your posts in markdown format here. Ideally, arrange your posts into year and month folders for better searching.
-   `config.js`: [Config file](#configuration) for the site

## How to create new post

Simply run `meblog draft` or create a new file `post-name.md` in folder `posts` using the below format:

```md
---
title: This is the post title
publishedAt: 2021-05-15T18:04:00+07:00 (YYYY-MM-DDTHH:mm:ssZ)
tags: tag1, tag2
excerpt: Some thoughts about the growing journey
layout: ... (post is default layout for rendering posts page, but you can defined new layout in templates/posts folder)
customfield: Custom field will also be parsed and loaded into post object
---

Post body goes here
```

The file name `post-name` will be used as post slug.

## Preview your post while editing

Run the command `meblog serve` and start editing your post then hit the save button if you want to see the change.

Set the auto saving interval to 2s in your editor for better editing experience. _(As far as I know, **Visual Studio Code** or **IntelliJ-based IDEs** have this feature 😄)_

## Configuration

Put all configurations in `config.js` file, then all the data in this file will be available to use in the `pug` templates.
But there are some configurations that you need understand why do we have it.

-   `baseUrl`: This will be the host url that you're about to deploy to, eg: `https://sinzii.me` or `https://yourname.github.io`. It's not required for the site to work properly. But if you care about sharing your posts on Facebook, this property will be used to calculate the url in meta tags for the purpose of SEO or sharing your posts on social media or generate RSS feed.
-   `baseContext`: If you want to deploy the site on a sub directory like `https:/sinzii.me/blog`. Then set it's value as `blog`.
-   `postUrlStyle`: The engine can generate different styles of post url, choose your favorite one.
    -   `POSTS_SLUG`: ../posts/hello-world.html **(default)**
    -   `POSTS_YEAR_MONTH_SLUG`: ../posts/2021/05/hello-world.html
    -   `POSTS_YEAR_SLUG`: ../posts/2021/hello-world.html
    -   `YEAR_MONTH_SLUG`: ../2021/05/hello-world.html
    -   `YEAR_SLUG`: ../2021/hello-world.html
    -   `SLUG`: ../hello-world.html

## Template variables

### Global variables
-   `posts`: List of posts, but you also can access a specific post by its slug using `posts[post-slug]`
-   `tags`: List of available tags
-   `templateName`: Name of current rendering template
-   `formatDateTime`: A function taking a date as input, output formatted date time follow `dateTimeFormat` config
-   `formatDate`: A function taking a date as input, output formatted date follow `dateFormat` config
-   `rootUrl`: A function taking a path as input, ouput an absolute url of the site
-   `url`: A function taking a path as input, output a relative url from current `baseContext` config
-   `postRootUrl`: A function taking post object as input, output an absolute url of the post
-   `postUrl`: A function taking post object as input, output a relative url of the post
-   `tagRootUrl`: A function taking tag name as input, output an absolute url of the tag
-   `tagUrl`: A function taking tag name as input, output a relative url of the tag
-   And all properties from exported object in `config.js` will be available as global variables (eg: `baseUrl`, `siteName`, ...)

### Post layout template variables
_Variable listed here is only available in post layout template in folder `templates/posts`_
-   `post`: Current rendering post object

### Tag template variables
_Variables listed here are only available in tag template in folder `templates/tags`_
-   `tag`: Current rendering tag name
-   `postsByTag`: List of post tagged with current rendering `tag`

## Event hooks
By default, the engine only processes `pug` tempate to html pages and `scss` to css. What if you need to write some `JavaScript` or even `TypeScript` and want those scripts to be bundle into one file or hot reload the script files on change when designing the site?

This is when event hooks come into play. Let's me first explain about the build process of meblog.

### The build process
Both `meblog serve` and `meblog build` commands will trigger the __build process__ when running, the only different is the former uses `dev` enviroment, and the latter uses `prod` enviroment.

When the build process is running, a series of tasks will be trigger one by one.
- `CleanCache`: Clean cache
- `Clean`: Clean output directory
- `Build`: Build the site
    - `CopyAssets`: Copy assets to output directory
    - `LoadData`: Parsing and loading posts from markdown format to javascript object.
    - `GenerateTemplates`: Generate templates
        - `GeneratePages`: Generate pages
        - `GeneratePosts`: Generate posts
        - `GenerateTags`: Generate tags
    - `GenerateRssFeed`: Generate RSS feed
    - `GenerateCSS`: Generate CSS
- `OnServe`: Starting local development server & watching file changes (only in `meblog serve` command)

For each task, the engine will emit one event named `BEFORE:TaskName` before running the task and one event named `AFTER:TaskName` after the task is finished running. Therefore, in order to hook into the build process, we simply need to listen to those events and do some customization.

### Listen to the events
For example, we need to write some javascript in `js/main.js` then want to minify and copy this file to output directory after `GenereteCss` task.

```js
// in config.js file

const gulp = require('gulp');
const minify = require('gulp-minify');

module.exports = {
    ...
    eventRegister(emitter) {
        emitter.on('AFTER:GenerateCss', () => {
            return new Promise(resolve => {
                const prod = !this.config.devMode;
                
                let stream = gulp.src('./js/main.js');
                
                if (prod) {
                    stream = stream.pipe(minify());
                }

                stream
                    .pipe(gulp.dest(this.outputDirectory))
                    .on('end', resolve);
            });
        })
    }
    ...
}
```

## Deploy your site on Github

1. Put all your posts in folder `posts`.
2. Run `meblog build`, your site will be generated into folder `docs`, use option `--outdir` if you want the build to be generated somewhere else.
3. Commit the files & push your commit to Github.
4. Enable [Github Pages](https://guides.github.com/features/pages/), make sure to choose `/docs` as the source folder.
5. Enjoy the result! 🍺

## Websites built with meblog

-   [meblog.sinzii.me](http://meblog.sinzii.me) - meblog website
-   [sinzii.me](https://sinzii.me) - Thang X. Vu (@sinzii)
-   Who next?

## Contribution

-   We embrace all the contributions to our hearts. So don't hesitate to shoot a pull request.
-   If you spot any problems or have any ideas to improve **meblog**, let's discuss it [here](https://github.com/sinzii/meblog/issues)!

## License

[MIT](LICENSE)
