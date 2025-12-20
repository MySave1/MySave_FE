console.log("MySave: 대시보드 스크립트 실행 중...");

// 1. 대시보드 웹사이트의 로그인 토큰을 확장프로그램 저장소로 공유
// (웹사이트 -> 확장프로그램)
function syncAuthToken() {
    // 웹사이트의 localStorage에서 토큰을 읽어옵니다.
    // 주의: 웹사이트가 'accessToken'이라는 키로 토큰을 저장하고 있어야 합니다.
    const token = localStorage.getItem('accessToken'); 
    const userId = localStorage.getItem('userId');
    
    if (token) {
        chrome.storage.local.set({ accessToken: token, userId: userId }, () => {
            console.log("MySave: 로그인 토큰이 확장프로그램에 동기화되었습니다.");
        });
    } else {
        // 로그아웃 상태라면 확장프로그램 토큰도 삭제 (선택 사항)
        // chrome.storage.local.remove(['accessToken', 'userId']);
    }
}

// 페이지가 로드될 때 실행
syncAuthToken();