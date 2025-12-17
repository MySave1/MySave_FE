// =============================
// 1. 초기 데이터 (빈 배열로 설정)
// =============================
const initialDashboardData = [];

// =============================
// 2. 로컬 스토리지 접근 함수
// =============================
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

// 태그 데이터 가져오기 (태그 페이지와 연동)
function getTagList() {
    const stored = localStorage.getItem('myTagList');
    return stored ? JSON.parse(stored) : [];
}

function saveTagList(tags) {
    localStorage.setItem('myTagList', JSON.stringify(tags));
}

// =============================
// 3. 삭제 기능
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
  alert("삭제가 완료되었습니다.");
}

// =============================
// 4. 카드 렌더링
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
    const activeClass = item.isStarred ? 'active' : '';
    const starIconClass = item.isStarred ? 'fa-solid' : 'fa-regular';
    const starColor = item.isStarred ? '#facc15' : '#ccc';
    const unreadBadge = !item.isRead ? '<div class="unread-dot"></div>' : '';

    const bgStyle = item.image 
      ? `background-image: url('${item.image}'); background-size: cover; background-position: center;` 
      : `background-color: ${item.bgColor || '#eee'};`;

    const reminderBadge = item.reminderTime
      ? `<div style="width: 28px; height: 28px; background-color: rgba(255, 255, 255, 0.90); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="리마인드 설정됨"><i class="fa-solid fa-bell" style="color: #3182F6; font-size: 13px;"></i></div>`
      : '';

    let summaryTag = '';
    if (!item.image) {
        if (item.hasSummary) {
            summaryTag = `<span class="summary-tag" style="display: inline-flex !important; white-space: nowrap !important; align-items: center; justify-content: center; height: 20px; padding: 0 10px; background: rgba(255,255,255,0.9); border-radius: 14px; font-size: 12px; font-weight: 400; color: #3182F6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">요약됨</span>`;
        } else {
            summaryTag = `<span class="summary-tag" style="display: inline-flex !important; white-space: nowrap !important; align-items: center; justify-content: center; height: 20px; padding: 0 10px; background: rgba(255, 255, 255, 0.9); border-radius: 14px; font-size: 12px; font-weight: 400; color: #555; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">요약하기</span>`;
        }
    }
      
    const deleteButton = `
      <div class="card-delete-btn" title="삭제" style="display: inline-flex !important; width: 28px; height: 28px; background-color: rgba(255, 255, 255, 0.90); border-radius: 50%; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; flex-shrink: 0;">
        <i class="fa-solid fa-trash-can" style="color: #ff4d4f; font-size: 13px;"></i>
      </div>
    `;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-img" style="${bgStyle} height: 160px; position: relative; display: flex !important; flex-direction: row !important; justify-content: space-between !important; align-items: flex-start !important; padding: 12px;">
        
        <div style="display: flex !important; flex-direction: row !important; align-items: flex-start !important; gap: 6px;">
           ${unreadBadge}
           ${reminderBadge}
        </div>

        <div style="margin-left: auto !important; display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: center !important; gap: 8px !important;">
           ${summaryTag}
           ${deleteButton}
        </div>

      </div>
      
      <div class="card-body">
        <h4 class="card-title">${item.title || ''}</h4>
        <div class="card-footer">
          <span class="tag-badge" style="background-color: ${item.tagColor || '#555'}">#${item.tag || ''}</span>
          <div class="date-star">
            <span style="color: #888; font-size: 13px;">${item.date || ''}</span>
            <i class="star-btn ${starIconClass} fa-star ${activeClass}" style="color: ${starColor}; cursor: pointer;"></i>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (!item.isRead) {
        const all = getDashboardData();
        const target = all.find(d => d.id === item.id);
        if (target) {
          target.isRead = true;
          saveDashboardData(all);
        }
      }
      localStorage.setItem('currentBookmarkId', item.id);
      localStorage.setItem('previousPage', 'dashboard');
      localStorage.setItem('editMode', 'false');
      window.location.href = `../bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard`;
    });

    const starBtn = card.querySelector('.star-btn');
    if (starBtn) {
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStar(starBtn, item.id);
      });
    }

    const deleteBtn = card.querySelector('.card-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBookmark(item.id);
      });
    }

    cardContainer.appendChild(card);
  });
}

