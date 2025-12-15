document.addEventListener('DOMContentLoaded', () => {
    // 1. 데이터 가져오기
    const currentId = localStorage.getItem('currentBookmarkId');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks'));
    const isEditMode = localStorage.getItem('editMode') === 'true'; 

    if (!currentId || !bookmarks) {
        alert('잘못된 접근입니다.');
        window.location.href = '../bookmark/bookmark.html';
        return;
    }

    const currentData = bookmarks.find(item => item.id == currentId);

    if (!currentData) {
        alert('존재하지 않는 게시글입니다.');
        window.location.href = '../bookmark/bookmark.html';
        return;
    }

    // 2. 화면 그리기
    renderDetail(currentData);
    renderReminderUI(currentData);

    // 3. 수정 모드 체크 (전체 수정 모드)
    if (isEditMode) {
        enableMainEditMode(currentData, bookmarks);
    }

    // 4. 이벤트 연결
    setupEventListeners(currentData, bookmarks);
    setupReminderEvents(currentData, bookmarks);
});

function renderDetail(data) {
    document.getElementById('detailTitle').textContent = data.title;
    
    const tagEl = document.getElementById('detailTag');
    tagEl.textContent = `#${data.tag}`;
    tagEl.style.backgroundColor = data.tagColor || '#555';
    
    // [중요] 태그가 클릭 가능하다는 것을 시각적으로 표시
    tagEl.style.cursor = 'pointer';
    tagEl.title = "클릭하여 태그 변경";

    document.getElementById('detailDate').textContent = data.date;
    
    const contentHtml = data.content ? data.content.replace(/\n/g, '<br>') : "<p>내용이 없습니다.</p>";
    document.getElementById('detailContent').innerHTML = contentHtml;

    const imageContainer = document.querySelector('.thumbnail-placeholder');
    if (data.image && data.image.trim() !== "") {
        imageContainer.style.display = 'block'; 
        imageContainer.innerHTML = `<img src="${data.image}" alt="Cover Image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
    } else {
        imageContainer.style.display = 'none';
        imageContainer.innerHTML = '';
    }

    const readBtn = document.getElementById('readStatusBtn');
    if (readBtn) updateReadStatusUI(readBtn, data.isRead);

    const starIcon = document.querySelector('#detailStarBtn i');
    updateStarUI(starIcon, data.isStarred);

    document.getElementById('detailAiSummary').textContent = data.aiSummary || "작성된 요약이 없습니다.";
    document.getElementById('detailMemo').value = data.memo || "";
}

function setupEventListeners(currentData, allBookmarks) {
    // 1. 뒤로가기
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const previousPage = localStorage.getItem('previousPage');
            if (previousPage === 'dashboard') window.location.href = '../dashboard/dashboard.html';
            else if (previousPage === 'reminder') window.location.href = '../reminder/reminder.html';
            else if (previousPage === 'index') window.location.href = '../index/index.html';
            else window.location.href = '../bookmark/bookmark.html';
        });
    }

    // ============================================================
    // [NEW] 2. 태그 클릭 시 인라인 수정 기능 연결
    // ============================================================
    const tagEl = document.getElementById('detailTag');
    if (tagEl) {
        tagEl.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            enableInlineTagEdit(currentData, allBookmarks);
        });
    }

    // 3. 수정 버튼 (제목/내용 수정용)
    const editBtn = document.getElementById('editContentBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            enableMainEditMode(currentData, allBookmarks);
        });
    }

    // 4. 삭제 버튼
    const deleteBtn = document.getElementById('deleteContentBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm("정말 이 글을 삭제하시겠습니까?")) {
                const newData = allBookmarks.filter(item => item.id !== currentData.id);
                localStorage.setItem('bookmarks', JSON.stringify(newData));
                alert("삭제되었습니다.");
                backBtn.click(); 
            }
        });
    }

    // 5. 즐겨찾기
    const bookmarkBtn = document.getElementById('detailStarBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            const icon = bookmarkBtn.querySelector('i');
            currentData.isStarred = !currentData.isStarred;
            updateStarUI(icon, currentData.isStarred);
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        });
    }

    // 6. 메모 저장
    const editMemoBtn = document.getElementById('editMemoBtn');
    const memoText = document.getElementById('detailMemo');
    let isMemoEditing = false;
    if (editMemoBtn && memoText) {
        editMemoBtn.addEventListener('click', () => {
            if (!isMemoEditing) {
                memoText.readOnly = false;
                memoText.focus();
                memoText.style.border = "1px solid #3182F6";
                memoText.style.padding = "8px";
                editMemoBtn.innerText = '저장하기';
                editMemoBtn.style.backgroundColor = '#4CAF50';
                editMemoBtn.style.color = 'white';
                isMemoEditing = true;
            } else {
                memoText.readOnly = true;
                memoText.style.border = "none";
                memoText.style.padding = "10px";
                editMemoBtn.innerText = '메모 수정하기';
                editMemoBtn.style.backgroundColor = ''; 
                editMemoBtn.style.color = '';
                isMemoEditing = false;
                currentData.memo = memoText.value;
                localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
                alert("메모가 저장되었습니다.");
            }
        });
    }

    // 7. 읽음 상태 토글
    const readBtn = document.getElementById('readStatusBtn');
    if (readBtn) {
        readBtn.addEventListener('click', () => {
            currentData.isRead = !currentData.isRead;
            updateReadStatusUI(readBtn, currentData.isRead);
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        });
    }
}

// ============================================================
// [NEW] 작성해주신 태그 인라인 수정 함수
// ============================================================
function enableInlineTagEdit(currentData, allBookmarks) {
    const tagEl = document.getElementById('detailTag');
    if (!tagEl) return;

    // 이미 열려있으면 중복 방지
    if (document.getElementById('editTagSelect')) return;

    const defaultTags = [
        { name: "Dev", color: "#a0c4ff" }, 
        { name: "Design", color: "#ffadad" }, 
        { name: "Work", color: "#caffbf" }, 
        { name: "News", color: "#ffd6a5" },
        { name: "Idea", color: "#fdffb6" },
        { name: "Study", color: "#bdb2ff" },
        { name: "Etc", color: "#cfcfcf" }
    ];
    const storedTags = JSON.parse(localStorage.getItem('myTagList')) || defaultTags;

    // 태그 뱃지 숨기기
    tagEl.style.display = 'none';

    // wrapper 생성 (화살표 꾸미기)
    const wrapper = document.createElement('span');
    wrapper.className = 'tag-select-wrapper';

    // select 생성
    const tagSelect = document.createElement('select');
    tagSelect.id = 'editTagSelect';

    storedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.name;
        option.textContent = tag.name;
        option.dataset.color = tag.color;
        if (tag.name === currentData.tag) option.selected = true;
        tagSelect.appendChild(option);
    });

    wrapper.appendChild(tagSelect);
    tagEl.parentNode.insertBefore(wrapper, tagEl.nextSibling);

    // 닫기 함수
    const closeSelect = () => {
        if (wrapper.isConnected) wrapper.remove();
        tagEl.style.display = 'inline-block';
        document.removeEventListener('click', handleOutsideClick, true);
    };


    const saveAndClose = () => {
        const selectedOption = tagSelect.options[tagSelect.selectedIndex];
        const newTagName = tagSelect.value;
        const newTagColor = selectedOption.getAttribute('data-color') || '#555';

        currentData.tag = newTagName;
        currentData.tagColor = newTagColor;
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));

        tagSelect.remove();
        tagEl.textContent = `#${newTagName}`;
        tagEl.style.backgroundColor = newTagColor;
        tagEl.style.display = 'inline-block';
    };

    tagSelect.addEventListener('change', saveAndClose);

    tagSelect.addEventListener('blur', () => {
        // change 이벤트가 먼저 발생하고 blur가 발생하므로 약간의 딜레이를 주거나
        // 이미 제거된 경우 에러 방지
        setTimeout(() => {
            if (document.getElementById('editTagSelect')) {
                tagSelect.remove();
                tagEl.style.display = 'inline-block';
            }
        }, 100);
    });
}

