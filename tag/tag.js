// ==========================================
// 1. 초기 설정 및 데이터
// ==========================================

const defaultTags = [];

let currentSelectedColor = {
    bg: "#FF02024D",
    dot: "#FF0202"
};

// ==========================================
// 2. 실행 및 이벤트 리스너
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        alert("로그인이 필요합니다.");
        window.location.href = "../index/index.html";
        return;
    }

    renderTags();
    setupColorPicker();

    const createBtn = document.getElementById('createTagBtn');
    if (createBtn) {
        createBtn.addEventListener('click', addNewTag);
    }

    const inputField = document.getElementById('tagNameInput');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNewTag();
        });
    }

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
// 3. 핵심 기능 함수들 (Mock DB 적용)
// ==========================================

// 내 태그만 가져오기
function getTags() {
    // 'fake_tags_db'라는 가짜 DB에서 전체 데이터를 가져옴
    const allTags = JSON.parse(localStorage.getItem('fake_tags_db')) || [];
    const myId = localStorage.getItem('userId');

    // 내 아이디(userId)와 일치하는 태그만 필터링해서 리턴
    return allTags.filter(tag => tag.userId === myId);
}

// 태그 저장하기 (내 것만 추가)
function saveNewTagToDB(newTag) {
    const allTags = JSON.parse(localStorage.getItem('fake_tags_db')) || [];
    allTags.push(newTag); // 전체 DB에 추가
    localStorage.setItem('fake_tags_db', JSON.stringify(allTags));
}

// 태그 삭제하기 (내 것만 삭제)
function deleteTagFromDB(tagId) {
    let allTags = JSON.parse(localStorage.getItem('fake_tags_db')) || [];
    // 삭제하려는 ID만 빼고 다시 저장
    allTags = allTags.filter(tag => tag.id !== tagId);
    localStorage.setItem('fake_tags_db', JSON.stringify(allTags));
}

// 북마크 개수 세기 (내 북마크 중에서만)
function getCountForTag(tagName) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const myId = localStorage.getItem('userId');
    const targetTag = tagName.toUpperCase();
    
    return bookmarks.filter(item => {
        // 1. 내 북마크인지 확인 (userId가 없으면 패스하거나 예전 데이터로 간주)
        const isMine = item.userId ? (item.userId === myId) : true; 
        // 2. 태그 이름 일치 확인
        const itemTag = (item.tag || '').toUpperCase();
        return isMine && (itemTag === targetTag);
    }).length;
}

function renderTags() {
    const container = document.getElementById('tagListContainer');
    if (!container) return;

    container.innerHTML = ''; 
    const tags = getTags();

    if (tags.length === 0) {
        container.innerHTML = '<p style="padding: 20px; color: #888;">생성된 태그가 없습니다.</p>';
        return;
    }

    tags.forEach(tag => {
        const count = getCountForTag(tag.name);

        const cardHTML = `
            <div class="tag-card" 
                 style="background-color: ${tag.color}; cursor: pointer;"
                 onclick="goToTagFilter('${tag.name}')">
                
                <i class="fa-solid fa-xmark delete-btn" 
                   title="삭제"
                   onclick="event.stopPropagation(); deleteTag(${tag.id}, '${tag.name}')"></i>
                
                <div class="tag-info">
                    <div class="tag-dot" style="background-color: ${tag.dotColor};"></div>
                    <span class="tag-name">${tag.name}</span>
                </div>
                <span class="tag-count">${count}개의 글</span>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

function setupColorPicker() {
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

function addNewTag() {
    const input = document.getElementById('tagNameInput');
    const tagName = input.value.trim().toUpperCase();
    const myId = localStorage.getItem('userId'); // 내 아이디 가져오기

    if (!tagName) {
        alert("태그 이름을 입력해주세요!");
        return;
    }

    const tags = getTags(); // 내 태그 목록만 가져옴
    const isDuplicate = tags.some(t => t.name === tagName);

    if (isDuplicate) {
        alert("이미 존재하는 태그 이름입니다.");
        return;
    }

    const newTag = {
        id: Date.now(),
        userId: myId,  // [핵심] 유저 ID 추가 (주인 표시)
        name: tagName,
        color: currentSelectedColor.bg,
        dotColor: currentSelectedColor.dot,
        createdAt: new Date().toISOString()
    };

    saveNewTagToDB(newTag); // DB에 저장
    renderTags();

    input.value = '';
}

// 태그 삭제 시 관련 북마크(글)도 함께 삭제
window.deleteTag = function(id, tagName) {
    if(confirm(`'${tagName}' 태그와 해당 태그에 포함된 모든 글이 삭제됩니다. \n계속하시겠습니까?`)) {
        
        // 1. 태그 목록에서 삭제
        deleteTagFromDB(id);

        // 2. 해당 태그를 가진 북마크(글)들 삭제
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        const myId = localStorage.getItem('userId');
        const targetTag = tagName.toUpperCase();

        const updatedBookmarks = bookmarks.filter(item => {
            // 내 글이면서 + 태그가 같은 경우 -> 삭제 대상 (즉, 남길 것만 true)
            
            const isMine = item.userId ? (item.userId === myId) : true;
            const itemTag = (item.tag || '').toUpperCase();

            if (isMine && itemTag === targetTag) {
                return false; 
            }
            return true;
        });

        // 결과 저장
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
        
        // 3. 화면 갱신
        renderTags();
    }
};

window.goToTagFilter = function(tagName) {
    window.location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tagName)}`;
};