// 5. 별표 토글
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

// 6. 사이드바 리마인드
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
    const itemDate = new Date(item.reminderTime);
    const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const diffTime = itemStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    item.displayTime = itemDate.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

    if (diffDays === 0) groups.today.push(item);
    else if (diffDays === 1) groups.tomorrow.push(item);
  });

  groups.today.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
  groups.tomorrow.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));

  container.innerHTML = '';
  if (groups.today.length > 0) container.innerHTML += createSidebarGroupHTML('오늘', 'blue', groups.today);
  if (groups.tomorrow.length > 0) container.innerHTML += createSidebarGroupHTML('내일', 'yellow', groups.tomorrow);

  if (groups.today.length === 0 && groups.tomorrow.length === 0) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: #aaa; font-size: 13px;">오늘, 내일 일정이 없습니다.<br><a href="../reminder/reminder.html" style="color:#3182F6">전체 보기</a></div>`;
  }
}

function createSidebarGroupHTML(label, color, items) {
  const listHTML = items.map(item => `
    <div class="reminder-item" onclick="location.href='../bookmarkContent/bookmarkContent.html?id=${item.id}&from=dashboard'" style="cursor: pointer;">
      <span class="time">${item.displayTime}</span>
      <span class="task" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</span>
    </div>
  `).join('');

  return `<div class="day-group"><div class="day-label"><span class="dot ${color}"></span> ${label}</div>${listHTML}</div>`;
}

// 7. 통계 업데이트
function updateDashboardStats() {
  const totalReminderEl = document.getElementById('totalReminderCount');
  const todayReminderDescEl = document.getElementById('todayReminderDesc');
  const weeklyRateEl = document.getElementById('weeklyRate');
  const weeklyDescEl = document.getElementById('weeklyDesc');

  const topTagEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
  const topTagDescEl = document.querySelector('.stat-card:nth-child(3) .stat-desc');

  if (!totalReminderEl || !todayReminderDescEl || !weeklyRateEl || !weeklyDescEl) return;

  const bookmarks = getDashboardData();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let totalIncompleteCount = 0;
  let todayDueCount = 0;
  const totalSavedCount = bookmarks.length;
  let totalReadCount = 0;

  const tagCounts = {};

  bookmarks.forEach(item => {
    if (item.reminderTime) {
      if (!item.isRead) totalIncompleteCount++;
      const itemDate = new Date(item.reminderTime);
      const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      const diffTime = itemStart.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) todayDueCount++;
    }
    if (item.isRead) totalReadCount++;
    if (item.tag) tagCounts[item.tag] = (tagCounts[item.tag] || 0) + 1;
  });

  totalReminderEl.textContent = totalIncompleteCount;
  todayReminderDescEl.textContent = `오늘 마감되는 항목 ${todayDueCount} 건`;

  const percentage = totalSavedCount > 0 ? Math.round((totalReadCount / totalSavedCount) * 100) : 0;
  weeklyRateEl.textContent = percentage;
  weeklyDescEl.textContent = `전체 ${totalSavedCount}개 중 ${totalReadCount}개 읽음`;

  // 태그 통계
  const entries = Object.entries(tagCounts);
  if (topTagEl && topTagDescEl) {
      if (entries.length === 0) {
        topTagEl.innerHTML = `없음 <span class="badge">-</span>`;
        topTagDescEl.textContent = "저장된 태그가 없습니다";
      } else {
        const maxCount = Math.max(...entries.map(([_, c]) => c));
        const topCandidates = entries
          .filter(([_, c]) => c === maxCount)
          .map(([t]) => t)
          .sort((a, b) => a.localeCompare(b, 'en'));
        const topTag = topCandidates[0];
        const tieExtra = topCandidates.length - 1;
        topTagEl.innerHTML = `
          ${topTag}
          <span class="badge">Top 1</span>
          ${tieExtra > 0 ? `<span class="badge">+${tieExtra}</span>` : ``}
        `.trim();
        topTagDescEl.textContent =
        tieExtra > 0
          ? `총 ${maxCount}회 사용됨 · + ${topCandidates.length}`
          : `총 ${maxCount}회 사용됨`;
    }
  }
  renderSidebarTags(tagCounts);
}

