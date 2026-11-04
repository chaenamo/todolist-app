import { Router } from 'express';
import { validateIdParam } from '../validators/common.js';
import { validateTodoInput, validateListQuery, validateCompletion } from '../validators/todo.js';
import { listTodos, createTodo, getTodo, updateTodo, deleteTodo, setCompleted } from '../services/todoService.js';

export const todosRouter = Router();

// AQ-09: 쓰기·단건 응답에는 status가 없다

todosRouter.post('/', async (req, res) => {
  res.status(201).json(await createTodo(req.userId, validateTodoInput(req.body)));
});

todosRouter.get('/', async (req, res) => {
  res.json(await listTodos(req.userId, validateListQuery(req.query)));
});

// BE-10의 /calendar는 /:id보다 먼저 등록해야 한다
todosRouter.get('/:id', async (req, res) => {
  res.json(await getTodo(req.userId, validateIdParam(req.params.id)));
});

todosRouter.put('/:id', async (req, res) => {
  const id = validateIdParam(req.params.id);
  res.json(await updateTodo(req.userId, id, validateTodoInput(req.body)));
});

todosRouter.delete('/:id', async (req, res) => {
  await deleteTodo(req.userId, validateIdParam(req.params.id));
  res.status(204).end();
});

todosRouter.patch('/:id', async (req, res) => {
  const id = validateIdParam(req.params.id);
  res.json(await setCompleted(req.userId, id, validateCompletion(req.body)));
});
