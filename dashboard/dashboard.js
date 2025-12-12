// =============================
// 1. 초기 데이터
// =============================
const initialDashboardData = [
    { 
        id: 1, 
        title: "React 19의 새로운 기능 완벽 정리", 
        tag: "Dev", 
        tagColor: "#3b5998", 
        date: "2025.11.30", 
        bgColor: "#ffb3b3",
        isStarred: true, 
        isRead: false, 
        hasSummary: true, 
        content: "React 19의 새로운 기능인 Actions와 Compiler에 대해 알아봅니다.", 
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop"
    },
    { 
        id: 2, 
        title: "2025 AI 디자인 트렌드 분석 리포트", 
        tag: "Design", 
        tagColor: "#E91E63", 
        date: "2025.11.20", 
        bgColor: "#cce0ff",
        isStarred: false, 
        isRead: true, 
        hasSummary: false, 
        content: "AI 툴의 발전으로 인한 디자인 프로세스 혁신에 대해 다룹니다.", 
        image: "" 
    },
    { 
        id: 3, 
        title: "효율적인 팀 커뮤니케이션 가이드", 
        tag: "Work", 
        tagColor: "#475569", 
        date: "2025.11.15", 
        bgColor: "#b3e6b3",
        isStarred: true, 
        isRead: true, 
        hasSummary: true, 
        content: "비동기 커뮤니케이션의 핵심은 명확한 문서화입니다.", 
        image: null
    },
    {
        id: 4,
        title: "프론트엔드 성능 최적화 베스트 프랙티스",
        tag: "Dev",
        tagColor: "#3b5998",
        date: "2025.11.20",
        bgColor: "#ffdbb3",
        isStarred: false,
        isRead: false,
        hasSummary: true,
        content: "Lighthouse 점수를 올리기 위한 이미지 최적화 및 코드 스플리팅 기법.",
        image: null
    },
    {
        id: 5,
        title: "UX 심리학: 사용자를 사로잡는 법칙들",
        tag: "Design",
        tagColor: "#3b5998",
        date: "2025.11.19",
        bgColor: "#e6e6e6",
        isStarred: false,
        isRead: false,
        hasSummary: false,
        content: "제이콥의 법칙: 사용자는 다른 사이트에서 겪은 경험을 기대한다.",
        image: null
    }
];

// =============================
// 2. 로컬 스토리지 접근 함수
// =============================
function getDashboardData() {
    const stored = localStorage.getItem('bookmarks');
    if (!stored) {
        localStorage.setItem('bookmarks', JSON.stringify(initialDashboardData));
        return initialDashboardData;
    }
    return JSON.parse(stored);
}

function saveDashboardData(newData) {
    localStorage.setItem('bookmarks', JSON.stringify(newData));
}

// =============================
// 3. 삭제 기능 (데이터 및 화면 갱신)
// =============================
function deleteBookmark(id) {
    if (!confirm('정말로 이 북마크를 삭제하시겠습니까?')) {
        return;
    }
    
    let allData = getDashboardData();
    const filtered = allData.filter(item => item.id !== id);
    saveDashboardData(filtered);
    
    // 화면 갱신을 위해 현재 검색 상태를 확인
    const searchInput = document.querySelector('.search-container input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (keyword) {
        // 검색 중이면 검색 결과만 다시 표시
        const searchFiltered = filtered.filter(item => 
            item.title.toLowerCase().includes(keyword) || 
            item.tag.toLowerCase().includes(keyword)
        );
        renderCards(searchFiltered);
    } else {
        // 검색 중이 아니면 최신 6개 표시 (대시보드 기준)
        filtered.sort((a, b) => b.date.localeCompare(a.date));
        renderCards(filtered.slice(0, 6));
    }
    
    // 사이드바와 통계도 갱신
    renderSidebarReminders();
    updateDashboardStats();

    alert("삭제가 완료되었습니다.");
}

