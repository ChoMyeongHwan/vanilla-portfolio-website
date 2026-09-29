/**
 * ==========================================================================
 * 나를 소개하는 웹페이지 (Vanilla JS) - Main Script
 * 역할: 네비게이션, 다크 모드, 폼 유효성 검사, GitHub API 연동, 스크롤 애니메이션
 * 원칙: var 금지(const/let만 사용), HTML onclick 금지(addEventListener만 사용)
 * ==========================================================================
 */

'use strict';

// --------------------------------------------------------------------------
// 1. 전역 상수 및 DOM 요소 참조
// --------------------------------------------------------------------------
const GITHUB_USERNAME = 'ChoMyeongHwan';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`;

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
// 2. 다크 모드 & 테마 상태 관리 (상태 → 렌더링 흐름 1)
// --------------------------------------------------------------------------
const THEME_STORAGE_KEY = 'portfolio_theme';

/**
 * 테마를 DOM에 적용하고 로컬스토리지에 저장합니다.
 * @param {'light' | 'dark'} theme 
 */
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // 아이콘 업데이트
  const themeIcon = themeToggleBtn.querySelector('.theme-icon');
  if (themeIcon) {
    if (theme === 'dark') {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
      themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
  }
};

/**
 * 초기 테마 결정 (localStorage 확인 -> 시스템 OS 설정 감지)
 */
const initTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
  } else {
    // 보너스 요구사항: 시스템 prefers-color-scheme 감지
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
};

/**
 * 테마 토글 핸들러
 */
const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
};

// --------------------------------------------------------------------------
// 3. 네비게이션 & 스크롤 인터랙션
// --------------------------------------------------------------------------

/**
 * 모바일 햄버거 메뉴 토글
 */
const toggleMobileMenu = () => {
  const isActive = navMenu.classList.toggle('active');
  hamburgerBtn.classList.toggle('active', isActive);
  hamburgerBtn.setAttribute('aria-expanded', String(isActive));
};

/**
 * 메뉴 항목 클릭 시 모바일 메뉴 닫기
 */
const closeMobileMenu = () => {
  navMenu.classList.remove('active');
  hamburgerBtn.classList.remove('active');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
};

/**
 * 스크롤 위치에 따른 헤더 배경 변경(60px) 및 스크롤탑 버튼 표시(300px)
 */
const handleWindowScroll = () => {
  const scrollY = window.scrollY;

  // 헤더 스타일 변경 (스크롤 60px 이상)
  if (header) {
    header.classList.toggle('scrolled', scrollY > 60);
  }

  // 스크롤 탑 버튼 (스크롤 300px 이상)
  if (scrollTopBtn) {
    scrollTopBtn.classList.toggle('visible', scrollY > 300);
  }

  // 활성 네비게이션 링크 하이라이트
  highlightActiveNavLink();
};

/**
 * 현재 보이는 섹션에 맞추어 네비게이션 활성 링크 업데이트
 */
const highlightActiveNavLink = () => {
  const sections = document.querySelectorAll('main section[id]');
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

    if (navLink) {
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLink.classList.add('active');
      } else {
        navLink.classList.remove('active');
      }
    }
  });
};

/**
 * 페이지 최상단으로 부드럽게 스크롤 이동
 */
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// --------------------------------------------------------------------------
// 4. 스크롤 진입 애니메이션 (Intersection Observer)
// --------------------------------------------------------------------------
const initScrollAnimation = () => {
  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2 // PDF 권장 임계값 0.2
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        obs.unobserve(entry.target); // 1회 애니메이션 실행 후 감시 해제
      }
    });
  }, observerOptions);

  // 애니메이션 대상 요소 등록
  const animatedElements = document.querySelectorAll('.about-card, .skill-group, .project-card, .contact-wrapper');
  animatedElements.forEach((el) => {
    el.classList.add('fade-in-target');
    observer.observe(el);
  });
};

// --------------------------------------------------------------------------
// 5. Contact 폼 실시간 유효성 검사 (상태 → 렌더링 흐름 2)
// --------------------------------------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 단일 필드 유효성 검사 및 에러 메시지 렌더링
 * @param {HTMLInputElement | HTMLTextAreaElement} inputEl 
 * @param {HTMLElement} errorEl 
 * @param {string} fieldName 
 * @returns {boolean} 유효 여부
 */
const validateField = (inputEl, errorEl, fieldName) => {
  const value = inputEl.value.trim();

  // 필수값 검증
  if (!value) {
    inputEl.classList.add('invalid');
    errorEl.textContent = `${fieldName}을(를) 입력해 주세요.`;
    return false;
  }

  // 이메일 형식 검증
  if (inputEl.type === 'email' && !EMAIL_REGEX.test(value)) {
    inputEl.classList.add('invalid');
    errorEl.textContent = '올바른 이메일 주소 형식을 입력해 주세요 (예: example@domain.com)';
    return false;
  }

  // 통과
  inputEl.classList.remove('invalid');
  errorEl.textContent = '';
  return true;
};

/**
 * 폼 전체 유효성 검사
 */
const validateForm = () => {
  const nameInput = document.getElementById('name');
  const nameError = document.getElementById('name-error');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const messageInput = document.getElementById('message');
  const messageError = document.getElementById('message-error');

  const isNameValid = validateField(nameInput, nameError, '이름');
  const isEmailValid = validateField(emailInput, emailError, '이메일');
  const isMessageValid = validateField(messageInput, messageError, '문의 내용');

  return isNameValid && isEmailValid && isMessageValid;
};

/**
 * 폼 제출 이벤트 핸들러
 * @param {Event} e 
 */
const handleFormSubmit = (e) => {
  e.preventDefault(); // 기본 새로고침 방지 (필수 요구사항)

  if (!validateForm()) {
    return;
  }

  // 제출 성공 피드백 렌더링
  if (formFeedback) {
    formFeedback.className = 'form-feedback success';
    formFeedback.innerHTML = `
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
      <strong>메시지가 성공적으로 전송되었습니다!</strong> 빠른 시일 내에 회신드리겠습니다.
    `;
  }

  // 폼 필드 초기화
  contactForm.reset();

  // 5초 후 피드백 숨김
  setTimeout(() => {
    if (formFeedback) {
      formFeedback.className = 'form-feedback';
    }
  }, 5000);
};

// --------------------------------------------------------------------------
// 6. GitHub API 비동기 연동 & 4대 상태 UI 처리 (상태 → 렌더링 흐름 3)
// --------------------------------------------------------------------------

// 데모용 샘플 프로젝트 데이터 (API 403 Rate Limit 또는 빈 저장소 대비)
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

/**
 * 1) 로딩 상태 UI 렌더링
 */
const renderLoadingState = () => {
  if (!projectsContainer) return;
  projectsContainer.innerHTML = `
    <div class="state-container loading-state">
      <div class="spinner" aria-hidden="true"></div>
      <p class="state-text">GitHub 저장소 목록을 불러오는 중입니다...</p>
    </div>
  `;
};

/**
 * 2) 성공 상태 UI 렌더링 (ES6+ 템플릿 리터럴, map, 구조분해 할당)
 * @param {Array} repos 
 */
const renderSuccessState = (repos) => {
  if (!projectsContainer) return;

  const cardsHtml = repos.map((repo) => {
    // ES6+ 구조분해 할당
    const {
      name,
      description = '등록된 프로젝트 설명이 없습니다.',
      html_url,
      language = '기타',
      stargazers_count = 0
    } = repo;

    return `
      <article class="project-card">
        <div class="project-card-header">
          <h3 class="project-title">
            <i class="fa-solid fa-book-bookmark" aria-hidden="true"></i>
            <a href="${html_url}" target="_blank" rel="noopener noreferrer">${name}</a>
          </h3>
          <p class="project-desc">${description || '등록된 프로젝트 설명이 없습니다.'}</p>
        </div>
        <div class="project-meta">
          <span class="project-lang">
            <i class="fa-solid fa-code" aria-hidden="true"></i> ${language || 'Web'}
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
 * 3) 에러 상태 UI 렌더링 (재시도 버튼 + 데모 데이터 토글 지원)
 * @param {string} errorMsg 
 * @param {boolean} isRateLimit 
 */
