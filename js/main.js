/**
 * ==========================================================================
 * 나를 소개하는 웹페이지 (Vanilla JS) - Main Script
 * 역할: 중앙 상태 관리, 네비게이션, 다크 모드, 폼 유효성 검사, GitHub API 연동,
 *       Array.filter 기반 프로젝트 필터링, 스크롤 애니메이션
 * 원칙: var 금지(const/let만 사용), HTML onclick 금지(addEventListener만 사용)
 * 아키텍처: 단일 STATE 객체 → setState() → 상태 변경 감지 → render() 자동 호출
 * ==========================================================================
 */

'use strict';

// --------------------------------------------------------------------------
// 1. 전역 상수 및 DOM 요소 참조
// --------------------------------------------------------------------------
const GITHUB_USERNAME = 'ChoMyeongHwan';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`;
const THEME_STORAGE_KEY = 'portfolio_theme';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DOM Elements
const header = document.getElementById('header');
const navMenu = document.getElementById('nav-menu');
const hamburgerBtn = document.getElementById('hamburger-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const scrollTopBtn = document.getElementById('scroll-top-btn');
const contactForm = document.getElementById('contact-form');
const projectsContainer = document.getElementById('projects-container');
const formFeedback = document.getElementById('form-feedback');

// --------------------------------------------------------------------------
// 2. 중앙 상태(STATE) 객체 & 상태 관리 시스템 (#14 요구사항 충족)
//    모든 앱 상태를 단일 객체에서 통합 관리하며,
//    setState()를 통해서만 상태를 변경하고 연관 렌더 함수를 자동 호출합니다.
// --------------------------------------------------------------------------

/**
 * 앱 전체 상태를 중앙 집중 관리하는 단일 상태 객체
 * @type {{
 *   theme: 'light' | 'dark',
 *   filter: string,
 *   repos: Array,
 *   projectStatus: 'idle' | 'loading' | 'success' | 'error' | 'empty',
 *   errorMessage: string,
 *   isRateLimit: boolean,
 *   mobileMenuOpen: boolean,
 *   scrollY: number
 * }}
 */
const STATE = {
  theme: 'light',
  filter: 'all',
  repos: [],
  projectStatus: 'idle',
  errorMessage: '',
  isRateLimit: false,
  mobileMenuOpen: false,
  scrollY: 0
};

/**
 * 상태 변경 함수 — STATE를 직접 수정하지 않고 반드시 이 함수를 통해 변경합니다.
 * 변경된 키에 따라 연관 렌더 함수를 자동 호출하여 UI를 동기화합니다.
 * @param {Partial<typeof STATE>} newState - 변경할 상태 속성 (부분 업데이트 지원)
 */
const setState = (newState) => {
  const changedKeys = Object.keys(newState);

  // 상태 객체에 변경 사항 반영
  Object.assign(STATE, newState);

  // 변경된 키별 렌더 함수 매핑 및 자동 호출
  changedKeys.forEach((key) => {
    switch (key) {
      case 'theme':
        renderTheme();
        break;
      case 'filter':
      case 'repos':
      case 'projectStatus':
      case 'errorMessage':
      case 'isRateLimit':
        renderProjects();
        break;
      case 'mobileMenuOpen':
        renderMobileMenu();
        break;
      case 'scrollY':
        renderScrollUI();
        break;
    }
  });
};

// --------------------------------------------------------------------------
// 3. 렌더 함수들 — STATE에 기반한 UI 렌더링 (상태 → 뷰 단방향 흐름)
// --------------------------------------------------------------------------

/**
 * 테마 렌더: STATE.theme에 따라 DOM 속성, 아이콘, localStorage를 동기화합니다.
 */
const renderTheme = () => {
  document.documentElement.setAttribute('data-theme', STATE.theme);
  localStorage.setItem(THEME_STORAGE_KEY, STATE.theme);

  const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;
  if (themeIcon) {
    if (STATE.theme === 'dark') {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
      themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
  }
};

/**
 * 모바일 메뉴 렌더: STATE.mobileMenuOpen에 따라 메뉴 표시/숨김을 동기화합니다.
 * 웹 접근성(a11y): 메뉴 오픈 시 첫 번째 링크 포커스 이동, 닫힐 때 햄버거 버튼 포커스 복귀
 */
const renderMobileMenu = () => {
  if (!navMenu || !hamburgerBtn) return;
  navMenu.classList.toggle('active', STATE.mobileMenuOpen);
  hamburgerBtn.classList.toggle('active', STATE.mobileMenuOpen);
  hamburgerBtn.setAttribute('aria-expanded', String(STATE.mobileMenuOpen));

  if (STATE.mobileMenuOpen) {
    const firstLink = navMenu.querySelector('.nav-link');
    if (firstLink) firstLink.focus();
  } else if (document.activeElement && navMenu.contains(document.activeElement)) {
    hamburgerBtn.focus();
  }
};

/**
 * 스크롤 UI 렌더: STATE.scrollY에 따라 헤더 배경, 스크롤탑 버튼, 네비 활성화를 동기화합니다.
 */
const renderScrollUI = () => {
  if (header) {
    header.classList.toggle('scrolled', STATE.scrollY > 60);
  }
  if (scrollTopBtn) {
    scrollTopBtn.classList.toggle('visible', STATE.scrollY > 300);
  }
  highlightActiveNavLink();
};

/**
 * 프로젝트 렌더: STATE.projectStatus, STATE.repos, STATE.filter에 따라
 * 프로젝트 목록 UI를 동기화합니다.
 * Array.filter를 사용하여 선택된 카테고리에 맞는 저장소만 필터링합니다. (#12 요구사항)
 */
const renderProjects = () => {
  if (!projectsContainer) return;

  // 로딩 / 에러 / 빈 상태는 필터와 무관하게 렌더링
  switch (STATE.projectStatus) {
    case 'loading':
      projectsContainer.innerHTML = `
        <div class="state-container loading-state">
          <div class="spinner" aria-hidden="true"></div>
          <p class="state-text">GitHub 저장소 목록을 불러오는 중입니다...</p>
        </div>
      `;
      return;

    case 'error':
      renderProjectError();
      return;

    case 'empty':
      renderProjectEmpty();
      return;

    case 'success':
      break;

    default:
      return;
  }

  // ──────────────────────────────────────────────────────────────
  // Array.filter 기반 카테고리 필터링 (#12 핵심 로직)
  // STATE.filter 값에 따라 repos 배열을 필터링하여 조건에 맞는 항목만 추출합니다.
  // ──────────────────────────────────────────────────────────────
  const filteredRepos = STATE.filter === 'all'
    ? STATE.repos
    : STATE.repos.filter((repo) => {
        const lang = (repo.language || '').toLowerCase();
        const filterLang = STATE.filter.toLowerCase();
        return lang === filterLang;
      });

  // 필터 결과가 비어있는 경우
  if (filteredRepos.length === 0) {
    projectsContainer.innerHTML = `
      <div class="filter-empty-state">
        <i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>
        <p>'${STATE.filter}' 언어로 작성된 프로젝트가 없습니다.</p>
        <button class="btn btn-secondary filter-reset-btn" type="button">
          <i class="fa-solid fa-rotate-left" aria-hidden="true"></i> 전체 보기
        </button>
      </div>
    `;
    const resetBtn = projectsContainer.querySelector('.filter-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        setState({ filter: 'all' });
        syncFilterButtons('all');
      });
    }
    return;
  }

  // 성공 상태: 필터링된 프로젝트 카드 렌더링 (ES6+ map, 구조분해 할당, 템플릿 리터럴)
  const cardsHtml = filteredRepos.map((repo) => {
    const {
      name,
      description = '등록된 프로젝트 설명이 없습니다.',
      html_url,
      language = '기타',
      stargazers_count = 0
    } = repo;

    return `
      <article class="project-card">
        <div class="project-card-top">
          <div class="project-header-row">
            <span class="project-icon-box" aria-hidden="true">
              <i class="fa-solid fa-book-bookmark"></i>
            </span>
            <a href="${html_url}" target="_blank" rel="noopener noreferrer" class="project-external-btn" aria-label="${name} 저장소 바로가기">
              <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            </a>
          </div>
          <h3 class="project-title">
            <a href="${html_url}" target="_blank" rel="noopener noreferrer">${name}</a>
          </h3>
          <p class="project-desc">${description || '등록된 프로젝트 설명이 없습니다.'}</p>
        </div>
        <div class="project-meta">
          <span class="project-lang">
            <span class="lang-dot lang-${(language || 'other').toLowerCase()}" aria-hidden="true"></span>
            ${language || 'Web'}
          </span>
          <span class="project-stars">
            <i class="fa-solid fa-star" aria-hidden="true"></i> ${stargazers_count}
          </span>
        </div>
      </article>
    `;
  }).join('');

  projectsContainer.innerHTML = cardsHtml;

  // 새로 생성된 카드에 애니메이션 관찰자 적용
  initScrollAnimation();
};

/**
 * 에러 상태 UI 렌더링 (재시도 버튼 + 데모 데이터 토글 지원)
 */
const renderProjectError = () => {
  if (!projectsContainer) return;

  const rateLimitNotice = STATE.isRateLimit
    ? '<p class="error-notice">⚠️ GitHub API 호출 제한(시간당 60회)이 발생했습니다.</p>'
    : '';

  projectsContainer.innerHTML = `
    <div class="state-container error-state">
      <i class="fa-solid fa-triangle-exclamation state-icon state-icon-error" aria-hidden="true"></i>
      <p class="state-text">프로젝트를 불러올 수 없습니다. (${STATE.errorMessage})</p>
      ${rateLimitNotice}
      <div class="error-actions">
        <button id="retry-btn" class="btn btn-primary" type="button">
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i> 다시 시도
        </button>
        <button id="demo-btn" class="btn btn-secondary" type="button">
          <i class="fa-solid fa-eye" aria-hidden="true"></i> 샘플 프로젝트 보기
        </button>
      </div>
    </div>
  `;

  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchGitHubProjects);
  }

  const demoBtn = document.getElementById('demo-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      setState({
        repos: SAMPLE_PROJECTS,
        projectStatus: 'success',
        filter: 'all'
      });
      syncFilterButtons('all');
    });
  }
};

/**
 * 빈 데이터 상태 UI 렌더링
 */
const renderProjectEmpty = () => {
  if (!projectsContainer) return;
  projectsContainer.innerHTML = `
    <div class="state-container empty-state">
      <i class="fa-solid fa-folder-open state-icon state-icon-empty" aria-hidden="true"></i>
      <p class="state-text">표시할 프로젝트가 없습니다.</p>
      <button id="empty-demo-btn" class="btn btn-secondary btn-demo-margin" type="button">
        <i class="fa-solid fa-eye" aria-hidden="true"></i> 샘플 프로젝트 불러오기
      </button>
    </div>
  `;

  const emptyDemoBtn = document.getElementById('empty-demo-btn');
  if (emptyDemoBtn) {
    emptyDemoBtn.addEventListener('click', () => {
      setState({
        repos: SAMPLE_PROJECTS,
        projectStatus: 'success',
        filter: 'all'
      });
      syncFilterButtons('all');
    });
  }
};

// --------------------------------------------------------------------------
// 4. 데모용 샘플 프로젝트 데이터 (API 403 Rate Limit 또는 빈 저장소 대비)
// --------------------------------------------------------------------------
const SAMPLE_PROJECTS = [
  {
    name: 'mis-core-system',
    description: '사내 경영정보시스템(MIS) 데이터 흐름 및 핵심 비즈니스 로직 유지보수 프로젝트',
    html_url: `https://github.com/${GITHUB_USERNAME}/mis-core-system`,
    language: 'Java',
    stargazers_count: 3
  },
  {
    name: 'nextgen-data-migrator',
    description: '레거시 시스템에서 차세대 시스템으로의 대용량 데이터 이관 및 정합성 검증 모듈',
    html_url: `https://github.com/${GITHUB_USERNAME}/nextgen-data-migrator`,
    language: 'Python',
    stargazers_count: 5
  },
  {
    name: 'vanilla-portfolio-website',
    description: '순수 HTML/CSS/JavaScript로 구현한 반응형 포트폴리오 웹사이트 (GitHub API 연동)',
    html_url: `https://github.com/${GITHUB_USERNAME}/vanilla-portfolio-website`,
    language: 'JavaScript',
    stargazers_count: 2
  }
];

