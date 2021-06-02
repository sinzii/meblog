# :house_with_garden: meblog

![GitHub](https://img.shields.io/github/license/sinzii/meblog)

A simple blog engine for personal blogging

Live demo: [meblog.sinzii.me](https://meblog.sinzii.me).

## Table of contents

-   [Have a quick taste](#have-a-quick-taste)
-   [Features](#features)
-   [Project structure](#project-structure)
-   [How to create new post](#how-to-create-new-post)
-   [Preview your post while editing](#preview-your-post-while-editing)
-   [Configuration](#configuration)
-   [Deploy your site on Github](#deploy-your-site-on-github)
-   [Websites built with meblog](#websites-built-with-meblog)
-   [Contribution](#contribution)
-   [License](#license)

## Have a quick taste

```ssh
npm install -g meblog // use --unsafe-perm if facing node-gyp error

meblog init your-site && cd your-site

meblog sample --number-of-posts=20

meblog serve
```

## Features

-   Simple and fast as you always want.
-   Edit the code or posts and see the change immediately with the support of browser-sync.
-   Support [different styles of post url](#configuration).
-   Built-in RSS feed generator.
-   Love using `pug` template? **meblog** is the right tool for you.

## Template project structure

The project makes use of `pug` for templating, `scss` for styling and `gulpjs` for generating the site and automating the process.

-   `theme`: Where you customize the pages & styles
    -   `theme/templates`: Pug templates
    -   `theme/templates/pages`: Add your new page here
    -   `theme/scss`: SCSS styling files
    -   `theme/js`: Javascript files
-   `assets`: Put your images, favicon, and other resources here
-   `posts`: Put your posts in markdown format here. Ideally, arrange your posts into year and month folders for better referencing or searching.
-   `config.js`: [Config file](#configuration) for the site

## How to create new post

Simply run `meblog draft` or create a new file `post-name.md` in folder `posts` using the below format:

```md
---
title: This is the post title
publishedAt: 2021-05-15T18:04:00+07:00 (YYYY-MM-DDTHH:mm:ssZ)
tags: tag1, tag2
excerpt: Some thoughts about the growing journey
---

Post body goes here
```

The file name `post-name` will be used as post slug.

## Preview your post while editing

Run the command `meblog serve` and start editing your post then hit the save button if you want to see the change.

Set the auto saving interval to 2s in your editor for better editing experience. _(As far as I know, **Visual Studio Code** or **IntelliJ-based IDEs** have this feature 😄)_

Now let's start composing! ✍️✍️✍️

![Preview while editing](/documents/images/PreviewOnEditing.gif)

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

## Deploy your site on Github

1. Put all your posts in folder `posts`.
2. Run `meblog build`, your site will be generated into folder `docs`, use option `--outdir` if you want the build to be generated somewhere else.
3. Commit the files & push your commit to Github.
4. Enable [Github Pages](https://guides.github.com/features/pages/), make sure to choose `/docs` as the source folder.
5. Enjoy the result! 🍺

## Websites built with meblog

-   [meblog.sinzii.me](http://meblog.sinzii.me) - meblog demo website
-   [sinzii.me](https://sinzii.me) - Thang X. Vu (@sinzii)
-   Who next?

## Contribution

-   We embrace all the contributions to our hearts. So don't hesitate to shoot a pull request.
-   If you spot any problems or have any ideas to improve **meblog**, let's discuss it [here](https://github.com/sinzii/meblog/issues)!

## License

[MIT](LICENSE)