const renderErrorState = (errorMsg, isRateLimit = false) => {
  if (!projectsContainer) return;

  const rateLimitNotice = isRateLimit
    ? '<p class="error-notice">⚠️ GitHub API 호출 제한(시간당 60회)이 발생했습니다.</p>'
    : '';

  projectsContainer.innerHTML = `
    <div class="state-container error-state">
      <i class="fa-solid fa-triangle-exclamation state-icon state-icon-error" aria-hidden="true"></i>
      <p class="state-text">프로젝트를 불러올 수 없습니다. (${errorMsg})</p>
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

  // 재시도 버튼 이벤트
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchGitHubProjects);
  }

  // 데모 보기 버튼 이벤트
  const demoBtn = document.getElementById('demo-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      renderSuccessState(SAMPLE_PROJECTS);
    });
  }
};

/**
 * 4) 빈 데이터 상태 UI 렌더링
 */
const renderEmptyState = () => {
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
      renderSuccessState(SAMPLE_PROJECTS);
    });
  }
};

/**
 * GitHub API 비동기 통신 메인 함수
 */
const fetchGitHubProjects = async () => {
  renderLoadingState();

  try {
    const response = await fetch(GITHUB_API_URL);

    // 403 Rate Limit 처리 (PDF 요구사항)
    if (response.status === 403) {
      renderErrorState('API 호출 횟수 초과 (403 Forbidden)', true);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP 오류 상태코드: ${response.status}`);
    }

    const repos = await response.json();

    // 빈 데이터 상태 처리
    if (!Array.isArray(repos) || repos.length === 0) {
      renderEmptyState();
      return;
    }

    // 성공 상태 렌더링
    renderSuccessState(repos);
  } catch (err) {
    console.error('GitHub API 연동 오류:', err);
    renderErrorState(err.message || '네트워크 연결 실패');
  }
};