// --------------------------------------------------------------------------
// 5. 네비게이션 & 스크롤 인터랙션
// --------------------------------------------------------------------------

/**
 * 현재 보이는 섹션에 맞추어 네비게이션 활성 링크 업데이트
 * (Contact 섹션 등 최하단 섹션이 브라우저 뷰포트 한계로 활성화되지 않는 문제 해결)
 */
const highlightActiveNavLink = () => {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const headerHeight = header ? header.offsetHeight : 70;

  // 1. 페이지 최하단 도달 시 마지막 메뉴(Contact) 활성화
  const isAtBottom = (window.innerHeight + STATE.scrollY) >= (document.documentElement.scrollHeight - 80);

  if (isAtBottom) {
    navLinks.forEach((link) => link.classList.remove('active'));
    const contactLink = document.querySelector('.nav-link[href="#contact"]');
    if (contactLink) {
      contactLink.classList.add('active');
    }
    return;
  }

  // 2. 일반 스크롤 영역: 뷰포트 상단 기준선을 지나는 섹션 감지
  let currentActiveId = '';
  const triggerPoint = STATE.scrollY + headerHeight + 60;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    if (triggerPoint >= sectionTop && triggerPoint < sectionTop + sectionHeight) {
      currentActiveId = section.getAttribute('id');
    }
  });

  if (currentActiveId) {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${currentActiveId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
};

/**
 * 페이지 최상단으로 부드럽게 스크롤 이동
 */
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --------------------------------------------------------------------------
// 6. 스크롤 진입 애니메이션 (Intersection Observer)
// --------------------------------------------------------------------------
const initScrollAnimation = () => {
  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.about-card, .skill-group, .project-card, .contact-wrapper');
  animatedElements.forEach((el) => {
    el.classList.add('fade-in-target');
    observer.observe(el);
  });
};

// --------------------------------------------------------------------------
// 7. Contact 폼 실시간 유효성 검사
// --------------------------------------------------------------------------

/**
 * 단일 필드 유효성 검사 및 에러 메시지 렌더링
 * @param {HTMLInputElement | HTMLTextAreaElement} inputEl
 * @param {HTMLElement} errorEl
 * @param {string} fieldName
 * @param {boolean} isInitialTyping - 오류가 없는 상태에서 처음 입력 중인지 여부
 * @returns {boolean} 유효 여부
 */
const validateField = (inputEl, errorEl, fieldName, isInitialTyping = false) => {
  if (!inputEl || !errorEl) return false;

  const value = inputEl.value.trim();

  // 1. 필수값 검증
  if (!value) {
    if (isInitialTyping) {
      inputEl.classList.remove('invalid');
      inputEl.removeAttribute('aria-invalid');
      errorEl.innerHTML = '';
      return false;
    }
    inputEl.classList.add('invalid');
    inputEl.setAttribute('aria-invalid', 'true');
    errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> ${fieldName}을(를) 입력해 주세요.`;
    return false;
  }

  // 2. 이메일 형식 검증
  if (inputEl.type === 'email') {
    const isValidEmail = EMAIL_REGEX.test(value);

    if (isInitialTyping && !isValidEmail) {
      return false;
    }

    if (!isValidEmail) {
      inputEl.classList.add('invalid');
      inputEl.setAttribute('aria-invalid', 'true');
      errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> 올바른 이메일 주소 형식을 입력해 주세요 (예: example@domain.com)`;
      return false;
    }
  }

  // 3. 통과 시 에러 상태 즉시 해제
  inputEl.classList.remove('invalid');
  inputEl.setAttribute('aria-invalid', 'false');
  errorEl.innerHTML = '';
  return true;
};

