document.addEventListener('DOMContentLoaded', () => {
    const currentId = localStorage.getItem('currentBookmarkId');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const isEditModeOnEntry = localStorage.getItem('editMode') === 'true'; 
    localStorage.removeItem('editMode'); 

    if (!currentId || bookmarks.length === 0) {
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

    renderDetail(currentData);
    renderReminderUI(currentData);
    setupEventListeners(currentData, bookmarks);
    setupReminderEvents(currentData, bookmarks);

    if (isEditModeOnEntry) {
        toggleMainContentEdit(currentData, bookmarks);
    }
});

let isContentEditing = false;
function toggleMainContentEdit(currentData, allBookmarks) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');
    const editBtn = document.getElementById('mainEditBtn');
    const EDIT_STYLE = "1px dashed #3183f67e";
    const EDIT_BG = "#f8f9ffcf";

    if (!isContentEditing) {
        isContentEditing = true;
        titleEl.contentEditable = true;
        contentEl.contentEditable = true;
        [titleEl, contentEl].forEach(el => {
            el.style.border = EDIT_STYLE;
            el.style.backgroundColor = EDIT_BG;
            el.style.outline = "none";
        });
        titleEl.style.padding = "10px";
        contentEl.style.padding = "20px";
        if (editBtn) {
            editBtn.classList.add('editing');
            editBtn.innerHTML = '<span>저장 완료</span>';
        }
        titleEl.focus();
    } else {
        currentData.title = titleEl.textContent;
        currentData.content = contentEl.innerHTML;
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        isContentEditing = false;
        titleEl.contentEditable = false;
        contentEl.contentEditable = false;
        [titleEl, contentEl].forEach(el => {
            el.style.border = "none";
            el.style.backgroundColor = "transparent";
            el.style.padding = "0";
        });
        if (editBtn) {
            editBtn.classList.remove('editing');
            editBtn.innerHTML = '<span>수정하기</span>';
        }
        alert('내용이 저장되었습니다.');
    }
}

function renderDetail(data) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');
    titleEl.textContent = data.title || "제목 없음";
    contentEl.innerHTML = data.content || "내용이 없습니다.";
    const tagEl = document.getElementById('detailTag');
    tagEl.textContent = data.tag ? `#${data.tag}` : "#태그없음";
    tagEl.style.backgroundColor = data.tagColor || '#555';
    document.getElementById('detailDate').textContent = data.date || "";
    const imgArea = document.getElementById('detailImageArea');
    if (data.image) {
        imgArea.style.display = 'block';
        imgArea.innerHTML = `<img src="${data.image}" style="width:100%; height:100%; object-fit:cover; border-radius:24px;">`;
    } else {
        imgArea.style.display = 'none';
    }
    updateReadStatusUI(document.getElementById('readStatusBtn'), data.isRead);
    updateStarUI(document.querySelector('#detailStarBtn i'), data.isStarred);
    document.getElementById('detailAiSummary').textContent = data.aiSummary || "요약된 내용이 없습니다.";
    document.getElementById('detailMemo').value = data.memo || "";
}

function setupEventListeners(currentData, allBookmarks) {
    document.querySelector('.btn-back').onclick = (e) => {
        e.preventDefault();
        const prevPage = document.referrer;

        if (prevPage.includes('dashboard.html')) {
            window.location.href = '../dashboard/dashboard.html';
        } else if (prevPage.includes('bookmark.html')) {
            window.location.href = '../bookmark/bookmark.html';
        } else {
            window.location.href = '../bookmark/bookmark.html';
        }
    };
    document.getElementById('mainEditBtn').onclick = () => toggleMainContentEdit(currentData, allBookmarks);
    document.getElementById('detailStarBtn').onclick = function() {
        currentData.isStarred = !currentData.isStarred;
        updateStarUI(this.querySelector('i'), currentData.isStarred);
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
    };
    const memoArea = document.getElementById('detailMemo');
    const memoBtn = document.getElementById('editMemoBtn');
    memoBtn.onclick = () => {
        if (memoArea.readOnly) {
            memoArea.readOnly = false; memoArea.focus(); memoArea.style.border = "1px solid #3182F6";
            memoBtn.innerText = '메모 저장';
        } else {
            memoArea.readOnly = true; memoArea.style.border = "none";
            currentData.memo = memoArea.value;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            memoBtn.innerText = '메모 수정하기';
            alert('메모가 저장되었습니다.');
        }
    };
    document.getElementById('readStatusBtn').onclick = function() {
        currentData.isRead = !currentData.isRead;
        updateReadStatusUI(this, currentData.isRead);
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
    };
}

