document.addEventListener('DOMContentLoaded', () => {
    const tagInput = document.getElementById('tagInput');
    const tagContainer = document.getElementById('tagContainer'); // 입력된 태그 표시 영역
    const tagChoiceContainer = document.createElement('div'); // 기존 태그 선택 영역 생성
    tagChoiceContainer.className = 'tag-selection-area';
    tagInput.parentNode.appendChild(tagChoiceContainer);

    let tags = [];

    const toggleBtn = document.getElementById('reminderToggle');
    const reminderOptions = document.getElementById('reminderOptions');
    const dateInput = document.getElementById('reminderDate');
    const calendarTrigger = document.getElementById('calendarTrigger');
    const dateDisplay = document.getElementById('dateDisplay');
    const quickBtns = document.querySelectorAll('.quick-btn');

    // 1. 초기 데이터 로드: 웹 앱의 태그 목록 가져오기
    function loadExistingTags() {
        // localStorage는 확장 프로그램과 웹 페이지가 공유되지 않으므로, 
        // 실제 운영 시에는 chrome.storage를 통합해서 사용하거나 
        // 우선은 기본 저장된 태그 목록을 동기화하는 로직이 필요합니다.
        chrome.storage.local.get(['myTagList'], (result) => {
            const myTagList = result.myTagList || [];
            tagChoiceContainer.innerHTML = '';
            
            myTagList.forEach(tag => {
                const chip = document.createElement('div');
                chip.className = 'choice-tag'; // CSS는 dashboard.css의 스타일을 참고
                chip.style.cssText = `background-color: ${tag.color || '#eee'}; color: #333; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer; margin-right: 4px; display: inline-block; margin-top: 5px;`;
                chip.textContent = `#${tag.name}`;
                
                chip.onclick = () => {
                    if (!tags.includes(tag.name)) {
                        tags.push(tag.name.toUpperCase());
                        renderTags();
                    }
                };
                tagChoiceContainer.appendChild(chip);
            });
        });
    }
    loadExistingTags();

    // 2. 태그 입력 (대문자 변환 로직)
    tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            let newTag = tagInput.value.trim().toUpperCase(); // ⭐ 대문자로 변환
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
            icon.onclick = (e) => {
                tags.splice(parseInt(e.target.dataset.idx), 1);
                renderTags();
            };
        });
    }

    // 3. 리마인드 및 기타 UI 로직 (기존 유지)
    // ... (중략: updateDateDisplay, applyQuickDate 등 기존 원본 로직)

    // 4. 저장하기 (통계 및 대문자 태그 연동 핵심)
    document.getElementById('saveBtn').addEventListener('click', () => {
        const title = document.getElementById('pageTitle').value.trim();
        if (!title) { alert("제목을 입력해주세요."); return; }

        // [날짜 포맷 통일] 오늘 저장한 글 통계 연동을 위해 YYYY.MM.DD 형식 사용
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

        // 입력창에 남아있는 텍스트 마지막으로 체크
        if (tagInput.value.trim().length > 0) {
            const lastTag = tagInput.value.trim().toUpperCase();
            if(!tags.includes(lastTag)) tags.push(lastTag);
        }

        const newBookmark = {
            id: Date.now(),
            url: document.getElementById('pageUrl').value,
            title: title,
            content: document.getElementById('selectedText').value,
            memo: document.getElementById('memo').value,
            tag: tags.length > 0 ? tags[0] : 'ETC', // 첫 번째 태그를 대표 태그로 저장
            tags: tags,
            date: dateStr, // ⭐ "오늘 저장한 글" 통계에 잡히도록 포맷팅
            isStarred: false,
            isRead: false,
            hasSummary: !!document.getElementById('selectedText').value,
            reminderTime: toggleBtn.checked ? new Date(dateInput.value).toISOString() : null
        };

        // 데이터 저장
        chrome.storage.local.get(['bookmarks'], (result) => { 
            const bookmarks = result.bookmarks || []; 
            bookmarks.unshift(newBookmark);
            chrome.storage.local.set({ bookmarks: bookmarks }, () => { 
                // ✅ 통계 동기화를 위해 대시보드 새로고침용 메시지 전송 (선택 사항)
                document.getElementById('statusMsg').innerText = "✅ 성공적으로 저장되었습니다!";
                setTimeout(() => window.close(), 1000);
            });
        });
    });
});