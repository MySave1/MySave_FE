// =============================
// 1. 초기 데이터 및 로컬 스토리지 관리
// =============================
const initialDashboardData = [];

// 시스템 기준 날짜 설정 (2025-12-18)
const SYSTEM_NOW = new Date("2025-12-18T13:38:50"); 

function getDashboardData() {
  const stored = localStorage.getItem('bookmarks');
  if (!stored) {
    localStorage.setItem('bookmarks', JSON.stringify(initialDashboardData));
    return initialDashboardData;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    localStorage.setItem('bookmarks', JSON.stringify(initialDashboardData));
    return initialDashboardData;
  }
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

  const searchInput = document.querySelector('.search-container input');
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (keyword) {
    const searchFiltered = filtered.filter(item =>
      (item.title || '').toLowerCase().includes(keyword) ||
      (item.tag || '').toLowerCase().includes(keyword)
    );
    renderCards(searchFiltered);
  } else {
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    renderCards(filtered.slice(0, 6));
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

// =============================
// 3. 렌더링 함수
// =============================
function renderCards(data) {
  const cardContainer = document.getElementById('cardContainer');
  if (!cardContainer) return;

  cardContainer.innerHTML = '';
  
  if (data.length === 0) {
      cardContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #aaa;">저장된 북마크가 없습니다.</div>';
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

    const bgStyle = item.image
      ? `background-image: url('${item.image}'); background-size: cover; background-position: center;`
      : `background-color: ${item.bgColor || '#eee'};`;

    const reminderBadge = item.reminderTime
      ? `<div style="width: 28px; height: 28px; background-color: rgba(255, 255, 255, 0.90); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><i class="fa-solid fa-bell" style="color: #3182F6; font-size: 13px;"></i></div>`
      : '';

    let summaryTag = '';
    if (!item.image) {
        summaryTag = item.hasSummary 
            ? `<span class="summary-tag" style="color: #3182F6;">요약됨</span>`
            : `<span class="summary-tag" style="color: #555;">요약하기</span>`;
    }
      
    card.innerHTML = `
      <div class="card-img" style="${bgStyle} height: 160px; position: relative; padding: 12px; display: flex; justify-content: space-between;">
        <div style="display: flex; gap: 6px;">${unreadBadge}${reminderBadge}</div>
        <div style="display: flex; gap: 8px; align-items: center;">${summaryTag}
          <div class="card-delete-btn"><i class="fa-solid fa-trash-can"></i></div>
        </div>
      </div>
      <div class="card-body">
        <h4 class="card-title">${item.title || ''}</h4>
        <div class="card-footer">
          <span class="tag-badge" style="background-color: ${item.tagColor || '#555'}">#${item.tag || ''}</span>
          <div class="date-star">
            <span>${item.date || ''}</span>
            <i class="star-btn ${starIconClass} fa-star ${activeClass}" style="color: ${starColor};"></i>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (!item.isRead) {
        const all = getDashboardData();
        const target = all.find(d => d.id === item.id);
        if (target) { target.isRead = true; saveDashboardData(all); }
      }
      localStorage.setItem('currentBookmarkId', item.id);
      window.location.href = `../bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard`;
    });

    card.querySelector('.star-btn').addEventListener('click', (e) => {
      e.stopPropagation(); toggleStar(e.target, item.id);
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation(); deleteBookmark(item.id);
    });

    cardContainer.appendChild(card);
  });
}

function renderSidebarReminders() {
  const container = document.getElementById('sidebarReminderList');
  if (!container) return;
  const bookmarks = getDashboardData();
  const reminders = bookmarks.filter(item => item.reminderTime);
  
  if (reminders.length === 0) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: #aaa;">예정된 리마인드가 없습니다.</div>`;
    return;
  }

  const todayStart = new Date(SYSTEM_NOW.getFullYear(), SYSTEM_NOW.getMonth(), SYSTEM_NOW.getDate());
  const groups = { today: [], tomorrow: [] };

  reminders.forEach(item => {
    const itemDate = new Date(item.reminderTime);
    const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const diffDays = Math.round((itemStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    item.displayTime = itemDate.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 0) groups.today.push(item);
    else if (diffDays === 1) groups.tomorrow.push(item);
  });

  container.innerHTML = '';
  if (groups.today.length > 0) container.innerHTML += createSidebarGroupHTML('오늘', 'blue', groups.today);
  if (groups.tomorrow.length > 0) container.innerHTML += createSidebarGroupHTML('내일', 'yellow', groups.tomorrow);
}

function createSidebarGroupHTML(label, color, items) {
  const listHTML = items.map(item => `
    <div class="reminder-item" onclick="location.href='../bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard'" style="cursor: pointer;">
      <span class="time">${item.displayTime}</span>
      <span class="task">${item.title}</span>
    </div>
  `).join('');
  return `<div class="day-group"><div class="day-label"><span class="dot ${color}"></span> ${label}</div>${listHTML}</div>`;
}

// [수정] 통계 업데이트 함수 (어제/오늘 비교 멘트 추가)
function updateDashboardStats() {
    const bookmarks = getDashboardData();
    const todayStr = `${SYSTEM_NOW.getFullYear()}.${String(SYSTEM_NOW.getMonth() + 1).padStart(2, '0')}.${String(SYSTEM_NOW.getDate()).padStart(2, '0')}`;
    
    // 어제 날짜 구하기
    const yesterday = new Date(SYSTEM_NOW);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}.${String(yesterday.getMonth() + 1).padStart(2, '0')}.${String(yesterday.getDate()).padStart(2, '0')}`;

    // 1. 오늘 저장한 글 수 및 멘트 계산
    const todaySavedEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
    const todayDescEl = document.querySelector('.stat-card:nth-child(1) .stat-desc');
    
    if (todaySavedEl) {
        const todayCount = bookmarks.filter(item => item.date === todayStr).length;
        const yesterdayCount = bookmarks.filter(item => item.date === yesterdayStr).length;
        
        todaySavedEl.innerHTML = `${todayCount} <span class="unit">건</span>`;

        // 어제와 비교하여 멘트 생성
        if (todayDescEl) {
            if (todayCount > yesterdayCount) {
                todayDescEl.textContent = `어제보다 ${todayCount - yesterdayCount}건 더 많이 저장됨`;
            } else if (todayCount < yesterdayCount) {
                todayDescEl.textContent = `어제보다 ${yesterdayCount - todayCount}건 적게 저장됨`;
            } else {
                todayDescEl.textContent = `어제와 동일한 양을 저장함`;
            }
        }
    }

    // 2. 미완료 리마인드 계산
    const totalReminderEl = document.getElementById('totalReminderCount');
    const todayReminderDescEl = document.getElementById('todayReminderDesc');
    if (totalReminderEl) {
        const incomplete = bookmarks.filter(item => item.reminderTime && !item.isRead).length;
        totalReminderEl.textContent = incomplete;

        const todayDueCount = bookmarks.filter(item => {
            if (!item.reminderTime) return false;
            const d = new Date(item.reminderTime);
            return d.getFullYear() === SYSTEM_NOW.getFullYear() && 
                   d.getMonth() === SYSTEM_NOW.getMonth() && 
                   d.getDate() === SYSTEM_NOW.getDate();
        }).length;
        if (todayReminderDescEl) todayReminderDescEl.textContent = `오늘 마감되는 항목 ${todayDueCount} 건`;
    }
}

// =============================
// 4. 모달 및 이벤트 실행
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const allData = getDashboardData();
  allData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  renderCards(allData.slice(0, 6));
  renderSidebarReminders();
  updateDashboardStats();

  const searchInput = document.querySelector('.search-container input');
  const addModal = document.getElementById('addBookmarkModal');
  const newTagInput = document.getElementById('newTagInput');
  const tagSelectionContainer = document.getElementById('tagSelectionContainer');
  const saveNewBtn = document.getElementById('saveNewBookmarkBtn');

  if (newTagInput) {
      newTagInput.addEventListener('input', () => {
          const allChips = document.querySelectorAll('.choice-tag');
          allChips.forEach(chip => chip.classList.remove('selected'));
      });
  }

  function loadTagsAsChips() {
    if (!tagSelectionContainer) return;
    const tags = getTagList();
    tagSelectionContainer.innerHTML = '';
    tags.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = 'choice-tag';
        chip.textContent = `#${tag.name}`;
        chip.addEventListener('click', () => {
            const isSelected = chip.classList.contains('selected');
            document.querySelectorAll('.choice-tag').forEach(c => c.classList.remove('selected'));
            if (isSelected) {
                if(newTagInput) newTagInput.value = '';
                chip.classList.remove('selected');
            } else {
                if(newTagInput) newTagInput.value = tag.name.toUpperCase();
                chip.classList.add('selected');
            }
        });
        tagSelectionContainer.appendChild(chip);
    });
  }

  document.getElementById('openAddModalBtn')?.addEventListener('click', () => {
    document.getElementById('newUrl').value = '';
    document.getElementById('newTitle').value = '';
    document.getElementById('newContent').value = '';
    document.getElementById('newMemo').value = '';
    newTagInput.value = '';
    loadTagsAsChips();
    addModal.style.display = 'flex';
  });

  document.querySelector('.close-modal')?.addEventListener('click', () => {
    addModal.style.display = 'none';
  });

  if (saveNewBtn) {
    saveNewBtn.addEventListener('click', () => {
      const title = document.getElementById('newTitle').value.trim();
      const url = document.getElementById('newUrl').value.trim();
      const tagNameInput = newTagInput.value.trim().toUpperCase();
      
      if (!title) { alert('제목을 입력해주세요.'); return; }

      const finalTagName = tagNameInput || 'ETC';
      const existingTags = getTagList();
      let existingTagObj = existingTags.find(t => t.name === finalTagName);
      let finalTagColor = '#555';
      
      if (!existingTagObj && finalTagName !== 'ETC' && finalTagName !== '') {
          const randomColors = ["#FF02024D", "#FF77004D", "#fdffb64D", "#FFE5004D", "#3D98FA4D", "#E250CF4D", "#8888884D"];
          const randomDots = ["#FF0202", "#FF7700", "#FFE500", "#0E9E29", "#3D98FA", "#E250CF", "#888888"];
          const randIdx = Math.floor(Math.random() * randomColors.length);
          finalTagColor = randomColors[randIdx];
          const newTagObj = { id: Date.now(), name: finalTagName, color: finalTagColor, dotColor: randomDots[randIdx] };
          existingTags.push(newTagObj);
          saveTagList(existingTags);
      } else if (existingTagObj) {
          finalTagColor = existingTagObj.color;
      }

      const dateStr = `${SYSTEM_NOW.getFullYear()}.${String(SYSTEM_NOW.getMonth() + 1).padStart(2, '0')}.${String(SYSTEM_NOW.getDate()).padStart(2, '0')}`;

      const newBookmark = {
        id: Date.now(),
        title, url, tag: finalTagName,
        tagColor: finalTagColor, date: dateStr,
        bgColor: '#f0f2f5', isStarred: false, isRead: false,
        hasSummary: !!document.getElementById('newContent').value,
        content: document.getElementById('newContent').value,
        memo: document.getElementById('newMemo').value,
        reminderTime: document.getElementById('newReminderToggle').checked ? new Date(document.getElementById('newReminderDate').value).toISOString() : null
      };

      const currentData = getDashboardData();
      currentData.unshift(newBookmark);
      saveDashboardData(currentData);
      renderCards(currentData.slice(0, 6));
      updateDashboardStats();
      addModal.style.display = 'none';
      alert('북마크가 저장되었습니다.');
    });
  }
});