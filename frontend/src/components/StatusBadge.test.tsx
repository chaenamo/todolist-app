import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { STATUS_LABEL, StatusBadge } from './StatusBadge';

afterEach(() => {
  cleanup();
});

const cases = [
  ['NOT_STARTED', '시작 전'],
  ['IN_PROGRESS', '진행 중'],
  ['COMPLETED', '완료'],
  ['OVERDUE', '기한 초과'],
] as const;

test('[CMP-05] StatusBadge는 4개 코드를 각각 시작 전·진행 중·완료·기한 초과로 표시한다', () => {
  for (const [status, label] of cases) {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
    expect(STATUS_LABEL[status]).toBe(label);
    cleanup();
  }
});
