import argon2 from 'argon2'
import Router from 'koa-router'
import {Model} from 'mongorito'

export class User extends Model {
  configure() {
    this.before('save', async () => {
      if (!this.get('name')) {
        throw new Error('Missing name.')
      }

      if (!this.get('password')) {
        throw new Error('Missing password.')
      }
    })

    this.verify = async password => {
      return await argon2.verify(this.get('password'), password)
    }
  }
}

const router = new Router()

router.get('/', async ctx => {
  ctx.body = await User.all()
})

router.post('/', async ctx => {
  const {name, password} = ctx.request.body
  const hash = await argon2.hash(password, await argon2.generateSalt())
  const user = new User({name, password: hash})
  await user.save()
  ctx.body = {user}
  ctx.status = 201
})

router.param('user', async (name, ctx, next) => {
  ctx.user = await User.findOne({name})
  await next()
})

router.patch('/:user', async ctx => {
  const {password} = ctx.request.body
  if (password != null) {
    const hash = await argon2.hash(password, await argon2.generateSalt())
    ctx.user.set('password', hash)
  }

  await ctx.user.save()
  ctx.status = 200
  ctx.body = {user: ctx.user}
})

router.delete('/:user', async ctx => {
  await ctx.user.remove()
  ctx.status = 204
})

export default router
