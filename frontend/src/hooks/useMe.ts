import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, getMe, updateName } from '../api/users';
import { useAuthStore } from '../stores/authStore';

export const ME_KEY = ['me'] as const;

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: getMe });
}

export function useUpdateName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateName,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    // 비밀번호 변경 시 서버가 refresh token을 재발급하므로 교체한다
    onSuccess: (data) => useAuthStore.getState().setRefreshToken(data.refreshToken),
  });
}
