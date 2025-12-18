// ==========================================
// 백엔드 서버 주소 설정
// 1. 나 혼자 테스트할 때: "http://localhost:8080"
// 2. 친구(백엔드)랑 연결할 때: 친구가 준 배포 주소
//    예: "https://a1b2-c3d4.ngrok-free.app"
// ==========================================
const API_BASE_URL = "http://localhost:8080"; 


document.addEventListener("DOMContentLoaded", async () => {
    // 1. UI 설정 초기화
    initDarkMode();
    initAiToggle();
    initNotificationToggle();
    initProfileImageEdit();
    initSearchBar();
    initDataManagement();

    // 2. 계정 관련 로직
    await checkLoginStatus(); // 페이지 로드 시: 내 정보 가져오기
    initAccountActions();     // 버튼 이벤트 연결: 로그인 시작 / 로그아웃
});

/* ---------------------------
    공통 저장/로드 유틸
---------------------------- */
function setSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getSetting(key, defaultValue = false) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
}

/* ---------------------------
    0. 로그인 상태 확인 및 내 정보 불러오기
---------------------------- */
async function checkLoginStatus() {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
        // 토큰이 있으면 백엔드에서 최신 정보 가져오기
        await fetchUserProfile(token);
    } else {
        setLoggedOutState();
    }
}

async function fetchUserProfile(token) {
    try {
        // API_BASE_URL 변수 사용
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            setLoggedInState(userData);
        } else {
            console.warn("토큰 만료 또는 유효하지 않음");
            handleLogout(false); 
        }
    } catch (error) {
        console.error("서버 연결 실패:", error);
        setLoggedOutState();
    }
}

// 로그인 성공 시 화면 (UI 업데이트)
function setLoggedInState(user) {
    const nicknameEl = document.getElementById('userNickname');
    const emailEl = document.getElementById('userEmail');
    
    if(nicknameEl) nicknameEl.textContent = user.nickname || '이름 없음';
    if(emailEl) emailEl.textContent = user.email || '이메일 없음';

    const imgDiv = document.getElementById('userProfileImg');
    if (imgDiv && user.profileImageUrl) {
        imgDiv.style.backgroundImage = `url(${user.profileImageUrl})`;
        imgDiv.style.backgroundSize = 'cover';
    }

    const badge = document.getElementById('connectionStatus');
    const logoutLink = document.getElementById('logoutLink');
    const kakaoBtn = document.getElementById('kakaoAuthBtn');

    if(badge) badge.style.display = 'inline-flex';
    if(logoutLink) logoutLink.style.display = 'inline-flex';
    
    if(kakaoBtn) {
        kakaoBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kakao 연동 완료';
        kakaoBtn.disabled = true;
        kakaoBtn.style.opacity = '0.7';
        kakaoBtn.style.cursor = 'default';
    }
}

// 로그아웃 상태 화면 (UI 초기화)
function setLoggedOutState() {
    const nicknameEl = document.getElementById('userNickname');
    const emailEl = document.getElementById('userEmail');
    
    if(nicknameEl) nicknameEl.textContent = '로그인이 필요합니다';
    if(emailEl) emailEl.textContent = '-';
    
    const imgDiv = document.getElementById('userProfileImg');
    if(imgDiv) imgDiv.style.backgroundImage = 'none';

    const badge = document.getElementById('connectionStatus');
    const logoutLink = document.getElementById('logoutLink');
    const kakaoBtn = document.getElementById('kakaoAuthBtn');

    if(badge) badge.style.display = 'none';
    if(logoutLink) logoutLink.style.display = 'none';

    if(kakaoBtn) {
        kakaoBtn.innerHTML = '<i class="fa-solid fa-comment"></i> Kakao 로그인 연결';
        kakaoBtn.disabled = false;
        kakaoBtn.style.opacity = '1';
        kakaoBtn.style.cursor = 'pointer';
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
    7. 계정 연동 / 로그아웃 (핵심 수정)
---------------------------- */
function initAccountActions() {
    const kakaoBtn = document.getElementById("kakaoAuthBtn");
    const logoutBtn = document.getElementById("logoutLink");

    // 로그인 시작 버튼
    if (kakaoBtn) {
        kakaoBtn.addEventListener("click", async () => {
            if (kakaoBtn.disabled) return; 

            try {
                // API_BASE_URL 사용
                // 백엔드에게 "카카오 로그인 주소 만들어줘 (redirect는 callback.html로 맞춰줘)" 라고 요청
                const response = await fetch(`${API_BASE_URL}/api/auth/kakao/login-url`);
                
                if(!response.ok) throw new Error("로그인 주소 요청 실패");

                const loginUrl = await response.text();
                
                // 받아온 주소(카카오)로 이동 -> 로그인 후 callback.html로 돌아옴
                window.location.href = loginUrl; 
            } catch (error) {
                console.error("로그인 시작 실패:", error);
                alert("서버와 연결할 수 없습니다. (백엔드 서버를 확인해주세요.)");
            }
        });
    }

    // 로그아웃 버튼
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout(true);
        });
    }
}

function handleLogout(askConfirm = true) {
    if (askConfirm && !confirm("로그아웃 하시겠습니까?")) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userName'); 
    localStorage.removeItem('userEmail');
    
    alert("로그아웃 되었습니다.");
    window.location.reload(); 
}