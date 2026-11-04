#todolist-app의 최상위 지침

## 반드시 지켜야할 지침

- 모든 응답은 한국어로 할 것
- 오버엔지니어링 금지

## 프로젝트의 디렉토리 구조

- 백엔드 : backend/
- 프론트엔드 : frontend/
- 문서 : docs/

## 문서 목록

| 문서                                                       | 내용                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| [docs/1-domain-definition.md](docs/1-domain-definition.md) | 도메인 정의서: 엔터티, 상태(ST), 비즈니스 규칙(BR), 유스케이스(UC) |
| [docs/2-PRD.md](docs/2-PRD.md)                             | PRD: 기능·비기능 요구사항(NFR), 기술 제약(TC), 우선순위(MoSCoW)    |
| [docs/3-user-scenario.md](docs/3-user-scenario.md)         | 사용자 시나리오(SC)와 예외 흐름                                    |
| [docs/4-wireframe.md](docs/4-wireframe.md)                 | 와이어프레임(WF), 공통 컴포넌트(CMP), 전체 화면 흐름               |
| [docs/5-project-principle.md](docs/5-project-principle.md) | 프로젝트 구조 설계 원칙(PR), FE/BE 디렉토리 구조                   |
| [docs/6-arch-diagram.md](docs/6-arch-diagram.md)           | 기술 아키텍처·시퀀스 다이어그램(AD)                                |
| [docs/7-erd.md](docs/7-erd.md)                             | ERD: 테이블(T), 제약(CN), 인덱스(IX)                               |
| [docs/schema.sql](docs/schema.sql)                         | PostgreSQL DDL (7-erd 기준)                                        |
| [docs/8-plan.md](docs/8-plan.md)                           | 실행 계획(WBS): DB/BE/FE/QA/OPS 작업과 완료 조건                   |
| [docs/9-api-spec.md](docs/9-api-spec.md)                   | API 계약: 엔드포인트 19개, 인증, 에러 형식, 결정 사항(BE-01)       |
| [backend/swagger.yaml](backend/swagger.yaml)               | API 명세 (OpenAPI 3.0.3)                                           |