// =============================
// 4. 카드 렌더링
// =============================
function renderCards(data) {
    const cardContainer = document.getElementById('cardContainer');
    if (!cardContainer) return;
    
    cardContainer.innerHTML = ''; 
    data.forEach((item) => {
        const activeClass = item.isStarred ? 'active' : '';
        const starIconClass = item.isStarred ? 'fa-solid' : 'fa-regular';
        const starColor = item.isStarred ? '#facc15' : '#ccc';
        const unreadBadge = !item.isRead ? '<div class="unread-dot"></div>' : '';

        const imageContent = item.image 
            ? `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover; border-radius: inherit;">` 
            : '<span class="summary-tag">요약됨</span>';

        const reminderBadge = item.reminderTime 
            ? `
            <div style="
                position: absolute; 
                top: 10px; 
                left: 10px; 
                width: 28px; 
                height: 28px; 
                background-color: rgba(255, 255, 255, 0.95); 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.15); 
                z-index: 10;
            " title="리마인드 설정됨">
                <i class="fa-solid fa-bell" style="color: #3182F6; font-size: 13px;"></i>
            </div>`
            : '';

        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-img" style="background-color: ${item.bgColor || '#eee'}; position: relative;">
                ${reminderBadge} ${unreadBadge}
                ${imageContent}
            </div>

            <button class="card-delete-btn" title="삭제">
                <i class="fa-solid fa-trash-can"></i>
            </button>

            <div class="card-body">
                <h4 class="card-title">${item.title}</h4>
                <div class="card-footer">
                    <span class="tag-badge" style="background-color: ${item.tagColor}">#${item.tag}</span>
                    <div class="date-star">
                        <span style="color: #888; font-size: 13px;">${item.date}</span>
                        
                        <i class="star-btn ${starIconClass} fa-star ${activeClass}" style="color: ${starColor}; cursor: pointer;"></i>
                    </div>
                </div>
            </div>
        `;

        // 카드 클릭 이벤트
        card.addEventListener('click', () => {
            if (!item.isRead) {
                const allData = getDashboardData();
                const target = allData.find(d => d.id === item.id);
                if (target) {
                    target.isRead = true;
                    saveDashboardData(allData);
                }
            }
            localStorage.setItem('currentBookmarkId', item.id);
            localStorage.setItem('previousPage', 'dashboard');
            localStorage.setItem('editMode', 'false');
            window.location.href = `/bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard`;
        });

        // ⭐ 별표 클릭 이벤트 (이동 방지)
        const starBtn = card.querySelector('.star-btn');
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStar(starBtn, item.id);
        });

        // ⭐ 삭제 버튼 클릭 이벤트
        const deleteBtn = card.querySelector('.card-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 방지
            deleteBookmark(item.id); // 전역 deleteBookmark 함수 호출
        });

        cardContainer.appendChild(card);
    });
}

// 5. 별표 토글 (기존 코드 유지)
function toggleStar(element, id) {
    const allData = getDashboardData();
    const targetItem = allData.find(item => item.id === id);
    
    if (targetItem) {
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
    }
    // 갱신 후 통계 업데이트
    updateDashboardStats();
}

// 6. 사이드바 리마인드 렌더링 함수 (기존 코드 유지)
function renderSidebarReminders() {
    const container = document.getElementById('sidebarReminderList');
    if (!container) return; 

    const bookmarks = getDashboardData();
    const reminders = bookmarks.filter(item => item.reminderTime);

    if (reminders.length === 0) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: #aaa; font-size: 13px;">예정된 리마인드가 없습니다.</div>`;
        return;
    }

    const groups = { today: [], tomorrow: [] };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    reminders.forEach(item => {
        const tDate = new Date(item.reminderTime);
        const tStart = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        const diffDays = Math.ceil((tStart - todayStart) / (1000 * 60 * 60 * 24));
        
        item.displayTime = tDate.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

        if (diffDays === 0) groups.today.push(item);
        else if (diffDays === 1) groups.tomorrow.push(item);
    });

    groups.today.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
    groups.tomorrow.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));

    container.innerHTML = '';
    
    if (groups.today.length > 0) {
        container.innerHTML += createSidebarGroupHTML('오늘', 'blue', groups.today);
    }
    if (groups.tomorrow.length > 0) {
        container.innerHTML += createSidebarGroupHTML('내일', 'yellow', groups.tomorrow);
    }

    if (groups.today.length === 0 && groups.tomorrow.length === 0) {
         container.innerHTML = `<div style="padding: 20px; text-align: center; color: #aaa; font-size: 13px;">오늘, 내일 일정이 없습니다.<br><a href="../reminder/reminder.html" style="color:#3182F6">전체 보기</a></div>`;
    }
}

// 사이드바 그룹 HTML 생성 헬퍼 (기존 코드 유지)
function createSidebarGroupHTML(label, color, items) {
    const listHTML = items.map(item => `
        <div class="reminder-item" onclick="location.href='bookmarkcontent.html?id=${item.id}&from=dashboard'" style="cursor: pointer;">
            <span class="time">${item.displayTime}</span>
            <span class="task" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</span>
        </div>
    `).join('');

    return `
        <div class="day-group">
            <div class="day-label"><span class="dot ${color}"></span> ${label}</div>
            ${listHTML}
        </div>
    `;
}