function updateReadStatusUI(btnElement, isRead) {
    const textSpan = btnElement.querySelector('span');
    const icon = btnElement.querySelector('i');

    if (isRead) {
        btnElement.classList.add('read');
        textSpan.textContent = "읽음 완료";
        icon.className = "fa-solid fa-check";
    } else {
        btnElement.classList.remove('read');
        textSpan.textContent = "안 읽음";
        icon.className = "fa-regular fa-circle-check"; 
    }
}

function updateStarUI(iconElement, isStarred) {
    if (isStarred) {
        iconElement.className = 'fa-solid fa-star';
        iconElement.style.color = '#facc15';
    } else {
        iconElement.className = 'fa-regular fa-star';
        iconElement.style.color = '';
    }
}

// 기존 제목/내용 수정 함수 (그대로 유지)
function enableMainEditMode(currentData, allBookmarks) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');
    const backNav = document.querySelector('.back-navigation'); 

    titleEl.contentEditable = true;
    contentEl.contentEditable = true;
    
    const editStyle = "1px solid #ddd";

    titleEl.style.border = editStyle;
    titleEl.style.backgroundColor = "#fff"; 
    titleEl.style.outline = "none";
    titleEl.style.padding = "8px"; 
    titleEl.style.borderRadius = "8px";
    
    contentEl.style.border = editStyle;
    contentEl.style.backgroundColor = "#fff";
    contentEl.style.outline = "none";
    contentEl.style.padding = "15px";
    contentEl.style.borderRadius = "8px";
    
    titleEl.focus();

    if (!document.getElementById('saveMainBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveMainBtn';
        saveBtn.innerText = '수정 완료';
        
        Object.assign(saveBtn.style, {
            padding: '8px 16px',
            backgroundColor: '#3182F6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(49, 130, 246, 0.3)',
            marginLeft: 'auto'
        });

        backNav.appendChild(saveBtn);

        saveBtn.addEventListener('click', () => {
            const now = new Date();
            const newDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

            currentData.title = titleEl.textContent;
            currentData.content = contentEl.innerHTML; 
            currentData.date = newDate; 
            
            document.getElementById('detailDate').textContent = newDate;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));

            alert('글이 수정되었습니다.');

            titleEl.contentEditable = false;
            titleEl.style.border = "";
            titleEl.style.padding = ""; 
            titleEl.style.backgroundColor = "";
            contentEl.contentEditable = false;
            contentEl.style.border = "";
            contentEl.style.padding = "";
            contentEl.style.backgroundColor = "";
            
            saveBtn.remove(); 
            localStorage.removeItem('editMode');
        });
    }
}

