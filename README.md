# 나를 소개하는 웹페이지 처음부터 만들기

> **[나를 소개하는 웹페이지 처음부터 만들기] - 순수 HTML/CSS/JavaScript로 구현한 반응형 포트폴리오 웹사이트 (GitHub API 연동 및 다크 모드 지원)**

---

## 📖 과제 소개

본 프로젝트는 외부 UI 라이브러리(React, Vue, jQuery, Bootstrap, Tailwind CSS 등)를 일체 사용하지 않고, 브라우저 표준 기술인 **순수 HTML5, CSS3, Vanilla JavaScript(ES6+)만으로 완성한 반응형 포트폴리오 웹사이트입니다.**

단순한 정적 페이지 구현을 넘어, 웹 프론트엔드의 가장 본질적인 동작 메커니즘인 **"사용자 이벤트 → 상태 변경 → DOM 조작 및 화면 렌더링"의 단방향 데이터 흐름을 체계적으로 구현했습니다.** 또한 GitHub REST API를 연동하여 실무 서비스에서 필수적인 4대 비동기 상태(로딩, 성공, 에러/레이트 리밋, 빈 데이터)를 견고하게 핸들링합니다.

---

## 🎯 학습 목표

- **시맨틱 마크업 설계**: `div` 남발을 지양하고 의미론적 태그(`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)를 활용하여 검색 엔진 최적화(SEO) 및 웹 접근성(a11y) 기준을 충족할 수 있습니다.
- **CSS 변수와 반응형 레이아웃**: `:root` 디자인 토큰 시스템을 구축하고, Flexbox와 Grid(`auto-fit`, `minmax`)를 조합하여 모바일 퍼스트 반응형 웹을 구현할 수 있습니다.
- **이벤트 기반 DOM 조작**: `addEventListener`와 `classList`를 사용하여 햄버거 메뉴, 스크롤 감지 헤더, 스크롤탑 버튼, 다크 모드 전환을 제어할 수 있습니다.
- **비동기 통신과 상태 렌더링**: `fetch` 및 `async/await`로 외부 API 데이터를 호출하고, 로딩/성공/에러/빈데이터 상태를 UI로 분기 렌더링할 수 있습니다.
- **폼 유효성 검증 UX**: 정규표현식과 실시간 `input` 이벤트를 연계하여 즉각적인 피드백을 제공하고, `preventDefault()`를 통한 안전한 폼 제출 흐름을 설계할 수 있습니다.

---

## 🌟 주요 기능

1. **6대 필수 섹션 구성**:
   - `Hero`: 인사말, 직무(AI & 백엔드 엔지니어), Codyssey 동료학습 배지, 사람을 위한 가치 지향 소개 및 CTA 앵커 버튼
   - `About`: 개발 가치관(사람을 위한 개발자), Codyssey AI 과정 동료학습 & 상호 평가, MIS 유지보수 및 차세대 개발 실무 경험(1년), 배드민턴 취미 및 프로필 이미지
   - `Skills`: Backend, Database, Web Basics, Tools 4개 그룹별 기술 스택 목록
   - `Projects`: GitHub REST API 연동을 통한 최신 공개 저장소 카드 목록 렌더링
   - `Contact`: 이름, 이메일, 문의 내용 실시간 유효성 검사 및 전송 성공 피드백 폼
   - `Footer`: 저작권 표기 및 GitHub/Email 소셜 링크
2. **반응형 인터랙션**:
   - 모바일 네비게이션 햄버거 메뉴 토글 (`classList.toggle('active')`)
   - 앵커 링크 부드러운 스크롤 이동 (`scroll-behavior: smooth`)
   - 스크롤 60px 이상 시 헤더 블러 및 배경색 스타일 전환
   - 스크롤 300px 이상 시 우측 하단 스크롤탑 버튼 노출 및 최상단 이동
   - `IntersectionObserver`를 활용한 카드 및 섹션 스크롤 진입 페이드인 애니메이션
3. **테마 영속화 (다크 모드)**:
   - 다크 모드 토글 버튼 및 `[data-theme="dark"]` CSS 변수 오버라이드
   - `localStorage`를 통한 사용자 테마 설정 영구 보존 (새로고침 후에도 유지)
   - 시스템 OS 설정(`prefers-color-scheme`) 초기 감지
4. **GitHub API 4대 상태 처리**:
   - 로딩 상태: 원형 스피너 및 로딩 텍스트 노출
   - 성공 상태: 템플릿 리터럴과 `map`을 활용한 카드 리스트 동적 렌더링
   - 에러 상태: 403 Rate Limit 대응 안내 및 [다시 시도], [샘플 프로젝트 보기] 지원
   - 빈 데이터 상태: 안내 문구 및 [샘플 프로젝트 불러오기] 지원

---

## 🛠️ 사용 기술 및 제약 사항 준수

| 구분 | 적용 기술 및 도구 | 제약 사항 준수 여부 |
| :--- | :--- | :---: |
| **Markup** | HTML5 Semantic Elements, WAI-ARIA, Google Fonts, Font Awesome | **준수** (외부 UI 프레임워크 미사용) |
| **Styling** | CSS3 (:root 변수, Flexbox, Grid, Media Queries, Transition) | **준수** (인라인 스타일 `style="..."` 배제) |
| **Scripting** | Vanilla JavaScript (ES6+, DOM API, Fetch API, IntersectionObserver) | **준수** (`var` 배제, `onclick` 배제, `defer` 연결) |
| **VCS & Deploy** | Git, GitHub Pages | **준수** (독립 Git 저장소 관리) |

---

## 📁 프로젝트 구조

```text
projects/B1-1/
├── index.html              # 시맨틱 구조의 메인 웹페이지
├── assignment.pdf          # 과제 공식 요구사항 원본 문서
├── README.md               # 프로젝트 상세 안내 및 감사 보고서
│
├── css/
│   └── style.css           # CSS 변수, 모바일 퍼스트 반응형, 다크모드 스타일
│
├── js/
│   └── main.js             # 햄버거, 다크모드, 폼 유효성, GitHub API 연동 스크립트
│
└── images/
    └── profile.svg         # 프로필 아바타 벡터 이미지
```

---

## 🧪 테스트 및 검증 결과

| 검증 영역 | 테스트 시나리오 | 검증 결과 |
| :--- | :--- | :---: |
| **시맨틱 마크업** | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` 정상 포함 여부 | `PASS` |
| **웹 접근성** | 이미지 `alt` 속성 존재, `<label for>`와 `<input id>` 1:1 매칭 | `PASS` |
| **반응형 뷰포트** | 모바일(<768px), 태블릿(768px~1023px), 데스크톱(>=1024px) 레이아웃 최적화 | `PASS` |
| **모바일 네비게이션** | 햄버거 버튼 클릭 시 메뉴 펼침/닫힘 및 링크 클릭 시 자동 닫힘 | `PASS` |
| **다크 모드** | 토글 시 `data-theme` 전환 및 브라우저 새로고침 후에도 테마 유지 | `PASS` |
| **폼 유효성 검사** | 빈 필드 제출 차단, 이메일 형식 미일치 시 에러 표시, 정상 시 성공 메시지 노출 | `PASS` |
| **스크롤 인터랙션** | 스크롤 60px 이상 시 헤더 스타일 변경, 300px 이상 시 탑 버튼 표시 및 클릭 이동 | `PASS` |
| **GitHub API 상태** | 로딩 상태 스피너 표시, 정상 응답 시 카드 렌더링, 오류/403 시 에러 UI 및 재시도 | `PASS` |
| **코드 스타일 제약** | `var` 사용 없음 (`const`/`let`), 인라인 스타일 및 인라인 이벤트 속성 없음 | `PASS` |

---

## 🌐 배포 안내 (GitHub Pages)

본 프로젝트는 GitHub Pages를 통해 무료로 정적 웹사이트를 호스팅할 수 있도록 모든 에셋 경로가 상대 경로로 설계되었습니다.

1. **저장소 설정**: GitHub 레포지토리(`ChoMyeongHwan/vanilla-portfolio-website`) 이동
2. **Pages 활성화**: **Settings** → **Pages** → **Build and deployment**
3. **Source 설정**: `Deploy from a branch` 선택 후 Branch를 `main` / `/(root)`로 지정 후 저장
4. **배포 URL**: `https://chomyeonghwan.github.io/vanilla-portfolio-website/`

---

## 📜 Git Commit 이력

모든 커밋은 **한글 Conventional Commit 규칙을 준수하여 해당 과제 저장소 내부에서 독립적으로 생성되었습니다:**

- `feat: 프로젝트 기본 구조 및 시맨틱 HTML5 6대 섹션 마크업 구현`
- `feat: CSS 변수 기반 디자인 토큰 및 모바일 퍼스트 반응형 레이아웃 구현`
- `feat: 모바일 햄버거 메뉴, 스크롤탑 및 Intersection Observer 애니메이션 구현`
- `feat: 다크 모드 테마 전환 및 로컬스토리지 영속화 구현`
- `feat: Contact 폼 실시간 유효성 검사 및 사용자 피드백 상태 처리 구현`
- `feat: GitHub API 비동기 통신 및 4대 상태(로딩·성공·에러·빈데이터) UI 구현`
- `docs: 프로젝트 README 작성 및 GitHub Pages 배포 설정 완료`
