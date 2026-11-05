import { Router } from 'express';
import { validateUpdateMe, validateChangePassword } from '../validators/user.js';
import { getMe, updateMe, changePassword } from '../services/userService.js';

export const usersRouter = Router();

usersRouter.get('/me', async (req, res) => {
  res.json(await getMe(req.userId));
});

usersRouter.patch('/me', async (req, res) => {
  res.json(await updateMe(req.userId, validateUpdateMe(req.body)));
});

usersRouter.put('/me/password', async (req, res) => {
  res.json(await changePassword(req.userId, validateChangePassword(req.body)));
});
