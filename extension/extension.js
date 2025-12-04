document.addEventListener('DOMContentLoaded', () => {

    const tagInput = document.getElementById('tagInput');
    const tagContainer = document.getElementById('tagContainer');
    let tags = [];

    const toggleBtn = document.getElementById('reminderToggle');
    const reminderOptions = document.getElementById('reminderOptions');
    const dateInput = document.getElementById('reminderDate');
    const calendarTrigger = document.getElementById('calendarTrigger');
    const dateDisplay = document.getElementById('dateDisplay');
    const quickBtns = document.querySelectorAll('.quick-btn');

    // 1. URL, Title, Selection 자동 채우기 + URL 유효성 검사 (통합됨)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        // ⭐ URL 유효성 검사: 내부 Chrome 페이지 접근 차단 오류 해결
        if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
            document.getElementById('pageTitle').value = currentTab.title || '내부 페이지';
            document.getElementById('pageUrl').value = currentTab.url;
            document.getElementById('selectedText').value = '선택된 텍스트 없음 (내부 페이지)';
            return; 
        }

        // 유효한 URL인 경우에만 값 채우기 및 스크립트 실행
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

    // 2. 태그 (Input Text 기능)
    tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 

            let newTag = tagInput.value.trim();
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

    // 3. 리마인드 (기존 로직 유지)
    function updateDateDisplay(dateStr) {
        if(!dateStr) {
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

    document.getElementById('btnTomorrow').addEventListener('click', function() {
        applyQuickDate(setQuickDate(1, 9), this.id);
    });
    document.getElementById('btnWeekend').addEventListener('click', function() {
        const d = new Date();
        const day = d.getDay();
        const dist = 6 - day + (day === 6 ? 7 : 0);
        d.setDate(d.getDate() + dist);
        d.setHours(10, 0, 0, 0);
        applyQuickDate(d, this.id);
    });
    document.getElementById('btnNextWeek').addEventListener('click', function() {
        const d = new Date();
        const day = d.getDay();
        const dist = 8 - day;
        d.setDate(d.getDate() + dist);
        d.setHours(9, 0, 0, 0);
        applyQuickDate(d, this.id);
    });

    function applyQuickDate(dateObj, btnId) {
        const formatted = formatDateTime(dateObj);
        dateInput.value = formatted;
        updateDateDisplay(formatted);
        quickBtns.forEach(b => b.classList.remove('active'));
        document.getElementById(btnId).classList.add('active');
    }

    // 4. 저장하기
    document.getElementById('saveBtn').addEventListener('click', () => {
        
        // 최종 태그 처리: 입력 필드에 남아있는 텍스트를 최종 배열에 추가
        if (tagInput.value.trim().length > 0) {
            const inputTags = tagInput.value.split(',')
                .map(t => t.trim().replace(/^#/, ''))
                .filter(t => t.length > 0 && !tags.includes(t));
            
            tags.push(...inputTags);
            tagInput.value = '';
            renderTags();
        }
        
        const newBookmark = {
            id: Date.now(),
            url: document.getElementById('pageUrl').value,
            title: document.getElementById('pageTitle').value,
            text: document.getElementById('selectedText').value,
            memo: document.getElementById('memo').value,
            tags: tags, 
            reminder: toggleBtn.checked,
            reminderDate: toggleBtn.checked ? dateInput.value : null,
            date: new Date().toLocaleDateString(),
            isStarred: false
        };

        if (!newBookmark.title.trim()) {
            document.getElementById('statusMsg').innerText = "제목을 입력해주세요.";
            return;
        }

        // CRITICAL FIX: 데이터 저장 키를 웹 앱과 통일
        chrome.storage.local.get(['bookmarks'], (result) => { 
            const bookmarks = result.bookmarks || []; 
            bookmarks.unshift(newBookmark);
            chrome.storage.local.set({ bookmarks: bookmarks }, () => { 
                document.getElementById('statusMsg').innerText = "✅ 저장되었습니다!";
                setTimeout(() => window.close(), 1000);
            });
        });
    });

    // 5. 페이지 이동 기능
    const baseUrl = 'http://127.0.0.1:5500/'; // ⭐ 사용하시는 로컬 서버 주소에 맞춰 수정하세요
    
    document.getElementById('goToDashboardBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: `${baseUrl}dashboard/dashboard.html` });
    });

    document.getElementById('goToBookmarkListBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: `${baseUrl}bookmark/bookmark.html` });
    });
});