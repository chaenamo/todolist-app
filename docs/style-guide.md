# TodoList 스타일 가이드

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 비고 |
|------|------|--------|------|------|
| v0.1 | 2026-11-05 | chaenamo | 초안 | 최초 작성 (U-07 결정) |
| v0.2 | 2026-11-05 | chaenamo | 초안 | FE-03 구현 중 토큰 2개 추가 |
| v0.3 | 2026-11-05 | chaenamo | 초안 | 다크 모드 색 토큰 추가 |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 변경 내용 | 변경자 |
|------|------|-----------|-----------|--------|
| v0.1 | 2026-11-05 | 전체 | 와이어프레임 v0.5와 참고 캘린더 화면 3장(월간·주간·일간)을 검토해 디자인 토큰·컴포넌트·화면 규칙을 정의. 임시 원본이던 `tokens.css`(U-07)를 이 문서로 대체 | chaenamo |
| v0.2 | 2026-11-05 | 2.7 | FE-03 구현에서 리터럴 대신 쓰도록 `--toast-max-width`(480px), `--border-width-thick`(2px) 추가. 모달 최대 폭은 `--form-max-width` 재사용 | chaenamo |
| v0.3 | 2026-11-05 | 2.9(신규) | 화면 모드(FE-16): 다크 모드 색 토큰 값 정의(검정 배경·흰 글자·밝은 강조색). 라이트(2.1~2.4) 값 변경 없음 | chaenamo |

> 기준 문서: `docs/4-wireframe.md` (v0.5), `docs/5-project-principle.md` (PR-24, U-07), `docs/2-PRD.md` (NFR-16, NFR-17).
> 화면 구성·동작은 와이어프레임(WF, CMP)을 따르고, 이 문서는 **어떻게 보이는지**만 정한다. 둘이 다르면 와이어프레임이 우선이다.
> 이 문서 고유 ID: 스타일 규칙 `SG-xx`. 삭제되어도 **재사용하거나 다시 매기지 않는다.**

## 0. 적용 방법

| ID | 규칙 |
|----|------|
| SG-01 | **토큰의 구현은 `frontend/src/styles/tokens.css` 한 곳**이다. 이 문서 2장의 토큰 이름·값과 `tokens.css`가 같아야 하며, 값을 바꿀 때는 둘을 함께 고친다. |
| SG-02 | 컴포넌트 CSS(CSS Modules)는 색·간격·크기·모서리·그림자에 **`var(--…)`만** 쓴다. `#hex`, `rgb()`, `px` 직접값 금지. 예외: 미디어 쿼리 브레이크포인트(CSS 변수 사용 불가), `0`, `1px` 테두리 두께, `100%`. (FE-03 완료 조건) |
| SG-03 | 외부 UI 라이브러리·아이콘 폰트·웹폰트를 추가하지 않는다(PR-08, PR-17). 아이콘은 텍스트 기호(`‹` `›` `×` `+` `☰`) 또는 인라인 SVG를 쓰고, 기호만 있는 버튼에는 `aria-label`을 단다. |
| SG-04 | 상태·의미를 **색만으로 전달하지 않는다.** 상태 배지는 항상 텍스트 라벨(CMP-05), 완료는 취소선을 함께 쓴다. 접근성 감사는 범위 밖(NFR-17)이지만 본문 글자 대비는 4.5:1 이상을 목표로 값을 골랐다. |

## 1. 디자인 방향

참고 이미지(웹 캘린더 서비스의 월간·주간·일간 화면)에서 가져온 것과 가져오지 않은 것:

