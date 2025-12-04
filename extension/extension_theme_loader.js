// extension_theme_loader.js 파일 내용

function initExtensionDarkMode() {
    // Chrome Storage에서 다크 모드 상태를 읽어와 적용
    chrome.storage.local.get(['darkMode'], (result) => {
        // Local Storage 대신 Chrome Storage를 사용해야 확장 프로그램에서 설정 읽기가 가능합니다.
        const isDark = result.darkMode || false;
        document.body.classList.toggle('dark-mode', isDark);
    });

    // 설정 페이지에서 다크 모드 변경 시 실시간 동기화
    chrome.storage.local.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.darkMode) {
            const isDark = changes.darkMode.newValue || false;
            document.body.classList.toggle('dark-mode', isDark);
        }
    });
}

// 확장 프로그램이 로드될 때 함수 실행
initExtensionDarkMode();