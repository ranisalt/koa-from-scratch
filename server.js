import Koa from 'koa'
import Router from 'koa-router'
import todo from './routes/todo'

const app = new Koa()
const router = new Router()
router.use('/todo', todo.routes(), todo.allowedMethods())
app.use(router.routes())
app.listen(3000)