function renderSidebarTags(tagCounts) {
  const cloudContainer = document.querySelector('.tag-cloud');
  if (!cloudContainer) return;

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], 'en');
    })
    .slice(0, 5);

  if (sortedTags.length === 0) {
    cloudContainer.innerHTML = '<span style="color:#aaa; font-size:13px;">태그 내역이 없습니다.</span>';
    return;
  }

  // 로컬 스토리지에 있는 내 태그 정보 가져오기 (색상 매칭용)
  const storedTagsData = getTagList();

  cloudContainer.innerHTML = '';

  sortedTags.forEach(([tagName, count]) => {
    // 저장된 태그 목록에서 정보 찾기
    const tagInfo = storedTagsData.find(t => t.name === tagName);
    // 없으면 기본색(회색)
    const color = tagInfo ? tagInfo.color : '#555'; 

    const span = document.createElement('span');
    span.className = 'tag-pill';
    span.textContent = `#${tagName}`;
    span.style.backgroundColor = color;
    span.style.color = '#fff';
    span.style.cursor = 'pointer';

    span.onclick = () => {
      const searchInput = document.querySelector('.search-container input');
      if (searchInput) {
        searchInput.value = tagName;
        searchInput.dispatchEvent(new Event('input'));
      }
    };
    cloudContainer.appendChild(span);
  });
}

