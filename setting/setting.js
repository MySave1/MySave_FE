const API_BASE_URL = "http://13.60.25.65:8080";

document.addEventListener("DOMContentLoaded", async () => {
  // 0) 로그인 여부 상관없이 기본 사용자 세팅(게스트)
  ensureGuestUser();

  // 1) UI 설정 초기화
  initDarkMode();
  initAiToggle();
  initNotificationToggle();
  initProfileImageEdit();
  initSearchBar();
  initDataManagement();

  // 2) 계정 관련(로그인 상태 체크 및 버튼 연결)
  await checkLoginStatus(); 
  initAccountActions();     
});

// 로그인 없어도 모든 페이지 작동하게: 기본 사용자(게스트) 채워넣기
function ensureGuestUser() {
  if (!localStorage.getItem("userId")) localStorage.setItem("userId", "guest");
  if (!localStorage.getItem("userName")) localStorage.setItem("userName", "게스트");
  if (!localStorage.getItem("userEmail")) localStorage.setItem("userEmail", "guest@mysave.local");
}

/* ---------------------------
  공통 저장/로드 유틸
---------------------------- */
function setSetting(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getSetting(key, defaultValue = false) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

/* ---------------------------
  0. 로그인 상태 표시
---------------------------- */
async function checkLoginStatus() {
  const token = localStorage.getItem("accessToken");

  // 토큰이 없거나 데모 토큰이면: 로컬 정보(게스트) 표시하고 종료
  if (!token || token.startsWith("demo-")) {
    setLoggedInStateFromLocal(); 
    return;
  }

  // 진짜 토큰이면 프로필 API 조회
  await fetchUserProfile(token);
}

// 로컬 스토리지 정보로 UI 세팅 (비로그인/게스트 상태)
function setLoggedInStateFromLocal() {
  const user = {
    nickname: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
    profileImageUrl: null
  };
  // 게스트 상태에서는 카카오 연동 배지를 숨기고 로그인 버튼을 활성화
  // 여기서 false를 넘겨서 비로그인 상태임을 알림
  const hasToken = localStorage.getItem("accessToken") && !localStorage.getItem("accessToken").startsWith("demo-");
  updateProfileUI(user, hasToken);
}

// 서버에서 프로필 정보 가져오기
async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.warn("프로필 조회 실패. 로컬 사용자로 표시");
      setLoggedInStateFromLocal();
      return;
    }

    const userData = await response.json();
    
    // 서버 데이터 포맷에 맞춰 매핑
    const user = {
        nickname: userData.name || userData.nickname,
        email: userData.email,
        profileImageUrl: userData.profileImageUrl 
    };

    // 로그인 성공 상태로 UI 업데이트
    updateProfileUI(user, true);

  } catch (error) {
    console.warn("서버 연결 실패:", error);
    setLoggedInStateFromLocal();
  }
}

// UI 업데이트 함수 (로그인 여부에 따라 분기)
function updateProfileUI(user, isLoggedIn) {
  const nicknameEl = document.getElementById("userNickname");
  const emailEl = document.getElementById("userEmail");
  const imgDiv = document.getElementById("userProfileImg");
  const defaultIcon = document.getElementById("defaultProfileIcon");
  
  // 1. 텍스트 정보 업데이트
  if (nicknameEl) nicknameEl.textContent = user.nickname || "게스트";
  if (emailEl) emailEl.textContent = user.email || "guest@mysave.local";

  // 2. 프로필 이미지 처리
  if (imgDiv) {
      if (user.profileImageUrl) {
        imgDiv.style.backgroundImage = `url(${user.profileImageUrl})`;
        imgDiv.style.backgroundSize = "cover";
        if(defaultIcon) defaultIcon.style.display = "none";
      } else {
        imgDiv.style.backgroundImage = "none";
        if(defaultIcon) defaultIcon.style.display = "none"; // 기본 아이콘 보이기
      }
  }

  // 3. 버튼 및 배지 상태 처리
  const badge = document.getElementById("connectionStatus");
  const logoutLink = document.getElementById("logoutLink");
  const kakaoBtn = document.getElementById("kakaoAuthBtn");

  if (isLoggedIn) {
      // 로그인 상태: "연동됨" 배지 보임, 로그아웃 버튼 보임, 로그인 버튼 숨김
      if (badge) badge.style.display = "inline-flex";
      if (logoutLink) logoutLink.style.display = "inline-flex";
      if (kakaoBtn) kakaoBtn.style.display = "none";
  } else {
      // 비로그인(게스트) 상태: 배지 숨김, 로그아웃 숨김, 로그인 버튼 보임
      if (badge) badge.style.display = "none";
      if (logoutLink) logoutLink.style.display = "none";
      if (kakaoBtn) {
          kakaoBtn.style.display = "block";
          kakaoBtn.innerHTML = '<i class="fa-solid fa-comment"></i> Kakao 로그인 연결';
      }
  }
}

