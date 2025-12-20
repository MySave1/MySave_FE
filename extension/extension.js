document.addEventListener('DOMContentLoaded', async () => {

  // 1. 기본 설정
  const API_BASE_URL = "http://13.60.25.65:8080";
  const statusMsg = document.getElementById('statusMsg');

  // 태그 관련
  const tagInput = document.getElementById('tagInput');
  const tagContainer = document.getElementById('tagContainer');
  let tags = []; 

  // 리마인드, 이미지 관련 변수
  const toggleBtn = document.getElementById('reminderToggle');
  const reminderOptions = document.getElementById('reminderOptions');
  const dateInput = document.getElementById('reminderDate');
  const calendarTrigger = document.getElementById('calendarTrigger');
  const dateDisplay = document.getElementById('dateDisplay');
  const quickBtns = document.querySelectorAll('.quick-btn');
  const imgPreview = document.getElementById('imgPreview');
  const ogImageUrlInput = document.getElementById('ogImageUrl');

  function setStatus(text, color = "#555") {
      if (!statusMsg) return;
      statusMsg.innerText = text;
      statusMsg.style.color = color;
  }

  // 2. 초기화: 토큰 및 로컬 태그 불러오기
  const storageData = await chrome.storage.local.get(['accessToken', 'localTags']);
  const token = storageData.accessToken;
  let knownTags = storageData.localTags || [];

  // 3. 페이지 정보 가져오기 (이미지 포함)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('edge://')) {
           document.getElementById('pageTitle').value = currentTab.title || '내부 페이지';
           document.getElementById('pageUrl').value = currentTab.url;
           return;
      }

      document.getElementById('pageTitle').value = currentTab.title;
      document.getElementById('pageUrl').value = currentTab.url;

      // 페이지 내 스크립트 실행 (텍스트, 이미지 추출)
      chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: getPageMetaInfo
      }, (results) => {
          if (results && results[0]?.result) {
              const data = results[0].result;
              if (data.selection) document.getElementById('selectedText').value = data.selection;
              
              // 이미지 처리
              if (data.ogImage) {
                  ogImageUrlInput.value = data.ogImage;
                  imgPreview.style.display = 'block';
                  imgPreview.style.backgroundImage = `url('${data.ogImage}')`;
              }
          }
      });
  });

  // Content Script 함수 (웹페이지 내부에서 실행됨)
  function getPageMetaInfo() {
      const selection = window.getSelection().toString();
      
      // OG 이미지 찾기
      const metaImg = document.querySelector('meta[property="og:image"]');
      let ogImage = metaImg ? metaImg.content : "";
      
      // 없으면 img 태그 중 큰 것 찾기
      if (!ogImage) {
          const imgs = document.querySelectorAll('img');
          for(let img of imgs) {
              if(img.width > 200 && img.height > 100) {
                  ogImage = img.src;
                  break;
              }
          }
      }
      return { selection, ogImage };
  }

  // 4. 태그 기능
  // 엔터키 입력 처리
  tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          addTagFromInput();
      }
  });
  
  tagInput.addEventListener('blur', () => {
      addTagFromInput();
  });

  function addTagFromInput() {
      let val = tagInput.value.trim().toUpperCase();
      if (val) {
          const newTags = val.split(',').map(t => t.trim()).filter(t => t && !tags.includes(t));
          tags.push(...newTags);
          tagInput.value = '';
          renderTags();
      }
  }

  function renderTags() {
      tagContainer.innerHTML = '';
      tags.forEach((tag, idx) => {
          const chip = document.createElement('div');
          chip.className = 'tag-chip';
          chip.innerHTML = `#${tag} <i class="fa-solid fa-xmark"></i>`;
          chip.querySelector('i').addEventListener('click', () => {
              tags.splice(idx, 1);
              renderTags();
          });
          tagContainer.appendChild(chip);
      });
  }

  // 5. 리마인드 기능 (기존 로직 유지)
  function updateDateDisplay(dateStr) {
      if (!dateStr) {
          dateDisplay.innerText = "직접 날짜 / 시간 선택하기";
          calendarTrigger.style.borderColor = "#ddd";
          calendarTrigger.style.backgroundColor = "transparent";
          return;
      }
      const d = new Date(dateStr);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      
      dateDisplay.innerText = `${month}월 ${day}일 ${hour}:${min}`;
      calendarTrigger.style.borderColor = "#3182F6";
      calendarTrigger.style.backgroundColor = "rgba(49, 130, 246, 0.1)";
  }

  toggleBtn.addEventListener('change', (e) => {
      reminderOptions.style.display = e.target.checked ? 'block' : 'none';
      if (!e.target.checked) {
          dateInput.value = '';
          quickBtns.forEach(b => b.classList.remove('active'));
          updateDateDisplay(null);
      }
  });

  calendarTrigger.addEventListener('click', () => { try { dateInput.showPicker(); } catch { dateInput.focus(); } });
  dateInput.addEventListener('change', () => { 
      quickBtns.forEach(b => b.classList.remove('active')); 
      updateDateDisplay(dateInput.value); 
  });
  
  function setQuickDate(daysToAdd, setHour) {
      const d = new Date();
      d.setDate(d.getDate() + daysToAdd);
      d.setHours(setHour, 0, 0, 0);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
      dateInput.value = localISOTime;
      updateDateDisplay(localISOTime);
      if (!toggleBtn.checked) { toggleBtn.checked = true; reminderOptions.style.display = 'block'; }
  }
  
  if(document.getElementById('btnTomorrow')) document.getElementById('btnTomorrow').onclick = function() { setQuickDate(1, 9); setActiveBtn(this); };
  if(document.getElementById('btnWeekend')) document.getElementById('btnWeekend').onclick = function() { const d=new Date(); const day=d.getDay(); const dist=6-day+(day===6?7:0); setQuickDate(dist, 10); setActiveBtn(this); };
  if(document.getElementById('btnNextWeek')) document.getElementById('btnNextWeek').onclick = function() { const d=new Date(); const day=d.getDay(); const dist=(8-day)%7||7; setQuickDate(dist, 9); setActiveBtn(this); };
  function setActiveBtn(target) { quickBtns.forEach(b => b.classList.remove('active')); target.classList.add('active'); }


  // 6. [저장하기] (게스트 / 로그인 분기)
  document.getElementById('saveBtn').addEventListener('click', async () => {
      
      // 저장 누를 때 입력창에 글자 남아있으면 태그로 변환
      addTagFromInput();

      const title = document.getElementById('pageTitle').value.trim();
      if (!title) { setStatus("제목을 입력해주세요.", "red"); return; }

      setStatus("저장 중...", "#3182F6");

      // 태그 목록 로컬 업데이트 (다음에 자동완성 등으로 쓸 수 있게)
      await updateKnownTags(tags);

      const bookmarkData = {
          url: document.getElementById('pageUrl').value,
          title: title,
          content: document.getElementById('selectedText').value,
          memo: document.getElementById('memo').value,
          tags: tags, 
          tag: tags.length > 0 ? tags[0] : 'ETC', // 대표 태그
          image: ogImageUrlInput.value, // 이미지 URL 포함
          reminderAt: toggleBtn.checked && dateInput.value ? new Date(dateInput.value).toISOString() : null,
          createdAt: new Date().toISOString()
      };

      if (token) {
          // A. 로그인 유저 -> 서버 전송
          try {
              // userId 필요시 (백엔드 로직에 따라 다름)
              const storedUser = await chrome.storage.local.get(['userId']);
              const userId = storedUser.userId ? Number(storedUser.userId) : 1;
              bookmarkData.userId = userId;

              const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(bookmarkData)
              });

              if (response.ok) {
                  setStatus("서버 저장 성공!", "green");
                  setTimeout(() => window.close(), 1000);
              } else if (response.status === 401) {
                  setStatus("인증 만료. 다시 로그인하세요.", "red");
              } else {
                  setStatus(`서버 오류 (${response.status})`, "red");
              }
          } catch (error) {
              console.error(error);
              setStatus("서버 연결 실패", "red");
          }
      } else {
          // B. 게스트 유저 -> 로컬 스토리지 저장
          // 게스트 데이터는 서버로 안 가고 크롬 브라우저에만 저장됨.
          // 대시보드(웹)에서는 직접 접근 불가. 나중에 로그인 시 동기화하거나 content script로 띄워줘야 함.
          chrome.storage.local.get(['guestBookmarks'], (res) => {
              const guestList = res.guestBookmarks || [];
              bookmarkData.id = 'guest_' + Date.now();
              bookmarkData.isSynced = false; 
              guestList.unshift(bookmarkData);

              chrome.storage.local.set({ guestBookmarks: guestList }, () => {
                  setStatus("게스트 모드로 저장됨 (내 기기)", "orange");
                  setTimeout(() => window.close(), 1200);
              });
          });
      }
  });

  function updateKnownTags(usedTags) {
      return new Promise((resolve) => {
          if (!usedTags || usedTags.length === 0) { resolve(); return; }
          chrome.storage.local.get(['localTags'], (res) => {
              let savedTags = res.localTags || [];
              let isChanged = false;
              usedTags.forEach(tagName => {
                  if (!savedTags.find(t => t.name === tagName)) {
                      savedTags.push({ name: tagName, color: '#ffadad4D', createdAt: new Date().toISOString() });
                      isChanged = true;
                  }
              });
              if (isChanged) {
                  chrome.storage.local.set({ localTags: savedTags }, resolve);
              } else {
                  resolve();
              }
          });
      });
  }

  // 7. 페이지 이동 기능
  const IS_DEV = !('update_url' in chrome.runtime.getManifest()); // 로컬 로드면 true인 경우 많음
  const baseUrl = IS_DEV
    ? 'http://127.0.0.1:5500/'
    : 'https://my-save-fe.vercel.app/';
  const dashboardBtn = document.getElementById('goToDashboardBtn');
  if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: `${baseUrl}dashboard/dashboard.html` });
      });
  }
  const bookmarkListBtn = document.getElementById('goToBookmarkListBtn');
  if (bookmarkListBtn) {
      bookmarkListBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: `${baseUrl}bookmark/bookmark.html` });
      });
  }

});