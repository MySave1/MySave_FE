const STORAGE_KEY_BOOKMARKS = "bookmarks";
const STORAGE_KEY_TAGS = "myTagList";

// =============================
// 1. 유틸리티 및 데이터 관리
// =============================
function getNow() { return new Date(); }

function getDashboardData() {
    const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    try {
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}

function saveDashboardData(newData) {
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(newData));
}

function getTagList() {
    const stored = localStorage.getItem(STORAGE_KEY_TAGS);
    try {
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}

function toDateStr(d) {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeUrl(url) {
    const trimmed = (url || "").trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
}

// =============================
// 2. 핵심 로직
// =============================
function deleteBookmark(id) {
    if (!confirm("정말로 이 북마크를 삭제하시겠습니까?")) return;
    const allData = getDashboardData();
    const filtered = allData.filter(item => item.id !== id);
    saveDashboardData(filtered);
    renderCards(getRecentSix());
    renderSidebarReminders();
    updateDashboardStats();
}

function toggleStar(element, id) {
    const allData = getDashboardData();
    const targetItem = allData.find(item => item.id === id);
    if (!targetItem) return;

    targetItem.isStarred = !targetItem.isStarred;
    saveDashboardData(allData);

    element.classList.toggle("fa-solid", targetItem.isStarred);
    element.classList.toggle("fa-regular", !targetItem.isStarred);
    element.style.color = targetItem.isStarred ? "#facc15" : "#ccc";
}

function getRecentSix() {
    const allData = getDashboardData();
    allData.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return allData.slice(0, 6);
}

// =============================
// 3. 통계 업데이트 (HTML의 '데이터 계산 중' 해결)
// =============================
function updateDashboardStats() {
    const bookmarks = getDashboardData();
    const now = getNow();
    const todayStr = toDateStr(now);

    // 1) 오늘 저장 건수
    const todaySavedEl = document.querySelector(".stat-card:nth-child(1) .stat-value");
    if (todaySavedEl) {
        const count = bookmarks.filter(b => b.date === todayStr).length;
        todaySavedEl.innerHTML = `${count} <span class="unit">건</span>`;
    }

    // 2) 미완료 리마인드
    const totalRemindEl = document.getElementById("totalReminderCount");
    const todayRemindDesc = document.getElementById("todayReminderDesc");
    const activeReminders = bookmarks.filter(b => b.reminderTime && !b.isRead);
    if (totalRemindEl) totalRemindEl.textContent = activeReminders.length;
    if (todayRemindDesc) {
        const dueToday = activeReminders.filter(r => new Date(r.reminderTime).toDateString() === now.toDateString()).length;
        todayRemindDesc.textContent = `오늘 마감되는 항목 ${dueToday} 건`;
    }

    // 3) 태그 및 사이드바 (색상 통일 문제 해결)
    const tagCount = {};
    bookmarks.forEach(b => { const t = (b.tag || "ETC").toUpperCase(); tagCount[t] = (tagCount[t] || 0) + 1; });
    const sortedTags = Object.entries(tagCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    
    // Top 1 태그 표시
    const topTagEl = document.querySelector(".stat-card:nth-child(3) .stat-value");
    if (topTagEl) topTagEl.innerHTML = sortedTags.length ? `${sortedTags[0].name} <span class="badge">Top 1</span>` : "없음";

    // 사이드바 태그 클라우드 (태그 관리에서 설정한 색상 반영)
    const cloud = document.querySelector(".tag-cloud");
    if (cloud) {
        cloud.innerHTML = "";
        const masterTags = getTagList();
        sortedTags.slice(0, 5).forEach(tag => {
            const info = masterTags.find(m => m.name.toUpperCase() === tag.name);
            const span = document.createElement("span");
            span.className = "tag-pill";
            span.textContent = `#${tag.name}`;
            // 마스터 태그에 등록된 색상이 있으면 사용, 없으면 기본색
            span.style.backgroundColor = info ? (info.color || info.bg) : "#3182F64D";
            span.onclick = () => location.href = `../bookmark/bookmark.html?tag=${tag.name}`;
            cloud.appendChild(span);
        });
    }

    // 4) 주간 읽기 달성률 (데이터 계산 중 해결)
    const weeklyRateEl = document.getElementById("weeklyRate");
    const weeklyDescEl = document.getElementById("weeklyDesc");
    if (weeklyRateEl) {
        const total = bookmarks.length;
        const readCount = bookmarks.filter(b => b.isRead).length;
        const rate = total === 0 ? 0 : Math.round((readCount / total) * 100);
        weeklyRateEl.textContent = rate;
        if (weeklyDescEl) {
            weeklyDescEl.textContent = total === 0 ? "저장된 글이 없습니다." : `전체 ${total}개 중 ${readCount}개 읽음`;
        }
    }
}

// =============================
// 4. 리마인드 및 카드 렌더링
// =============================
function renderCards(data) {
    const container = document.getElementById("cardContainer");
    if (!container) return;
    container.innerHTML = data.length ? "" : '<p style="grid-column:1/-1; text-align:center; color:#ccc; padding:50px;">저장된 북마크가 없습니다.</p>';

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        const bgStyle = item.image ? `background-image:url('${item.image}'); background-size:cover;` : `background-color:${item.bgColor || "#eee"};`;
        
        card.innerHTML = `
            <div class="card-img" style="${bgStyle} height:160px; position:relative;">
                <div class="card-delete-btn" onclick="event.stopPropagation(); deleteBookmark(${item.id})"><i class="fa-solid fa-trash-can"></i></div>
            </div>
            <div class="card-body">
                <h4 class="card-title">${item.title}</h4>
                <div class="card-footer">
                    <span class="tag-badge" style="background-color:${item.tagColor || "#555"}">#${item.tag}</span>
                    <div class="date-star">
                        <span>${item.date}</span>
                        <i class="star-btn ${item.isStarred ? 'fa-solid' : 'fa-regular'} fa-star" 
                           style="color:${item.isStarred ? '#facc15' : '#ccc'}" 
                           onclick="event.stopPropagation(); toggleStar(this, ${item.id})"></i>
                    </div>
                </div>
            </div>`;
        card.onclick = () => { localStorage.setItem("currentBookmarkId", item.id); location.href = `../bookmarkContent/bookmarkContent.html?id=${item.id}`; };
        container.appendChild(card);
    });
}

function renderSidebarReminders() {
    const container = document.getElementById("sidebarReminderList");
    if (!container) return;
    const reminders = getDashboardData().filter(b => b.reminderTime && !b.isRead);
    if (!reminders.length) {
        container.innerHTML = '<p style="padding:20px; text-align:center; color:#ccc;">예정된 알림이 없습니다.</p>';
        return;
    }
    reminders.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
    container.innerHTML = reminders.slice(0, 3).map(r => `
        <div class="reminder-item" onclick="location.href='../bookmarkContent/bookmarkContent.html?id=${r.id}'">
            <span class="time">${new Date(r.reminderTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            <span class="task">${r.title}</span>
        </div>`).join("");
}

// =============================
// 5. 초기화 및 이벤트
// =============================
document.addEventListener("DOMContentLoaded", () => {
    renderCards(getRecentSix());
    renderSidebarReminders();
    updateDashboardStats();

    const modal = document.getElementById("addBookmarkModal");
    const reminderToggle = document.getElementById("newReminderToggle");
    const reminderOptions = document.getElementById("newReminderOptions");

    // 모달 열기/닫기
    document.getElementById("openAddModalBtn").onclick = () => modal.style.display = "flex";
    document.querySelector(".close-modal").onclick = () => modal.style.display = "none";
    
    // 리마인드 옵션 토글
    reminderToggle.onchange = (e) => reminderOptions.style.display = e.target.checked ? "block" : "none";

    // 저장 버튼 (색상 문제 해결 포함)
    document.getElementById("saveNewBookmarkBtn").onclick = () => {
        const title = document.getElementById("newTitle").value.trim();
        if (!title) return alert("제목을 입력하세요.");

        const tagName = (document.getElementById("newTagInput").value.trim() || "ETC").toUpperCase();
        const masterTags = getTagList();
        const tagInfo = masterTags.find(t => t.name.toUpperCase() === tagName);

        const newItem = {
            id: Date.now(),
            title,
            url: normalizeUrl(document.getElementById("newUrl").value),
            tag: tagName,
            tagColor: tagInfo ? (tagInfo.color || tagInfo.bg) : "#3182F64D",
            date: toDateStr(getNow()),
            isStarred: false,
            isRead: false,
            memo: document.getElementById("newMemo").value,
            content: document.getElementById("newContent").value,
            reminderTime: reminderToggle.checked && document.getElementById("newReminderDate").value 
                          ? new Date(document.getElementById("newReminderDate").value).toISOString() : null
        };

        const data = getDashboardData();
        data.unshift(newItem);
        saveDashboardData(data);
        location.reload(); // 저장 후 전체 갱신
    };
});