// 7. 상단 통계 카드 업데이트 함수 (기존 코드 유지)
function updateDashboardStats() {
    const totalReminderEl = document.getElementById('totalReminderCount');
    const todayReminderDescEl = document.getElementById('todayReminderDesc');
    const weeklyRateEl = document.getElementById('weeklyRate');
    const weeklyDescEl = document.getElementById('weeklyDesc');
    
    if (!totalReminderEl || !todayReminderDescEl || !weeklyRateEl || !weeklyDescEl) return;

    const bookmarks = getDashboardData();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let totalIncompleteCount = 0; 
    let todayDueCount = 0;        
    
    let totalSavedCount = bookmarks.length; 
    let totalReadCount = 0;                 

    bookmarks.forEach(item => {
        if (item.reminderTime) {
            if (!item.isRead) {
                totalIncompleteCount++; 
            }

            const targetDate = new Date(item.reminderTime);
            const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const diffDays = Math.ceil((targetDayStart - todayStart) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                todayDueCount++; 
            }
        }
        if (item.isRead) {
            totalReadCount++;
        }
    });

    totalReminderEl.textContent = totalIncompleteCount;
    todayReminderDescEl.textContent = `오늘 마감되는 항목 ${todayDueCount} 건`;

    let percentage = 0;
    if (totalSavedCount > 0) {
        percentage = Math.round((totalReadCount / totalSavedCount) * 100);
    }
    
    weeklyRateEl.textContent = percentage;
    weeklyDescEl.textContent = `전체 ${totalSavedCount}개 중 ${totalReadCount}개 읽음`;
}