// =============================
// 8. 실행 (DOMContentLoaded)
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const allData = getDashboardData();
  allData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  renderCards(allData.slice(0, 6));
  renderSidebarReminders();
  updateDashboardStats();

  const searchInput = document.querySelector('.search-container input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      const currentData = getDashboardData();
      if (keyword === "") {
        currentData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        renderCards(currentData.slice(0, 6));
      } else {
        const filtered = currentData.filter(item =>
          (item.title || '').toLowerCase().includes(keyword) ||
          (item.tag || '').toLowerCase().includes(keyword)
        );
        renderCards(filtered);
      }
    });
  }

  // ==========================================
  // 북마크 추가 모달 (태그 칩 선택 방식 적용)
  // ==========================================
  const addModal = document.getElementById('addBookmarkModal');
  const openModalBtn = document.getElementById('openAddModalBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const saveNewBtn = document.getElementById('saveNewBookmarkBtn');

  const newUrlInput = document.getElementById('newUrl');
  const newTitleInput = document.getElementById('newTitle');
  const newContentInput = document.getElementById('newContent');
  const newMemoInput = document.getElementById('newMemo');

  // [수정] 태그 관련 요소 (칩 방식)
  const newTagInput = document.getElementById('newTagInput');
  const tagSelectionContainer = document.getElementById('tagSelectionContainer');

  // [추가] 엔터키로 저장하기 (URL, 제목, 태그 입력창)
  const inputsToTriggerSave = [newUrlInput, newTitleInput, newTagInput];
  inputsToTriggerSave.forEach(input => {
      if (input) {
          input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault(); // 폼 제출 등 기본 동작 방지
                  saveNewBtn.click(); // 저장 버튼 클릭 트리거
              }
          });
      }
  });

  const newReminderToggle = document.getElementById('newReminderToggle');
  const newReminderOptions = document.getElementById('newReminderOptions');
  const newReminderDate = document.getElementById('newReminderDate');
  const calendarTrigger = document.getElementById('calendarTrigger');
  const dateDisplay = document.getElementById('dateDisplay');
  const quickBtns = document.querySelectorAll('.quick-btn');

  // 태그 칩 로드 함수
  function loadTagsAsChips() {
    if (!tagSelectionContainer) return;

    const tags = getTagList();
    const fallbackTags = [];
    const displayTags = tags.length > 0 ? tags : fallbackTags;

    tagSelectionContainer.innerHTML = '';
    
    displayTags.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = 'choice-tag';
        chip.textContent = `#${tag.name}`;
        
        // 클릭 시 인풋창에 값 입력(대문자 변환) + 선택 효과
        chip.addEventListener('click', () => {
            if(newTagInput) newTagInput.value = tag.name.toUpperCase(); // 선택한 칩 이름도 대문자로 입력
            document.querySelectorAll('.choice-tag').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
        });

        tagSelectionContainer.appendChild(chip);
    });
  }

  // 모달 열기
  if (openModalBtn && addModal) {
    openModalBtn.addEventListener('click', () => {
      if (newUrlInput) newUrlInput.value = '';
      if (newTitleInput) newTitleInput.value = '';
      if (newContentInput) newContentInput.value = '';
      if (newMemoInput) newMemoInput.value = '';
      if (newTagInput) newTagInput.value = '';

      loadTagsAsChips();

      if (newReminderToggle) newReminderToggle.checked = false;
      if (newReminderOptions) newReminderOptions.style.display = 'none';
      if (newReminderDate) newReminderDate.value = '';
      updateDateDisplay(null);
      quickBtns.forEach(btn => btn.classList.remove('active'));

      addModal.style.display = 'flex';
    });
  }

  if (closeModalBtn && addModal) {
    closeModalBtn.addEventListener('click', () => {
      addModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (addModal && e.target === addModal) addModal.style.display = 'none';
  });

  // 날짜 관련 함수들
  function formatDateTime(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date - offset)).toISOString().slice(0, 16);
  }
  function updateDateDisplay(dateStr) {
    if (!dateDisplay || !calendarTrigger) return;
    if (!dateStr) {
      dateDisplay.innerText = "직접 날짜 / 시간 선택하기";
      calendarTrigger.style.borderColor = "";
      calendarTrigger.style.backgroundColor = "";
      return;
    }
    const dateObj = new Date(dateStr);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hour = dateObj.getHours().toString().padStart(2, '0');
    const min = dateObj.getMinutes().toString().padStart(2, '0');
    dateDisplay.innerText = `${month}월 ${day}일 ${hour}:${min}`;
    calendarTrigger.style.borderColor = "rgba(52, 84, 130, 1)";
    calendarTrigger.style.backgroundColor = "rgba(52, 82, 130, 0.11)";
  }
  function setQuickDate(daysToAdd, hour) {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(hour, 0, 0, 0);
    return d;
  }
  function applyQuickDate(dateObj, btnId) {
    if (!newReminderDate) return;
    const formatted = formatDateTime(dateObj);
    newReminderDate.value = formatted;
    updateDateDisplay(formatted);
    quickBtns.forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById(btnId);
    if (targetBtn) targetBtn.classList.add('active');
  }

  if (newReminderToggle) {
    newReminderToggle.addEventListener('change', (e) => {
      if (e.target.checked) newReminderOptions.style.display = 'block';
      else {
        newReminderOptions.style.display = 'none';
        newReminderDate.value = '';
        quickBtns.forEach(btn => btn.classList.remove('active'));
        updateDateDisplay(null);
      }
    });
  }
  if (calendarTrigger) {
    calendarTrigger.addEventListener('click', () => {
      try { newReminderDate.showPicker(); } catch (err) { newReminderDate.focus(); newReminderDate.click(); }
    });
  }
  if (newReminderDate) {
    newReminderDate.addEventListener('change', () => {
      quickBtns.forEach(b => b.classList.remove('active'));
      updateDateDisplay(newReminderDate.value);
    });
  }
  if (document.getElementById('btnTomorrow')) {
      document.getElementById('btnTomorrow').addEventListener('click', function() { applyQuickDate(setQuickDate(1, 9), this.id); });
  }
  if (document.getElementById('btnWeekend')) {
      document.getElementById('btnWeekend').addEventListener('click', function() {
        const d = new Date();
        const day = d.getDay();
        const dist = 6 - day + (day === 6 ? 7 : 0);
        d.setDate(d.getDate() + dist);
        d.setHours(10, 0, 0, 0);
        applyQuickDate(d, this.id);
      });
  }
  if (document.getElementById('btnNextWeek')) {
      document.getElementById('btnNextWeek').addEventListener('click', function() {
        const d = new Date();
        const day = d.getDay();
        const dist = 8 - day;
        d.setDate(d.getDate() + dist);
        d.setHours(9, 0, 0, 0);
        applyQuickDate(d, this.id);
      });
  }

  // ==========================================
  // [핵심] 저장하기 버튼 클릭 (모든 태그 대문자 변환 로직 적용)
  // ==========================================
  if (saveNewBtn) {
    saveNewBtn.addEventListener('click', () => {
      const title = (newTitleInput?.value || '').trim();
      let url = (newUrlInput?.value || '').trim();
      
      // [수정] 태그 입력값을 받자마자 대문자로 변환
      const tagNameInput = (newTagInput?.value || '').trim().toUpperCase();

      if (!title) {
        alert('제목을 입력해주세요.');
        return;
      }

      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // [1] 태그 처리 로직
      const finalTagName = tagNameInput || 'ETC'; // 기본값도 대문자로
      let finalTagColor = '#555';

      // [2] 기존 태그 목록 확인
      const existingTags = getTagList();
      const existingTagObj = existingTags.find(t => t.name === finalTagName);

      if (existingTagObj) {
          finalTagColor = existingTagObj.color;
      } else {
          // [3] 새로운 태그라면? -> 랜덤 색상 배정 후 자동 추가!
          if (finalTagName !== 'ETC') {
              const randomColors = ["#FF02024D", "#FF77004D", "#fdffb64D", "#FFE5004D", "#3D98FA4D", "#E250CF4D", "#8888884D"];
              const randomDots = ["#FF0202", "#FF7700", "#FFE500", "#0E9E29", "#3D98FA", "#E250CF", "#888888"];
              const randIdx = Math.floor(Math.random() * randomColors.length);
              
              finalTagColor = randomColors[randIdx];
              
              const newTagObj = {
                  id: Date.now(),
                  name: finalTagName, // 대문자로 저장
                  color: finalTagColor,
                  dotColor: randomDots[randIdx]
              };
              
              existingTags.push(newTagObj);
              saveTagList(existingTags);
          }
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

      const newBookmark = {
        id: Date.now(),
        title,
        url,
        tag: finalTagName, // 대문자로 저장된 태그
        tagColor: finalTagColor,
        date: dateStr,
        bgColor: '#f0f0f0',
        isStarred: false,
        isRead: false,
        hasSummary: !!(newContentInput?.value || ''),
        content: newContentInput?.value || '',
        memo: newMemoInput?.value || '',
        image: '',
        reminderTime: (newReminderToggle?.checked && newReminderDate?.value)
          ? new Date(newReminderDate.value).toISOString()
          : null
      };

      const currentData = getDashboardData();
      currentData.unshift(newBookmark);
      saveDashboardData(currentData);

      currentData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      renderCards(currentData.slice(0, 6));
      renderSidebarReminders();
      updateDashboardStats();

      if (addModal) addModal.style.display = 'none';
      alert('북마크가 추가되었습니다.');
    });
  }
});