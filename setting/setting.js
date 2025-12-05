document.addEventListener("DOMContentLoaded", () => {
    initDarkMode();
    initAiToggle();
    initNotificationToggle();
    initProfileImageEdit();
    initSearchBar();
    initDataManagement();
    initAccountActions();
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
    1. 다크 모드
---------------------------- */
function initDarkMode() {
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;

    // 저장된 상태 적용
    const savedMode = getSetting("darkMode", false);
    toggle.checked = savedMode;
    document.body.classList.toggle("dark-mode", savedMode);

    toggle.addEventListener("change", () => {
        const isDark = toggle.checked;
        document.body.classList.toggle("dark-mode", isDark);
        setSetting("darkMode", isDark);
        
        // ✨ 추가: 다른 탭/페이지에 즉시 알림
        localStorage.setItem("darkModeChange", Date.now().toString());
    });
}

// ✨ 새로 추가: 다른 탭에서 변경사항 감지
window.addEventListener("storage", (e) => {
    if (e.key === "darkMode") {
        const isDark = e.newValue === "true";
        document.body.classList.toggle("dark-mode", isDark);
        
        // 토글 버튼 상태도 동기화
        const toggle = document.getElementById("darkModeToggle");
        if (toggle) {
            toggle.checked = isDark;
        }
    }
});

/* ---------------------------
    2. AI 요약 자동화
---------------------------- */
function initAiToggle() {
    const toggle = document.getElementById("aiToggle");
    if (!toggle) return;

    // 초기 상태 로드 (기본값: true)
    const saved = getSetting("aiAutoSummary", true);
    toggle.checked = saved;

    toggle.addEventListener("change", () => {
        // 토글 상태를 로컬 스토리지에 저장
        setSetting("aiAutoSummary", toggle.checked);
        console.log("AI 자동 요약:", toggle.checked ? "활성화" : "비활성화");
        // 실제 요약 로직은 북마크 저장 시점에서 이 값을 참조하여 실행됩니다.
    });
}
/* ---------------------------
    3. 알림 설정
---------------------------- */
function initNotificationToggle() {
    const toggle = document.getElementById("notiToggle");
    if (!toggle) return;

    // 초기 상태 로드 (기본값: true)
    const saved = getSetting("notification", true);
    toggle.checked = saved;

    toggle.addEventListener("change", async () => {
        if (toggle.checked) {
            // 브라우저 알림 권한 요청
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                alert("브라우저에서 알림 권한을 허용해야 리마인드가 작동합니다.");
                toggle.checked = false;
                setSetting("notification", false); // 권한 거부 시 상태 저장
                return;
            }
        }
        // 토글 상태 저장
        setSetting("notification", toggle.checked);
        console.log("리마인드 알림:", toggle.checked ? "활성화" : "비활성화");
    });
}

/* ---------------------------
    4. 프로필 이미지 변경
---------------------------- */
function initProfileImageEdit() {
    const btn = document.querySelector(".edit-icon-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        alert("프로필 이미지 변경 팝업을 띄우세요.");
        // → 실제 이미지 업로드 모달/파일 선택 로직 연결 가능
    });
}

/* ---------------------------
    5. 검색 기능
---------------------------- */
function initSearchBar() {
    const input = document.querySelector(".search-container input");
    if (!input) return;

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
            const q = encodeURIComponent(input.value.trim());
            // 검색어를 쿼리 파라미터 'q'에 담아 북마크 목록 페이지로 이동
            window.location.href = `../bookmark/bookmark.html?q=${q}`;
            // 검색어는 북마크 페이지에서 다시 로드하여 필터링에 사용됩니다.
        }
    });
}

/* ---------------------------
    6. 데이터 관리
---------------------------- */
function initDataManagement() {
    const deleteBtn = document.querySelector(".delete-data-btn");
    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", () => {
        const first = confirm("정말 모든 데이터를 삭제하시겠습니까?");
        if (!first) return;

        const second = prompt("삭제하려면 '삭제합니다'라고 입력하세요.");
        if (second === "삭제합니다") {
            alert("데이터 삭제 완료!");
            // 실제 삭제 로직 삽입
        } else {
            alert("삭제가 취소되었습니다.");
        }
    });
}

/* ---------------------------
    7. 계정 연동 / 로그아웃
---------------------------- */
function initAccountActions() {
    const kakaoBtn = document.querySelector(".kakao-btn-full");
    const logoutBtn = document.querySelector(".logout-link");

    if (kakaoBtn) {
        kakaoBtn.addEventListener("click", () => {
            alert("카카오 연동 해제 또는 재연동 로직 실행");
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            alert("로그아웃 되었습니다.");
            window.location.href = "../index/index.html"; // 다음 클론
        });
    }
}