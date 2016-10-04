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

export const app = new Koa()
app.listen(3000)
```

It creates a new Koa app that listens on port 3000. If you run it with Node,
either with `node server.js` or `npm start` you will see that... it breaks,
because syntax is unsupported (as of Node 6). Let's install Babel, then:

```sh
npm install --save-dev babel-cli babel-preset-{es2015,stage-0} babel-plugin-transform-runtime
```

Now we add a configuration file (`.babelrc`), with the following configuration:

```js
{
  "plugins": ["transform-runtime"],
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

### Pro-tip
You can toggle debugging messages with the `DEBUG` environment variable. To see
all Koa-related debug log, run `env DEBUG=koa* npm start` instead. You will also
see the *regex* generated for every endpoint.

## Adding more routes

Now we want to be able to add, update and delete our todos. Let's add one POST
route to `/todos` to add one more to the list, as a REST API does, but for that
we need to parse the body of the request. The package
[koa-bodyparser][koa-bodyparser-url] is our friend here:

```sh
npm install --save koa-bodyparser@next
```

Import it and add to the app **before** the routes are added:

```js
import bodyparser from 'koa-bodyparser'

(...)

app.use(bodyparser())
```

Now, to access body content, use `ctx.request.body` on a route. By the way,
that's ES7 destructuring assignment, meaning `title = ctx.request.body.title`:

```js
router.post('/', async ctx => {
  const {title} = ctx.request.body
  todos.push({title, completed: false})
  ctx.status = 204
})
```

The response has status code 204 Created and empty body. You can post a new todo
and go to the index again to check it has been inserted. I'll use curl for
simplicity:

```sh
curl localhost:3000 -H "Content-Type: application/json" --data '{"title": "Be awesome"}'
```

Now hit `/todos` and you will see we added it :)

# It needs some testing

Oh yeah, we got to the part every developer loves: unit testing. I know it
should exist from the start, but I wanted to be more straightforward.

For this, we'll use [ava][ava-url], a minimal but very fast test runner with
modern feature support, such as async functions that we already know. We will
also use [nyc][nyc-url] for coverage report. We need a mock client to fake
requests to the API, and for that we will use [supertest][supertest-url], but it
uses callbacks, let's use [supertest-as-promised][supertest-as-promised-url]
wrapper. Go get them, npm:

```sh
npm install --save-dev ava nyc supertest{,-as-promised}
```

Create a `todos.spec.js` under the `test` directory and import the dependencies:

```js
import test from 'ava'
import request from 'supertest-as-promised'

import {app} from '../server'
```

For each test, we create a request client using the `beforeEach` hook:

```js
test.beforeEach(async t => {
  t.context.request = request(app.callback())
})
```

Every test and hook on ava has a parameter that represents test state. Modifying
the `context` key on it creates values that persists, so the request instance
will be accessible within tests. `app.callback()` will return a function that
actually processes HTTP requests, and we plug it into `supertest`. In fact, that
is how `app.listen(3000)` we used before works, but handing the `callback()` to
a Node.js HTTP server.

Every test on ava runs on a separate Node.js instance, so we can assume our app
is on a clean state. Let's first assure the todo-list is empty:

```js
test('listing is empty', async t => {
  const res = await t.context.request.get('/todos')
  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.is(res.body.length, 0)
})
```

Ah! Don't forget we need to change some things on `package.json`. First, change
the `test` script to run ava with nyc:

```js
"scripts": {
  "start": "babel-node server.js",
  "test": "nyc ava --serial"
},
```

Simple as that, since we are using the default file and path names for tests.
Also, let's inform ava we want to use babel:

```js
"ava": {
  "babel": "inherit",
  "require": "babel-register"
}
```

Run the test for the first time with:

```sh
npm test
```

And it should pass the test and output coverage status. We still do not cover
the post new todo route, let's fix it:

```js
test('create new listing', async t => {
  let res = await t.context.request.post('/todos').send({
    title: 'Be awesome'
  })
  t.is(res.status, 204)

  res = await t.context.request.get('/todos')
  t.is(res.body.length, 1)
})
```

