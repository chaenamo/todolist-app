import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { login, logout, signup } from '../api/auth';
import { discardSession } from '../api/client';
import type { AuthResponse } from '../api/types';
import { useAuthStore } from '../stores/authStore';

function useAuthSuccess() {
  const navigate = useNavigate();
  return (data: AuthResponse) => {
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    void navigate('/todos', { replace: true });
  };
}

export function useSignup() {
  return useMutation({ mutationFn: signup, onSuccess: useAuthSuccess() });
}

export function useLogin() {
  return useMutation({ mutationFn: login, onSuccess: useAuthSuccess() });
}

export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  return async () => {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // A-14: 네트워크 오류·5xx여도 로그아웃을 막지 않는다
    } finally {
      discardSession();
      void navigate('/login', { replace: true });
    }
  };
}
