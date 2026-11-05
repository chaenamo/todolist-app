import { Router } from 'express';
import { validateIdParam } from '../validators/common.js';
import { validateCategoryName } from '../validators/category.js';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
} from '../services/categoryService.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res) => {
  res.json(await listCategories(req.userId));
});

categoriesRouter.post('/', async (req, res) => {
  res.status(201).json(await createCategory(req.userId, validateCategoryName(req.body)));
});

categoriesRouter.patch('/:id', async (req, res) => {
  const id = validateIdParam(req.params.id);
  res.json(await renameCategory(req.userId, id, validateCategoryName(req.body)));
});

categoriesRouter.delete('/:id', async (req, res) => {
  await deleteCategory(req.userId, validateIdParam(req.params.id));
  res.status(204).end();
});