| 가져온 것 | 이 앱에 적용 |
|-----------|--------------|
| 흰 바탕 + 아주 옅은 회색 격자, 장식 없는 평면 UI | 전 화면 기본 톤. 그림자는 토스트·모달·드롭다운에만 |
| 보라 계열 주색 하나로 "선택됨"을 표시(현재 뷰 버튼, 주요 버튼) | `--color-primary`. 주색은 **주요 행동과 현재 선택**에만 쓴다 |
| 붙어 있는 버튼 묶음으로 뷰 전환(일간·주간·월간) | SG-24 세그먼트 컨트롤 (월/주/일) |
| 굵은 기간 제목 + 작은 이전/다음 버튼 + [오늘] | SG-25 기간 이동 툴바 |
| 오늘 칸은 옅은 파란 배경 + 진한 테두리 | SG-31 오늘 강조 |
| 일요일 날짜는 빨간색, 다른 달 날짜는 흐리게 | SG-30 날짜 번호 |
| 여러 날에 걸친 일정은 칸을 가로지르는 꽉 찬 색 막대 + 흰 글자, 뷰 밖으로 이어지면 `‹` `›` | SG-32 할일 바 (WF-06의 `<` `>`) |
| 작고 촘촘한 글자(12~14px)로 많은 정보를 한 화면에 | 캘린더·목록 행은 `--font-size-sm`/`xs` |

| 가져오지 않은 것 | 이유 |
|------------------|------|
| 왼쪽 사이드바(미니 달력, 캘린더 목록) | WF-01은 상단 내비 + 본문 중앙 정렬 |
| 주간·일간의 시간 격자(오전 6시~) | 할일은 날짜 단위(시간 없음). WF-06 주간은 7열 바, 일간은 목록 |
| 일정마다 다른 색(캘린더별 색) | 이 앱의 바 색은 **상태**(ST-01~04)로 정한다. 카테고리 색은 데이터에 없음 |
| 음력·공휴일·검색·알림·로고 | 범위 밖(PRD, 시나리오 4장) |

## 2. 디자인 토큰

### 2.1 색 — 기본

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-bg` | `#ffffff` | 페이지·카드·입력 배경 |
| `--color-surface` | `#f7f8fa` | 요일 머리 행, 툴바, 비활성 영역 |
| `--color-surface-hover` | `#f0f1f4` | 행·보조 버튼 hover |
| `--color-border` | `#e4e6ea` | 캘린더 격자, 목록 행 구분선, 카드 테두리 |
| `--color-border-strong` | `#c8ccd2` | 입력란·보조 버튼 테두리 |
| `--color-text` | `#1f2328` | 본문 |
| `--color-text-muted` | `#5f6670` | 보조 정보(카테고리, 기간), 라벨 |
| `--color-text-subtle` | `#9aa0a8` | 다른 달 날짜, placeholder, 비활성 글자 |
| `--color-primary` | `#5b4fe0` | 주요 버튼, 현재 뷰·현재 내비, 링크, 포커스 |
| `--color-primary-hover` | `#4a3fc8` | 주요 버튼 hover·active |
| `--color-primary-soft` | `#efedfd` | 선택된 항목 배경, 세그먼트 hover |
| `--color-primary-contrast` | `#ffffff` | 주색 위 글자 |
| `--color-overlay` | `rgba(17, 24, 39, 0.45)` | 모달 뒤 배경 |

### 2.2 색 — 캘린더

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-sunday` | `#d93b3b` | 일요일 요일·날짜 번호 |
| `--color-today-bg` | `#eef4fb` | 오늘 칸(월간·주간) 배경 |
| `--color-today-border` | `#1f2328` | 오늘 칸 테두리(2px) |

### 2.3 색 — 할일 상태 (CMP-05, ST-01~04)

배지(옅은 배경 + 진한 글자)와 캘린더 바(진한 배경 + 흰 글자) 두 벌을 둔다. 완료 바만 옅은 배경 + 취소선으로 "끝난 일"을 뒤로 물린다.

| 상태 | 배지 배경 / 글자 | 캘린더 바 배경 / 글자 |
|------|------------------|------------------------|
| 시작 전 (ST-02) | `--color-status-not-started` `#eef0f3` / `--color-status-not-started-text` `#4b5563` | `--color-bar-not-started` `#6b7488` / `--color-bar-text` `#ffffff` |
| 진행 중 (ST-03) | `--color-status-in-progress` `#efedfd` / `--color-status-in-progress-text` `#4a3fc8` | `--color-bar-in-progress` `#5b4fe0` / `--color-bar-text` |
| 기한 초과 (ST-04) | `--color-status-overdue` `#fde8e6` / `--color-status-overdue-text` `#b8321f` | `--color-bar-overdue` `#c73e29` / `--color-bar-text` |
| 완료 (ST-01) | `--color-status-completed` `#e3f4e8` / `--color-status-completed-text` `#1d7a3e` | `--color-bar-completed` `#e4e6ea` / `--color-text-muted` + 취소선 |

