// ==========================================
// 1. 초기 설정 및 전역 변수
// ==========================================

// 현재 선택된 색상 (기본값: red)
let currentSelectedColor = { bg: "#FF02024D", dot: "#FF0202" };

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // 1. 유저 체크
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "../index/index.html";
        return;
    }

    // 2. 초기 렌더링
    renderTags();
    setupColorSelection();

    // 3. 이벤트 리스너 연결
    document.getElementById('createTagBtn').addEventListener('click', addNewTag);
    
    document.getElementById('tagNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTag();
    });

    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) window.location.href = `../bookmark/bookmark.html?q=${encodeURIComponent(query)}`;
            }
        });
    }
});

// ==========================================
// 2. 핵심 로직 (Local Storage - 가짜 데이터)
// ==========================================

// 가짜 DB에서 태그 가져오기
function getTags() {
    const allTags = JSON.parse(localStorage.getItem('fake_tags_db')) || [];
    const myId = localStorage.getItem('userId');
    // 내 아이디로 된 태그만 가져오기
    return allTags.filter(tag => tag.userId === myId);
}

// 가짜 DB에 태그 저장
function saveTagsToDB(tags) {
    // 1. 기존 DB 가져오기
    const allTags = JSON.parse(localStorage.getItem('fake_tags_db')) || [];
    const myId = localStorage.getItem('userId');
    
    const otherUsersTags = allTags.filter(tag => tag.userId !== myId);
    const newDB = [...otherUsersTags, ...tags];
    
    localStorage.setItem('fake_tags_db', JSON.stringify(newDB));
}

function addNewTag() {
    const input = document.getElementById('tagNameInput');
    const name = input.value.trim().toUpperCase(); // 태그는 대문자로 관리 추천
    const myId = localStorage.getItem('userId');

    if (!name) { alert("태그 이름을 입력해주세요!"); return; }

    const myTags = getTags();

    // 중복 검사
    if (myTags.some(t => t.name === name)) {
        alert("이미 존재하는 태그입니다.");
        return;
    }

    // 새 태그 생성
    const newTag = {
        id: Date.now(),
        userId: myId,
        name: name,
        color: currentSelectedColor.bg,
        dotColor: currentSelectedColor.dot,
        createdAt: new Date().toISOString()
    };

    // 저장 및 갱신
    myTags.push(newTag);
    saveTagsToDB(myTags);
    
    input.value = '';
    renderTags();
}

// 태그 삭제
window.deleteTag = function(tagId) {
    if(!confirm("정말 이 태그를 삭제하시겠습니까?")) return;

    let myTags = getTags();
    myTags = myTags.filter(t => t.id !== tagId);
    
    saveTagsToDB(myTags);
    renderTags();
};

// ==========================================
// 3. UI 렌더링 및 헬퍼 함수
// ==========================================

function renderTags() {
    const container = document.getElementById('tagListContainer');
    container.innerHTML = '';
    
    const tags = getTags();

    if (tags.length === 0) {
        container.innerHTML = '<p style="padding: 20px; color: #888;">생성된 태그가 없습니다.</p>';
        return;
    }

    tags.forEach(tag => {
        const count = 0; 

        const cardHTML = `
            <div class="tag-card" 
                 style="background-color: ${tag.color}; cursor: pointer;"
                 onclick="goToTagFilter('${tag.name}')">
                 
                <i class="fa-solid fa-xmark delete-btn" 
                   onclick="event.stopPropagation(); deleteTag(${tag.id})"></i>
                   
                <div class="tag-info">
                    <div class="tag-dot" style="background-color: ${tag.dotColor};"></div>
                    <span class="tag-name">${tag.name}</span>
                </div>
                <span class="tag-count">Tag Filter</span>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// 태그 클릭 시 북마크 리스트 페이지로 이동 (검색)
window.goToTagFilter = function(tagName) {
    window.location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tagName)}`;
};

// 색상 선택 로직
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
        default:       currentSelectedColor = { bg: "#FF02024D", dot: "#FF0202" }; 
    }
}