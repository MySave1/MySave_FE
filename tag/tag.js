// ==========================================
// 1. 초기 설정 및 전역 변수
// ==========================================
const API_BASE_URL = "http://13.60.25.65:8080";
const TAG_STORAGE_KEY = 'myTagList'; // 대시보드와 동일한 키 사용

let currentSelectedColor = { bg: "#FF02024D", dot: "#FF0202" };

document.addEventListener('DOMContentLoaded', () => {
    // 유저 아이디가 없으면 기본값 설정 (로그인 없이 작동 유도)
    if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', 'guest_user_123');
    }

    renderTags();
    setupColorSelection();

    document.getElementById('createTagBtn').addEventListener('click', addNewTag);
    document.getElementById('tagNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTag();
    });
});

// ==========================================
// 2. 데이터 연동 로직
// ==========================================

function getTags() {
    // 대시보드에서 사용하는 'myTagList'를 가져옴
    return JSON.parse(localStorage.getItem(TAG_STORAGE_KEY)) || [];
}

function saveTagsToDB(tags) {
    // 대시보드와 동일한 키로 저장
    localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags));
}

function addNewTag() {
    const input = document.getElementById('tagNameInput');
    const name = input.value.trim().toUpperCase();
    const myId = localStorage.getItem('userId');

    if (!name) { alert("태그 이름을 입력해주세요!"); return; }

    const allTags = getTags();

    // 중복 검사
    if (allTags.some(t => t.name === name)) {
        alert("이미 존재하는 태그입니다.");
        return;
    }

    // 새 태그 생성 (대시보드 객체 구조와 동일하게 유지)
    const newTag = {
        id: Date.now(),
        userId: myId,
        name: name,
        color: currentSelectedColor.bg,
        dotColor: currentSelectedColor.dot,
        count: 0 // 북마크 개수 초기값
    };

    allTags.push(newTag);
    saveTagsToDB(allTags);
    
    input.value = '';
    renderTags();
    
    // 서버 연동 시 추가할 부분
    // syncTagWithServer(newTag);
}

window.deleteTag = function(tagId) {
    if(!confirm("정말 이 태그를 삭제하시겠습니까?")) return;

    let allTags = getTags();
    allTags = allTags.filter(t => t.id !== tagId);
    
    saveTagsToDB(allTags);
    renderTags();
};

// ==========================================
// 3. UI 렌더링
// ==========================================

function renderTags() {
    const container = document.getElementById('tagListContainer');
    if (!container) return;
    container.innerHTML = '';
    
    const tags = getTags();

    if (tags.length === 0) {
        container.innerHTML = '<p style="padding: 20px; color: #888; grid-column: 1/-1; text-align: center;">생성된 태그가 없습니다.</p>';
        return;
    }

    tags.forEach(tag => {
        const cardHTML = `
            <div class="tag-card" 
                 style="background-color: ${tag.color}; cursor: pointer;"
                 onclick="goToTagFilter('${tag.name}')">
                 
                <i class="fa-solid fa-xmark delete-btn" 
                   onclick="event.stopPropagation(); deleteTag(${tag.id})"></i>
                   
                <div class="tag-info">
                    <div class="tag-dot" style="background-color: ${tag.dotColor || '#888'}"></div>
                    <span class="tag-name">${tag.name}</span>
                </div>
                <span class="tag-count">목록 보기</span>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

window.goToTagFilter = function(tagName) {
    window.location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tagName)}`;
};

function setupColorSelection() {
    const circles = document.querySelectorAll('.color-circle');
    circles.forEach(circle => {
        circle.addEventListener('click', () => {
            circles.forEach(c => c.classList.remove('selected'));
            circle.classList.add('selected');
            const colorName = circle.getAttribute('data-color');
            updateColorVariable(colorName);
        });
    });
}

function updateColorVariable(colorName) {
    switch(colorName) {
        case 'red':    currentSelectedColor = { bg: "#FF02024D", dot: "#FF0202" }; break;
        case 'orange': currentSelectedColor = { bg: "#FF77004D", dot: "#FF7700" }; break;
        case 'yellow': currentSelectedColor = { bg: "#FFE5004D", dot: "#FFE500" }; break;
        case 'green':  currentSelectedColor = { bg: "#0E9E294D", dot: "#0E9E29" }; break;
        case 'blue':   currentSelectedColor = { bg: "#3D98FA4D", dot: "#3D98FA" }; break;
        case 'purple': currentSelectedColor = { bg: "#E250CF4D", dot: "#E250CF" }; break;
        case 'grey':   currentSelectedColor = { bg: "#8888884D", dot: "#888888" }; break;
    }
}