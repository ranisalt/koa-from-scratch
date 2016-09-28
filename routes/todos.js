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

router.param('todo', async (id, ctx, next) => {
  ctx.todo = await Todo.findById(id)
  await next()
})

router.patch('/:todo', async ctx => {
  const {completed} = ctx.request.body
  if (completed != null) {
    ctx.todo.set('completed', completed)
  }

  await ctx.todo.save()
  ctx.status = 200
  ctx.body = {todo: ctx.todo}
})

export default router
