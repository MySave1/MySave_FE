const STORAGE_KEY_BOOKMARKS = "bookmarks";
const STORAGE_KEY_TAGS = "myTagList";

// =============================
// 1. 로컬 스토리지 관리 및 유틸리티
// =============================
function getNow() { return new Date(); }

function getDashboardData() {
    const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify([]));
        return [];
    }
    try {
        const parsed = JSON.parse(stored);
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
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return "https://" + trimmed;
}

// =============================
// 2. 핵심 기능
// =============================
function deleteBookmark(id) {
    if (!confirm("정말로 이 북마크를 삭제하시겠습니까?")) return;
    const allData = getDashboardData();
    const filtered = allData.filter((item) => item.id !== id);
    saveDashboardData(filtered);

    const searchInput = document.querySelector(".search-container input");
    if (searchInput && searchInput.value.trim() !== "") {
        handleSearch(searchInput.value.trim());
    } else {
        renderCards(getRecentSix());
    }
    renderSidebarReminders();
    updateDashboardStats();
}

function toggleStar(element, id) {
    const allData = getDashboardData();
    const targetItem = allData.find((item) => item.id === id);
    if (!targetItem) return;

    targetItem.isStarred = !targetItem.isStarred;
    saveDashboardData(allData);

    element.classList.toggle("fa-solid", targetItem.isStarred);
    element.classList.toggle("fa-regular", !targetItem.isStarred);
    element.style.color = targetItem.isStarred ? "#facc15" : "#ccc";
    updateDashboardStats();
}

function handleSearch(query) {
    const allData = getDashboardData();
    const lowerQuery = query.toLowerCase();
    const filtered = allData.filter((item) => 
        (item.title || "").toLowerCase().includes(lowerQuery) ||
        (item.tag || "").toLowerCase().includes(lowerQuery) ||
        (item.memo || "").toLowerCase().includes(lowerQuery)
    );
    filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    renderCards(filtered.slice(0, 6));
}

function getRecentSix() {
    const allData = getDashboardData();
    allData.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return allData.slice(0, 6);
}

// =============================
// 3. 렌더링 함수
// =============================
function renderCards(data) {
    const cardContainer = document.getElementById("cardContainer");
    if (!cardContainer) return;
    cardContainer.innerHTML = "";

    if (!data || data.length === 0) {
        cardContainer.innerHTML = `<div style="grid-column: 1 / -1; padding:100px 0; text-align:center; color:#bbb;"><p>검색 결과가 없습니다.</p></div>`;
        return;
    }

    data.forEach((item) => {
        const card = document.createElement("div");
        card.className = "card";
        const starIconClass = item.isStarred ? "fa-solid" : "fa-regular";
        const starColor = item.isStarred ? "#facc15" : "#ccc";
        const unreadBadge = !item.isRead ? '<div class="unread-dot"></div>' : "";
        const reminderBadge = item.reminderTime ? `<div class="reminder-badge-icon"><i class="fa-solid fa-bell"></i></div>` : "";
        const bgStyle = item.image ? `background-image:url('${item.image}'); background-size:cover;` : `background-color:${item.bgColor || "#eee"};`;

        card.innerHTML = `
            <div class="card-img" style="${bgStyle} height:160px; position:relative; padding:12px; display:flex; justify-content:space-between;">
                <div style="display:flex; gap:6px;">${unreadBadge}${reminderBadge}</div>
                <div class="card-delete-btn"><i class="fa-solid fa-trash-can"></i></div>
            </div>
            <div class="card-body">
                <h4 class="card-title">${item.title || ""}</h4>
                <div class="card-footer">
                    <span class="tag-badge" style="background-color:${item.tagColor || "#555"}">#${item.tag || "ETC"}</span>
                    <div class="date-star"><span>${item.date || ""}</span><i class="star-btn ${starIconClass} fa-star" style="color:${starColor};"></i></div>
                </div>
            </div>`;

        card.onclick = () => { localStorage.setItem("currentBookmarkId", item.id); location.href = `../bookmarkContent/bookmarkContent.html?id=${item.id}`; };
        card.querySelector(".star-btn").onclick = (e) => { e.stopPropagation(); toggleStar(e.target, item.id); };
        card.querySelector(".card-delete-btn").onclick = (e) => { e.stopPropagation(); deleteBookmark(item.id); };
        cardContainer.appendChild(card);
    });
}