### 2.4 색 — 피드백

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-error` | `#b8321f` | 필드 오류 문구, 오류 입력 테두리, 위험 버튼 |
| `--color-error-hover` | `#9c2a1a` | 위험 버튼 hover |
| `--color-error-bg` | `#fde8e6` | 실패 토스트, 폼 오류 박스 배경 |
| `--color-success` | `#1d7a3e` | 성공 토스트 글자·아이콘 |
| `--color-success-bg` | `#e3f4e8` | 성공 토스트 배경 |

### 2.5 타이포그래피

| 토큰 | 값 | 용도 |
|------|----|------|
| `--font-family` | `system-ui, -apple-system, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif` | 전체. 웹폰트 없음(SG-03) |
| `--font-size-xs` | `0.75rem` (12px) | 캘린더 바·날짜 번호·요일, 배지 |
| `--font-size-sm` | `0.875rem` (14px) | 목록 행, 버튼, 라벨, 보조 정보, 토스트 |
| `--font-size-md` | `1rem` (16px) | 본문, **입력란**(모바일 자동 확대 방지) |
| `--font-size-lg` | `1.25rem` (20px) | 화면 제목, 캘린더 기간 제목 |
| `--font-size-xl` | `1.5rem` (24px) | 로그인·회원가입 제목, 404 문구 |
| `--font-weight-regular` | `400` | 본문 |
| `--font-weight-medium` | `500` | 버튼, 현재 내비, 요일 |
| `--font-weight-bold` | `600` | 제목, 기간 제목, 앱 이름 |
| `--line-height` | `1.5` | 본문 |
| `--line-height-tight` | `1.25` | 제목, 캘린더 바 |

- 날짜·숫자가 세로로 정렬되는 곳(목록 기간, 캘린더 날짜, 페이지 번호)은 `font-variant-numeric: tabular-nums`.
- 날짜 표기: 목록·일간 행은 `11/10 ~ 11/12`, 월간 제목 `2026년 11월`, 주간 제목 `2026.11.08 ~ 11.14`, 일간 제목 `2026년 11월 11일 (수)` (WF-04, WF-06).

### 2.6 간격 (4px 단위)

| 토큰 | 값 | 주 용도 |
|------|----|---------|
| `--space-1` | `4px` | 바 사이, 아이콘-글자 사이 |
| `--space-2` | `8px` | 버튼 안 좌우 여백(소), 필드 라벨-입력 사이 |
| `--space-3` | `12px` | 버튼 좌우 여백, 목록 행 상하 여백 |
| `--space-4` | `16px` | 모바일 좌우 여백, 카드 안 여백, 폼 필드 사이 |
| `--space-6` | `24px` | 화면 제목-본문 사이, 데스크톱 좌우 여백 |
| `--space-8` | `32px` | 섹션 사이 |
| `--space-12` | `48px` | 빈 상태·404 위아래 여백 |

### 2.7 크기·모서리·그림자·레이어

| 토큰 | 값 | 용도 |
|------|----|------|
| `--header-height` | `56px` | 상단 내비 |
| `--content-max-width` | `960px` | 본문 최대 폭(WF-01) |
| `--form-max-width` | `400px` | 로그인·회원가입·내 정보·편집 폼 폭, 모달 최대 폭 |
| `--toast-max-width` | `480px` | 토스트 최대 폭(데스크톱) |
| `--control-height` | `36px` | 버튼·입력·셀렉트 높이(데스크톱) |
| `--control-height-touch` | `44px` | 모바일(768px 미만) 버튼·입력 높이 |
| `--calendar-bar-height` | `20px` | 캘린더 할일 바 |
| `--calendar-cell-min-height` | `112px` | 월간·주간 칸 최소 높이(데스크톱, 넘치면 늘어남) |
| `--calendar-cell-min-height-mobile` | `72px` | 모바일 칸(바 2줄 + `+N`) |
| `--border-width-thick` | `2px` | 현재 내비 밑줄, 오늘 칸 테두리 |
| `--radius-xs` | `2px` | 캘린더 바 |
| `--radius-sm` | `4px` | 버튼, 입력, 세그먼트 |
| `--radius-md` | `8px` | 카드, 모달, 토스트 |
| `--radius-pill` | `999px` | 상태 배지 |
| `--shadow-popover` | `0 4px 16px rgba(17, 24, 39, 0.12)` | 토스트, 모바일 메뉴 |
| `--shadow-modal` | `0 12px 32px rgba(17, 24, 39, 0.2)` | 모달 |
| `--focus-ring` | `0 0 0 3px rgba(91, 79, 224, 0.35)` | 키보드 포커스(`:focus-visible`) |
| `--z-header` | `10` | 상단 내비 |
| `--z-modal` | `20` | 모달 + 오버레이 |
| `--z-toast` | `30` | 토스트(모달 위) |
| `--duration-fast` | `150ms` | hover·포커스 전환, 메뉴 열림 |