And run the test again. Oh man, do you smell that 100% coverage sweet scent?

# Storing with Mongorito

Mongorito is a driver for MongoDB that fits perfectly with Koa. It uses async
functions so the syntax is very sweet. Also, since Mongo stores documents in a
JSON-like syntax, we can use JS native objects seamlessly.

```sh
npm install --save mongorito
```

To use Mongorito, you need to import it in the main app file (`server.js`) and
connect. We'll use an environment variable to get the server URI, as it is a
common pattern around platforms (e.g. Heroku):

```js
import Mongorito from 'mongorito'

(...)

Mongorito.connect(process.env.MONGODB_URI)
```

Also, import Mongorito's Model to create a new... model. For simplicity, and
since we are not having any special behavior in our model (for now), let's just
declare it on the routes file (`routes/todos.js`):

```js
import {Model} from 'mongorito'

export class Todo extends Model {}
```

Extending Mongorito models gives you a lot of useful methods, such as `find()`
and `save()`, besides `get()`, `set()` and a constructor. We need to change the
routes to use instances of models:

```js
router.get('/', async ctx => {
  ctx.body = await Todo.find()
})

router.post('/', async ctx => {
  const {title} = ctx.request.body
  const todo = new Todo({title, completed: false})
  await todo.save()
  ctx.status = 204
})
```

Simple enough. If we wanted to filter todos anyhow, we would pass a filter
object to the `find()` method. `find()` is also aliased to `all()` for better
function naming. Suppose we want to check all completed todos:

```js
router.get('/completed', async ctx => {
  ctx.body = await Todo.find({completed: true})
})
```

One more change, now our tests need to cleanup the database on each test, as
data won't be reset in the DB as it did with the array.

```js
import {Todo} from '../routes/todos'

test.beforeEach(async t => {
  await Todo.remove()
  t.context.request = request(app.callback())
})
```

And that's it. Don't forget we don't need the todo array anymore, as everything
will be stored on the Mongo server. You can just run tests or spin up the server
and check with the same curl used above. Don't forget to set `MONGODB_URI`.

```sh
env MONGODB_URI=localhost/todos npm test
```

# Manipulating data

Until now, the routes provided can show and create new todos, but it is missing
the ability to edit (e.g. mark as completed) and remove them. With REST APIs,
endpoints related to specific resources are generally in the form `/<type>/<id>`
and `koa-router` has a great way to deal with those routes.

Besides `get()` and `put()` we already use, we create a middleware to routes
that take parameters using `param()`:

```js
router.param('todo', async (id, ctx, next) => {
  ctx.todo = await Todo.findById(id)
  await next()
})
```

Awaiting `next()` means calling the next middleware. Later we will use
'try`/`catch` to check if everything worked or any error occurred.

Every route that takes a `:todo` will now have a bound a todo to the context.
Example, to `patch()` a resource:

```js
router.patch('/:todo', async ctx => {
  const {completed} = ctx.request.body
  if (completed != null) {
    ctx.todo.set('completed', completed)
  }

  await ctx.todo.save()
  ctx.status = 200
  ctx.body = {todo: ctx.todo}
})
```

It's needed to check if the body actually contains data to be updated, in our
case only `completed`. Then, save the mutated object, set the status code and
return body.

Let's also provide a deletion route, this one is easy:

```js
router.delete('/:user', async ctx => {
  await ctx.user.remove()
  ctx.status = 204
})
```

[ava-url]: https://github.com/avajs/ava
[babel-url]: https://babeljs.io/
[koa-url]: https://github.com/koajs/koa/tree/v2.x
[koa-bodyparser-url]: https://github.com/koajs/bodyparser/tree/next
[koa-router-url]: https://github.com/alexmingoia/koa-router/tree/master
[nyc-url]: https://github.com/istanbuljs/nyc
[mongorito-url]: https://github.com/vdemedes/mongorito
[react-url]: https://github.com/facebook/react
[supertest-url]: https://github.com/visionmedia/supertest
[supertest-as-promised-url]: https://github.com/WhoopInc/supertest-as-promised