/**
 * 폼 전체 유효성 검사 (제출 시 실행)
 */
const validateForm = () => {
  const nameInput = document.getElementById('name');
  const nameError = document.getElementById('name-error');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const messageInput = document.getElementById('message');
  const messageError = document.getElementById('message-error');

  const isNameValid = validateField(nameInput, nameError, '이름', false);
  const isEmailValid = validateField(emailInput, emailError, '이메일', false);
  const isMessageValid = validateField(messageInput, messageError, '문의 내용', false);

  // 오류가 있는 첫 번째 필드로 자동 포커스 이동 (접근성)
  if (!isNameValid && nameInput) {
    nameInput.focus();
  } else if (!isEmailValid && emailInput) {
    emailInput.focus();
  } else if (!isMessageValid && messageInput) {
    messageInput.focus();
  }

  return isNameValid && isEmailValid && isMessageValid;
};

/**
 * 폼 제출 이벤트 핸들러
 * @param {Event} e
 */
const handleFormSubmit = (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // 제출 성공 피드백 렌더링
  if (formFeedback) {
    formFeedback.className = 'form-feedback success';
    formFeedback.innerHTML = `
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
      <span><strong>메시지가 성공적으로 전송되었습니다!</strong> 빠른 시일 내에 회신드리겠습니다.</span>
    `;
  }

  // 폼 필드 초기화 및 에러 잔여 상태 일괄 해제
  contactForm.reset();
  const formInputs = contactForm.querySelectorAll('.form-input, .form-textarea');
  formInputs.forEach((input) => {
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
  });
  const errorElements = contactForm.querySelectorAll('.error-message');
  errorElements.forEach((el) => {
    el.innerHTML = '';
  });

  // 5초 후 피드백 숨김
  setTimeout(() => {
    if (formFeedback) {
      formFeedback.className = 'form-feedback';
      formFeedback.innerHTML = '';
    }
  }, 5000);
};

