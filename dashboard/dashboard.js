// =============================
// 1. 초기 데이터 및 로컬 스토리지 관리
// =============================
const initialDashboardData = [];

// [시스템 기준 날짜 설정] 2025-12-18
const SYSTEM_NOW = new Date("2025-12-18T13:54:00"); 

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
// 2. 핵심 기능 (삭제, 별표 토글)
// =============================
function deleteBookmark(id) {
    if (!confirm('정말로 이 북마크를 삭제하시겠습니까?')) return;
    const allData = getDashboardData();
    const filtered = allData.filter(item => item.id !== id);
    saveDashboardData(filtered);
    
    // 삭제 후 현재 검색어 상태를 유지하며 다시 렌더링
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

// [추가] 실시간 검색 처리 함수
function handleSearch(query) {
    const allData = getDashboardData();
    const lowerQuery = query.toLowerCase();
    
    // 제목 또는 태그에 검색어가 포함된 항목 필터링
    const filtered = allData.filter(item => 
        (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
        (item.tag && item.tag.toLowerCase().includes(lowerQuery))
    );
    
    // 필터링된 결과 렌더링 (최신순 정렬 후 최대 6개)
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
        const activeClass = item.isStarred ? 'active' : '';
        const starIconClass = item.isStarred ? 'fa-solid' : 'fa-regular';
        const starColor = item.isStarred ? '#facc15' : '#ccc';
        const unreadBadge = !item.isRead ? '<div class="unread-dot"></div>' : '';
        const bgStyle = item.image ? `background-image: url('${item.image}'); background-size: cover; background-position: center;` : `background-color: ${item.bgColor || '#eee'};`;
        const reminderBadge = item.reminderTime ? `<div style="width: 28px; height: 28px; background-color: rgba(255, 255, 255, 0.90); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><i class="fa-solid fa-bell" style="color: #3182F6; font-size: 13px;"></i></div>` : '';

        let summaryTag = `<span class="summary-tag" style="color: #555;">요약하기</span>`;
          
        card.innerHTML = `
            <div class="card-img" style="${bgStyle} height: 160px; position: relative; padding: 12px; display: flex; justify-content: space-between;">
                <div style="display: flex; gap: 6px;">${unreadBadge}${reminderBadge}</div>
                <div style="display: flex; gap: 8px; align-items: center;">${summaryTag}<div class="card-delete-btn"><i class="fa-solid fa-trash-can"></i></div></div>
            </div>
            <div class="card-body">
                <h4 class="card-title">${item.title || ''}</h4>
                <div class="card-footer">
                    <span class="tag-badge" style="background-color: ${item.tagColor || '#555'}">#${item.tag || ''}</span>
                    <div class="date-star"><span>${item.date || ''}</span><i class="star-btn ${starIconClass} fa-star ${activeClass}" style="color: ${starColor};"></i></div>
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
    const reminders = bookmarks.filter(item => item.reminderTime && !item.isRead);
    
    if (reminders.length === 0) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; color: #ccc;">
                <i class="fa-regular fa-bell-slash" style="font-size: 30px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="font-size: 13px;">예정된 리마인드가 없습니다.</p>
            </div>`;
        return;
    }

    const todayStart = new Date(SYSTEM_NOW.getFullYear(), SYSTEM_NOW.getMonth(), SYSTEM_NOW.getDate());
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

    container.innerHTML = '';
    if (groups.today.length > 0) container.innerHTML += createSidebarGroupHTML('오늘', 'blue', groups.today);
    if (groups.tomorrow.length > 0) container.innerHTML += createSidebarGroupHTML('내일', 'yellow', groups.tomorrow);
    if (groups.upcoming.length > 0) container.innerHTML += createSidebarGroupHTML('예정', 'gray', groups.upcoming, true);
}

function createSidebarGroupHTML(label, color, items, showDate = false) {
    const listHTML = items.map(item => `
        <div class="reminder-item" onclick="location.href='../bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard'" style="cursor: pointer;">
            <span class="time">${showDate ? item.displayDate + ' ' : ''}${item.displayTime}</span>
            <span class="task" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</span>
        </div>
    `).join('');
    const dotStyle = color === 'gray' ? 'style="background-color: #ccc"' : '';
    const dotClass = color !== 'gray' ? `dot ${color}` : 'dot';
    return `<div class="day-group"><div class="day-label"><span class="${dotClass}" ${dotStyle}></span> ${label}</div>${listHTML}</div>`;
}

function renderSidebarTags(tagDataArray) {
    const cloudContainer = document.querySelector('.tag-cloud');
    if (!cloudContainer) return;
    const sortedTags = tagDataArray.slice(0, 5);
    cloudContainer.innerHTML = '';
    
    if (sortedTags.length === 0) {
        cloudContainer.innerHTML = `
            <div style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 0; color: #ccc;">
                <i class="fa-solid fa-tags" style="font-size: 24px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="font-size: 12px;">아직 사용된 태그가 없습니다.</p>
            </div>`;
        return;
    }
    
    sortedTags.forEach((tagData) => {
        const tagName = tagData.name;
        const storedTags = getTagList();
        const tagInfo = storedTags.find(t => t.name === tagName);
        const bgColor = tagInfo ? tagInfo.color : '#555';
        const span = document.createElement('span');
        span.className = 'tag-pill';
        span.textContent = `#${tagName}`;
        span.style.backgroundColor = bgColor;
        span.style.cursor = 'pointer';
        span.onclick = () => { window.location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tagName)}`; };
        cloudContainer.appendChild(span);
    });
}

function updateDashboardStats() {
    const bookmarks = getDashboardData();
    const todayStr = `${SYSTEM_NOW.getFullYear()}.${String(SYSTEM_NOW.getMonth() + 1).padStart(2, '0')}.${String(SYSTEM_NOW.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(SYSTEM_NOW);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}.${String(yesterday.getMonth() + 1).padStart(2, '0')}.${String(yesterday.getDate()).padStart(2, '0')}`;

    const todaySavedEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
    const todayDescEl = document.querySelector('.stat-card:nth-child(1) .stat-desc');
    if (todaySavedEl) {
        const todayCount = bookmarks.filter(item => item.date === todayStr).length;
        todaySavedEl.innerHTML = `${todayCount} <span class="unit">건</span>`;
        if (todayDescEl) {
            if (bookmarks.length === 0) todayDescEl.textContent = "첫 북마크를 추가해보세요!";
            else {
                const yesterdayCount = bookmarks.filter(item => item.date === yesterdayStr).length;
                if (todayCount > yesterdayCount) todayDescEl.textContent = `어제보다 ${todayCount - yesterdayCount}건 더 많이 저장됨`;
                else todayDescEl.textContent = `어제와 동일한 양을 저장함`;
            }
        }
    }

    const reminderValueEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
    const reminderDescEl = document.querySelector('.stat-card:nth-child(2) .stat-desc');
    if (reminderValueEl) {
        const totalCount = bookmarks.filter(item => item.reminderTime && !item.isRead).length;
        reminderValueEl.innerHTML = `${totalCount} <span class="unit">건</span>`;
        const todayDue = bookmarks.filter(item => {
            if (!item.reminderTime || item.isRead) return false;
            const d = new Date(item.reminderTime);
            return d.getFullYear() === SYSTEM_NOW.getFullYear() && d.getMonth() === SYSTEM_NOW.getMonth() && d.getDate() === SYSTEM_NOW.getDate();
        }).length;
        if (reminderDescEl) reminderDescEl.textContent = `오늘 마감되는 항목 ${todayDue}건`;
    }

    const tagAnalysis = {};
    bookmarks.forEach(item => {
        if (item.tag) {
            if (!tagAnalysis[item.tag]) { tagAnalysis[item.tag] = { count: 0, latestId: 0 }; }
            tagAnalysis[item.tag].count += 1;
            if (item.id > tagAnalysis[item.tag].latestId) { tagAnalysis[item.tag].latestId = item.id; }
        }
    });

    const sortedTagArray = Object.entries(tagAnalysis).map(([name, data]) => ({
        name, ...data
    })).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.latestId - a.latestId;
    });

   const topTagEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
    const topTagDescEl = document.querySelector('.stat-card:nth-child(3) .stat-desc');
    
    if (topTagEl && topTagDescEl) {
        if (sortedTagArray.length > 0) {
            // 1. 북마크(태그)가 있을 때
            const maxCount = sortedTagArray[0].count;
            const jointCount = sortedTagArray.filter(t => t.count === maxCount).length - 1;
            const plusBadge = jointCount > 0 ? `<span class="badge" style="background:#eee; color:#666; margin-left:5px;">+${jointCount}</span>` : '';
            
            const topTagName = sortedTagArray[0].name;
            topTagEl.innerHTML = `${topTagName} <span class="badge">Top 1</span> ${plusBadge}`;
            topTagEl.style.cursor = "pointer";
            topTagEl.onclick = () => { window.location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(topTagName)}`; };
            
            // 문구 변경: 현재 가장 많이 사용 중인 태그
            topTagDescEl.textContent = "현재 가장 많이 사용 중인 태그";
        } else {
            // 2. 북마크가 하나도 없을 때
            topTagEl.innerHTML = `없음 <span class="badge" style="background:#eee; color:#999;">-</span>`;
            topTagEl.style.cursor = "default";
            topTagEl.onclick = null;
            
            // 문구 변경: 태그를 사용하여 분류해보세요
            topTagDescEl.textContent = "태그를 사용하여 분류해보세요";
        }
    }
    const weeklyRateEl = document.querySelector('.stat-card:nth-child(4) .stat-value');
    const weeklyDescEl = document.querySelector('.stat-card:nth-child(4) .stat-desc');
    if (weeklyRateEl) {
        const totalItems = bookmarks.length;
        if (totalItems === 0) {
            weeklyRateEl.innerHTML = `0 <span class="unit">%</span>`;
            if (weeklyDescEl) weeklyDescEl.textContent = "읽기 습관을 시작해보세요";
        } else {
            const readItems = bookmarks.filter(item => item.isRead).length;
            const rate = Math.round((readItems / totalItems) * 100);
            weeklyRateEl.innerHTML = `${rate} <span class="unit">%</span>`;
            if (weeklyDescEl) {
                if (rate === 0) weeklyDescEl.textContent = "아직 읽은 글이 없어요";
                else if (rate === 100) weeklyDescEl.textContent = "모든 글을 읽었습니다! 완벽해요";
                else weeklyDescEl.textContent = "차근차근 읽어가는 중이에요";
            }
        }
    }
    renderSidebarTags(sortedTagArray);
}

