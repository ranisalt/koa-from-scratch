import Koa from 'koa'
import Router from 'koa-router'
import todos from './routes/todos'

const app = new Koa()
const router = new Router()
router.use('/todos', todos.routes(), todos.allowedMethods())
app.use(router.routes())
app.listen(3000)
