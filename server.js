import Koa from 'koa'
import bodyparser from 'koa-bodyparser'
import Router from 'koa-router'
import Mongorito from 'mongorito'
import todos from './routes/todos'
import users from './routes/users'

Mongorito.connect(`mongodb://${process.env.MONGODB_URI}`)

export const app = new Koa()
app.use(bodyparser())

const router = new Router()
router.use('/todos', todos.routes(), todos.allowedMethods())
router.use('/users', users.routes(), users.allowedMethods())
app.use(router.routes())
app.listen(3000)
