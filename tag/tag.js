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
// 3. 핵심 기능 함수들
// ==========================================

function getTags() {
    const stored = localStorage.getItem('myTagList');
    return stored ? JSON.parse(stored) : defaultTags;
}

function saveTags(tags) {
    localStorage.setItem('myTagList', JSON.stringify(tags));
}

function getCountForTag(tagName) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const targetTag = tagName.toUpperCase();
    
    return bookmarks.filter(item => {
        const itemTag = (item.tag || '').toUpperCase();
        return itemTag === targetTag;
    }).length;
}

function renderTags() {
    const container = document.getElementById('tagListContainer');
    if (!container) return;

    container.innerHTML = ''; 
    const tags = getTags();

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

    if (!tagName) {
        alert("태그 이름을 입력해주세요!");
        return;
    }

    const tags = getTags();
    const isDuplicate = tags.some(t => t.name === tagName);

    if (isDuplicate) {
        alert("이미 존재하는 태그 이름입니다.");
        return;
    }

    const newTag = {
        id: Date.now(),
        name: tagName,
        color: currentSelectedColor.bg,
        dotColor: currentSelectedColor.dot
    };

    tags.push(newTag);
    saveTags(tags);
    renderTags();

    input.value = '';
}

// [핵심 수정] 태그 삭제 시 관련 북마크(글)도 함께 삭제
window.deleteTag = function(id, tagName) {
    if(confirm(`'${tagName}' 태그와 해당 태그에 포함된 모든 글이 삭제됩니다. \n계속하시겠습니까?`)) {
        
        // 1. 태그 목록에서 삭제
        let tags = getTags();
        tags = tags.filter(tag => tag.id !== id);
        saveTags(tags);

        // 2. 해당 태그를 가진 북마크(글)들 삭제
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        const targetTag = tagName.toUpperCase();

        // 해당 태그가 아닌 북마크들만 남김 (필터링)
        const updatedBookmarks = bookmarks.filter(item => {
            const itemTag = (item.tag || '').toUpperCase();
            return itemTag !== targetTag;
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