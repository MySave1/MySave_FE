document.addEventListener('DOMContentLoaded', () => {

    // 1. 기본 설정 및 변수 선언
    const API_BASE_URL = "http://localhost:8080"; // 백엔드 주소

    const tagInput = document.getElementById('tagInput');
    const tagContainer = document.getElementById('tagContainer');
    let tags = [];

    const toggleBtn = document.getElementById('reminderToggle');
    const reminderOptions = document.getElementById('reminderOptions');
    const dateInput = document.getElementById('reminderDate');
    const calendarTrigger = document.getElementById('calendarTrigger');
    const dateDisplay = document.getElementById('dateDisplay');
    const quickBtns = document.querySelectorAll('.quick-btn');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        // 크롬 내부 페이지 예외 처리
        if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
            document.getElementById('pageTitle').value = currentTab.title || '내부 페이지';
            document.getElementById('pageUrl').value = currentTab.url;
            document.getElementById('selectedText').value = '선택된 텍스트 없음 (내부 페이지)';
            return; 
        }

        // 값 채우기
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

    function applyQuickDate(dateObj, btnId) {
        const formatted = formatDateTime(dateObj);
        dateInput.value = formatted;
        updateDateDisplay(formatted);
        
        quickBtns.forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(btnId);
        if(btn) btn.classList.add('active');

        if(!toggleBtn.checked) {
            toggleBtn.checked = true;
            reminderOptions.style.display = 'block';
        }
    }

    const btnTomorrow = document.getElementById('btnTomorrow');
    if(btnTomorrow) {
        btnTomorrow.addEventListener('click', function() {
            applyQuickDate(setQuickDate(1, 9), this.id);
        });
    }

    const btnWeekend = document.getElementById('btnWeekend');
    if(btnWeekend) {
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
    if(btnNextWeek) {
        btnNextWeek.addEventListener('click', function() {
            const d = new Date();
            const day = d.getDay();
            const daysToNextMonday = (1 + 7 - day) % 7 || 7;
            d.setDate(d.getDate() + daysToNextMonday);
            d.setHours(9, 0, 0, 0);
            applyQuickDate(d, this.id);
        });
    }

    // 4. 저장하기
    document.getElementById('saveBtn').addEventListener('click', () => {
        
        if (tagInput.value.trim().length > 0) {
            const inputTags = tagInput.value.split(',')
                .map(t => t.trim().replace(/^#/, '').toUpperCase())
                .filter(t => t.length > 0 && !tags.includes(t));
            tags.push(...inputTags);
            tagInput.value = '';
            renderTags();
        }
        
        chrome.storage.local.get(['accessToken', 'userId'], async (result) => { 
            const token = result.accessToken;
            const userId = result.userId ? Number(result.userId) : 1; // 기본값 1

            if (!token) {
                document.getElementById('statusMsg').innerText = "로그인이 필요합니다!";
                document.getElementById('statusMsg').style.color = "red";
                return;
            }

            const bookmarkData = {
                userId: userId,
                url: document.getElementById('pageUrl').value,
                title: document.getElementById('pageTitle').value,
                content: document.getElementById('selectedText').value,
                memo: document.getElementById('memo').value,
                tags: tags,
                reminderAt: toggleBtn.checked && dateInput.value ? new Date(dateInput.value).toISOString() : null
            };

            if (!bookmarkData.title.trim()) {
                document.getElementById('statusMsg').innerText = "제목을 입력해주세요.";
                return;
            }

            document.getElementById('statusMsg').innerText = "서버에 저장 중...";
            document.getElementById('statusMsg').style.color = "blue";

            try {
                const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(bookmarkData)
                });

                if (response.ok) {
                    document.getElementById('statusMsg').innerText = "✅ 저장 성공!";
                    document.getElementById('statusMsg').style.color = "green";
                    setTimeout(() => window.close(), 1000);
                } else {
                    document.getElementById('statusMsg').innerText = `실패 (${response.status})`;
                    document.getElementById('statusMsg').style.color = "red";
                }
            } catch (error) {
                console.error("저장 에러:", error);
                document.getElementById('statusMsg').innerText = "서버 연결 불가";
                document.getElementById('statusMsg').style.color = "red";
            }
        });
    });

    // 5. 페이지 이동 기능
    const baseUrl = 'http://127.0.0.1:5500/';
    document.getElementById('goToDashboardBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: `${baseUrl}dashboard/dashboard.html` });
    });

    document.getElementById('goToBookmarkListBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: `${baseUrl}bookmark/bookmark.html` });
    });
});