### 2.8 브레이크포인트 (CSS 변수 불가 → 값만, NFR-16)

| 이름 | 범위 | 레이아웃 |
|------|------|----------|
| 모바일 | 360px ~ 767px | 햄버거 내비, 1열 카드, 터치 높이 44px, 좌우 여백 `--space-4` |
| 태블릿 | 768px ~ 1023px | 상단 내비, 목록은 데스크톱 행, 좌우 여백 `--space-6` |
| 데스크톱 | 1024px 이상 | 본문 최대 960px 중앙 정렬 |

미디어 쿼리는 모바일 우선: `@media (min-width: 768px)`, `@media (min-width: 1024px)`. 360px에서 가로 스크롤이 생기면 안 된다(NFR-16).

### 2.9 다크 모드 (FE-16)

`<html data-theme="dark">`일 때 `tokens.css`의 `:root[data-theme='dark']`가 아래 **색 토큰만** 덮어쓴다(나머지 토큰은 2.1~2.8 그대로). 라이트는 2.1~2.4 값 그대로이고 기본 모드다(8-plan PQ-08). 방향: 검정 배경, 흰 글자, 강조색은 밝게 하고 그 위 글자는 검정(`--color-primary-contrast`, `--color-bar-text`). 글자 대비는 모두 4.5:1 이상. `color-scheme: dark`로 네이티브 입력·스크롤바도 어둡게 한다.

| 토큰 | 다크 값 | 비고 |
|------|---------|------|
| `--color-bg` | `#000000` | 페이지 배경(검정) |
| `--color-surface` | `#121212` | 필터 영역·모달 등 면 |
| `--color-surface-hover` | `#1f1f1f` | hover 배경 |
| `--color-border` | `#2c2c2c` | 구분선·격자 |
| `--color-border-strong` | `#555a62` | 입력란·보조 버튼 테두리 |
| `--color-text` | `#ffffff` | 본문 글자(흰색) |
| `--color-text-muted` | `#c2c6cc` | 보조 글자 |
| `--color-text-subtle` | `#8d939b` | 다른 달 날짜 등 흐린 글자 |
| `--color-primary` | `#a59cff` | 주 버튼·선택 상태(밝은 보라) |
| `--color-primary-hover` | `#c0b9ff` | 주 버튼 hover |
| `--color-primary-soft` | `#26214d` | 선택 행·연한 강조 배경 |
| `--color-primary-contrast` | `#000000` | 밝은 강조색 위 글자 |
| `--color-overlay` | `rgba(0, 0, 0, 0.7)` | 모달 오버레이 |
| `--color-sunday` | `#ff8080` | 일요일 날짜 |
| `--color-today-bg` | `#16223a` | 오늘 칸 배경 |
| `--color-today-border` | `#ffffff` | 오늘 칸 테두리 |
| `--color-status-not-started` | `#2a2d33` | 배지: 시작 전 |
| `--color-status-not-started-text` | `#d6dae0` |  |
| `--color-status-in-progress` | `#26214d` | 배지: 진행 중 |
| `--color-status-in-progress-text` | `#c0b9ff` |  |
| `--color-status-completed` | `#11331f` | 배지: 완료 |
| `--color-status-completed-text` | `#74e6a2` |  |
| `--color-status-overdue` | `#3d1712` | 배지: 기한 초과 |
| `--color-status-overdue-text` | `#ff9d8c` |  |
| `--color-bar-not-started` | `#a3abbd` | 캘린더 바: 시작 전 |
| `--color-bar-in-progress` | `#a59cff` | 캘린더 바: 진행 중 |
| `--color-bar-overdue` | `#ff8a73` | 캘린더 바: 기한 초과 |
| `--color-bar-completed` | `#2c2c2c` | 캘린더 바: 완료 |
| `--color-bar-text` | `#000000` | 바 글자(밝은 바 위) |
| `--color-error` | `#ff8a73` | 오류 글자·위험 버튼 |
| `--color-error-hover` | `#ffa898` |  |
| `--color-error-bg` | `#3d1712` | 오류 배경 |
| `--color-success` | `#74e6a2` |  |
| `--color-success-bg` | `#11331f` |  |
| `--shadow-popover` | `0 4px 16px rgba(0, 0, 0, 0.6)` |  |
| `--shadow-modal` | `0 12px 32px rgba(0, 0, 0, 0.7)` |  |
| `--focus-ring` | `0 0 0 3px rgba(165, 156, 255, 0.5)` |  |

