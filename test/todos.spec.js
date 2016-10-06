import test from 'ava'
import request from 'supertest-as-promised'

import {app} from '../server'
import {Todo} from '../routes/todos'

test.beforeEach(async t => {
  await Todo.remove()
  t.context.request = request(app.callback())
})

test('listing is empty', async t => {
  const {body, status, type} = await t.context.request.get('/todos')
  t.is(status, 200)
  t.is(type, 'application/json')
  t.is(body.length, 0)
})

test('create new resource', async t => {
  const {status} = await t.context.request.post('/todos').send({
    title: 'Be awesome'
  })
  t.is(status, 201)
  t.is(await Todo.count(), 1)
})

test('edit resource', async t => {
  let todo = new Todo({
    title: 'Be awesome'
  })
  await todo.save()

  const {status} = await t.context.request.patch(`/todos/${todo.get('_id')}`).send({
    completed: true
  })
  t.is(status, 200)

  todo = await Todo.findById(todo.get('_id'))
  t.is(todo.get('completed'), true)
})

test('delete resource', async t => {
  let todo = new Todo({
    title: 'Be awesome'
  })
  await todo.save()

  const {status} = await t.context.request.delete(`/todos/${todo.get('_id')}`).send({
    completed: true
  })
  t.is(status, 204)
  t.is(await Todo.count(), 0)
})