function renderSidebarReminders() {
    const container = document.getElementById("sidebarReminderList");
    if (!container) return;
    const bookmarks = getDashboardData();
    let reminders = bookmarks.filter(item => item.reminderTime && !item.isRead);

    if (reminders.length === 0) {
        container.innerHTML = `<p style="padding:20px; text-align:center; color:#ccc;">예정된 알림이 없습니다.</p>`;
        return;
    }
    reminders.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
    
    const now = getNow();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const groups = { today: [], tomorrow: [], upcoming: [] };

    reminders.forEach(item => {
        const itemDate = new Date(item.reminderTime);
        const itemDayOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const diffDays = Math.round((itemDayOnly - todayStart) / 86400000);
        
        item.displayTime = itemDate.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
        item.displayDate = `${itemDate.getMonth() + 1}월 ${itemDate.getDate()}일`;
        
        if (diffDays === 0) groups.today.push(item);
        else if (diffDays === 1) groups.tomorrow.push(item);
        else if (diffDays > 1) groups.upcoming.push(item);
    });

    container.innerHTML = 
        (groups.today.length ? createSidebarGroupHTML("오늘", "blue", groups.today.slice(0, 3)) : "") +
        (groups.tomorrow.length ? createSidebarGroupHTML("내일", "yellow", groups.tomorrow.slice(0, 3)) : "") +
        (groups.upcoming.length ? createSidebarGroupHTML("예정", "gray", groups.upcoming.slice(0, 3), true) : "");
}

function createSidebarGroupHTML(label, color, items, showDate = false) {
    const listHTML = items.map(item => `
        <div class="reminder-item" onclick="location.href='../bookmarkContent/bookmarkContent.html?id=${item.id}'">
            <span class="time">${showDate ? item.displayDate + " " : ""}${item.displayTime}</span>
            <span class="task">${item.title}</span>
        </div>`).join("");
    return `<div class="day-group"><div class="day-label"><span class="dot ${color}"></span> ${label}</div>${listHTML}</div>`;
}