## 3. 공통 요소

### SG-10 버튼

| 종류 | 모양 | 쓰는 곳 |
|------|------|---------|
| 주요(primary) | 배경 `--color-primary`, 글자 `--color-primary-contrast`, hover `--color-primary-hover` | 화면당 1개: [+ 새 할일], [저장], [로그인], [가입], 모달의 확인(삭제 제외) |
| 보조(secondary) | 배경 `--color-bg`, 테두리 `--color-border-strong`, 글자 `--color-text`, hover `--color-surface-hover` | [취소], [필터 초기화], [오늘], [수정], 페이지 번호 |
| 위험(danger) | 배경 `--color-error`, 글자 흰색, hover `--color-error-hover` | 삭제 확인 모달의 [삭제] |
| 텍스트(ghost) | 배경·테두리 없음, 글자 `--color-text-muted`, hover `--color-surface-hover` | 목록 행의 [삭제] 진입 버튼, 토스트 닫기 `×`, 내비 [로그아웃] |
| 아이콘 | 보조 버튼과 같되 정사각형(`--control-height`) | 이전 `‹` / 다음 `›`, 햄버거 `☰` — `aria-label` 필수 |

- 높이 `--control-height`(모바일 `--control-height-touch`), 좌우 여백 `--space-3`, 글자 `--font-size-sm` `--font-weight-medium`, 모서리 `--radius-sm`.
- 비활성(`disabled`, 요청 중): 불투명도 0.5, `cursor: not-allowed`. 요청 중인 버튼은 문구를 유지하고 비활성만 한다(완료 토글 포함, WF-04).
- 포커스: `:focus-visible`에 `box-shadow: var(--focus-ring)`. outline을 지우기만 하고 대체 표시를 안 하는 것은 금지.

### SG-11 입력란·셀렉트·체크박스

- 입력·셀렉트: 높이 `--control-height`(모바일 터치 높이), 테두리 1px `--color-border-strong`, 모서리 `--radius-sm`, 글자 `--font-size-md`, 좌우 여백 `--space-3`. 포커스 시 테두리 `--color-primary` + `--focus-ring`.
- 라벨은 입력란 **위**, `--font-size-sm` `--font-weight-medium`, 라벨-입력 간격 `--space-2`. placeholder는 라벨을 대신하지 않는다.
- 필수 표시: 라벨 뒤 ` *` (`--color-error`).
- 체크박스: 네이티브 `<input type="checkbox">` + `accent-color: var(--color-primary)`, 라벨 클릭 영역 포함. 완료 토글도 같은 체크박스(WF-04 6).
- 날짜: 네이티브 `<input type="date">`(FR-04 피커, 추가 라이브러리 없음).
- 읽기 전용(내 정보 이메일): 배경 `--color-surface`, 글자 `--color-text-muted`.

### SG-12 필드 오류·폼 오류 (CMP-03 3)

- 필드 오류: 입력란 테두리 `--color-error`, 바로 아래 `--space-1` 간격으로 `! 문구`, `--font-size-sm` `--color-error`. 입력에 `aria-invalid="true"`, 문구는 `aria-describedby`로 연결.
- 폼 오류(필드에 귀속되지 않는 서버 거부, 로그인 실패 G-04): 제출 버튼 위 박스, 배경 `--color-error-bg`, 글자 `--color-error`, 모서리 `--radius-sm`, 여백 `--space-3`, `role="alert"`.

