import { Router } from 'express';
import { validateCategoryName } from '../validators/category.js';
import { listCategories, createCategory } from '../services/categoryService.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res) => {
  res.json(await listCategories(req.userId));
});

categoriesRouter.post('/', async (req, res) => {
  res.status(201).json(await createCategory(req.userId, validateCategoryName(req.body)));
});
