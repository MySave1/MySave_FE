// ==========================================
// 1. 상태 변수
// ==========================================
let currentFilterType = 'all'; // all, starred, read, unread
let currentSortOrder = 'latest'; // latest, oldest
let currentPage = 1;
const itemsPerPage = 12;

// ==========================================
// 2. 페이지 로드 및 이벤트 리스너
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-container input');
    
    // --- [기능 1] URL 파라미터 처리 및 제목 동적 변경 ---
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag'); 
    const searchParam = urlParams.get('q'); 

    // 제목 요소 선택
    const pageTitleElement = document.querySelector('.page-header h2') || document.querySelector('.title-area h2');

    if (searchInput) {
        if (tagParam) {
            // 태그 클릭으로 왔을 때
            searchInput.value = `#${tagParam.toUpperCase()}`;
            if (pageTitleElement) pageTitleElement.textContent = `# ${tagParam} 페이지 목록`;
        } else if (searchParam) {
            // 검색 엔터로 왔을 때
            searchInput.value = searchParam;
            if (pageTitleElement) pageTitleElement.textContent = `'${searchParam}' 검색 결과`;
        } else {
            // 기본 상태
            if (pageTitleElement) pageTitleElement.textContent = "전체 페이지 목록";
        }

        // 실시간 검색 기능 (입력할 때마다 변동)
        searchInput.addEventListener('input', () => {
            currentPage = 1; 
            // 검색어 입력 시 제목도 실시간으로 변경하고 싶다면 아래 주석 해제
            // if (pageTitleElement) pageTitleElement.textContent = searchInput.value ? `'${searchInput.value}' 검색 중...` : "전체 페이지 목록";
            renderBookmarks();
        });
    }

    // --- [기능 2] 필터 버튼 이벤트 ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilterType = button.getAttribute('data-filter');
            currentPage = 1;
            renderBookmarks();
        });
    });

    // --- [기능 3] 정렬 버튼 이벤트 ---
    const sortBtn = document.querySelector('.sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            currentSortOrder = (currentSortOrder === 'latest') ? 'oldest' : 'latest';
            sortBtn.innerHTML = `${currentSortOrder === 'latest' ? '최신순' : '오래된순'} <i class="fa-solid fa-chevron-${currentSortOrder === 'latest' ? 'down' : 'up'}"></i>`;
            renderBookmarks();
        });
    }

    renderBookmarks();
    setupPaginationEvents();
});

