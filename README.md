# :house_with_garden:	 meblog
![GitHub](https://img.shields.io/github/license/sinzii/meblog)


A DIY blog engine that powered my-base-on-the-internet ([https://sinzii.me](https://sinzii.me))

## Have a quick taste
```ssh
npm install

npm run dev:sample -- --numberOfPosts=50

npm run dev:serve
```

## How do I customize the pages & styles
The project makes use of `pug` for templating, `scss` for styling and `gulpjs` for generating the site and automating the process.
- `src/templates`: Pug templates.
- `src/templates/pages`: Add your new page here.
- `src/scss`: SCSS styling files.
- `assets`: Put your images, favicon, and other resources here.

## How do I create new post?
Create a new `post-name.md` in folder `posts` (production) or `posts-dev` (dev) using the below format:
```md
---
title: This is the post title
slug: this-is-the-post-slug
publishedAt: 2021-05-15T18:04:00+07:00
tags: tag1, tag2
excerpt: Some thoughts about the growing journey 
---
Post body goes here
```
If you don't provide a slug, the engine will automatically slugify the post title for one.

## Preview your post while editing
Run the command `npm run prod:serve` and start editing your post and hit the save button to see the magic ✍️✍️✍️

![Preview while editing](/documents/images/PreviewOnEditing.gif)

## Configuration
Put all configurations in `config.ts` file, then all the data in this file will be available to use in the `pug` templates.
But there are some configurations that you need understand why do we have it.
- `baseUrl`: This will be the host url that you're about to deploy to, eg: `https://sinzii.me` or `https://yourname.github.io`. It's not required for the site to work properly, but if you care about sharing your posts on Facebook. This property will be used to calculate the url in meta tags for the purpose of SEO or sharing your posts on social media.
- `baseContext`: If you want to deploy the site on a sub directory like `https:/sinzii.me/blog`. Then set it's value as `blog`.
- `postUrlStyle`: The engine can generate different styles of post url, choose your favorite one.
  - `PostUrlStyle.POST_SLUG`: ../posts/hello-world.html __(default)__
  - `PostUrlStyle.POSTS_YEAR_MONTH_SLUG`: ../posts/2021/05/hello-world.html
  - `PostUrlStyle.POSTS_YEAR_SLUG`: ../posts/2021/hello-world.html
  - `PostUrlStyle.YEAR_MONTH_SLUG`: ../2021/05/hello-world.html
  - `PostUrlStyle.YEAR_SLUG`: ../2021/hello-world.html
  - `PostUrlStyle.SLUG`: ../hello-world.html

## Deploy your site on Github
1. Put all your posts in folder `posts`, you can arrange posts in sub folders if you want. Ideally, you could arrange your posts into year and month folders for better referencing or searching.
2. Run `npm run prod:build`: Your site will be generated into folder `docs`.
3. Commit the files & push your commit to Github.
4. Enable [Github Pages](https://guides.github.com/features/pages/), make sure to choose `/docs` as the source folder.
5. Enjoy the result! 🍺

## License
[MIT](LICENSE)

