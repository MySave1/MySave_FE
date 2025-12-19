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

  // 2) 계정 관련(로그인 강제 X)
  await checkLoginStatus(); // 토큰 있으면(진짜토큰이면) 프로필 시도, 아니면 로컬값으로 표시
  initAccountActions();     // 로그인 시작 / 로그아웃 버튼만 연결
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
  0. 로그인 상태 표시(강제 X)
---------------------------- */
async function checkLoginStatus() {
  const token = localStorage.getItem("accessToken");

  // 데모 토큰이거나 토큰이 없으면: 서버 조회 안 하고 로컬 표시만
  if (!token || token.startsWith("demo-")) {
    setLoggedInStateFromLocal(); // 입력한 닉/메일 그대로 표시
    return;
  }

  // 진짜 토큰이면 프로필 API 한 번 시도(실패해도 기능은 계속 됨)
  await fetchUserProfile(token);
}

function setLoggedInStateFromLocal() {
  const user = {
    nickname: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
    profileImageUrl: null
  };
  setLoggedInState(user);
}

async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    // 실패해도 로그아웃으로 쫓아내지 말고(요구사항), 로컬값 표시로 대체
    if (!response.ok) {
      console.warn("프로필 조회 실패. (로그인 강제 안 함) => 로컬 사용자로 표시");
      setLoggedInStateFromLocal();
      return;
    }

    const userData = await response.json();
    setLoggedInState(userData);
  } catch (error) {
    console.warn("서버 연결 실패. 로컬 사용자로 표시:", error);
    setLoggedInStateFromLocal();
  }
}

// 로그인 성공 시 화면 (UI 업데이트)
function setLoggedInState(user) {
  const nicknameEl = document.getElementById("userNickname");
  const emailEl = document.getElementById("userEmail");

  if (nicknameEl) nicknameEl.textContent = user.nickname || localStorage.getItem("userName") || "게스트";
  if (emailEl) emailEl.textContent = user.email || localStorage.getItem("userEmail") || "guest@mysave.local";

  const imgDiv = document.getElementById("userProfileImg");
  if (imgDiv && user.profileImageUrl) {
    imgDiv.style.backgroundImage = `url(${user.profileImageUrl})`;
    imgDiv.style.backgroundSize = "cover";
  }

  const badge = document.getElementById("connectionStatus");
  const logoutLink = document.getElementById("logoutLink");
  const kakaoBtn = document.getElementById("kakaoAuthBtn");

  if (badge) badge.style.display = "inline-flex";
  if (logoutLink) logoutLink.style.display = "inline-flex";

  if (kakaoBtn) {
    // 로그인 강제 제거
    kakaoBtn.innerHTML = '<i class="fa-solid fa-pen"></i> 닉네임/이메일 설정';
    kakaoBtn.disabled = false;
    kakaoBtn.style.opacity = "1";
    kakaoBtn.style.cursor = "pointer";
  }
}

/* ---------------------------
  1~6. 기타 UI 기능들
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
    localStorage.setItem("darkModeChange", Date.now().toString());
  });
}
window.addEventListener("storage", (e) => {
  if (e.key === "darkMode") {
    document.body.classList.toggle("dark-mode", e.newValue === "true");
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) toggle.checked = (e.newValue === "true");
  }
});

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
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("알림 권한이 필요합니다.");
        toggle.checked = false;
        setSetting("notification", false);
        return;
      }
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
    if (!confirm("정말 모든 데이터를 삭제하시겠습니까?")) return;
    if (prompt("삭제하려면 '삭제합니다'라고 입력하세요.") === "삭제합니다") {
      localStorage.clear();
      alert("데이터 삭제 완료! 초기화면으로 이동합니다.");
      window.location.href = "../index/index.html";
    } else {
      alert("삭제가 취소되었습니다.");
    }
  });
}

/* ---------------------------
  7. 계정 설정/로그아웃
---------------------------- */
function initAccountActions() {
  const kakaoBtn = document.getElementById("kakaoAuthBtn");
  const logoutBtn = document.getElementById("logoutLink");

  if (kakaoBtn) {
    kakaoBtn.addEventListener("click", () => {
      // 로그인 강제 X: 그냥 닉네임/이메일 설정 페이지로 보내기
      localStorage.setItem("redirectTo", window.location.href);
      window.location.href = "../login.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout(true);
    });
  }
}

// 로그아웃해도 북마크/태그 데이터는 남기고 “사용자정보만” 지움
function handleLogout(askConfirm = true) {
  if (askConfirm && !confirm("로그아웃 하시겠습니까?")) return;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");

  // 다시 게스트로 채워서 계속 사용 가능하게
  ensureGuestUser();
  alert("로그아웃 완료");
  window.location.reload();
}
