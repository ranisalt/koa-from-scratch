import Router from 'koa-router'
import {Model} from 'mongorito'

export class Todo extends Model {}

const router = new Router()

router.get('/', async ctx => {
  ctx.body = await Todo.all()
})

router.post('/', async ctx => {
  const {title} = ctx.request.body
  const todo = new Todo({title, completed: false})
  await todo.save()
  ctx.status = 204
})

export default router
