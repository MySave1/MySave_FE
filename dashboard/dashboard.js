// =============================
// 1. 초기 데이터
// =============================
const initialDashboardData = [
    {
      id: 1,
      title: "React 19의 새로운 기능 완벽 정리",
      tag: "Dev",
      tagColor: "#a0c4ff",
      date: "2025.11.30",
      bgColor: "#ffb3b3",
      isStarred: true,
      isRead: false,
      hasSummary: true,
      content: "React 19의 새로운 기능인 Actions와 Compiler에 대해 알아봅니다.",
      memo: "나중에 꼭 적용해보기",
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
    try {
      return JSON.parse(stored);
    } catch (e) {
      // 깨진 JSON이면 초기화
      localStorage.setItem('bookmarks', JSON.stringify(initialDashboardData));
      return initialDashboardData;
    }
  }
  
  function saveDashboardData(newData) {
    localStorage.setItem('bookmarks', JSON.stringify(newData));
  }
  
  // =============================
  // 3. 삭제 기능
  // =============================
  function deleteBookmark(id) {
    if (!confirm('정말로 이 북마크를 삭제하시겠습니까?')) return;
  
    const allData = getDashboardData();
    const filtered = allData.filter(item => item.id !== id);
    saveDashboardData(filtered);
  
    // 화면 갱신
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
    data.forEach((item) => {
      const activeClass = item.isStarred ? 'active' : '';
      const starIconClass = item.isStarred ? 'fa-solid' : 'fa-regular';
      const starColor = item.isStarred ? '#facc15' : '#ccc';
      const unreadBadge = !item.isRead ? '<div class="unread-dot"></div>' : '';
  
      // 이미지 없을 때: 요약이 있으면 "요약됨", 없으면 빈 상태
      const imageContent = item.image
        ? `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover; border-radius: inherit;">`
        : (item.hasSummary ? '<span class="summary-tag">요약됨</span>' : '');
  
      const reminderBadge = item.reminderTime
        ? `<div style="position: absolute; top: 10px; left: 10px; width: 28px; height: 28px; background-color: rgba(255, 255, 255, 0.95); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.15); z-index: 10;" title="리마인드 설정됨"><i class="fa-solid fa-bell" style="color: #3182F6; font-size: 13px;"></i></div>`
        : '';
  
      const card = document.createElement('div');
      card.className = 'card';
  
      card.innerHTML = `
        <div class="card-img" style="background-color: ${item.bgColor || '#eee'}; position: relative;">
          ${reminderBadge} ${unreadBadge}
          ${imageContent}
        </div>
        <button class="card-delete-btn" title="삭제"><i class="fa-solid fa-trash-can"></i></button>
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
        // 읽음 처리
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
  
  // 6. 사이드바 리마인드 렌더링
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
      // 리마인드 통계
      if (item.reminderTime) {
        if (!item.isRead) totalIncompleteCount++;
  
        const itemDate = new Date(item.reminderTime);
        const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const diffTime = itemStart.getTime() - todayStart.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) todayDueCount++;
      }
  
      // 읽음 통계
      if (item.isRead) totalReadCount++;
  
      // 태그 카운트
      if (item.tag) tagCounts[item.tag] = (tagCounts[item.tag] || 0) + 1;
    });
  
    // 1) 리마인드 통계 반영
    totalReminderEl.textContent = totalIncompleteCount;
    todayReminderDescEl.textContent = `오늘 마감되는 항목 ${todayDueCount} 건`;
  
    // 2) 읽기 달성률 반영
    const percentage = totalSavedCount > 0 ? Math.round((totalReadCount / totalSavedCount) * 100) : 0;
    weeklyRateEl.textContent = percentage;
    weeklyDescEl.textContent = `전체 ${totalSavedCount}개 중 ${totalReadCount}개 읽음`;
  
    // 3) Top Tag
    let topTag = "없음";
    let maxCount = 0;
    for (const [tag, count] of Object.entries(tagCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topTag = tag;
      }
    }
    
    const entries = Object.entries(tagCounts);
    if (topTagEl && topTagDescEl) {
        if (entries.length === 0) {
          topTagEl.innerHTML = `없음 <span class="badge">-</span>`;
          topTagDescEl.textContent = "저장된 태그가 없습니다";
        } else {
          const maxCount = Math.max(...entries.map(([_, c]) => c));
      
          // 최다 사용 태그 후보들(동률)
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
  
    // 태그 클라우드 업데이트
    renderSidebarTags(tagCounts);
  }
  
  function renderSidebarTags(tagCounts) {
    const cloudContainer = document.querySelector('.tag-cloud');
    if (!cloudContainer) return;
  
    const sortedTags = Object.entries(tagCounts)
  .sort((a, b) => {
    // 1) 사용 횟수 내림차순
    if (b[1] !== a[1]) return b[1] - a[1];
    // 2) 동률이면 abc순
    return a[0].localeCompare(b[0], 'en');
  })
  .slice(0, 3);
  
    if (sortedTags.length === 0) {
      cloudContainer.innerHTML = '<span style="color:#aaa; font-size:13px;">태그 내역이 없습니다.</span>';
      return;
    }
  
    const fallbackTags = [
      { name: "Dev", color: "#a0c4ff" },
      { name: "Design", color: "#ffadad" },
      { name: "Work", color: "#caffbf" },
      { name: "News", color: "#ffd6a5" },
      { name: "Idea", color: "#fdffb6" },
      { name: "Study", color: "#bdb2ff" },
      { name: "Etc", color: "#cfcfcf" }
    ];
  
    const storedTagsData = JSON.parse(localStorage.getItem('myTagList')) || fallbackTags;
  
    cloudContainer.innerHTML = '';
  
    sortedTags.forEach(([tagName, count]) => {
      const tagInfo = storedTagsData.find(t => t.name === tagName);
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
    // 초기 렌더링
    const allData = getDashboardData();
    allData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    renderCards(allData.slice(0, 6));
    renderSidebarReminders();
    updateDashboardStats();
  
    // 검색 기능
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
    // 북마크 추가 모달 (태그 선택 적용)
    // ==========================================
    const addModal = document.getElementById('addBookmarkModal');
    const openModalBtn = document.getElementById('openAddModalBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const saveNewBtn = document.getElementById('saveNewBookmarkBtn');
  
    const newUrlInput = document.getElementById('newUrl');
    const newTitleInput = document.getElementById('newTitle');
    const newContentInput = document.getElementById('newContent');
    const newMemoInput = document.getElementById('newMemo');
  
    const newTagSelect = document.getElementById('newTagSelect');
  
    const newReminderToggle = document.getElementById('newReminderToggle');
    const newReminderOptions = document.getElementById('newReminderOptions');
    const newReminderDate = document.getElementById('newReminderDate');
    const calendarTrigger = document.getElementById('calendarTrigger');
    const dateDisplay = document.getElementById('dateDisplay');
    const quickBtns = document.querySelectorAll('.quick-btn');
  
    function loadTagsToSelect() {
      if (!newTagSelect) return;
  
      const storedTags = localStorage.getItem('myTagList');
      const fallbackTags = [
        { name: "Dev", color: "#a0c4ff" },
        { name: "Design", color: "#ffadad" },
        { name: "Work", color: "#caffbf" },
        { name: "News", color: "#ffd6a5" },
        { name: "Idea", color: "#fdffb6" },
        { name: "Study", color: "#bdb2ff" },
        { name: "Etc", color: "#cfcfcf" }
      ];
  
      const tags = storedTags ? JSON.parse(storedTags) : fallbackTags;
  
      newTagSelect.innerHTML = '';
      tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.name;
        option.textContent = tag.name;
        option.setAttribute('data-color', tag.color);
        newTagSelect.appendChild(option);
      });
    }
  
    if (openModalBtn && addModal) {
      openModalBtn.addEventListener('click', () => {
        if (newUrlInput) newUrlInput.value = '';
        if (newTitleInput) newTitleInput.value = '';
        if (newContentInput) newContentInput.value = '';
        if (newMemoInput) newMemoInput.value = '';
  
        loadTagsToSelect();
  
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
  
    if (newReminderToggle && newReminderOptions && newReminderDate) {
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
    }
  
    if (calendarTrigger && newReminderDate) {
      calendarTrigger.addEventListener('click', () => {
        try {
          newReminderDate.showPicker();
        } catch (err) {
          newReminderDate.focus();
          newReminderDate.click();
        }
      });
    }
  
    if (newReminderDate) {
      newReminderDate.addEventListener('change', () => {
        quickBtns.forEach(b => b.classList.remove('active'));
        updateDateDisplay(newReminderDate.value);
      });
    }
  
    const btnTomorrow = document.getElementById('btnTomorrow');
    if (btnTomorrow) {
      btnTomorrow.addEventListener('click', function () {
        applyQuickDate(setQuickDate(1, 9), this.id);
      });
    }
  
    const btnWeekend = document.getElementById('btnWeekend');
    if (btnWeekend) {
      btnWeekend.addEventListener('click', function () {
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
      btnNextWeek.addEventListener('click', function () {
        const d = new Date();
        const day = d.getDay();
        const dist = 8 - day;
        d.setDate(d.getDate() + dist);
        d.setHours(9, 0, 0, 0);
        applyQuickDate(d, this.id);
      });
    }
  
    // ==========================================
    // 저장하기 (태그 선택 연동)
    // ==========================================
    if (saveNewBtn) {
      saveNewBtn.addEventListener('click', () => {
        const title = (newTitleInput?.value || '').trim();
        let url = (newUrlInput?.value || '').trim();
  
        if (!title) {
          alert('제목을 입력해주세요.');
          return;
        }
  
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
  
        const selectedTag = newTagSelect ? newTagSelect.value : 'Etc';
        const selectedOption = newTagSelect ? newTagSelect.options[newTagSelect.selectedIndex] : null;
        const tagColor = selectedOption ? (selectedOption.getAttribute('data-color') || '#555') : '#555';
  
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  
        const newBookmark = {
          id: Date.now(),
          title,
          url,
          tag: selectedTag,
          tagColor,
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
  