document.addEventListener('DOMContentLoaded', () => {
    const currentId = localStorage.getItem('currentBookmarkId');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    
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
});

function renderDetail(data) {
    document.getElementById('detailTitle').textContent = data.title || "제목 없음";
    
    const tagEl = document.getElementById('detailTag');
    tagEl.textContent = data.tag ? `#${data.tag}` : "#태그없음";
    tagEl.style.backgroundColor = data.tagColor || '#555';
    tagEl.style.cursor = 'pointer';

    document.getElementById('detailDate').textContent = data.date || "";
    
    const detailContentEl = document.getElementById('detailContent');
    detailContentEl.innerHTML = data.content || "<p style='color:#aaa;'>내용이 없습니다.</p>";

    const imgArea = document.getElementById('detailImageArea');
    if (data.image && data.image.trim() !== "") {
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
        const prev = localStorage.getItem('previousPage') || 'bookmark';
        window.location.href = `../${prev}/${prev}.html`;
    };

    document.getElementById('detailTag').onclick = () => enableInlineTagEdit(currentData, allBookmarks);

    document.getElementById('editContentBtn').onclick = () => enableMainEditMode(currentData, allBookmarks);

    document.getElementById('deleteContentBtn').onclick = () => {
        if (confirm("정말 이 글을 삭제하시겠습니까?")) {
            const newData = allBookmarks.filter(item => item.id !== currentData.id);
            localStorage.setItem('bookmarks', JSON.stringify(newData));
            window.location.href = '../bookmark/bookmark.html';
        }
    };

    document.getElementById('detailStarBtn').onclick = function() {
        currentData.isStarred = !currentData.isStarred;
        updateStarUI(this.querySelector('i'), currentData.isStarred);
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
    };

    const memoArea = document.getElementById('detailMemo');
    const memoBtn = document.getElementById('editMemoBtn');
    let isMemoEditing = false;

    memoBtn.onclick = () => {
        if (!isMemoEditing) {
            memoArea.readOnly = false;
            memoArea.focus();
            memoBtn.innerText = '저장하기';
            isMemoEditing = true;
        } else {
            memoArea.readOnly = true;
            currentData.memo = memoArea.value;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            memoBtn.innerText = '메모 수정하기';
            isMemoEditing = false;
            alert('메모가 저장되었습니다.');
        }
    };

    document.getElementById('readStatusBtn').onclick = function() {
        currentData.isRead = !currentData.isRead;
        updateReadStatusUI(this, currentData.isRead);
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
    };
}

function updateReadStatusUI(btn, isRead) {
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');
    if (isRead) {
        btn.classList.add('read');
        span.textContent = "읽음 완료";
        icon.className = "fa-solid fa-check";
    } else {
        btn.classList.remove('read');
        span.textContent = "안 읽음";
        icon.className = "fa-regular fa-circle-check";
    }
}

function updateStarUI(icon, isStarred) {
    if (isStarred) {
        icon.className = 'fa-solid fa-star';
        icon.style.color = '#facc15';
    } else {
        icon.className = 'fa-regular fa-star';
        icon.style.color = '#ccc';
    }
}

function enableInlineTagEdit(currentData, allBookmarks) {
    const tagEl = document.getElementById('detailTag');
    if (document.getElementById('editTagSelect')) return;

    const storedTags = JSON.parse(localStorage.getItem('myTagList')) || [];
    tagEl.style.display = 'none';

    const select = document.createElement('select');
    select.id = 'editTagSelect';
    select.style.padding = "5px 10px";
    select.style.borderRadius = "10px";

    storedTags.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        if (t.name === currentData.tag) opt.selected = true;
        select.appendChild(opt);
    });

    tagEl.parentNode.insertBefore(select, tagEl.nextSibling);
    select.focus();

    select.onchange = () => {
        const newTag = storedTags.find(t => t.name === select.value);
        currentData.tag = newTag.name;
        currentData.tagColor = newTag.color;
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        location.reload();
    };

    select.onblur = () => {
        setTimeout(() => {
            if (select.parentNode) select.remove();
            tagEl.style.display = 'inline-block';
        }, 200);
    };
}

function enableMainEditMode(currentData, allBookmarks) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');
    titleEl.contentEditable = true;
    contentEl.contentEditable = true;
    titleEl.style.border = contentEl.style.border = "2px dashed #3182F6";
    titleEl.focus();

    if (!document.getElementById('saveMainBtn')) {
        const btn = document.createElement('button');
        btn.id = 'saveMainBtn';
        btn.innerText = '수정 완료';
        btn.className = 'btn-light-blue';
        btn.style.cssText = "background-color:#3182F6; color:white; margin-left:10px;";
        document.querySelector('.back-navigation').appendChild(btn);

        btn.onclick = () => {
            currentData.title = titleEl.textContent;
            currentData.content = contentEl.innerHTML;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            alert('수정되었습니다.');
            location.reload();
        };
    }
}

function renderReminderUI(data) {
    const display = document.getElementById('reminderDisplay');
    const delBtn = document.getElementById('deleteReminderBtn');
    const toggleBtn = document.getElementById('toggleReminderBtn');

    if (data.reminderTime) {
        const date = new Date(data.reminderTime);
        const options = { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        display.innerHTML = `<strong style="color:#3182F6;">${date.toLocaleString('ko-KR', options)}</strong> 알림 예정 🔔`;
        delBtn.style.display = "inline-block";
        toggleBtn.innerText = "시간 수정";
    } else {
        display.innerText = "설정된 리마인드가 없습니다.";
        delBtn.style.display = "none";
        toggleBtn.innerText = "리마인드 추가";
    }
}

function setupReminderEvents(currentData, allBookmarks) {
    const toggle = document.getElementById('toggleReminderBtn');
    const save = document.getElementById('saveReminderBtn');
    const del = document.getElementById('deleteReminderBtn');
    const inputArea = document.getElementById('reminderInputArea');
    const dateInput = document.getElementById('reminderDateInput');

    toggle.onclick = () => {
        inputArea.style.display = 'block';
        save.style.display = 'inline-block';
        toggle.style.display = 'none';
        if (currentData.reminderTime) {
            const d = new Date(currentData.reminderTime);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            dateInput.value = d.toISOString().slice(0, 16);
        }
    };

    save.onclick = () => {
        const val = dateInput.value;
        if (!val) return alert('날짜를 선택하세요.');
        currentData.reminderTime = new Date(val).toISOString();
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        location.reload();
    };

    del.onclick = () => {
        if (confirm("리마인드를 해제하시겠습니까?")) {
            currentData.reminderTime = null;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            location.reload();
        }
    };
}