// --------------------------------------------------------------------------
// 7. 이벤트 리스너 등록 & 앱 초기화
// --------------------------------------------------------------------------
const initApp = () => {
  // 테마 초기화
  initTheme();

  // 이벤트 리스너 등록 (HTML 인라인 이벤트 금지 준수)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
  }

  // 네비게이션 링크 클릭 시 모바일 메뉴 닫기
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  // 스크롤 이벤트 (스로틀링 개념의 기본 스크롤 핸들러)
  window.addEventListener('scroll', handleWindowScroll, { passive: true });

  // 스크롤탑 버튼
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', scrollToTop);
  }

  // 폼 실시간 유효성 검사 (input 이벤트)
  const nameInput = document.getElementById('name');
  const nameError = document.getElementById('name-error');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const messageInput = document.getElementById('message');
  const messageError = document.getElementById('message-error');

  if (nameInput && nameError) {
    nameInput.addEventListener('input', () => validateField(nameInput, nameError, '이름'));
  }

  if (emailInput && emailError) {
    emailInput.addEventListener('input', () => validateField(emailInput, emailError, '이메일'));
  }

  if (messageInput && messageError) {
    messageInput.addEventListener('input', () => validateField(messageInput, messageError, '문의 내용'));
  }

  // 폼 제출 이벤트
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
  }

  // 스크롤 애니메이션 초기화
  initScrollAnimation();

  // GitHub API 호출
  fetchGitHubProjects();
};

// defer로 로드되므로 DOM 준비 후 즉시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