### SG-13 상태 배지 (CMP-05)

- 알약형: 모서리 `--radius-pill`, 좌우 `--space-2`, 상하 2px(예외 허용), 글자 `--font-size-xs` `--font-weight-medium`, 줄바꿈 금지.
- 색은 2.3 배지 열. 라벨은 '시작 전'·'진행 중'·'완료'·'기한 초과'로 고정(SG-04).

### SG-14 토스트 (CMP-03 1·2)

- 위치: 상단 내비 바로 아래 가운데, `--z-toast`. 데스크톱 폭 최대 480px, 모바일 폭 90%.
- 모양: 모서리 `--radius-md`, 여백 `--space-3` `--space-4`, 그림자 `--shadow-popover`, 글자 `--font-size-sm`, 오른쪽 닫기 `×`(텍스트 버튼).
- 성공: 배경 `--color-success-bg`, 글자 `--color-success`, `role="status"`, 3초 후 자동 닫힘. 실패: 배경 `--color-error-bg`, 글자 `--color-error`, `role="alert"`, 수동 닫기.

### SG-15 모달 (CMP-01, CMP-02)

- 오버레이 `--color-overlay`, 본문 상자 배경 `--color-bg`, 모서리 `--radius-md`, 그림자 `--shadow-modal`, 여백 `--space-6`, 폭 최대 400px(모바일은 좌우 `--space-4` 남기고 꽉 참).
- 제목 `--font-size-lg` `--font-weight-bold`, 본문 `--font-size-sm` `--color-text-muted`.
- 버튼은 오른쪽 정렬 [취소](보조) → [확인](주요 또는 위험) 순. 모바일은 버튼 전체 폭, 세로로 확인이 위.
- `role="dialog"` `aria-modal="true"`, 열리면 [취소]에 포커스(삭제 오조작 방지), Esc = 취소.

### SG-16 빈 상태·404 (WF-04 8, WF-06 7, CMP-04)

- 가운데 정렬, 위아래 여백 `--space-12`, 문구 `--font-size-md` `--color-text-muted`, 그 아래 `--space-4` 간격으로 버튼 1개(보조, 404는 주요).
- 404 문구는 `--font-size-xl`. 문구는 와이어프레임 그대로.

### SG-17 로딩

- 화면 단위: 본문 가운데 "불러오는 중…" `--font-size-sm` `--color-text-muted`, `role="status"`(FE-02 인증 확인 화면과 같은 방식). 스피너 그래픽은 쓰지 않는다.
- 재조회 중에는 기존 목록을 유지하고 지우지 않는다(깜빡임 방지).

## 4. 레이아웃 (WF-01)

### SG-20 상단 내비

- 높이 `--header-height`, 배경 `--color-bg`, 아래 테두리 1px `--color-border`, `position: sticky; top: 0`, `--z-header`.
- 왼쪽 앱 이름 "TodoList" `--font-size-lg` `--font-weight-bold` `--color-text`(로고 이미지 없음).
- 내비 항목: `--font-size-sm` `--font-weight-medium` `--color-text-muted`. **현재 화면**은 글자 `--color-primary` + 아래 2px 막대 `--color-primary`(`aria-current="page"`). hover는 `--color-text`.
- [로그아웃]은 오른쪽 끝 텍스트 버튼(SG-10 ghost).
- 모바일: 오른쪽 `☰` 아이콘 버튼 → 내비 아래로 펼치는 세로 목록(배경 `--color-bg`, 그림자 `--shadow-popover`, 항목 높이 `--control-height-touch`), 로그아웃은 맨 아래 + 위 구분선.

### SG-21 본문

- 최대 폭 `--content-max-width` 가운데 정렬, 좌우 여백 모바일 `--space-4` / 태블릿 이상 `--space-6`, 위 여백 `--space-6`.
- 화면 제목 행: 왼쪽 제목(`--font-size-lg` `--font-weight-bold`, `<h1>`), 오른쪽 주요 버튼. 제목 행 아래 `--space-4`.
- 폼 화면(로그인·회원가입·내 정보·할일 편집·카테고리 관리)은 `--form-max-width`. 로그인·회원가입은 내비 없이 화면 가운데.