/* ---------------------------
  1~6. 기타 UI 기능들 (기존 유지)
---------------------------- */
function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const savedMode = getSetting("darkMode", false);
  toggle.checked = savedMode;
  document.body.classList.toggle("dark-mode", savedMode);
  toggle.addEventListener("change", () => {
    const isDark = toggle.checked;
    document.body.classList.toggle("dark-mode", isDark);
    setSetting("darkMode", isDark);
  });
}

function initAiToggle() {
  const toggle = document.getElementById("aiToggle");
  if (!toggle) return;
  toggle.checked = getSetting("aiAutoSummary", true);
  toggle.addEventListener("change", () => setSetting("aiAutoSummary", toggle.checked));
}

function initNotificationToggle() {
  const toggle = document.getElementById("notiToggle");
  if (!toggle) return;
  toggle.checked = getSetting("notification", true);
  toggle.addEventListener("change", async () => {
    if (toggle.checked) {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                alert("알림 권한이 필요합니다.");
                toggle.checked = false;
                setSetting("notification", false);
                return;
            }
        } catch(e) { console.log("알림 권한 요청 불가"); }
    }
    setSetting("notification", toggle.checked);
  });
}

function initProfileImageEdit() {
  const btn = document.getElementById("editProfileBtn");
  if (btn) btn.addEventListener("click", () => alert("프로필 이미지 변경 기능은 준비 중입니다."));
}

function initSearchBar() {
  const input = document.querySelector(".search-container input");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        const q = encodeURIComponent(input.value.trim());
        window.location.href = `../bookmark/bookmark.html?q=${q}`;
      }
    });
  }
}

function initDataManagement() {
  const deleteLinks = document.querySelectorAll(".data-menu a");
  if (!deleteLinks.length) return;
  const deleteAllBtn = deleteLinks[deleteLinks.length - 1];
  deleteAllBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("정말 모든 데이터를 삭제하시겠습니까? (로컬 데이터만 삭제됩니다)")) return;
    
    localStorage.clear();
    alert("데이터 삭제 완료! 초기화면으로 이동합니다.");
    window.location.href = "../index/index.html";
  });
}

/* ---------------------------
  7. 계정 설정/로그아웃
---------------------------- */
function initAccountActions() {
  const kakaoBtn = document.getElementById("kakaoAuthBtn");
  const logoutBtn = document.getElementById("logoutLink");

  // 로그인 버튼 클릭 -> 로그인 페이지로 이동
  if (kakaoBtn) {
    kakaoBtn.addEventListener("click", () => {
      window.location.href = "../login/login.html";
    });
  }

  // 로그아웃 버튼 클릭
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout(true);
    });
  }
}

// 로그아웃 처리
function handleLogout(askConfirm = true) {
  if (askConfirm && !confirm("로그아웃 하시겠습니까?")) return;

  // 토큰 및 사용자 정보 삭제
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("notificationEmail"); 

  // 다시 게스트 정보 생성
  ensureGuestUser();
  
  alert("로그아웃 되었습니다.");
  window.location.reload(); 
}