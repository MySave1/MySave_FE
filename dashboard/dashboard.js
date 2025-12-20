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

// 태그 색상
const TAG_PALETTE = [
    { bg: "#3182F64D", dot: "#3182F6" }, // blue
    { bg: "#22C55E4D", dot: "#22C55E" }, // green
    { bg: "#F973164D", dot: "#F97316" }, // orange
    { bg: "#A855F74D", dot: "#A855F7" }, // purple
    { bg: "#EF44444D", dot: "#EF4444" }, // red
    { bg: "#14B8A64D", dot: "#14B8A6" }, // teal
    { bg: "#EAB3084D", dot: "#EAB308" }, // yellow
    { bg: "#64748B4D", dot: "#64748B" }, // slate
  ];
  
  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }
    function pickTagColor(tagName) {
    const idx = hashString((tagName || "").toUpperCase()) % TAG_PALETTE.length;
    return TAG_PALETTE[idx];
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
  
    allData.sort((a, b) => {
      const aId = typeof a.id === "number" ? a.id : 0;
      const bId = typeof b.id === "number" ? b.id : 0;
      if (bId !== aId) return bId - aId;
        return (b.date || "").localeCompare(a.date || "");
    });
  
    return allData.slice(0, 6);
  }
  

// =============================
// 3. 통계 업데이트 (HTML의 '데이터 계산 중' 해결)
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

    // 2. 미완료 리마인드 (전체 및 오늘 마감)
    const totalRemindEl = document.getElementById("totalReminderCount");
    const todayRemindDesc = document.getElementById("todayReminderDesc");
    const allReminders = bookmarks.filter(b => !!b.reminderTime);
    const unreadReminders = allReminders.filter(r => !r.isRead);

    if (totalRemindEl) totalRemindEl.textContent = unreadReminders.length;

    const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

    const dueTodayAll = allReminders.filter(r => isSameDay(new Date(r.reminderTime), now)).length;

    if (todayRemindDesc) {
    todayRemindDesc.textContent = `오늘 마감되는 항목 ${dueTodayAll} 건`;
    }

    // 사이드바 태그 클라우드 렌더링
    const cloud = document.querySelector(".tag-cloud");
    if (cloud) {
    cloud.innerHTML = "";
    const masterTags = getTagList();

    const tagMeta = {};

    bookmarks.forEach(b => {
        const t = (b.tag || "ETC").toUpperCase();
        if (!tagMeta[t]) tagMeta[t] = { count: 0, latestSaved: 0 };

        tagMeta[t].count += 1;

        let savedTs = 0;

        if (typeof b.id === "number") {
        savedTs = b.id;
        } else if (b.reminderTime) {
        const rt = Date.parse(b.reminderTime);
        savedTs = Number.isFinite(rt) ? rt : 0;
        } else if (b.date) {
        // "2025.12.20" -> timestamp
        const parts = b.date.split(".");
        if (parts.length === 3) {
            const y = Number(parts[0]);
            const m = Number(parts[1]) - 1;
            const d = Number(parts[2]);
            const dt = new Date(y, m, d).getTime();
            savedTs = Number.isFinite(dt) ? dt : 0;
        }
        }

        if (savedTs > tagMeta[t].latestSaved) tagMeta[t].latestSaved = savedTs;
    });

    const sortedTags = Object.entries(tagMeta)
        .map(([name, v]) => ({ name, count: v.count, latestSaved: v.latestSaved }))
        .sort((a, b) =>
        b.count - a.count ||
        b.latestSaved - a.latestSaved ||
        a.name.localeCompare(b.name, "ko-KR", { numeric: true, sensitivity: "base" })
        );

    const topTagEl = document.querySelector(".stat-card:nth-child(3) .stat-value");
    if (topTagEl) {
        if (!sortedTags.length) {
        topTagEl.textContent = "없음";
        } else {
        const topCount = sortedTags[0].count;
        const tied = sortedTags
        .filter(t => t.count === topCount)
        .sort((a, b) =>
          b.latestSaved - a.latestSaved ||
          a.name.localeCompare(b.name, "ko-KR", { numeric: true, sensitivity: "base" })
        );
        const mainName = tied[0].name;
        const extra = tied.length - 1;

        topTagEl.innerHTML =
            extra > 0
            ? `${mainName} <span class="badge">+ ${extra}</span>`
            : `${mainName} <span class="badge">Top 1</span>`;
        }
    }

    sortedTags.slice(0, 5).forEach(tag => {
        const info = masterTags.find(m => m.name.toUpperCase() === tag.name);

        const span = document.createElement("span");
        span.className = "tag-pill";
        span.textContent = `#${tag.name}`;
        span.style.backgroundColor = info ? (info.color || info.bg) : "#3182F64D";

        span.onclick = () => {
        location.href = `../bookmark/bookmark.html?tag=${encodeURIComponent(tag.name)}`;
        };

        cloud.appendChild(span);
    });
    }


    // 4. 읽기 달성률 (Progress)
    const rateEl = document.querySelector(".stat-card:nth-child(4) .stat-value");
    const weeklyDescEl = document.getElementById("weeklyDesc");
    
    if (rateEl) {
        const total = bookmarks.length;
        const readCount = bookmarks.filter(b => b.isRead).length;
        const rate = total === 0 ? 0 : Math.round((readCount / total) * 100);
        rateEl.innerHTML = `${rate} <span class="unit">%</span>`;
        
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
    
    // 데이터가 없을 때의 처리
    container.innerHTML = data.length ? "" : '<p style="grid-column:1/-1; text-align:center; color:#ccc; padding:50px;">저장된 북마크가 없습니다.</p>';

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        
        // 배경 이미지 또는 기본 배경색 설정
        const bgStyle = item.image 
            ? `background-image:url('${item.image}'); background-size:cover; background-position:center;` 
            : `background-color:${item.bgColor || "#eee"};`;
        
        // 리마인드 아이콘 정의 (리마인드 설정 시에만 생성)
        const reminderIcon = item.reminderTime 
            ? `<div class="control-icon reminder-icon" title="리마인드 설정됨">
                    <i class="fa-solid fa-bell"></i>
               </div>` 
            : "";

        card.innerHTML = `
            <div class="card-img" style="${bgStyle} height:160px; position:relative; overflow:hidden;">
                <div class="card-controls">
                    ${reminderIcon}
                    <div class="control-icon delete-icon" onclick="event.stopPropagation(); deleteBookmark(${item.id})">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                </div>
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

        // 카드 클릭 시 상세 페이지 이동
        card.onclick = () => { 
            localStorage.setItem("currentBookmarkId", item.id); 
            location.href = `../bookmarkContent/bookmarkContent.html?id=${item.id}`; 
        };
        
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
    const btnTomorrow = document.getElementById("btnTomorrow");
    const btnWeekend = document.getElementById("btnWeekend");
    const btnNextWeek = document.getElementById("btnNextWeek");
    const calendarTrigger = document.getElementById("calendarTrigger");
    const dateDisplay = document.getElementById("dateDisplay");
    const reminderDateInput = document.getElementById("newReminderDate");

    function pad2(n) { return String(n).padStart(2, "0"); }
    function toDatetimeLocal(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    function toDisplay(d) {
    return `${d.getFullYear()}.${pad2(d.getMonth()+1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    function setReminder(d) {
    if (!reminderDateInput) return;
    reminderDateInput.value = toDatetimeLocal(d);
    if (dateDisplay) dateDisplay.textContent = toDisplay(d);
    }

    // 내일 09:00
    btnTomorrow?.addEventListener("click", (e) => {
    e.preventDefault();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    setReminder(d);
    });

    // 이번 주말(토) 10:00
    btnWeekend?.addEventListener("click", (e) => {
    e.preventDefault();
    const d = new Date();
    const day = d.getDay(); // 0=일 ... 6=토
    const daysToSat = (6 - day + 7) % 7;
    d.setDate(d.getDate() + daysToSat);
    d.setHours(10, 0, 0, 0);
    setReminder(d);
    });

    // 다음주 월요일 09:00
    btnNextWeek?.addEventListener("click", (e) => {
    e.preventDefault();
    const d = new Date();
    const day = d.getDay();
    const daysToNextMon = ((1 - day + 7) % 7) + 7;
    d.setDate(d.getDate() + daysToNextMon);
    d.setHours(9, 0, 0, 0);
    setReminder(d);
    });

    // "직접 날짜 선택" 클릭 -> 숨겨진 datetime-local 열기
    calendarTrigger?.addEventListener("click", () => {
    if (!reminderDateInput) return;
    if (typeof reminderDateInput.showPicker === "function") reminderDateInput.showPicker();
    else reminderDateInput.click();
    });

    // 직접 바꿨을 때 표시 갱신
    reminderDateInput?.addEventListener("change", () => {
    if (!reminderDateInput.value) return;
    const d = new Date(reminderDateInput.value);
    if (dateDisplay) dateDisplay.textContent = toDisplay(d);
    });

    // 저장 버튼 (색상 문제 해결 포함)
    document.getElementById("saveNewBookmarkBtn").onclick = () => {
        const title = document.getElementById("newTitle").value.trim();
        if (!title) return alert("제목을 입력하세요.");

        const tagName = (document.getElementById("newTagInput").value.trim() || "ETC").toUpperCase();
        const masterTags = getTagList();
        let tagInfo = masterTags.find(t => t.name.toUpperCase() === tagName);
        
        if (!tagInfo) {
            const myId = localStorage.getItem("userId") || "guest";
            const picked = pickTagColor(tagName);
          
            tagInfo = {
              id: Date.now(),
              userId: myId,
              name: tagName,
              color: picked.bg,
              dotColor: picked.dot,
            };
          
            masterTags.push(tagInfo);
            localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(masterTags));
          }
          
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