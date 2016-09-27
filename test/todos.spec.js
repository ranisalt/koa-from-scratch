import test from 'ava'
import request from 'supertest-as-promised'

import {app} from '../server'
import {Todo} from '../routes/todos'

test.beforeEach(async t => {
  await Todo.remove()
  t.context.request = request(app.callback())
})

test('listing is empty', async t => {
  const res = await t.context.request.get('/todos')
  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.is(res.body.length, 0)
})

test('create new listing', async t => {
  let res = await t.context.request.post('/todos').send({
    title: 'Be awesome'
  })
  t.is(res.status, 204)

  res = await t.context.request.get('/todos')
  t.is(res.body.length, 1)
})
