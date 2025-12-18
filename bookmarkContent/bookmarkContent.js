/**
 * [상세 페이지 통합 스크립트]
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 데이터 가져오기
    const currentId = localStorage.getItem('currentBookmarkId');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    
    // 진입 시 이전 editMode 흔적은 제거하여 의도치 않은 버그 방지
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

    // 2. 초기 렌더링
    renderDetail(currentData);
    renderReminderUI(currentData);

    // 3. 이벤트 연결
    setupEventListeners(currentData, bookmarks);
    setupReminderEvents(currentData, bookmarks);

    // 4. 목록에서 '연필' 아이콘을 눌러 들어온 경우 바로 수정 상태 활성화
    if (isEditModeOnEntry) {
        toggleMainContentEdit(currentData, bookmarks);
    }
});

/**
 * [핵심 기능] 상세 페이지 내에서 수정/저장 즉시 토글
 */
let isContentEditing = false; // 현재 수정 상태인지 추적

function toggleMainContentEdit(currentData, allBookmarks) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');
    const editBtn = document.getElementById('mainEditBtn'); // 상세 페이지 내 수정 버튼

    // 편집 시 시각 효과 (연한 파란색 점선 톤)
    const EDIT_STYLE = "1px dashed #3183f67e";
    const EDIT_BG = "#f8f9ffcf";

    if (!isContentEditing) {
        // --- [수정 모드 시작] ---
        isContentEditing = true;
        titleEl.contentEditable = true;
        contentEl.contentEditable = true;

        // 편집 중임을 알리는 시각적 효과 적용
        [titleEl, contentEl].forEach(el => {
            el.style.border = EDIT_STYLE;
            el.style.backgroundColor = EDIT_BG;
            el.style.outline = "none";
        });
        titleEl.style.padding = "10px";
        contentEl.style.padding = "20px";

        // 버튼 스타일 변경: 'editing' 클래스 추가 (CSS에서 #C5DCFF 배경 적용)
        if (editBtn) {
            editBtn.classList.add('editing');
            editBtn.innerHTML = '<span>저장 완료</span>';
        }
        titleEl.focus();
    } else {
        // --- [저장 모드 실행] ---
        currentData.title = titleEl.textContent;
        currentData.content = contentEl.innerHTML;

        // 로컬 스토리지 데이터 동기화
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));

        // UI 편집 모드 해제
        isContentEditing = false;
        titleEl.contentEditable = false;
        contentEl.contentEditable = false;
        
        [titleEl, contentEl].forEach(el => {
            el.style.border = "none";
            el.style.backgroundColor = "transparent";
            el.style.padding = "0";
        });

        // 버튼 원래대로 복구: 'editing' 클래스 제거
        if (editBtn) {
            editBtn.classList.remove('editing');
            editBtn.innerHTML = '<span>수정하기</span>';
        }
        alert('내용이 저장되었습니다.');
    }
}

/**
 * 상세 페이지 상세 내용 렌더링
 */
function renderDetail(data) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');

    titleEl.textContent = data.title || "제목 없음";
    contentEl.innerHTML = data.content || "내용이 없습니다.";

    const tagEl = document.getElementById('detailTag');
    tagEl.textContent = data.tag ? `#${data.tag}` : "#태그없음";
    tagEl.style.backgroundColor = data.tagColor || '#555';

    document.getElementById('detailDate').textContent = data.date || "";
    
    // 이미지 영역 처리
    const imgArea = document.getElementById('detailImageArea');
    if (data.image && data.image.trim() !== "") {
        imgArea.style.display = 'block';
        imgArea.innerHTML = `<img src="${data.image}" style="width:100%; height:100%; object-fit:cover; border-radius:24px;">`;
    } else {
        imgArea.style.display = 'none';
    }

    // 하단 버튼 및 요약/메모 렌더링
    updateReadStatusUI(document.getElementById('readStatusBtn'), data.isRead);
    updateStarUI(document.querySelector('#detailStarBtn i'), data.isStarred);

    document.getElementById('detailAiSummary').textContent = data.aiSummary || "요약된 내용이 없습니다.";
    document.getElementById('detailMemo').value = data.memo || "";
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners(currentData, allBookmarks) {
    // 뒤로 가기 (목록으로 이동)
    document.querySelector('.btn-back').onclick = (e) => {
        e.preventDefault();
        const prev = localStorage.getItem('previousPage') || 'bookmark';
        window.location.href = `../${prev}/${prev}.html`;
    };

    // [중요] 메인 수정 버튼 클릭 이벤트
    const mainEditBtn = document.getElementById('mainEditBtn');
    if (mainEditBtn) {
        mainEditBtn.onclick = () => toggleMainContentEdit(currentData, allBookmarks);
    }

    // 즐겨찾기(별) 토글
    document.getElementById('detailStarBtn').onclick = function() {
        currentData.isStarred = !currentData.isStarred;
        updateStarUI(this.querySelector('i'), currentData.isStarred);
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
    };

    // 사이드바 메모 수정
    const memoArea = document.getElementById('detailMemo');
    const memoBtn = document.getElementById('editMemoBtn');
    let isMemoEditing = false;

    memoBtn.onclick = () => {
        if (!isMemoEditing) {
            memoArea.readOnly = false;
            memoArea.focus();
            memoArea.style.border = "1px solid #3182F6";
            memoBtn.innerText = '메모 저장';
            isMemoEditing = true;
        } else {
            memoArea.readOnly = true;
            memoArea.style.border = "none";
            currentData.memo = memoArea.value;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            memoBtn.innerText = '메모 수정하기';
            isMemoEditing = false;
            alert('메모가 저장되었습니다.');
        }
    };

    // 읽음 상태 버튼 토글
    document.getElementById('readStatusBtn').onclick = function() {
        currentData.isRead = !currentData.isRead;
        updateReadStatusUI(this, currentData.isRead);
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
    };

    // 태그 인라인 수정 호출
    document.getElementById('detailTag').onclick = () => {
        enableInlineTagEdit(currentData, allBookmarks);
    };
}

