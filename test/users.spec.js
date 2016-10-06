import argon2 from 'argon2'
import test from 'ava'
import request from 'supertest-as-promised'

import {app} from '../server'
import {User} from '../routes/users'

test.beforeEach(async t => {
  await User.remove()
  t.context.request = request(app.callback())
})

test('listing is empty', async t => {
  const {body, status, type} = await t.context.request.get('/users')
  t.is(status, 200)
  t.is(type, 'application/json')
  t.is(body.length, 0)
})

test('create new resource', async t => {
  const {status} = await t.context.request.post('/users').send({
    name: 'ademir',
    password: '123456'
  })
  t.is(status, 201)
  t.is(await User.count(), 1)
})

test('edit resource', async t => {
  let user = new User({
    name: 'ademir',
    password: await argon2.hash('123456', await argon2.generateSalt())
  })
  await user.save()

  const {status} = await t.context.request.patch(`/users/${user.get('name')}`).send({
    password: '654321'
  })
  t.is(status, 200)

  user = await User.findById(user.get('_id'))
  t.true(await argon2.verify(user.get('password'), '654321'))
})

test('delete resource', async t => {
  let user = new User({
    name: 'ademir',
    password: '123456'
  })
  await user.save()

  const {status} = await t.context.request.delete(`/users/${user.get('name')}`)
  t.is(status, 204)
  t.is(await User.count(), 0)
})