## 5. 할일 목록 (WF-04)

### SG-22 필터 영역

- 배경 `--color-surface`, 모서리 `--radius-md`, 여백 `--space-3` `--space-4`, 목록과 간격 `--space-4`.
- 데스크톱 한 줄: 카테고리 셀렉트 → 상태 체크박스 4개(간격 `--space-3`) → 오른쪽 [필터 초기화]. 정렬 안내("종료일자 오름차순")는 그 아래 `--font-size-xs` `--color-text-muted`.
- 모바일: 세로 배치, 상태 체크박스 2열.

### SG-23 할일 행 / 카드

- 데스크톱 행: 높이 최소 48px(예외 허용), 상하 여백 `--space-3`, 아래 테두리 1px `--color-border`, hover 배경 `--color-surface-hover`. 열 순서: 완료 체크박스 / 제목(`--font-size-sm` `--font-weight-medium`, 넘치면 말줄임) / 카테고리 / 기간(tabular-nums) / 상태 배지 / [수정] [삭제] — 보조 정보는 `--color-text-muted`.
- 완료 항목: 제목 `text-decoration: line-through` + `--color-text-muted`(목록·캘린더 동일, Q-03).
- 모바일 카드(3줄): 1줄 체크박스 + 제목 + [삭제], 2줄 `카테고리 · 기간`(`--font-size-sm` muted), 3줄 배지. 카드 사이 테두리 1px `--color-border`, 좌우 여백 없음(본문 여백 사용).
- 페이지네이션: 가운데 정렬, 보조 버튼, 현재 페이지는 주요 색 채움(`aria-current="page"`), 모바일은 `n / N` 텍스트.

## 6. 캘린더 (WF-06)

### SG-24 뷰 전환 세그먼트 (월/주/일)

- 버튼 3개를 붙여 한 묶음: 테두리 1px `--color-border-strong`, 바깥 모서리만 `--radius-sm`, 사이는 1px 구분선.
- 기본: 배경 `--color-bg`, 글자 `--color-text-muted` `--font-size-sm`. **현재 뷰**: 배경 `--color-primary`, 글자 `--color-primary-contrast`(`aria-pressed="true"`). hover: `--color-primary-soft`.

### SG-25 기간 이동 툴바

- 한 줄: [`‹`] [오늘] [`›`] (보조·아이콘 버튼, 간격 `--space-1`) → 기간 제목(`--font-size-lg` `--font-weight-bold`, tabular-nums) → 오른쪽 끝 SG-24.
- 모바일: 1줄 버튼, 2줄 제목, 3줄 세그먼트(WF-06 모바일).

### SG-26 격자 (월간·주간)

- 7열 균등(`grid-template-columns: repeat(7, minmax(0, 1fr))`, 가로 스크롤 금지). 바깥·칸 테두리 1px `--color-border`.
- 요일 머리 행: 배경 `--color-surface`, 높이 32px(예외 허용), `--font-size-xs` `--font-weight-medium` `--color-text-muted`, 일요일만 `--color-sunday`. 주 시작은 일요일(A-12).
- 칸 최소 높이 `--calendar-cell-min-height`(모바일 `-mobile`), 칸 안 여백 `--space-1`.

### SG-30 날짜 번호

- 칸 왼쪽 위, `--font-size-xs`, tabular-nums. 일요일 `--color-sunday`, 현재 월이 아닌 날짜 `--color-text-subtle`. 월의 1일(그리고 다른 달 1일)은 `11/1`, `12/1`처럼 월 표기.
- 날짜 번호는 버튼(일간 뷰로 이동, WF-06 9): hover 시 밑줄, `aria-label="11월 11일 일간 보기"`.

### SG-31 오늘 강조

- 월간·주간: 오늘 칸 배경 `--color-today-bg` + 안쪽 2px 테두리 `--color-today-border`(`box-shadow: inset` 사용, 격자 크기 불변).
- 날짜 번호는 `--font-weight-bold`. 일간 제목에는 강조 없음.

### SG-32 할일 바

