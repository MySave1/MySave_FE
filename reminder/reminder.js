document.addEventListener('DOMContentLoaded', () => {
    // 1. 페이지 로드 시 리마인드 데이터 불러오기
    loadAndRenderReminders();

    // 2. 검색창 엔터키 이벤트 처리
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { // 엔터키를 눌렀을 때만 실행
                const query = e.target.value.trim();
                if (query) {
                    // 검색어를 가지고 북마크 목록 페이지로 이동
                    // (폴더 구조에 따라 경로가 다를 수 있으니 확인 필요: 예: ../bookmark/bookmark.html)
                    window.location.href = `../bookmark/bookmark.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});

/**
 * 리마인드 데이터를 불러와서 타임라인을 그리는 메인 함수
 */
function loadAndRenderReminders() {
    const container = document.getElementById('timelineContainer');
    
    // 1. LocalStorage에서 전체 북마크 데이터 가져오기
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    
    // 2. 리마인드가 설정된 아이템만 필터링 (reminderTime이 존재하는 것)
    const reminders = bookmarks.filter(item => item.reminderTime);

    // 저장된 리마인드가 아예 없는 경우 안내 표시
    if (reminders.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 60px 0; color:#fff;">
                <i class="fa-regular fa-clock" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>설정된 리마인드가 없습니다.</p>
            </div>`;
        updateBannerCount(0);
        return;
    }

    // 3. 그룹핑을 위한 객체 초기화
    const groups = {
        today: { label: "오늘", color: "blue", items: [] },
        tomorrow: { label: "내일", color: "yellow", items: [] },
        upcoming: { label: "이번주 / 다음주", color: "pink", items: [] }
    };

    // 오늘 날짜 기준점 (시간 제외하고 날짜만 비교하기 위해 00:00:00으로 설정)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 4. 날짜 비교 및 그룹 분류 로직
    reminders.forEach(item => {
        const targetDate = new Date(item.reminderTime);
        const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

        // 날짜 차이 계산 (일 단위)
        const diffTime = targetDayStart - todayStart;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // 시간 표시 텍스트 생성 (예: "오후 2:00")
        const timeString = targetDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        // 화면에 보여줄 객체 생성 (기본 아이템 정보 + 표시용 시간)
        const displayItem = { ...item, displayTime: timeString };

        // [필터링 로직]
        if (diffDays < 0) {
            // 과거의 리마인드는 표시하지 않음
            return;
        } else if (diffDays === 0) {
            // 오늘
            groups.today.items.push(displayItem);
        } else if (diffDays === 1) {
            // 내일
            groups.tomorrow.items.push(displayItem);
        } else if (diffDays > 1 && diffDays <= 14) { 
            // 2일 뒤 ~ 14일 뒤 (이번주/다음주)까지만 표시
            const dateStr = `${targetDate.getMonth() + 1}.${targetDate.getDate()}`;
            displayItem.displayTime = `${dateStr} (D-${diffDays})`; 
            groups.upcoming.items.push(displayItem);
        }
        // 14일 이후의 일정은 포함되지 않음
    });

    // 5. 각 그룹 내부에서 시간순 정렬 (오름차순)
    Object.values(groups).forEach(group => {
        group.items.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
    });

    // 6. 상단 배너 숫자 업데이트 (오늘 할 일 개수만 카운트)
    updateBannerCount(groups.today.items.length);

    // 7. 화면에 그리기
    container.innerHTML = '';
    
    // 오늘 -> 내일 -> 예정 순서로 그룹 렌더링
    let hasAnyItems = false;
    ['today', 'tomorrow', 'upcoming'].forEach(key => {
        const group = groups[key];
        // 해당 그룹에 아이템이 하나라도 있을 때만 화면에 그리기
        if (group.items.length > 0) {
            renderGroup(container, group);
            hasAnyItems = true;
        }
    });

    // 필터링 결과 표시할 리마인드가 하나도 없는 경우 (모두 과거이거나 2주 뒤인 경우)
    if (!hasAnyItems) {
        container.innerHTML = `
            <div style="text-align:center; padding: 60px 0; color:#fff;">
                <p style="opacity: 0.7;">2주 이내에 예정된 리마인드가 없습니다.</p>
            </div>`;
    }
}

/**
 * 특정 그룹(오늘/내일/예정)의 HTML을 생성하여 컨테이너에 추가하는 함수
 */
function renderGroup(container, group) {
    let itemsHTML = '';
    
    group.items.forEach(item => {
        // URL에서 도메인만 추출 (예: https://naver.com -> naver.com)
        let hostname = 'No link';
        try { if (item.url) hostname = new URL(item.url).hostname; } catch (e) {}

        itemsHTML += `
            <div class="reminder-item" onclick="goToDetail(${item.id})" style="cursor: pointer;">
                <div class="item-left">
                    <div class="item-icon">
                        <i class="fa-solid fa-bell" style="line-height:44px; display:block; text-align:center; color:#ddd;"></i>
                    </div>
                    <div class="item-info">
                        <span class="item-time" style="color:${group.color === 'pink' ? '#ff6b6b' : '#3b82f6'}">
                            ${item.displayTime}
                        </span>
                        <span class="item-title">${item.title}</span>
                        <span class="item-link-text">${hostname}</span>
                    </div>
                </div>
                <div class="item-right">
                    ${item.url ? `
                    <a href="${item.url}" class="item-action" target="_blank" onclick="event.stopPropagation()">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> 원본 글 보기
                    </a>` : ''}
                </div>
            </div>
        `;
    });

    // 그룹 헤더와 아이템 리스트 합치기
    const groupHTML = `
        <div class="timeline-group">
            <div class="date-header">
                <div class="dot-wrapper ${group.color}">
                    <div class="dot ${group.color}"></div>
                </div>
                <span>${group.label}</span>
            </div>
            <div class="timeline-items">
                ${itemsHTML}
            </div>
        </div>
    `;

    container.innerHTML += groupHTML;
}

/**
 * 상단 파란색 배너의 텍스트와 카운트를 업데이트하는 함수
 */
function updateBannerCount(count) {
    const bannerTitle = document.querySelector('.notification-banner h2');
    const bannerDesc = document.querySelector('.notification-banner p');
    
    if (bannerTitle) {
        if (count > 0) {
            bannerTitle.innerHTML = `오늘 마감되는 글 <span style="color:#ffeb3b">${count}건</span>이 있어요`;
            if (bannerDesc) bannerDesc.innerText = "미루지 말고 오늘 읽어서 지식을 내 것으로 만드세요.";
        } else {
            bannerTitle.innerText = "오늘 마감되는 글이 없습니다 👏";
            if (bannerDesc) bannerDesc.innerText = "여유로운 하루네요! 미리 읽을 거리가 있는지 찾아볼까요?";
        }
    }
}

/**
 * 카드 클릭 시 상세 페이지로 이동하는 함수
 */
function goToDetail(id) {
    localStorage.setItem('currentBookmarkId', id);
    localStorage.setItem('previousPage', 'reminder'); // "리마인드 페이지에서 왔음" 표시
    localStorage.setItem('editMode', 'false');
    // 경로가 폴더 구조에 따라 다를 수 있음 (예: ../detail/detail.html)
    window.location.href = `../bookmarkContent/bookmarkContent.html?id=${id}`;
}