// =============================
// 4. 통계 및 초기화
// =============================
function updateDashboardStats() {
    const bookmarks = getDashboardData();
    const now = getNow();
    const todayStr = toDateStr(now);

    // 1. 오늘 저장 건수
    const todaySavedEl = document.querySelector(".stat-card:nth-child(1) .stat-value");
    if (todaySavedEl) {
        const count = bookmarks.filter(b => b.date === todayStr).length;
        todaySavedEl.innerHTML = `${count} <span class="unit">건</span>`;
    }

    // 2. 미완료 리마인드
    const totalRemindEl = document.getElementById("totalReminderCount");
    const todayRemindDesc = document.getElementById("todayReminderDesc");
    const activeReminders = bookmarks.filter(b => b.reminderTime && !b.isRead);
    if (totalRemindEl) totalRemindEl.textContent = activeReminders.length;
    if (todayRemindDesc) {
        const dueToday = activeReminders.filter(r => new Date(r.reminderTime).toDateString() === now.toDateString()).length;
        todayRemindDesc.textContent = `오늘 마감되는 항목 ${dueToday} 건`;
    }

    // 3. 최다 태그 및 사이드바 태그 클라우드
    const tagCount = {};
    bookmarks.forEach(b => { 
        const t = (b.tag || "ETC").toUpperCase(); 
        tagCount[t] = (tagCount[t] || 0) + 1; 
    });
    const sortedTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    
    const topTagEl = document.querySelector(".stat-card:nth-child(3) .stat-value");
    if (topTagEl) topTagEl.innerHTML = sortedTags.length ? `${sortedTags[0].name} <span class="badge">Top 1</span>` : "없음";

    const cloud = document.querySelector(".tag-cloud");
    if (cloud) {
        cloud.innerHTML = "";
        const masterTags = getTagList(); // 태그 관리 페이지 데이터 가져오기
        
        sortedTags.slice(0, 5).forEach(tag => {
            // [핵심] 마스터 리스트에서 일치하는 색상 찾기
            const info = masterTags.find(m => m.name.toUpperCase() === tag.name);
            
            const span = document.createElement("span");
            span.className = "tag-pill";
            span.textContent = `#${tag.name}`;
            // 저장된 색상이 있으면 사용, 없으면 기본 파란색 적용
            span.style.backgroundColor = info ? info.color : "#3182F64D";
            span.onclick = () => location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tag.name)}`;
            cloud.appendChild(span);
        });
    }

    // 4. 읽기 달성률
    const rateEl = document.querySelector(".stat-card:nth-child(4) .stat-value");
    if (rateEl) {
        const rate = bookmarks.length ? Math.round((bookmarks.filter(b => b.isRead).length / bookmarks.length) * 100) : 0;
        rateEl.innerHTML = `${rate} <span class="unit">%</span>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCards(getRecentSix());
    renderSidebarReminders();
    updateDashboardStats();

    const modal = document.getElementById("addBookmarkModal");
    const dateInput = document.getElementById("newReminderDate");
    const dateDisplay = document.getElementById("dateDisplay");

    if(document.getElementById("openAddModalBtn")) {
        document.getElementById("openAddModalBtn").onclick = () => modal.style.display = "flex";
    }
    
    const closeBtn = document.querySelector(".close-modal");
    if(closeBtn) {
        closeBtn.onclick = () => modal.style.display = "none";
    }

    const setDate = (d) => {
        const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        dateInput.value = localISO;
        dateDisplay.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const btnTomorrow = document.getElementById("btnTomorrow");
    if(btnTomorrow) {
        btnTomorrow.onclick = () => { const d = getNow(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0); setDate(d); };
    }

    const saveBtn = document.getElementById("saveNewBookmarkBtn");
    if (saveBtn) {
        saveBtn.onclick = () => {
            const titleInput = document.getElementById("newTitle");
            const title = titleInput.value.trim();
            if (!title) return alert("제목을 입력하세요.");

            const tagName = (document.getElementById("newTagInput").value.trim() || "ETC").toUpperCase();
            
            // [핵심] 새 북마크 저장 시에도 마스터 태그 색상 확인
            const masterTags = getTagList();
            const tagInfo = masterTags.find(t => t.name.toUpperCase() === tagName);

            const newItem = {
                id: Date.now(),
                title,
                url: normalizeUrl(document.getElementById("newUrl").value),
                tag: tagName,
                // 설정된 색상이 있으면 적용, 없으면 기본값
                tagColor: tagInfo ? tagInfo.color : "#3182F64D",
                date: toDateStr(getNow()),
                isStarred: false,
                isRead: false,
                memo: document.getElementById("newMemo").value,
                content: document.getElementById("newContent").value,
                reminderTime: document.getElementById("newReminderToggle").checked && dateInput.value ? new Date(dateInput.value).toISOString() : null
            };

            const data = getDashboardData();
            data.unshift(newItem);
            saveDashboardData(data);
            
            // UI 갱신
            modal.style.display = "none";
            // 입력 필드 초기화
            titleInput.value = "";
            document.getElementById("newUrl").value = "";
            document.getElementById("newTagInput").value = "";
            
            renderCards(getRecentSix());
            renderSidebarReminders();
            updateDashboardStats();
            
            alert("북마크가 저장되었습니다.");
        };
    }
});