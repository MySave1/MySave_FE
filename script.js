// Daum 클론 기본 스크립트
console.log("Daum Clone Loaded");

function logout() {
    if(confirm("로그아웃 하시겠습니까?")) alert("로그아웃 되었습니다.");
}

// ★★★ [NEW] 추천 위젯 데이터 및 렌더링 (LocalStorage 연동) ★★★
document.addEventListener('DOMContentLoaded', () => {
    renderMiniCards();
});

function renderMiniCards() {
    const container = document.getElementById('miniCardGrid');
    if (!container) return;

    container.innerHTML = '';

    // 1. LocalStorage에서 데이터 가져오기
    const storedData = localStorage.getItem('bookmarks');
    
    // 데이터가 없으면 안내 메시지 표시
    if (!storedData) {
        container.innerHTML = '<p style="padding: 20px; color: #888;">저장된 글이 없습니다.</p>';
        return;
    }

    let bookmarks = JSON.parse(storedData);

    // 2. 날짜 기준 내림차순 정렬 (최신글이 먼저 오게)
    bookmarks.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. 상위 4개만 자르기
    const top4 = bookmarks.slice(0, 4);

    // 4. 카드 HTML 생성
    top4.forEach(item => {
        // 이미지가 있으면 이미지 태그, 없으면 '요약됨' 배지 표시 로직
        let imageContent;
        if (item.image) {
            imageContent = `<img src="${item.image}" alt="썸네일" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            imageContent = `<span class="mini-badge">요약됨</span>`;
        }

        // 태그 색상이 없으면 기본값
        const tagColor = item.tagColor || '#eee';
        // 배경색이 없으면 기본값
        const bgColor = item.bgColor || '#f0f0f0';

        // HTML 구조 조립 (CSS 클래스명에 맞춰서 구성)
        const html = `
            <div class="mini-card" onclick="goToDetailFromIndex(${item.id})">
                <div class="mini-card-img" style="background-color: ${bgColor};">
                    ${imageContent}
                </div>
                <div class="mini-card-body">
                    <div class="mini-card-title">${item.title}</div>
                    <span class="mini-card-tag" style="color: ${tagColor}; border: 1px solid ${tagColor};">#${item.tag}</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// 5. 클릭 시 상세 페이지로 이동하는 함수
function goToDetailFromIndex(id) {
    // 상세 페이지가 어떤 글을 보여줄지 ID 저장
    localStorage.setItem('currentBookmarkId', id);
    
    localStorage.setItem('previousPage', 'index'); 
    
    // 수정 모드는 끄고 이동
    localStorage.setItem('editMode', 'false');
    window.location.href = 'bookmarkcontent.html';
}