- 높이 `--calendar-bar-height`, 모서리 `--radius-xs`, 바 사이 세로 간격 `--space-1`, 글자 `--font-size-xs` `--line-height-tight` 한 줄 말줄임, 좌우 여백 `--space-1`.
- 색은 **상태**별(2.3 바 열). 완료는 옅은 배경 + `--color-text-muted` + 취소선.
- 여러 칸에 걸치면 한 줄로 이어 그리고(주 경계에서는 다음 줄에서 이어짐), 뷰 밖으로 이어지는 쪽 끝에 `‹` / `›` 표시, 그 쪽 모서리는 각지게(0).
- 바는 버튼(편집으로 이동): `title`과 `aria-label`에 "제목, 기간, 상태" 전체, hover 시 밝기 `filter: brightness(0.92)`, 포커스 `--focus-ring`.
- 모바일 `+N`: 바 2줄 아래 `--font-size-xs` `--font-weight-medium` `--color-text-muted` 텍스트 버튼("+1"), `aria-label="11월 11일 할일 1건 더 보기"`.

### SG-33 일간 목록

- SG-23 데스크톱 행과 같은 열(완료 토글·수정·삭제 없음, G-15·G-16): 제목(바 색의 왼쪽 4px 막대로 상태 보조 표시) / 카테고리 / 기간 / 배지. 모바일은 1열 카드.
- 할일이 없으면 SG-16 문구 "이 날 할일이 없습니다".

## 7. 화면별 적용 요약

| 화면 | 적용 규칙 |
|------|-----------|
| WF-02 로그인 / WF-03 회원가입 | 내비 없음, 가운데 카드(`--form-max-width`, 테두리 `--color-border`, `--radius-md`, 여백 `--space-8`), 제목 `--font-size-xl`, 주요 버튼 전체 폭, 폼 오류 SG-12, 전환 링크 `--color-primary` |
| WF-04 할일 목록 | SG-21 제목 행 + SG-22 + SG-23 + SG-16 |
| WF-05 할일 편집 | SG-21 폼 폭, SG-11·SG-12, 버튼 오른쪽 [취소][저장], 이탈 시 SG-15 |
| WF-06 캘린더 | SG-24~SG-26, SG-30~SG-33 |
| WF-07 내 정보 | 이름·비밀번호 두 구역(사이 `--space-8` + 구분선), 이메일 읽기 전용 SG-11, 구역별 저장 버튼 |
| WF-08 카테고리 관리 | 등록 입력 + 버튼 한 줄, 목록 행 SG-23 스타일('기본'은 이름 옆 배지 대신 `--color-text-muted` "(기본)", 변경·삭제 버튼 숨김) |
| CMP-01~05 | SG-15, SG-14, SG-16, SG-13 |

## 8. 하지 말 것

- 주색을 장식(배경 띠, 큰 면적)에 쓰지 않는다. 화면당 주요 버튼 1개.
- 그라디언트, 큰 그림자, 둥근 큰 카드(8px 초과 모서리), 이모지 아이콘을 쓰지 않는다.
- 상태를 색 점·색 바만으로 표시하지 않는다(SG-04).
- 캘린더에서 바 색을 카테고리별로 바꾸지 않는다(카테고리 색 데이터 없음, 1장).
- 컴포넌트 CSS에 색·간격 리터럴을 쓰지 않는다(SG-02).

## 9. 확인 필요 / 결정 기록

| 항목 | 결정 | 근거 / 확인 필요 |
|------|------|------------------|
| U-07 스타일 가이드 | **결정**: 이 문서가 원본, `tokens.css`는 구현(SG-01) | 원칙 U-07, develop-frontend 스킬 |
| 캘린더 바 색 기준 | 상태(ST-01~04)별 | 카테고리 색 없음. 카테고리 색이 필요해지면 DB·API 변경이 필요해 별도 결정 |
| 주색 | 보라 `#5b4fe0` | 참고 화면의 "선택됨" 색 계열, 흰 글자 대비 약 6:1 |
| 데스크톱 칸 넘침 | 칸 높이를 늘려 전부 표시 | 와이어프레임 6.2와 동일, 모바일만 `+N` |
| 다크 모드 | 지원하지 않음 | PRD에 요구 없음 |
