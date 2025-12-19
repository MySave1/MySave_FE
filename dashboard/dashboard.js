// =============================
// 1. 초기 데이터 및 로컬 스토리지 관리
// =============================
const initialDashboardData = [];

// 고정된 날짜 대신 실시간 현재 날짜 사용 함수
function getNow() {
    return new Date();
}

function getDashboardData() {
    const stored = localStorage.getItem('bookmarks');
    if (!stored) {
        localStorage.setItem('bookmarks', JSON.stringify(initialDashboardData));
        return initialDashboardData;
    }
    try { return JSON.parse(stored); } catch (e) { return initialDashboardData; }
}

function saveDashboardData(newData) {
    localStorage.setItem('bookmarks', JSON.stringify(newData));
}

function getTagList() {
    const stored = localStorage.getItem('myTagList');
    return stored ? JSON.parse(stored) : [];
}

function saveTagList(tags) {
    localStorage.setItem('myTagList', JSON.stringify(tags));
}

// =============================
// 2. 핵심 기능 (삭제, 별표 토글, 검색)
// =============================
function deleteBookmark(id) {
    if (!confirm('정말로 이 북마크를 삭제하시겠습니까?')) return;
    const allData = getDashboardData();
    const filtered = allData.filter(item => item.id !== id);
    saveDashboardData(filtered);
    
    const searchInput = document.querySelector('.search-container input');
    if (searchInput && searchInput.value.trim() !== "") {
        handleSearch(searchInput.value.trim());
    } else {
        const currentData = getDashboardData();
        currentData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        renderCards(currentData.slice(0, 6));
    }
    
    renderSidebarReminders();
    updateDashboardStats();
}

function toggleStar(element, id) {
    const allData = getDashboardData();
    const targetItem = allData.find(item => item.id === id);
    if (!targetItem) return;
    targetItem.isStarred = !targetItem.isStarred;
    saveDashboardData(allData);
    if (targetItem.isStarred) {
        element.classList.remove('fa-regular');
        element.classList.add('fa-solid', 'active');
        element.style.color = '#facc15';
    } else {
        element.classList.remove('fa-solid', 'active');
        element.classList.add('fa-regular');
        element.style.color = '#ccc';
    }
    updateDashboardStats();
}

