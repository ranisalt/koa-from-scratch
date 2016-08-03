import Router from 'koa-router'

const router = new Router()
const todos = []

router.get('/', async ctx => {
  ctx.body = todos
})

export default router
