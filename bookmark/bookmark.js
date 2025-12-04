// 1. 초기 더미 데이터 (image 필드 추가됨)
// 이미지가 필요한 곳에는 URL을 넣고, 없으면 null 또는 ""(빈 문자열)로 둡니다.
const initialBookmarkData = [
    { 
        id: 1, 
        title: "React 19의 새로운 기능 완벽 정리", 
        tag: "Dev", 
        tagColor: "#3b5998", 
        date: "2025.11.30", // 오늘 날짜로 업데이트됨
        isStarred: true, 
        isRead: false, 
        hasSummary: true, 
        content: "React 19의 새로운 기능인 Actions...", 
        aiSummary: "요약...", 
        memo: "메모...",
        // [테스트용] 이미지가 있는 경우 (무료 이미지 서비스 URL)
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop"
    },
    { 
        id: 2, 
        title: "2025 AI 디자인 트렌드 분석 리포트", 
        tag: "Design", 
        tagColor: "#E91E63", 
        date: "2025.11.20", 
        isStarred: false, 
        isRead: true, 
        hasSummary: false, 
        content: "2025년 디자인 트렌드는...", 
        aiSummary: "", 
        memo: "",
        // [테스트용] 이미지가 있는 경우
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"
    },
    { 
        id: 3, 
        title: "효율적인 팀 커뮤니케이션을 위한 가이드", 
        tag: "Work", 
        tagColor: "#2E7D32", 
        date: "2025.11.19", 
        isStarred: true, 
        isRead: true, 
        hasSummary: true, 
        content: "비동기 커뮤니케이션의 중요성이...", 
        aiSummary: "", 
        memo: "",
        image: null // [테스트용] 이미지가 없는 경우 -> 글만 나옴
    },
    // 나머지 데이터들도 image: null 로 설정한다고 가정
    { id: 4, title: "프론트엔드 성능 최적화", tag: "Dev", tagColor: "#3b5998", date: "2025.11.18", isStarred: false, isRead: false, hasSummary: true, content: "내용...", aiSummary: "", memo: "", image: null },
    { id: 5, title: "UX 심리학 법칙", tag: "Design", tagColor: "#E91E63", date: "2025.11.17", isStarred: true, isRead: false, hasSummary: false, content: "내용...", aiSummary: "", memo: "", image: null },
    { id: 6, title: "노션 활용 꿀팁", tag: "Work", tagColor: "#2E7D32", date: "2025.11.16", isStarred: false, isRead: true, hasSummary: true, content: "내용...", aiSummary: "", memo: "", image: null },
    { id: 7, title: "타입스크립트 활용", tag: "Dev", tagColor: "#3b5998", date: "2025.11.15", isStarred: true, isRead: true, hasSummary: true, content: "내용...", aiSummary: "", memo: "", image: null },
    { id: 8, title: "피그마 오토레이아웃", tag: "Design", tagColor: "#E91E63", date: "2025.11.14", isStarred: false, isRead: false, hasSummary: false, content: "내용...", aiSummary: "", memo: "", image: null },
    { id: 9, title: "리모트 워크 문화", tag: "Work", tagColor: "#2E7D32", date: "2025.11.13", isStarred: false, isRead: true, hasSummary: true, content: "내용...", aiSummary: "", memo: "", image: null },
];

let currentFilterType = 'all';
let currentSortOrder = 'latest';
let currentPage = 1;
const itemsPerPage = 12;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-container input');
    // 1. URL 파라미터 처리 (다른 페이지에서 넘어온 경우)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('q');

    if (searchParam && searchInput) {
        searchInput.value = searchParam; // 검색어 채우기
    }
    
    // 2. 검색창 이벤트 리스너 연결 (변수 재선언 없이 바로 사용)
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            renderBookmarks();
        });
    }

    // 초기 데이터 로드
    if (!localStorage.getItem('bookmarks')) {
        localStorage.setItem('bookmarks', JSON.stringify(initialBookmarkData));
    }

    renderBookmarks();

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

    const sortBtn = document.querySelector('.sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            if (currentSortOrder === 'latest') {
                currentSortOrder = 'oldest';
                sortBtn.innerHTML = '오래된순 <i class="fa-solid fa-chevron-up"></i>';
            } else {
                currentSortOrder = 'latest';
                sortBtn.innerHTML = '최신순 <i class="fa-solid fa-chevron-down"></i>';
            }
            renderBookmarks();
        });
    }

    // 페이지네이션
    const prevBtn = document.querySelector('.pagination .page-control:first-child');
    const nextBtn = document.querySelector('.pagination .page-control:last-child');

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderBookmarks();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = parseInt(document.querySelector('.page-info').dataset.totalPages || 1);
        if (currentPage < totalPages) {
            currentPage++;
            renderBookmarks();
        }
    });
});

