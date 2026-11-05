// BE-01 계약(docs/9-api-spec.md 1.2)의 응답 타입. 손으로 쓴다(PR-24)

export type TodoStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  isDefault: boolean;
}

// 쓰기·단건 조회 응답에는 status가 없다(AQ-09)
export interface Todo {
  id: number;
  categoryId: number;
  title: string;
  description: string | null;
  startDate: string; // 'YYYY-MM-DD' (PR-04)
  endDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 등록·수정 요청 본문 (isCompleted는 PATCH로만 바꾼다)
export interface TodoInput {
  title: string;
  description: string | null;
  categoryId: number | null;
  startDate: string;
  endDate: string;
}

// 목록·캘린더 항목
export interface TodoWithStatus extends Todo {
  status: TodoStatus;
}

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface Items<T> {
  items: T[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// PR-20 에러 본문
export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
