// 페이지가 로드되기 전에 즉시 실행 (깜빡임 방지)
(function() {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "true") {
        document.documentElement.classList.add("dark-mode");
        // body에도 추가 (body가 아직 없을 수 있으므로 documentElement 사용)
        if (document.body) {
            document.body.classList.add("dark-mode");
        }
    }
})();

// DOM이 완전히 로드된 후 body에 다크모드 클래스 추가
document.addEventListener("DOMContentLoaded", () => {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "true") {
        document.body.classList.add("dark-mode");
    }
});