function renderBookmarks() {
    const searchQuery = document.querySelector('.search-container input').value;
    const container = document.getElementById('bookmarkCardContainer');
    container.innerHTML = '';

    const bookmarks = JSON.parse(localStorage.getItem('bookmarks'));

    // 필터링 및 정렬 로직
    let filteredData = bookmarks;
    if (currentFilterType === 'starred') filteredData = bookmarks.filter(item => item.isStarred);
    else if (currentFilterType === 'read') filteredData = bookmarks.filter(item => item.isRead);
    else if (currentFilterType === 'unread') filteredData = bookmarks.filter(item => !item.isRead);

    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.tag.toLowerCase().includes(query) ||
            (item.content && item.content.toLowerCase().includes(query))
        );
    }

    filteredData.sort((a, b) => {
        if (currentSortOrder === 'latest') return b.date.localeCompare(a.date);
        else return a.date.localeCompare(b.date);
    });

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        pageInfo.dataset.totalPages = totalPages;
    }

    if (totalItems === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; margin-top: 50px;">검색 결과가 없습니다.</p>';
        return;
    }

    // 카드 생성 루프
    paginatedData.forEach(item => {
        // 요약 배지 생성
        const summaryBadge = item.hasSummary 
            ? `<span class="summary-tag">요약됨</span>` 
            : `<button class="summary-btn" onclick="event.stopPropagation(); alert('요약 생성 기능 준비중')">요약하기</button>`;

        const starClass = item.isStarred ? 'fa-solid fa-star active' : 'fa-regular fa-star';

        // 이미지가 있는지 확인하여 HTML 조립
        let imageHTML = '';
        
        // 이미지가 있으면: 회색 박스(card-img) + 이미지 태그 + 요약 배지
        if (item.image) {
            imageHTML = `
                <div class="card-img">
                    <img src="${item.image}" alt="cover image">
                    ${summaryBadge}
                </div>
            `;
        } 
        // 이미지가 없으면: imageHTML은 빈 문자열이 됨 (즉, 회색 박스 자체가 생성되지 않음)
        // 주의: 이미지가 없으면 '요약됨' 배지도 같이 사라집니다. (원하시면 본문 쪽으로 이동 가능)

        const cardHTML = `
            <div class="card" onclick="goToDetail(${item.id})">
                ${imageHTML} 
                <div class="card-body">
                    <h4 class="card-title">${item.title}</h4>
                    <div class="card-footer">
                        <span class="tag-badge" style="background-color: ${item.tagColor}">#${item.tag}</span>
                        <div class="card-actions">
                            <span>${item.date}</span>
                            <i class="fa-solid fa-pen action-icon" onclick="editBookmark(event, ${item.id})"></i>
                            <i class="fa-regular fa-trash-can action-icon" onclick="event.stopPropagation(); deleteBookmark(${item.id})"></i>
                            <i class="${starClass} action-icon star-icon" onclick="toggleBookmarkStar(event, ${item.id})"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

function goToDetail(id) {
    localStorage.setItem('currentBookmarkId', id);
    localStorage.setItem('previousPage', 'bookmark');
    localStorage.removeItem('editMode');
    window.location.href = `/bookmarkContent/bookmarkContent.html?id=${id}`;
}

function editBookmark(event, id) {
    event.stopPropagation();
    localStorage.setItem('currentBookmarkId', id)
    localStorage.setItem('previousPage', 'bookmark');
    localStorage.setItem('editMode', 'true');
    window.location.href = `/bookmarkContent/bookmarkContent.html?id=${id}`;
}

function toggleBookmarkStar(event, id) {
    event.stopPropagation();
    const element = event.target;
    if (element.classList.contains('fa-solid')) {
        element.classList.replace('fa-solid', 'fa-regular');
        element.classList.remove('active');
    } else {
        element.classList.replace('fa-regular', 'fa-solid');
        element.classList.add('active');
    }
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks'));
    const targetIndex = bookmarks.findIndex(b => b.id === id);
    if (targetIndex > -1) {
        bookmarks[targetIndex].isStarred = !bookmarks[targetIndex].isStarred;
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
}

function deleteBookmark(id) {
    if(confirm('정말 삭제하시겠습니까?')) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks'));
        const newBookmarks = bookmarks.filter(b => b.id !== id);
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        const newTotalPages = Math.ceil(newBookmarks.length / itemsPerPage) || 1;
        if (currentPage > newTotalPages) currentPage = newTotalPages;
        renderBookmarks();
    }
}