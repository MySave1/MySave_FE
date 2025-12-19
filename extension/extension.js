document.addEventListener('DOMContentLoaded', () => {

    // 1. 기본 설정 및 변수 선언
    const API_BASE_URL = "http://13.60.25.65:8080";
    const tagInput = document.getElementById('tagInput');
    const tagContainer = document.getElementById('tagContainer');
    let tags = [];
  
    const toggleBtn = document.getElementById('reminderToggle');
    const reminderOptions = document.getElementById('reminderOptions');
    const dateInput = document.getElementById('reminderDate');
    const calendarTrigger = document.getElementById('calendarTrigger');
    const dateDisplay = document.getElementById('dateDisplay');
    const quickBtns = document.querySelectorAll('.quick-btn');
  
    const statusMsg = document.getElementById('statusMsg');
  
    // 유틸: 상태 메시지
    function setStatus(text, color = "#555") {
      if (!statusMsg) return;
      statusMsg.innerText = text;
      statusMsg.style.color = color;
    }
  
    // 유틸: 로컬 저장 (확장프로그램 스토리지)
    function saveToLocalBookmark(item) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['localBookmarks'], (res) => {
          const prev = Array.isArray(res.localBookmarks) ? res.localBookmarks : [];
          prev.unshift(item);
          chrome.storage.local.set({ localBookmarks: prev }, () => resolve(true));
        });
      });
    }
  
    // 유틸: 로컬에서 “임시 유저” 만들어두기 (로그인 없이도 구분 가능)
    function ensureLocalUser() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userId', 'userName', 'userEmail'], (res) => {
          const userId = res.userId || "guest";
          const userName = res.userName || "게스트";
          const userEmail = res.userEmail || "guest@mysave.local";
          chrome.storage.local.set({ userId, userName, userEmail }, () => resolve({ userId, userName, userEmail }));
        });
      });
    }
  
    // 페이지 정보 채우기
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
  
      // 크롬 내부 페이지 예외 처리
      if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
        document.getElementById('pageTitle').value = currentTab.title || '내부 페이지';
        document.getElementById('pageUrl').value = currentTab.url;
        document.getElementById('selectedText').value = '선택된 텍스트 없음 (내부 페이지)';
        return;
      }
  
      document.getElementById('pageTitle').value = currentTab.title;
      document.getElementById('pageUrl').value = currentTab.url;
  
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => window.getSelection().toString()
      }, (results) => {
        if (results && results[0] && results[0].result) {
          document.getElementById('selectedText').value = results[0].result;
        }
      });
    });
  
    // 2. 태그 입력
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
  
        let newTag = tagInput.value.trim().toUpperCase();
        if (newTag.length > 0) {
          const newTagsArray = newTag.split(',')
            .map(tag => tag.trim().replace(/^#/, ''))
            .filter(tag => tag.length > 0 && !tags.includes(tag));
  
          tags.push(...newTagsArray);
        }
  
        tagInput.value = '';
        renderTags();
      }
    });
  
    function renderTags() {
      tagContainer.innerHTML = '';
      tags.forEach((tag, idx) => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.innerHTML = `#${tag} <i class="fa-solid fa-xmark" data-idx="${idx}"></i>`;
        tagContainer.appendChild(chip);
      });
  
      document.querySelectorAll('.tag-chip i').forEach(icon => {
        icon.addEventListener('click', (e) => {
          const indexToRemove = parseInt(e.target.dataset.idx);
          tags.splice(indexToRemove, 1);
          renderTags();
        });
      });
    }
  
    // 3. 리마인드
    function updateDateDisplay(dateStr) {
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
  
    toggleBtn.addEventListener('change', (e) => {
      if (e.target.checked) {
        reminderOptions.style.display = 'block';
      } else {
        reminderOptions.style.display = 'none';
        dateInput.value = '';
        quickBtns.forEach(btn => btn.classList.remove('active'));
        updateDateDisplay(null);
      }
    });
  
    calendarTrigger.addEventListener('click', () => {
      try { dateInput.showPicker(); } catch (err) { dateInput.focus(); dateInput.click(); }
    });
  
    dateInput.addEventListener('change', () => {
      quickBtns.forEach(b => b.classList.remove('active'));
      updateDateDisplay(dateInput.value);
    });
  
    function formatDateTime(date) {
      const offset = date.getTimezoneOffset() * 60000;
      return (new Date(date - offset)).toISOString().slice(0, 16);
    }
  
    function setQuickDate(daysToAdd, hour) {
      const d = new Date();
      d.setDate(d.getDate() + daysToAdd);
      d.setHours(hour, 0, 0, 0);
      return d;
    }
  
    function applyQuickDate(dateObj, btnId) {
      const formatted = formatDateTime(dateObj);
      dateInput.value = formatted;
      updateDateDisplay(formatted);
  
      quickBtns.forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.add('active');
  
      if (!toggleBtn.checked) {
        toggleBtn.checked = true;
        reminderOptions.style.display = 'block';
      }
    }
  
    document.getElementById('btnTomorrow')?.addEventListener('click', function () {
      applyQuickDate(setQuickDate(1, 9), this.id);
    });
  
    document.getElementById('btnWeekend')?.addEventListener('click', function () {
      const d = new Date();
      const day = d.getDay();
      const dist = 6 - day + (day === 6 ? 7 : 0);
      d.setDate(d.getDate() + dist);
      d.setHours(10, 0, 0, 0);
      applyQuickDate(d, this.id);
    });
  
    document.getElementById('btnNextWeek')?.addEventListener('click', function () {
      const d = new Date();
      const day = d.getDay();
      const daysToNextMonday = (1 + 7 - day) % 7 || 7;
      d.setDate(d.getDate() + daysToNextMonday);
      d.setHours(9, 0, 0, 0);
      applyQuickDate(d, this.id);
    });
  
    // 4. 저장하기 (핵심 수정)
    document.getElementById('saveBtn').addEventListener('click', async () => {
  
      // 입력 중이던 태그 반영
      if (tagInput.value.trim().length > 0) {
        const inputTags = tagInput.value.split(',')
          .map(t => t.trim().replace(/^#/, '').toUpperCase())
          .filter(t => t.length > 0 && !tags.includes(t));
        tags.push(...inputTags);
        tagInput.value = '';
        renderTags();
      }
  
      // 제목 체크
      const title = document.getElementById('pageTitle').value;
      if (!title.trim()) {
        setStatus("제목을 입력해주세요.", "red");
        return;
      }
  
      // 토큰/유저정보 가져오기 (없으면 guest)
      const localUser = await ensureLocalUser();
  
      chrome.storage.local.get(['accessToken', 'userId', 'userName', 'userEmail'], async (result) => {
        const token = result.accessToken || null;
  
        const bookmarkData = {
          // 서버용/로컬용 겸용
          userId: result.userId || localUser.userId, // guest 가능
          userName: result.userName || localUser.userName,
          userEmail: result.userEmail || localUser.userEmail,
  
          url: document.getElementById('pageUrl').value,
          title: document.getElementById('pageTitle').value,
          content: document.getElementById('selectedText').value,
          memo: document.getElementById('memo').value,
          tags: tags,
          reminderAt: toggleBtn.checked && dateInput.value ? new Date(dateInput.value).toISOString() : null,
  
          createdAt: new Date().toISOString()
        };
  
        // 1) 무조건 로컬 저장부터
        await saveToLocalBookmark(bookmarkData);
        setStatus("로컬 저장 완료! (서버 저장 시도 중...)", "blue");
  
        // 2) 토큰 있으면 서버 저장 시도
        if (!token) {
          setStatus("저장 완료! (로그인 없이 로컬에 저장됨)", "green");
          setTimeout(() => window.close(), 800);
          return;
        }
  
        try {
          const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: bookmarkData.userId,
              url: bookmarkData.url,
              title: bookmarkData.title,
              content: bookmarkData.content,
              memo: bookmarkData.memo,
              tags: bookmarkData.tags,
              reminderAt: bookmarkData.reminderAt
            })
          });
  
          if (response.ok) {
            setStatus("저장 성공! (서버 + 로컬)", "green");
            setTimeout(() => window.close(), 800);
          } else {
            setStatus(`서버 저장 실패 (${response.status}) → 로컬 저장만 완료`, "orange");
            setTimeout(() => window.close(), 1200);
          }
        } catch (error) {
          console.error("서버 저장 에러:", error);
          setStatus("서버 연결 불가 → 로컬 저장만 완료", "orange");
          setTimeout(() => window.close(), 1200);
        }
      });
    });
  
  });
  