function renderReminderUI(data) {
    const displayEl = document.getElementById('reminderDisplay');
    const delBtn = document.getElementById('deleteReminderBtn');
    const toggleBtn = document.getElementById('toggleReminderBtn');
    if (data.reminderTime) {
        const dateObj = new Date(data.reminderTime);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        displayEl.innerHTML = `<strong style="color:#3182F6;">${dateStr} ${timeStr}</strong><br>알림 예정 🔔`;
        toggleBtn.textContent = "시간 수정";
        delBtn.style.display = "inline-block";
    } else {
        displayEl.innerHTML = `<p style="color: #aaa; font-size: 14px;">리마인드가 설정되지 않았습니다.</p>`;
        toggleBtn.textContent = "설정하기";
        delBtn.style.display = "none";
    }
}

/**
 * 리마인드 이벤트 (퀵 버튼 로직 포함)
 */
function setupReminderEvents(currentData, allBookmarks) {
    const toggle = document.getElementById('toggleReminderBtn');
    const save = document.getElementById('saveReminderBtn');
    const del = document.getElementById('deleteReminderBtn');
    const inputArea = document.getElementById('reminderInputArea');
    const dateInput = document.getElementById('reminderDateInput');
    const displayEl = document.getElementById('reminderDisplay');

    // 퀵 버튼 요소
    const btnTomorrow = document.getElementById('btnTomorrow');
    const btnWeekend = document.getElementById('btnWeekend');
    const btnNextWeek = document.getElementById('btnNextWeek');

    const setActiveBtn = (target) => {
        document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
        if(target) target.classList.add('active');
    };

    const setInputDate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date - offset).toISOString().slice(0, 16);
        dateInput.value = localISOTime;
    };

    toggle.onclick = () => {
        displayEl.style.display = 'none';
        inputArea.style.display = 'block';
        save.style.display = 'inline-block';
        toggle.style.display = 'none';
        del.style.display = 'none';
    };

    btnTomorrow.onclick = () => {
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9,0,0,0);
        setInputDate(d); setActiveBtn(btnTomorrow);
    };

    btnWeekend.onclick = () => {
        const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7 || 7); d.setHours(10,0,0,0);
        setInputDate(d); setActiveBtn(btnWeekend);
    };

    btnNextWeek.onclick = () => {
        const d = new Date(); d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7) + 7); d.setHours(9,0,0,0);
        setInputDate(d); setActiveBtn(btnNextWeek);
    };

    dateInput.oninput = () => setActiveBtn(null);

    save.onclick = () => {
        if (!dateInput.value) return alert('날짜를 선택하세요.');
        currentData.reminderTime = new Date(dateInput.value).toISOString();
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        alert('저장되었습니다.');
        inputArea.style.display = 'none'; save.style.display = 'none';
        toggle.style.display = 'inline-block'; displayEl.style.display = 'block';
        renderReminderUI(currentData);
    };

    del.onclick = () => {
        if (confirm("해제하시겠습니까?")) {
            currentData.reminderTime = null;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            renderReminderUI(currentData);
        }
    };
}

function updateReadStatusUI(btn, isRead) {
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');
    if (isRead) {
        btn.classList.add('read'); span.textContent = "읽음 완료"; icon.className = "fa-solid fa-check";
    } else {
        btn.classList.remove('read'); span.textContent = "안 읽음"; icon.className = "fa-regular fa-circle-check";
    }
}

function updateStarUI(icon, isStarred) {
    icon.className = isStarred ? 'fa-solid fa-star' : 'fa-regular fa-star';
    icon.style.color = isStarred ? '#facc15' : '#ccc';
}