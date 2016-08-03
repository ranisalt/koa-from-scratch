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

[babel-url]: https://babeljs.io/
[koa-url]: https://github.com/koajs/koa/tree/v2.x
[mongorito-url]: https://github.com/vdemedes/mongorito
[react-url]: https://github.com/facebook/react