// --------------------------------------------------------------------------
// 8. GitHub API 비동기 연동 & 4대 상태 UI 처리
// --------------------------------------------------------------------------

/**
 * GitHub API 비동기 통신 메인 함수 (AbortController 타임아웃 8초 적용)
 * 응답 데이터를 STATE에 저장하면 setState → renderProjects 자동 호출됩니다.
 */
const fetchGitHubProjects = async () => {
  setState({ projectStatus: 'loading' });

  // 비동기 안정성 강화: 8초 AbortController 타임아웃 제어
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 8000);

  try {
    const response = await fetch(GITHUB_API_URL, {
      signal: abortController.signal
    });
    clearTimeout(timeoutId);

    // 403 Rate Limit 처리
    if (response.status === 403) {
      setState({
        projectStatus: 'error',
        errorMessage: 'API 호출 횟수 초과 (403 Forbidden)',
        isRateLimit: true
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP 오류 상태코드: ${response.status}`);
    }

    const repos = await response.json();

    // 빈 데이터 상태 처리
    if (!Array.isArray(repos) || repos.length === 0) {
      setState({ projectStatus: 'empty', repos: [] });
      return;
    }

    // 성공 상태 — repos를 STATE에 저장하면 renderProjects가 자동 호출됨
    setState({
      repos: repos,
      projectStatus: 'success',
      filter: 'all'
    });
    syncFilterButtons('all');
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('GitHub API 연동 오류:', err);

    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout
      ? '네트워크 요청 시간 초과 (8초 타임아웃)'
      : (err.message || '네트워크 연결 실패');

    setState({
      projectStatus: 'error',
      errorMessage: errorMsg,
      isRateLimit: false
    });
  }
};

// --------------------------------------------------------------------------
// 9. 프로젝트 필터 버튼 컨트롤러 (#12 Array.filter 요구사항)
// --------------------------------------------------------------------------

/**
 * 필터 버튼 active 상태를 UI와 동기화합니다.
 * @param {string} filterValue - 활성화할 필터 값
 */
const syncFilterButtons = (filterValue) => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    const isActive = btn.dataset.filter === filterValue;
    btn.classList.toggle('active', isActive);
  });
};

/**
 * 필터 버튼 클릭 이벤트를 바인딩합니다.
 */
const initFilterButtons = () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedFilter = btn.dataset.filter;

      // 이미 선택된 필터를 다시 클릭하면 무시
      if (STATE.filter === selectedFilter) return;

      // STATE.filter 변경 → renderProjects 자동 호출
      setState({ filter: selectedFilter });
      syncFilterButtons(selectedFilter);
    });
  });
};

// --------------------------------------------------------------------------
// 10. 이벤트 리스너 등록 & 앱 초기화
// --------------------------------------------------------------------------
const initApp = () => {
  // 1. 테마 초기화: localStorage 유효성 검증 → 시스템 설정 → 기본값 순으로 결정
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    setState({ theme: savedTheme });
  } else {
    // 유효하지 않은 값이 들어있으면 스토리지 정리 후 시스템 기본값 폴백
    if (savedTheme !== null) {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setState({ theme: prefersDark ? 'dark' : 'light' });
  }

  // OS 다크모드 미디어 쿼리 실시간 감지 리스너 (사용자가 수동 변경하지 않은 경우 시스템 테마 동기화)
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (e) => {
      const currentStored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!currentStored) {
        setState({ theme: e.matches ? 'dark' : 'light' });
      }
    };
    if (typeof colorSchemeQuery.addEventListener === 'function') {
      colorSchemeQuery.addEventListener('change', handleColorSchemeChange);
    } else if (typeof colorSchemeQuery.addListener === 'function') {
      colorSchemeQuery.addListener(handleColorSchemeChange);
    }
  }

  // 2. 이벤트 리스너 등록 (HTML 인라인 이벤트 금지 준수)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      setState({ theme: STATE.theme === 'dark' ? 'light' : 'dark' });
    });
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      setState({ mobileMenuOpen: !STATE.mobileMenuOpen });
    });
  }

  // 웹 접근성(a11y): Esc 키 누르면 열려있는 모바일 메뉴 닫기
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && STATE.mobileMenuOpen) {
      setState({ mobileMenuOpen: false });
    }
  });

  // 네비게이션 링크 클릭 시 모바일 메뉴 닫기
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setState({ mobileMenuOpen: false });
    });
  });

  // 스크롤 이벤트 — 스크롤 위치를 STATE에 반영하면 renderScrollUI 자동 호출
  window.addEventListener('scroll', () => {
    setState({ scrollY: window.scrollY });
  }, { passive: true });

  // 스크롤탑 버튼
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', scrollToTop);
  }

  // 3. 폼 유효성 검사 이벤트 바인딩 (blur & input 스마트 검증)
  const nameInput = document.getElementById('name');
  const nameError = document.getElementById('name-error');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const messageInput = document.getElementById('message');
  const messageError = document.getElementById('message-error');

  const setupFieldValidation = (inputEl, errorEl, fieldName) => {
    if (!inputEl || !errorEl) return;

    inputEl.addEventListener('blur', () => {
      inputEl.value = inputEl.value.trim();
      validateField(inputEl, errorEl, fieldName, false);
    });

    inputEl.addEventListener('input', () => {
      const isAlreadyInvalid = inputEl.classList.contains('invalid');
      validateField(inputEl, errorEl, fieldName, !isAlreadyInvalid);
    });
  };

  setupFieldValidation(nameInput, nameError, '이름');
  setupFieldValidation(emailInput, emailError, '이메일');
  setupFieldValidation(messageInput, messageError, '문의 내용');

  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
  }

  // 4. 스크롤 애니메이션 초기화
  initScrollAnimation();

  // 5. 필터 버튼 이벤트 바인딩
  initFilterButtons();

  // 6. GitHub API 호출 (setState를 통해 상태 변경 → renderProjects 자동 호출)
  fetchGitHubProjects();
};

// defer로 로드되므로 DOM 준비 후 즉시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