// 리마인드 UI 함수들 (그대로 유지)
function renderReminderUI(data) {
    const displayEl = document.getElementById('reminderDisplay');
    const toggleBtn = document.getElementById('toggleReminderBtn');
    const deleteBtn = document.getElementById('deleteReminderBtn');

    if (data.reminderTime) {
        const dateObj = new Date(data.reminderTime);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        
        displayEl.innerHTML = `<strong style="display:block; margin-bottom: 8px; color:#3182F6; font-size: 16px;">${dateStr} ${timeStr}</strong><span style="color: #darkgray;">에 알림이 울립니다. 🔔</span>`;        
        toggleBtn.textContent = "시간 수정하기";
        deleteBtn.style.display = "inline-block";
    } else {
        displayEl.textContent = "리마인드가 설정되지 않았습니다.";
        toggleBtn.textContent = "리마인드 추가";
        deleteBtn.style.display = "none";
    }
}

function setupReminderEvents(currentData, allBookmarks) {
    const toggleBtn = document.getElementById('toggleReminderBtn');
    const saveBtn = document.getElementById('saveReminderBtn');
    const deleteBtn = document.getElementById('deleteReminderBtn');
    const displayEl = document.getElementById('reminderDisplay');
    const inputArea = document.getElementById('reminderInputArea');
    const dateInput = document.getElementById('reminderDateInput');

    toggleBtn.addEventListener('click', () => {
        displayEl.style.display = 'none';
        inputArea.style.display = 'block';
        toggleBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'none'; 
        if (currentData.reminderTime) {
            const isoStr = new Date(currentData.reminderTime).toISOString();
            dateInput.value = isoStr.substring(0, 16); 
        }
    });

    saveBtn.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) { alert("날짜와 시간을 선택해주세요."); return; }
        currentData.reminderTime = new Date(selectedDate).toISOString();
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        alert("리마인드가 설정되었습니다!");
        displayEl.style.display = 'block';
        inputArea.style.display = 'none';
        toggleBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        renderReminderUI(currentData);
    });

    deleteBtn.addEventListener('click', () => {
        if(confirm("리마인드를 삭제하시겠습니까?")) {
            currentData.reminderTime = null; 
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            alert("리마인드가 해제되었습니다.");
            renderReminderUI(currentData); 
        }
    });
}