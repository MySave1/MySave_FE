// ==========================================
// 1. 초기 데이터 및 설정
// ==========================================

// 기본 태그 데이터 (저장된 게 없을 때 사용)
const defaultTags = [
    { id: 1, name: "Dev", color: "#a0c4ff", dotColor: "#1565c0" },
    { id: 2, name: "Design", color: "#ffadad", dotColor: "#d32f2f" },
    { id: 3, name: "Work", color: "#caffbf", dotColor: "#2e7d32" },
    { id: 4, name: "Etc", color: "#cfcfcf", dotColor: "#424242" }
];

// 현재 선택된 색상 (기본값: Red 계열)
let selectedColorBg = "#ffadad";
let selectedColorDot = "#d32f2f";

// 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    renderTags();         // 태그 목록 그리기
    setupColorSelection();// 색상 선택 이벤트 연결
    
    // 생성 버튼 & 엔터키 이벤트 연결
    document.getElementById('createTagBtn').addEventListener('click', addNewTag);
    document.getElementById('tagNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTag();
    });

    // 검색창 기능 추가
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { // 엔터키를 눌렀을 때만 실행
                const query = e.target.value.trim();
                if (query) {
                    // 검색어를 가지고 bookmark.html로 이동
                    window.location.href = `bookmark.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});

// ==========================================
// 2. 핵심 로직 (불러오기 & 그리기)
// ==========================================

function getTags() {
    const stored = localStorage.getItem('myTagList');
    return stored ? JSON.parse(stored) : defaultTags;
}

function saveTags(tags) {
    localStorage.setItem('myTagList', JSON.stringify(tags));
}

// ★ 북마크 개수 세기 (실제 데이터 기반)
function getCountForTag(tagName) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    // 저장된 북마크 중 태그 이름이 같은 것의 개수를 셈
    // (대시보드 데이터 구조상 tag 필드와 비교)
    return bookmarks.filter(item => item.tag === tagName).length;
}

function renderTags() {
    const container = document.getElementById('tagListContainer');
    const tags = getTags();
    
    container.innerHTML = ''; // 초기화

    tags.forEach(tag => {
        // 실제 개수 계산
        const realCount = getCountForTag(tag.name);

        const cardHTML = `
            <div class="tag-card" style="background-color: ${tag.color};">
                <i class="fa-solid fa-xmark delete-btn" onclick="deleteTag(${tag.id})"></i>
                <div class="tag-info">
                    <div class="tag-dot" style="background-color: ${tag.dotColor};"></div>
                    <span class="tag-name">${tag.name}</span>
                </div>
                <span class="tag-count">${realCount}개의 글</span>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// ==========================================
// 3. 기능 구현 (색상선택, 추가, 삭제)
// ==========================================

function setupColorSelection() {
    const circles = document.querySelectorAll('.color-circle');
    
    circles.forEach(circle => {
        circle.addEventListener('click', () => {
            // 선택 효과 UI 처리
            circles.forEach(c => c.classList.remove('selected'));
            circle.classList.add('selected');
            
            // 선택한 색상값 변수에 저장
            const colorName = circle.getAttribute('data-color');
            updateSelectedColors(colorName);
        });
    });
}

function updateSelectedColors(colorName) {
    // 색상 팔레트 정의
    switch(colorName) {
        case 'red':    selectedColorBg = "#ffadad"; selectedColorDot = "#d32f2f"; break;
        case 'orange': selectedColorBg = "#ffd6a5"; selectedColorDot = "#e65100"; break;
        case 'yellow': selectedColorBg = "#fdffb6"; selectedColorDot = "#fbc02d"; break;
        case 'green':  selectedColorBg = "#caffbf"; selectedColorDot = "#2e7d32"; break;
        case 'blue':   selectedColorBg = "#a0c4ff"; selectedColorDot = "#1565c0"; break;
        case 'purple': selectedColorBg = "#bdb2ff"; selectedColorDot = "#6a1b9a"; break;
        case 'grey':   selectedColorBg = "#cfcfcf"; selectedColorDot = "#424242"; break;
    }
}

function addNewTag() {
    const input = document.getElementById('tagNameInput');
    const name = input.value.trim();

    if (!name) {
        alert("태그 이름을 입력해주세요!");
        return;
    }

    // 중복 체크
    const tags = getTags();
    if (tags.some(t => t.name === name)) {
        alert("이미 존재하는 태그입니다.");
        return;
    }

    const newTag = {
        id: Date.now(),
        name: name,
        color: selectedColorBg,
        dotColor: selectedColorDot
    };

    tags.push(newTag);
    saveTags(tags); // 저장
    renderTags();   // 다시 그리기
    input.value = ''; // 입력창 비우기
}

window.deleteTag = function(id) {
    if(confirm("정말 이 태그를 삭제하시겠습니까?")) {
        let tags = getTags();
        tags = tags.filter(tag => tag.id !== id);
        saveTags(tags);
        renderTags();
    }
};