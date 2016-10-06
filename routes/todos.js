import Router from 'koa-router'
import {Model} from 'mongorito'

import {User} from './users.js'

export class Todo extends Model {}

const router = new Router()

async function login(ctx, next) {
  const {name, password} = ctx.request.body
  const user = await User.findOne({name})
  if (await user.verify(password)) {
    ctx.user = user.get('_id')
    await next()
  } else {
    throw new Error('User not found.')
  }
}

router.get('/', async ctx => {
  ctx.body = await Todo.all()
})

router.post('/', login, async ctx => {
  const {title} = ctx.request.body
  const todo = new Todo({
    title,
    completed: false,
    user: ctx.user
  })
  await todo.save()
  ctx.body = {todo}
  ctx.status = 201
})

router.param('todo', async (id, ctx, next) => {
  ctx.todo = await Todo.findById(id)
  await next()
})

router.patch('/:todo', login, async ctx => {
  const {todo, user} = ctx
  if (todo.get('user').toString() != user) {
    throw new Error('Invalid credentials.')
  }

  const {completed} = ctx.request.body
  if (completed != null) {
    todo.set('completed', completed)
  }

  await ctx.todo.save()
  ctx.status = 200
  ctx.body = {todo}
})

router.delete('/:todo', login, async ctx => {
  const {todo, user} = ctx
  if (todo.get('user').toString() != user) {
    throw new Error('Invalid credentials.')
  }

  await ctx.todo.remove()
  ctx.status = 204
})

export default router