/**
 * 리마인드 UI 업데이트
 */
function renderReminderUI(data) {
    const displayEl = document.getElementById('reminderDisplay');
    const delBtn = document.getElementById('deleteReminderBtn');
    const toggleBtn = document.getElementById('toggleReminderBtn');
    
    if (data.reminderTime) {
        const dateObj = new Date(data.reminderTime);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        displayEl.innerHTML = `<strong style="color:#3182F6;">${dateStr} ${timeStr}</strong><br> 에 알림이 있습니다. 🔔`;
        toggleBtn.textContent = "시간 수정";
        delBtn.style.display = "inline-block";
    } else {
        displayEl.innerHTML = `<span>리마인드가 설정되지 않았습니다.</span>`;
        toggleBtn.textContent = "리마인드 설정";
        delBtn.style.display = "none";
    }
}

/**
 * 리마인드 설정 이벤트
 */
function setupReminderEvents(currentData, allBookmarks) {
    const toggle = document.getElementById('toggleReminderBtn');
    const save = document.getElementById('saveReminderBtn');
    const del = document.getElementById('deleteReminderBtn');
    const inputArea = document.getElementById('reminderInputArea');
    const dateInput = document.getElementById('reminderDateInput');
    const displayEl = document.getElementById('reminderDisplay');

    toggle.onclick = () => {
        displayEl.style.display = 'none';
        inputArea.style.display = 'block';
        save.style.display = 'inline-block';
        toggle.style.display = 'none';
        del.style.display = 'none';
    };

    save.onclick = () => {
        const val = dateInput.value;
        if (!val) return alert('날짜를 선택하세요.');
        currentData.reminderTime = new Date(val).toISOString();
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        alert('리마인드가 설정되었습니다!');
        inputArea.style.display = 'none';
        save.style.display = 'none';
        toggle.style.display = 'inline-block';
        displayEl.style.display = 'block';
        renderReminderUI(currentData);
    };

    del.onclick = () => {
        if (confirm("리마인드를 해제하시겠습니까?")) {
            currentData.reminderTime = null;
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            renderReminderUI(currentData);
        }
    };
}

/**
 * UI 유틸리티 함수
 */
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

/**
 * 태그 인라인 수정 드롭다운 생성
 */
function enableInlineTagEdit(currentData, allBookmarks) {
    const tagEl = document.getElementById('detailTag');
    if (document.getElementById('editTagSelect')) return;

    const storedTags = JSON.parse(localStorage.getItem('myTagList')) || [
        { name: "Dev", color: "#a0c4ff" }, { name: "Design", color: "#ffadad" },
        { name: "Work", color: "#caffbf" }, { name: "Etc", color: "#cfcfcf" }
    ];

    tagEl.style.display = 'none';
    const select = document.createElement('select');
    select.id = 'editTagSelect';
    Object.assign(select.style, { padding: "5px 10px", borderRadius: "10px", border: "1px solid #3182F6" });

    storedTags.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        if (t.name === currentData.tag) opt.selected = true;
        select.appendChild(opt);
    });

    tagEl.parentNode.insertBefore(select, tagEl.nextSibling);
    select.onchange = () => {
        const newTagData = storedTags.find(t => t.name === select.value);
        currentData.tag = newTagData.name;
        currentData.tagColor = newTagData.color;
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        tagEl.textContent = `#${newTagData.name}`;
        tagEl.style.backgroundColor = newTagData.color;
        select.remove();
        tagEl.style.display = 'inline-block';
    };
    select.onblur = () => {
        setTimeout(() => { if (select.parentNode) select.remove(); tagEl.style.display = 'inline-block'; }, 200);
    };
}