// =============================
// 4. 리마인드 설정 헬퍼 함수
// =============================
function setReminderDate(date) {
    const hiddenDateInput = document.getElementById('newReminderDate');
    const dateDisplay = document.getElementById('dateDisplay');
    const isoStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    hiddenDateInput.value = isoStr;
    dateDisplay.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function setActiveQuickBtn(activeBtn) {
    document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

// =============================
// 5. 모달 및 이벤트 실행
// =============================
document.addEventListener('DOMContentLoaded', () => {
    const allData = getDashboardData();
    renderCards(allData.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6));
    renderSidebarReminders();
    updateDashboardStats();

    // [수정] 실시간 검색 기능 구현 (input 이벤트 사용)
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query === "") {
                // 검색어가 없으면 다시 최신 목록 6개 표시
                const currentData = getDashboardData();
                currentData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                renderCards(currentData.slice(0, 6));
            } else {
                // 실시간 필터링 실행
                handleSearch(query);
            }
        });
        
        // 엔터 시 검색 결과 페이지 이동 로직도 유지
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `../bookmark/bookmark.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    const addModal = document.getElementById('addBookmarkModal');
    const newTagInput = document.getElementById('newTagInput');
    const tagSelectionContainer = document.getElementById('tagSelectionContainer');
    const saveNewBtn = document.getElementById('saveNewBookmarkBtn');
    const reminderToggle = document.getElementById('newReminderToggle');
    const reminderOptions = document.getElementById('newReminderOptions');
    const hiddenDateInput = document.getElementById('newReminderDate');
    const dateDisplay = document.getElementById('dateDisplay');

    function loadTagsAsChips() {
        if (!tagSelectionContainer) return;
        const tags = getTagList();
        tagSelectionContainer.innerHTML = '';
        tags.forEach(tag => {
            const chip = document.createElement('div');
            chip.className = 'choice-tag';
            chip.textContent = `#${tag.name}`;
            chip.style.backgroundColor = tag.color;
            chip.onclick = () => {
                const isSelected = chip.classList.contains('selected');
                document.querySelectorAll('.choice-tag').forEach(c => c.classList.remove('selected'));
                if (isSelected) { if(newTagInput) newTagInput.value = ''; chip.classList.remove('selected'); }
                else { if(newTagInput) newTagInput.value = tag.name.toUpperCase(); chip.classList.add('selected'); }
            };
            tagSelectionContainer.appendChild(chip);
        });
    }

    document.getElementById('openAddModalBtn')?.addEventListener('click', () => {
        document.getElementById('newUrl').value = '';
        document.getElementById('newTitle').value = '';
        document.getElementById('newContent').value = '';
        document.getElementById('newMemo').value = '';
        newTagInput.value = '';
        reminderToggle.checked = false;
        reminderOptions.style.display = 'none';
        hiddenDateInput.value = '';
        dateDisplay.textContent = '직접 날짜 / 시간 선택하기';
        document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
        loadTagsAsChips();
        addModal.style.display = 'flex';
    });

    document.querySelector('.close-modal')?.addEventListener('click', () => { addModal.style.display = 'none'; });

    reminderToggle?.addEventListener('change', (e) => { reminderOptions.style.display = e.target.checked ? 'block' : 'none'; });

    document.getElementById('btnTomorrow')?.addEventListener('click', (e) => {
        const d = new Date(SYSTEM_NOW); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
        setReminderDate(d); setActiveQuickBtn(e.currentTarget);
    });

    document.getElementById('btnWeekend')?.addEventListener('click', (e) => {
        const d = new Date(SYSTEM_NOW); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7 || 7); d.setHours(10, 0, 0, 0);
        setReminderDate(d); setActiveQuickBtn(e.currentTarget);
    });

    document.getElementById('btnNextWeek')?.addEventListener('click', (e) => {
        const d = new Date(SYSTEM_NOW); d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7) + 7); d.setHours(9, 0, 0, 0);
        setReminderDate(d); setActiveQuickBtn(e.currentTarget);
    });

    document.getElementById('calendarTrigger')?.addEventListener('click', () => hiddenDateInput.showPicker());
    hiddenDateInput?.addEventListener('change', (e) => {
        const d = new Date(e.target.value);
        dateDisplay.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
    });

    if (saveNewBtn) {
        saveNewBtn.addEventListener('click', () => {
            const title = document.getElementById('newTitle').value.trim();
            if (!title) { alert('제목을 입력해주세요.'); return; }
            const tagName = newTagInput.value.trim().toUpperCase() || 'ETC';
            const existingTags = getTagList();
            let tagColor = '#555';
            let tagDotColor = '#888888'; 
            let tagObj = existingTags.find(t => t.name === tagName);
            
            if (!tagObj && tagName !== 'ETC') {
                const colorPalette = [
                    { bg: "#FF02024D", dot: "#FF0202" }, { bg: "#FF77004D", dot: "#FF7700" },
                    { bg: "#FFE5004D", dot: "#FFE500" }, { bg: "#0E9E294D", dot: "#0E9E29" },
                    { bg: "#3D98FA4D", dot: "#3D98FA" }, { bg: "#E250CF4D", dot: "#E250CF" },
                    { bg: "#8888884D", dot: "#888888" }
                ];
                const randChoice = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                tagColor = randChoice.bg;
                tagDotColor = randChoice.dot;
                
                tagObj = { id: Date.now(), name: tagName, color: tagColor, dotColor: tagDotColor };
                existingTags.push(tagObj);
                saveTagList(existingTags);
            } else if (tagObj) { tagColor = tagObj.color; }

            const newBookmark = {
                id: Date.now(), title, tag: tagName, tagColor,
                date: `${SYSTEM_NOW.getFullYear()}.${String(SYSTEM_NOW.getMonth() + 1).padStart(2, '0')}.${String(SYSTEM_NOW.getDate()).padStart(2, '0')}`,
                bgColor: '#f0f2f5', isStarred: false, isRead: false,
                hasSummary: false, // 요약 기능 미구현 고정
                content: document.getElementById('newContent').value,
                memo: document.getElementById('newMemo').value,
                reminderTime: reminderToggle.checked && hiddenDateInput.value ? new Date(hiddenDateInput.value).toISOString() : null
            };

            const data = getDashboardData(); data.unshift(newBookmark); saveDashboardData(data);
            renderCards(data.slice(0, 6)); renderSidebarReminders(); updateDashboardStats();
            addModal.style.display = 'none';
        });
    }
});