// ==========================================
// 3. 핵심 렌더링 함수
// ==========================================
function renderBookmarks() {
    const targetContainer = document.getElementById('bookmarkCardContainer') || document.querySelector('.card-grid');
    if (!targetContainer) return;
    targetContainer.innerHTML = '';

    const searchInput = document.querySelector('.search-container input');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

    // --- [1단계] 탭 필터링 ---
    let filteredData = bookmarks;
    if (currentFilterType === 'starred') filteredData = bookmarks.filter(item => item.isStarred);
    else if (currentFilterType === 'read') filteredData = bookmarks.filter(item => item.isRead);
    else if (currentFilterType === 'unread') filteredData = bookmarks.filter(item => !item.isRead);

    // --- [2단계] 검색어/태그 필터링 (실시간 반영) ---
    if (searchQuery !== '') {
        if (searchQuery.startsWith('#')) {
            const tagKeyword = searchQuery.substring(1);
            filteredData = filteredData.filter(item => 
                (item.tag || '').toLowerCase().includes(tagKeyword)
            );
        } else {
            filteredData = filteredData.filter(item => 
                (item.title || '').toLowerCase().includes(searchQuery) || 
                (item.tag || '').toLowerCase().includes(searchQuery) ||
                (item.content || '').toLowerCase().includes(searchQuery)
            );
        }
    }

    // --- [3단계] 정렬 ---
    filteredData.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (currentSortOrder === 'latest') {
            return dateB.localeCompare(dateA) || b.id - a.id;
        } else {
            return dateA.localeCompare(dateB) || a.id - b.id;
        }
    });

    // --- [4단계] 페이지네이션 로직 ---
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        pageInfo.dataset.totalPages = totalPages;
    }

    // --- [5단계] 결과 없음 처리 ---
    if (totalItems === 0) {
        targetContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 0; color: #888;">
                <i class="fa-regular fa-folder-open" style="font-size: 40px; margin-bottom: 15px; opacity:0.5;"></i>
                <p>표시할 북마크가 없습니다.</p>
            </div>`;
        return;
    }

    // --- [6단계] HTML 카드 생성 ---
    paginatedData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // 요약 배지 (고정: 요약하기)
        let summaryTag = `<span class="summary-tag" style="display: inline-flex !important; white-space: nowrap !important; align-items: center; justify-content: center; height: 20px; padding: 0 10px; background: rgba(255, 255, 255, 0.9); border-radius: 14px; font-size: 12px; font-weight: 400; color: #555; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: absolute; top: 10px; right: 10px; cursor: pointer;" onclick="event.stopPropagation();">요약하기</span>`;

        const starClass = item.isStarred ? 'fa-solid fa-star active' : 'fa-regular fa-star';
        const starColor = item.isStarred ? '#facc15' : '';

        card.innerHTML = `
            <div class="card-img" style="background-color: ${item.bgColor || '#f0f2f5'}; height:160px; position:relative;">
                ${summaryTag}
            </div>
            <div class="card-body" style="padding:15px;">
                <h4 class="card-title" style="font-size:15px; font-weight:700; margin-bottom:12px; color:#333;">${item.title || '제목 없음'}</h4>
                <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="tag-badge" style="background:${item.tagColor || '#555'}; color:white; padding:3px 10px; border-radius:12px; font-size:11px;">#${item.tag || 'ETC'}</span>
                    <div class="card-actions" style="display:flex; gap:12px; color:#999; font-size:14px; align-items:center;">
                        <span style="font-size:12px;">${item.date || ''}</span>
                        <i class="fa-solid fa-pen" style="cursor:pointer;" onclick="editBookmark(event, ${item.id})"></i>
                        <i class="fa-regular fa-trash-can" style="cursor:pointer;" onclick="event.stopPropagation(); deleteBookmark(${item.id})"></i>
                        <i class="${starClass} fa-star" style="cursor:pointer; color:${starColor};" onclick="toggleBookmarkStar(event, ${item.id})"></i>
                    </div>
                </div>
            </div>
        `;
        
        card.onclick = () => goToDetail(item.id);
        targetContainer.appendChild(card);
    });
}

// ==========================================
// 4. 기능 함수
// ==========================================
function goToDetail(id) {
    localStorage.setItem('currentBookmarkId', id);
    localStorage.setItem('previousPage', 'bookmark');
    localStorage.removeItem('editMode');
    window.location.href = `../bookmarkContent/bookmarkContent.html?id=${id}`;
}

function editBookmark(event, id) {
    event.stopPropagation();
    localStorage.setItem('currentBookmarkId', id);
    localStorage.setItem('previousPage', 'bookmark');
    localStorage.setItem('editMode', 'true');
    window.location.href = `../bookmarkContent/bookmarkContent.html?id=${id}`;
}

function toggleBookmarkStar(event, id) {
    event.stopPropagation();
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const target = bookmarks.find(b => b.id === id);
    if (target) {
        target.isStarred = !target.isStarred;
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        renderBookmarks();
    }
}

function deleteBookmark(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    renderBookmarks();
}

function setupPaginationEvents() {
    document.querySelector('.page-control:first-child')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderBookmarks(); }
    });
    document.querySelector('.page-control:last-child')?.addEventListener('click', () => {
        const info = document.querySelector('.page-info');
        const total = info ? parseInt(info.dataset.totalPages) : 1;
        if (currentPage < total) { currentPage++; renderBookmarks(); }
    });
}