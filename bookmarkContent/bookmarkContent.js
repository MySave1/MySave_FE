document.addEventListener('DOMContentLoaded', () => {
    // 1. 데이터 가져오기
    const currentId = localStorage.getItem('currentBookmarkId');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks'));
    const isEditMode = localStorage.getItem('editMode') === 'true'; 

    // 예외 처리
    if (!currentId || !bookmarks) {
        alert('잘못된 접근입니다.');
        window.location.href = 'bookmark.html';
        return;
    }

    const currentData = bookmarks.find(item => item.id == currentId);

    if (!currentData) {
        alert('존재하지 않는 게시글입니다.');
        window.location.href = 'bookmark.html';
        return;
    }

    // 2. 화면 그리기
    renderDetail(currentData);
    
    // 리마인드 UI 렌더링
    renderReminderUI(currentData);

    // 3. 수정 모드 체크
    if (isEditMode) {
        enableMainEditMode(currentData, bookmarks);
    }

    // 4. 이벤트 연결
    setupEventListeners(currentData, bookmarks);
    
    // 리마인드 이벤트 연결
    setupReminderEvents(currentData, bookmarks);
});

function renderDetail(data) {
    // 텍스트 정보
    document.getElementById('detailTitle').textContent = data.title;
    
    const tagEl = document.getElementById('detailTag');
    tagEl.textContent = `#${data.tag}`;
    tagEl.style.backgroundColor = data.tagColor || '#555';

    document.getElementById('detailDate').textContent = data.date;
    
    // 본문 (줄바꿈 처리 포함)
    const contentHtml = data.content ? data.content.replace(/\n/g, '<br>') : "<p>내용이 없습니다.</p>";
    document.getElementById('detailContent').innerHTML = contentHtml;

    // 이미지 처리
    const imageContainer = document.querySelector('.thumbnail-placeholder');
    if (data.image && data.image.trim() !== "") {
        imageContainer.style.display = 'block'; 
        imageContainer.innerHTML = `<img src="${data.image}" alt="Cover Image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
    } else {
        imageContainer.style.display = 'none';
        imageContainer.innerHTML = '';
    }

    // 읽음 상태 버튼 UI 초기화
    const readBtn = document.getElementById('readStatusBtn');
    if (readBtn) {
        updateReadStatusUI(readBtn, data.isRead);
    }

    // 별표 아이콘 상태
    const starIcon = document.querySelector('#detailStarBtn i');
    updateStarUI(starIcon, data.isStarred);

    // 요약 및 메모
    document.getElementById('detailAiSummary').textContent = data.aiSummary || "작성된 요약이 없습니다.";
    document.getElementById('detailMemo').value = data.memo || "";
}

// [수정됨] 이 함수를 renderDetail 밖으로 꺼냈습니다! (전역에서 쓸 수 있게)
function updateReadStatusUI(btnElement, isRead) {
    const textSpan = btnElement.querySelector('span');
    const icon = btnElement.querySelector('i');

    if (isRead) {
        btnElement.classList.add('read'); // 초록색 스타일 클래스 추가
        textSpan.textContent = "읽음 완료";
        icon.className = "fa-solid fa-check";
    } else {
        btnElement.classList.remove('read'); // 스타일 제거 (회색됨)
        textSpan.textContent = "안 읽음";
        icon.className = "fa-regular fa-circle-check"; 
    }
}

// 리마인드 UI 렌더링 함수
function renderReminderUI(data) {
    const displayEl = document.getElementById('reminderDisplay');
    const toggleBtn = document.getElementById('toggleReminderBtn');
    const deleteBtn = document.getElementById('deleteReminderBtn');

    if (data.reminderTime) {
        // 설정된 날짜가 있으면
        const dateObj = new Date(data.reminderTime);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        
        displayEl.innerHTML = `
        <strong style="display:block; margin-bottom: 8px; color:#3182F6; font-size: 16px;">
            ${dateStr} ${timeStr}
        </strong>
        <span style="color: #ffffffff;">에 알림이 울립니다. 🔔</span>
        `;        
        toggleBtn.textContent = "시간 수정하기";
        deleteBtn.style.display = "inline-block";
    } else {
        // 없으면
        displayEl.textContent = "리마인드가 설정되지 않았습니다.";
        toggleBtn.textContent = "리마인드 추가";
        deleteBtn.style.display = "none";
    }
}

// 리마인드 이벤트 핸들러
function setupReminderEvents(currentData, allBookmarks) {
    const toggleBtn = document.getElementById('toggleReminderBtn');
    const saveBtn = document.getElementById('saveReminderBtn');
    const deleteBtn = document.getElementById('deleteReminderBtn');
    
    const displayEl = document.getElementById('reminderDisplay');
    const inputArea = document.getElementById('reminderInputArea');
    const dateInput = document.getElementById('reminderDateInput');

    // 1. '추가/수정' 버튼 클릭 시 -> 달력 열기
    toggleBtn.addEventListener('click', () => {
        displayEl.style.display = 'none';
        inputArea.style.display = 'block';
        
        toggleBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'none'; // 수정 중엔 삭제 버튼 숨김

        // 기존 시간이 있으면 입력창에 세팅
        if (currentData.reminderTime) {
            const isoStr = new Date(currentData.reminderTime).toISOString();
            dateInput.value = isoStr.substring(0, 16); 
        }
    });

    // 2. '저장' 버튼 클릭 시
    saveBtn.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        
        if (!selectedDate) {
            alert("날짜와 시간을 선택해주세요.");
            return;
        }

        // 데이터 업데이트
        currentData.reminderTime = new Date(selectedDate).toISOString();
        localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));

        alert("리마인드가 설정되었습니다!");
        
        // UI 리셋
        displayEl.style.display = 'block';
        inputArea.style.display = 'none';
        toggleBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        
        renderReminderUI(currentData); // 텍스트 갱신
    });

    // 3. '삭제' 버튼 클릭 시
    deleteBtn.addEventListener('click', () => {
        if(confirm("리마인드를 삭제하시겠습니까?")) {
            currentData.reminderTime = null; // 데이터 삭제
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
            
            alert("리마인드가 해제되었습니다.");
            renderReminderUI(currentData); // 화면 갱신
        }
    });
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

// 수정 모드 활성화 함수
function enableMainEditMode(currentData, allBookmarks) {
    const titleEl = document.getElementById('detailTitle');
    const contentEl = document.getElementById('detailContent');
    const backNav = document.querySelector('.back-navigation'); 

    // 편집 가능 설정
    titleEl.contentEditable = true;
    contentEl.contentEditable = true;
    
    // 깔끔한 회색 실선으로 변경
    const editStyle = "1px solid #ddd";

    titleEl.style.border = editStyle;
    titleEl.style.backgroundColor = "#fff"; // 배경 흰색
    titleEl.style.outline = "none";
    titleEl.style.padding = "8px"; // 여백 확보
    titleEl.style.borderRadius = "8px";
    
    contentEl.style.border = editStyle;
    contentEl.style.backgroundColor = "#fff";
    contentEl.style.outline = "none";
    contentEl.style.padding = "15px";
    contentEl.style.borderRadius = "8px";
    
    titleEl.focus();

    // 저장 버튼 생성
    if (!document.getElementById('saveMainBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveMainBtn';
        saveBtn.innerText = '수정 완료';
        
        // 버튼 스타일링
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

        // 저장 버튼 클릭 이벤트
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
            titleEl.style.borderRadius = "";
            titleEl.style.backgroundColor = "";
            
            contentEl.contentEditable = false;
            contentEl.style.border = "";
            contentEl.style.padding = "";
            contentEl.style.borderRadius = "";
            contentEl.style.backgroundColor = "";
            
            saveBtn.remove(); 
            localStorage.removeItem('editMode');
        });
    }
}

function setupEventListeners(currentData, allBookmarks) {
    // 1. 뒤로가기 버튼
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const previousPage = localStorage.getItem('previousPage');
            
            if (previousPage === 'dashboard') {
                window.location.href = '../dashboard/dashboard.html';
            } 
            else if (previousPage === 'reminder') {
                window.location.href = '../reminder/reminder.html';
            } 
            else if (previousPage === 'index') {
                window.location.href = '../index/index.html';
            } 
            else {
                window.location.href = '../bookmark/bookmark.html'; 
            }
        });
    }

    // 2. 별표(즐겨찾기) 토글
    const bookmarkBtn = document.getElementById('detailStarBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            const icon = bookmarkBtn.querySelector('i');
            currentData.isStarred = !currentData.isStarred;
            updateStarUI(icon, currentData.isStarred);
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        });
    }

    // 3. 메모 수정/저장 기능
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
    
    // 4. AI 요약 버튼
    const generateSummaryBtn = document.getElementById('generateSummaryBtn');
    if(generateSummaryBtn){
        generateSummaryBtn.addEventListener('click', () => {
            alert('AI 요약 기능은 서버 연동이 필요합니다.');
        });
    }

    // 5. 읽음/안읽음 토글 버튼 (이제 updateReadStatusUI를 찾을 수 있습니다!)
    const readBtn = document.getElementById('readStatusBtn');
    if (readBtn) {
        readBtn.addEventListener('click', () => {
            // 상태 반전
            currentData.isRead = !currentData.isRead;
            
            // UI 즉시 반영
            updateReadStatusUI(readBtn, currentData.isRead);
            
            // 데이터 저장
            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
        });
    }
}