function handleSearch(query) {
    const allData = getDashboardData();
    const lowerQuery = query.toLowerCase();
    const filtered = allData.filter(item => 
        (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
        (item.tag && item.tag.toLowerCase().includes(lowerQuery))
    );
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    renderCards(filtered.slice(0, 6));
}

// =============================
// 3. 렌더링 함수 (카드, 리마인드, 태그)
// =============================

function renderCards(data) {
    const cardContainer = document.getElementById('cardContainer');
    if (!cardContainer) return;
    cardContainer.innerHTML = '';
    
    if (data.length === 0) {
        cardContainer.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 0; color: #bbb;">
                <i class="fa-regular fa-folder-open" style="font-size: 40px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p style="font-size: 14px;">검색 결과가 없거나 저장된 북마크가 없습니다.</p>
            </div>`;
        return;
    }

    data.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'card';
        if (item.tag !== '기초웹') {
            card.style.border = 'none';
            card.style.boxShadow = 'none';
        }
        const starIconClass = item.isStarred ? 'fa-solid' : 'fa-regular';
        const starColor = item.isStarred ? '#facc15' : '#ccc';
        const unreadBadge = !item.isRead ? '<div class="unread-dot"></div>' : '';
        const bgStyle = item.image ? `background-image: url('${item.image}'); background-size: cover; background-position: center;` : `background-color: ${item.bgColor || '#eee'};`;
        const reminderBadge = item.reminderTime ? `<div style="width: 28px; height: 28px; background-color: rgba(255, 255, 255, 0.90); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><i class="fa-solid fa-bell" style="color: #3182F6; font-size: 13px;"></i></div>` : '';

        card.innerHTML = `
            <div class="card-img" style="${bgStyle} height: 160px; position: relative; padding: 12px; display: flex; justify-content: space-between;">
                <div style="display: flex; gap: 6px;">${unreadBadge}${reminderBadge}</div>
                <div style="display: flex; gap: 8px; align-items: center;"><span class="summary-tag" style="color: #555;">요약하기</span><div class="card-delete-btn"><i class="fa-solid fa-trash-can"></i></div></div>
            </div>
            <div class="card-body">
                <h4 class="card-title">${item.title || ''}</h4>
                <div class="card-footer">
                    <span class="tag-badge" style="background-color: ${item.tagColor || '#555'}">#${item.tag || ''}</span>
                    <div class="date-star"><span>${item.date || ''}</span><i class="star-btn ${starIconClass} fa-star" style="color: ${starColor};"></i></div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            localStorage.setItem('currentBookmarkId', item.id);
            window.location.href = `../bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard`;
        });

        card.querySelector('.star-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleStar(e.target, item.id); });
        card.querySelector('.card-delete-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteBookmark(item.id); });
        cardContainer.appendChild(card);
    });
}

function renderSidebarReminders() {
    const container = document.getElementById('sidebarReminderList');
    if (!container) return;

    const bookmarks = getDashboardData();
    let reminders = bookmarks.filter(item => item.reminderTime && !item.isRead);

    if (reminders.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px 0; color: #ccc;"><p>예정된 리마인드가 없습니다.</p></div>`;
        return;
    }

    reminders.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));

    const now = getNow();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const groups = { today: [], tomorrow: [], upcoming: [] };

    reminders.forEach(item => {
        const itemDate = new Date(item.reminderTime);
        const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const diffDays = Math.round((itemDayStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        
        item.displayTime = itemDate.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
        item.displayDate = `${itemDate.getMonth() + 1}월 ${itemDate.getDate()}일`;

        if (diffDays === 0) groups.today.push(item);
        else if (diffDays === 1) groups.tomorrow.push(item);
        else if (diffDays > 1) groups.upcoming.push(item);
    });

    let finalHTML = '';
    if (groups.today.length > 0) finalHTML += createSidebarGroupHTML('오늘', 'blue', groups.today.slice(0, 4));
    if (groups.tomorrow.length > 0) finalHTML += createSidebarGroupHTML('내일', 'yellow', groups.tomorrow.slice(0, 4));
    if (groups.upcoming.length > 0) finalHTML += createSidebarGroupHTML('예정', 'gray', groups.upcoming.slice(0, 4), true);

    container.innerHTML = finalHTML;
}

function createSidebarGroupHTML(label, color, items, showDate = false) {
    const listHTML = items.map(item => `
        <div class="reminder-item" onclick="location.href='../bookmarkContent/bookmarkContent.html?id=${item.id}'" style="cursor: pointer;">
            <span class="time">${showDate ? item.displayDate + ' ' : ''}${item.displayTime}</span>
            <span class="task">${item.title}</span>
        </div>
    `).join('');
    return `<div class="day-group"><div class="day-label"><span class="dot ${color}"></span> ${label}</div>${listHTML}</div>`;
}

function renderSidebarTags(tagDataArray) {
    const cloudContainer = document.querySelector('.tag-cloud');
    if (!cloudContainer) return;
    const sortedTags = tagDataArray.slice(0, 5);
    cloudContainer.innerHTML = '';
    
    sortedTags.forEach((tagData) => {
        const storedTags = getTagList();
        const tagInfo = storedTags.find(t => t.name === tagData.name);
        const span = document.createElement('span');
        span.className = 'tag-pill';
        span.textContent = `#${tagData.name}`;
        span.style.backgroundColor = tagInfo ? tagInfo.color : '#555';
        span.onclick = () => { window.location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tagData.name)}`; };
        cloudContainer.appendChild(span);
    });
}

function updateDashboardStats() {
    const bookmarks = getDashboardData();
    const now = getNow();
    const todayStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    const todaySavedEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (todaySavedEl) {
        const todayCount = bookmarks.filter(item => item.date === todayStr).length;
        todaySavedEl.innerHTML = `${todayCount} <span class="unit">건</span>`;
    }

    const tagAnalysis = {};
    bookmarks.forEach(item => {
        if (item.tag) {
            tagAnalysis[item.tag] = (tagAnalysis[item.tag] || 0) + 1;
        }
    });

    const sortedTagArray = Object.entries(tagAnalysis)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    renderSidebarTags(sortedTagArray);
}

// =============================
// 4. 리마인드 설정 헬퍼 함수
// =============================
function setReminderDate(date) {
    const hiddenDateInput = document.getElementById('newReminderDate');
    const dateDisplay = document.getElementById('dateDisplay');
    const isoStr = date.toISOString().slice(0, 16);
    hiddenDateInput.value = isoStr;
    dateDisplay.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// =============================
// 5. 모달 및 이벤트 실행
// =============================
document.addEventListener('DOMContentLoaded', () => {
    const allData = getDashboardData();
    renderCards(allData.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6));
    renderSidebarReminders();
    updateDashboardStats();

    const saveNewBtn = document.getElementById('saveNewBookmarkBtn');
    const addModal = document.getElementById('addBookmarkModal');
    const newTagInput = document.getElementById('newTagInput');

    // URL 자동 보정 로직 포함된 저장 버튼
    if (saveNewBtn) {
        saveNewBtn.addEventListener('click', () => {
            const title = document.getElementById('newTitle').value.trim();
            let url = document.getElementById('newUrl').value.trim();

            if (!title || !url) { 
                alert('제목과 URL을 모두 입력해주세요.'); 
                return; 
            }

            // URL 보정 로직
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            const tagName = newTagInput.value.trim().toUpperCase() || 'ETC';
            const existingTags = getTagList();
            let tagColor = '#555';
            let tagObj = existingTags.find(t => t.name === tagName);
            
            if (!tagObj && tagName !== 'ETC') {
                const colorPalette = [
                    { bg: "#FF02024D", dot: "#FF0202" }, 
                    { bg: "#3D98FA4D", dot: "#3D98FA" }
                ];
                const rand = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                tagObj = { id: Date.now(), name: tagName, color: rand.bg, dotColor: rand.dot };
                existingTags.push(tagObj);
                saveTagList(existingTags);
                tagColor = rand.bg;
            } else {
                tagColor = tagObj ? tagObj.color : '#555';
            }

            const now = getNow();
            const newBookmark = {
                id: Date.now(), 
                title, 
                tag: tagName, 
                tagColor,
                url: url,
                date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
                bgColor: '#f0f2f5', 
                isStarred: false, 
                isRead: false,
                content: document.getElementById('newContent').value,
                memo: document.getElementById('newMemo').value,
                reminderTime: document.getElementById('newReminderToggle').checked ? new Date(document.getElementById('newReminderDate').value).toISOString() : null
            };

            const data = getDashboardData(); 
            data.unshift(newBookmark); 
            saveDashboardData(data);
            renderCards(data.slice(0, 6)); 
            renderSidebarReminders(); 
            updateDashboardStats();
            addModal.style.display = 'none';
        });
    }

    // 리마인드 퀵 버튼 (오늘 날짜 기준)
    document.getElementById('btnTomorrow')?.addEventListener('click', () => {
        const d = getNow(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
        setReminderDate(d);
    });
});