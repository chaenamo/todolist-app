import { Router } from 'express';
import { validateSignup, validateLogin, validateRefreshToken } from '../validators/auth.js';
import { signup, login, refreshAccessToken, logout } from '../services/authService.js';

// PR-07: 공개 경로. refresh·logout은 body의 refresh token으로 인증한다
export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  res.status(201).json(await signup(validateSignup(req.body)));
});

authRouter.post('/login', async (req, res) => {
  res.json(await login(validateLogin(req.body)));
});

authRouter.post('/refresh', async (req, res) => {
  res.json(await refreshAccessToken(validateRefreshToken(req.body)));
});

authRouter.post('/logout', async (req, res) => {
  await logout(validateRefreshToken(req.body));
  res.status(204).end();
});