// 8. 실행
document.addEventListener('DOMContentLoaded', () => {
    // 1. 초기 렌더링
    const allData = getDashboardData();
    allData.sort((a, b) => b.date.localeCompare(a.date));
    renderCards(allData.slice(0, 6));
    
    renderSidebarReminders();
    updateDashboardStats();

    // 2. 검색 기능
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            const currentData = getDashboardData();
            
            if (keyword === "") {
                // 검색어 없으면 최신순 6개 표시
                currentData.sort((a, b) => b.date.localeCompare(a.date));
                renderCards(currentData.slice(0, 6));
            } else {
                // 검색어 있으면 필터링된 결과 전부 표시
                const filtered = currentData.filter(item => 
                    item.title.toLowerCase().includes(keyword) || 
                    item.tag.toLowerCase().includes(keyword)
                );
                renderCards(filtered);
            }
        });
    }

    // 3. 모달 및 북마크 추가 기능 (기존 코드 유지)
    const addModal = document.getElementById('addBookmarkModal');
    const openModalBtn = document.getElementById('openAddModalBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const saveNewBtn = document.getElementById('saveNewBookmarkBtn');
    
    const newUrlInput = document.getElementById('newUrl');
    const newTitleInput = document.getElementById('newTitle');
    const newContentInput = document.getElementById('newContent');
    const newTagInput = document.getElementById('newTagInput');
    const newTagContainer = document.getElementById('newTagContainer');
    const newReminderToggle = document.getElementById('newReminderToggle');
    const newReminderOptions = document.getElementById('newReminderOptions');
    const newReminderDate = document.getElementById('newReminderDate');

    const calendarTrigger = document.getElementById('calendarTrigger');
    const dateDisplay = document.getElementById('dateDisplay');
    const quickBtns = document.querySelectorAll('.quick-btn');

    let currentTags = []; 

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            newUrlInput.value = '';
            newTitleInput.value = '';
            newContentInput.value = '';
            newTagInput.value = '';
            currentTags = [];
            renderNewTags();
            newReminderToggle.checked = false;
            newReminderOptions.style.display = 'none';
            newReminderDate.value = '';
            addModal.style.display = 'flex';
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            addModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === addModal) addModal.style.display = 'none';
    });

    newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !currentTags.includes(val)) {
                currentTags.push(val);
                renderNewTags();
            }
            e.target.value = '';
        }
    });

    function renderNewTags() {
        newTagContainer.innerHTML = '';
        currentTags.forEach((tag, idx) => {
            const chip = document.createElement('span');
            chip.className = 'tag-chip';
            chip.innerHTML = `#${tag} <i class="fa-solid fa-xmark" style="margin-left:4px;"></i>`;
            chip.onclick = () => {
                currentTags.splice(idx, 1);
                renderNewTags();
            };
            newTagContainer.appendChild(chip);
        });
    }

    function formatDateTime(date) {
        const offset = date.getTimezoneOffset() * 60000;
        return (new Date(date - offset)).toISOString().slice(0, 16);
    }

    function updateDateDisplay(dateStr) {
        if(!dateStr) {
            if (dateDisplay) dateDisplay.innerText = "직접 날짜 / 시간 선택하기";
            if (calendarTrigger) {
                calendarTrigger.style.borderColor = "";
                calendarTrigger.style.backgroundColor = "";
            }
            return;
        }
        const dateObj = new Date(dateStr);
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        const hour = dateObj.getHours().toString().padStart(2, '0');
        const min = dateObj.getMinutes().toString().padStart(2, '0');
        
        if (dateDisplay) dateDisplay.innerText = `${month}월 ${day}일 ${hour}:${min}`;
        
        if (calendarTrigger) {
            calendarTrigger.style.borderColor = "rgba(52, 84, 130, 1)";
            calendarTrigger.style.backgroundColor = "rgba(52, 82, 130, 0.11)";
        }
    }

    function setQuickDate(daysToAdd, hour) {
        const d = new Date();
        d.setDate(d.getDate() + daysToAdd);
        d.setHours(hour, 0, 0, 0);
        return d;
    }

    function applyQuickDate(dateObj, btnId) {
        const formatted = formatDateTime(dateObj);
        newReminderDate.value = formatted;
        updateDateDisplay(formatted);
        quickBtns.forEach(b => b.classList.remove('active'));
        document.getElementById(btnId).classList.add('active');
    }

    newReminderToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            newReminderOptions.style.display = 'block';
        } else {
            newReminderOptions.style.display = 'none';
            newReminderDate.value = '';
            quickBtns.forEach(btn => btn.classList.remove('active'));
            updateDateDisplay(null);
        }
    });

    if (calendarTrigger) {
        calendarTrigger.addEventListener('click', () => {
            try { 
                newReminderDate.showPicker(); 
            } catch (err) { 
                newReminderDate.focus(); 
                newReminderDate.click(); 
            }
        });
    }

    newReminderDate.addEventListener('change', () => {
        quickBtns.forEach(b => b.classList.remove('active'));
        updateDateDisplay(newReminderDate.value);
    });

    const btnTomorrow = document.getElementById('btnTomorrow');
    if (btnTomorrow) {
        btnTomorrow.addEventListener('click', function() {
            applyQuickDate(setQuickDate(1, 9), this.id);
        });
    }

    const btnWeekend = document.getElementById('btnWeekend');
    if (btnWeekend) {
        btnWeekend.addEventListener('click', function() {
            const d = new Date();
            const day = d.getDay();
            const dist = 6 - day + (day === 6 ? 7 : 0);
            d.setDate(d.getDate() + dist);
            d.setHours(10, 0, 0, 0);
            applyQuickDate(d, this.id);
        });
    }

    const btnNextWeek = document.getElementById('btnNextWeek');
    if (btnNextWeek) {
        btnNextWeek.addEventListener('click', function() {
            const d = new Date();
            const day = d.getDay();
            const dist = 8 - day;
            d.setDate(d.getDate() + dist);
            d.setHours(9, 0, 0, 0);
            applyQuickDate(d, this.id);
        });
    }

   saveNewBtn.addEventListener('click', () => {
    const title = newTitleInput.value.trim();
    let url = newUrlInput.value.trim(); 
    if (!title) { alert('제목을 입력해주세요.'); return; }

    const newMemoInput = document.getElementById('newMemo');

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    const newBookmark = {
        id: Date.now(),
        title: title,
        url: url,
        tag: currentTags.length > 0 ? currentTags[0] : 'Etc', 
        tagColor: '#555',
        date: dateStr,
        bgColor: '#f0f0f0',
        isStarred: false,
        isRead: false,
        hasSummary: !!newContentInput.value,
        
        content: newContentInput.value, 
        memo: newMemoInput.value,    
        
        image: '', 
        reminderTime: newReminderToggle.checked && newReminderDate.value ? new Date(newReminderDate.value).toISOString() : null
    };

    const currentData = getDashboardData();
    currentData.unshift(newBookmark);
    saveDashboardData(currentData);

    // 화면 갱신
    currentData.sort((a, b) => b.date.localeCompare(a.date));
    renderCards(currentData.slice(0, 6));
    renderSidebarReminders();
    updateDashboardStats();

    addModal.style.display = 'none';
    alert('북마크가 추가되었습니다.');
    });
});