# koa-from-scratch

First of all, you need to initialize your project using `npm init`. For this,
we will use [Koa 2][koa-url], a next generation framework, together with
[Mongorito][mongorito-url], an awesome MongoDB mapper, and [React][react-url]
for the front-end.

Analog to MEAN for Mongo+Express+Angular+Node stack, I call it MKRN for
Mongo+Koa+React+Node stack.

## Installing Koa 2

While Koa 2 is not marked as stable, it is already great. It still depends on
some features to be implemented on Node, but we will use [Babel][babel-url]
to circumvent that. You will need to install the `next` tag with NPM:

```sh
npm install --save koa@next
```

Differently from Express, Koa is a minimal framework and does not provide
anything besides parsing requests and serving responses. You need to provide
middlewares for routing, parsing body, templates, everything. A basic, routeless
application looks like this (call it `server.js`):

```js
import Koa from 'koa'

const app = new Koa()
app.listen(3000)
```

It creates a new Koa app that listens on port 3000. If you run it with Node,
either with `node server.js` or `npm start` you will see that... it breaks,
because syntax is unsupported (as of Node 6). Let's install Babel, then:

```sh
npm install --save-dev babel-cli babel-preset-{es2015,stage-0}
```

Now we add a configuration file (`.babelrc`), with the following configuration:

```js
{
  "presets": ["es2015", "stage-0"]
}
```

And override default `npm start` behavior on `package.json`, under the `scripts`
object:

```js
"scripts": {
  "start": "babel-node server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Hell yeah! Launch with `npm start` and hit `localhost:3000` on your browser. You
will see Koa automatically responding with "Not Found", of course.

## Our first route

Now, let's add some routes to our app. We should only work with JSON requests
and responses, since the view layer is entirely done client-side on modern MVC
apps. Install the excellent [koa-router][koa-router-url] middleware, again with
the `next` tag:

```sh
npm install --save koa-router@next
```

I like to put controllers inside a `routes` directory for structure purposes.
So, let's create our first controller on `routes/todos.js` and start by the
index:

```js
import Router from 'koa-router'

const router = new Router()
const todos = []

router.get('/', async ctx => {
  ctx.body = todos
})

export default router
```

Let's explain: first, you instantiate a Router object, that is provided by the
`koa-router` package. You can add routes to it using `get`, `post`, `put` and
`delete` functions, passing the route (in this case, `/` means the root of the
router) and a function that receives the context. Actually, you can have
multiple functions, as you'll see later on.

In Express, you'd probably use `this` as it binds functions to the context.
This is too much magic and Koa explicitly receives the context as a parameter
instead. You also receive a `next` function that calls the next function of the
pipeline, in case you are writting a middleware. We will use it later and you
will totally love it.

(sorry for postponing too much stuff, but Koa is just so minimal and powerful)

We now need to integrate this router with the server, and that should be easy.
Just import the router in the `server.js` file and hey, remember my previous
talk about middlewares? `koa-router` can generate a middleware for you, which
maps the request to the responding function:

```js
import todos from './routes/todos'

(...)

app.use(todos.routes())
```

Easy, huh? It's worth mentioning that middlewares are called sequentially, so
put your routing at last so that other important middleware (body parsing,
templating) are called first. I suggest adding routes just above `listen`, see
[server.js](server.js).

Fire up your server and hit `localhost:3000` and you will se an empty JSON
array, which is what we defined as the body of the response.

But say we want all our todo REST under the `/todos` prefix. That's easy too,
import `koa-router` here too and replace the `app.use` line with the following:

```js
const router = new Router()
router.use('/todos', todos.routes(), todos.allowedMethods())
app.use(router.routes())
```

That's right, we can nest routes to achieve nice functionality. Say some of your
modules (sets of REST endpoints, such as `todo` here) lie inside an `admin`
prefix, you can just keep nesting routers to achieve the desired endpoint URIs.

[babel-url]: https://babeljs.io/
[koa-url]: https://github.com/koajs/koa/tree/v2.x
[koa-router-url]: https://github.com/alexmingoia/koa-router/tree/master
[mongorito-url]: https://github.com/vdemedes/mongorito
[react-url]: https://github.com/facebook/react
