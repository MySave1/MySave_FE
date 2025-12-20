# MySave Frontend

MySave는 웹에서 발견한 유용한 정보를 **빠르게 저장**하고, **태그로 분류**하며, **리마인더로 다시 읽기까지 이어지도록** 돕는 북마크 관리 서비스입니다.  
본 저장소는 **정적 HTML/CSS/JS 기반 멀티페이지 웹 프론트엔드**와 **Chrome Extension(원클릭 저장)** UI를 포함합니다.

---

## 1. 프로젝트 소개

### 서비스 한 줄 소개
- “저장 → 분류 → 다시 읽기”까지 한 흐름으로 관리하는 개인 아카이빙 서비스입니다.

### 프론트엔드의 역할
- **웹(정적 페이지)**: 대시보드/목록/상세/태그/리마인더/설정 화면을 제공하고, localStorage 기반으로 데이터를 저장·조회합니다.
- **크롬 확장 프로그램**: 사용자가 보고 있는 페이지에서 URL을 빠르게 가져와 저장을 시작할 수 있도록 돕습니다. (원클릭 저장)

---

## 2. 배포 링크

- FE 배포 URL (Vercel): https://my-save-fe.vercel.app/

---

## 3. 기술 스택

- **Language**: HTML / CSS / JavaScript (Vanilla)
- **CDN**
  - Pretendard
  - Font Awesome
- **Tools**
  - VS Code Live Server
  - Chrome Extension(개발자 모드, 압축 해제 로드)

---

## 4. 실행 방법

### 4.1 로컬 실행(웹)
이 프로젝트는 정적 파일 기반이므로 별도 빌드 과정이 없습니다.

#### Live Server (권장)
1) VS Code에서 프로젝트 폴더 열기  
2) `index.html` 우클릭 → **Open with Live Server**

### 4.2 크롬 확장 실행(압축 해제 로드)

1. 크롬 브라우저 주소창에 `chrome://extensions` 입력
2. 개발자 모드 활성화
3. “압축해제된 확장 프로그램 로드” 클릭
4. `extension/` 폴더 선택 선택하여 로드

---

## 5. 폴더 구조

현재 프론트 구조는 아래와 같습니다.

```text
MySave_FE-feature-FE/
├─ index.html
├─ style.css
├─ script.js
├─ login/
│  ├─ callback.html
│  └─ login.html
├─ dashboard/
│  ├─ dashboard.html
│  ├─ dashboard.css
│  └─ dashboard.js
├─ bookmark/
│  ├─ bookmark.html
│  ├─ bookmark.css
│  └─ bookmark.js
├─ bookmarkContent/
│  ├─ bookmarkContent.html
│  ├─ bookmarkContent.css
│  └─ bookmarkContent.js
├─ tag/
│  ├─ tag.html
│  ├─ tag.css
│  └─ tag.js
├─ reminder/
│  ├─ reminder.html
│  ├─ reminder.css
│  └─ reminder.js
├─ setting/
│  ├─ setting.html
│  ├─ setting.css
│  └─ setting.js
├─ extension/
│  ├─ extension.html
│  ├─ extension.css
│  ├─ extension.js
│  ├─ content.js
│  └─ manifest.json
└─ images/
   └─ screenshots/
```

## 5.1 localStorage 키 구조

이 프로젝트는 별도 상태관리 라이브러리 없이 **localStorage를 데이터 저장소로 사용**합니다.

### 핵심 키
- `bookmarks`: 북마크 목록(Array)
- `myTagList`: 태그 목록(Array)

### 로그인/사용자 관련(흐름에서 사용)
- `accessToken`
- `userId`
- `userName`
- `userEmail`
- `tempNickname` (임시 닉네임 저장용, 선택)

### 페이지 이동/상세 관련
- `currentBookmarkId`: 상세 페이지에서 조회할 북마크 id 저장

> 주의: localStorage는 브라우저/기기별 저장소이므로 기기를 바꾸면 데이터가 공유되지 않습니다.

---

## 6. 화면 구성 및 주요 기능

### 6.1 스크린샷 목록

스크린샷은 `images/screenshots/` 경로에 저장했습니다.

- 01_대시보드
- 02_북마크목록_전체
- 03_북마크목록_즐겨찾기
- 04_북마크상세
- 05_북마크검색
- 06_태그
- 07_리마인드
- 08_설정
- 09_대시보드_북마크직접추가
- 10_확장프로그램_대표이미지존재x
- 11_확장프로그램_대표이미지존재
- 12_확장프로그램_리마인더설정
- index_초기화면

---

### 6.2 페이지별 기능 요약

#### 1) 대시보드 (`dashboard/dashboard.html`)

<img src="images/screenshots/01_대시보드.png" width="900" alt="01 대시보드" />

- 통계 카드
  - 오늘 저장한 글
  - 미완료 리마인드
  - 가장 자주 쓴 태그
  - 주간 읽기 달성률
- 최근 저장 목록(최신 6개)
- 자주 쓰는 태그
  - 태그 클릭 시 해당 태그로 저장된 북마크 목록으로 이동합니다.
- 북마크 직접 추가(모달)
  - 제목(필수), 텍스트, 메모, 태그, 리마인더 설정이 가능합니다.
  - 태그가 기존에 존재하면 해당 태그를 사용하고, 없으면 새 태그를 생성합니다.
  - 신규 태그 색상은 태그 팔레트 기반으로 자동 배정됩니다.
- 리마인더 설정
  - 토글 ON 시 퀵 버튼(내일/이번 주말/다음주) 제공
  - 직접 날짜/시간 선택 가능

---

#### 2) 북마크 목록 (`bookmark/bookmark.html`)

<img src="images/screenshots/02_북마크목록_전체.png" width="900" alt="02 북마크목록 전체" />
<img src="images/screenshots/03_북마크목록_즐겨찾기.png" width="900" alt="03 북마크목록 즐겨찾기" />

- 저장한 북마크 목록을 최신순으로 표시합니다.
- 전체 북마크를 한 곳에서 모아볼 수 있습니다.
- 카드에서 빠른 상태 변경이 가능합니다. (삭제/즐겨찾기 등)
- 정렬: 최신순 / 오래된순
- 필터: 전체 / 즐겨찾기 / 읽음 / 안 읽음
- 페이지네이션
  - 9개 단위로 분할하여 9개 이상일 경우 페이지 이동이 가능합니다.

---

#### 3) 북마크 상세 (`bookmarkContent/bookmarkContent.html`)

<img src="images/screenshots/04_북마크상세.png" width="900" alt="04 북마크 상세" />

- 수정/상태 변경
  - 수정하기 버튼으로 제목/텍스트 수정이 가능합니다.
  - 읽음 / 안 읽음 버튼으로 상태를 토글합니다.
  - 즐겨찾기 버튼으로 즐겨찾기 상태를 토글합니다.
- 연동
  - 즐겨찾기/읽음 상태는 대시보드와 목록 화면에도 연동됩니다.
- 메모
  - 메모 수정하기 버튼으로 메모 수정이 가능합니다.
- 리마인더
  - 리마인더가 없을 때는 설정이 가능하고, 존재할 때는 수정/삭제가 가능합니다.
  - UI는 퀵 버튼 + 직접 날짜 선택 흐름을 사용합니다.
- 목록으로
  - 사용자가 진입한 위치(목록/대시보드)로 되돌아가도록 구성했습니다.

---

#### 4) 검색(공통)

<img src="images/screenshots/05_북마크검색.png" width="900" alt="05 북마크 검색" />

- 대시보드/북마크 목록 상단에서 검색이 가능합니다.
- “저장한 글, 태그 검색”을 통해 제목 또는 태그에 검색어가 포함된 북마크 목록을 반환합니다.

---

#### 5) 태그 (`tag/tag.html`)

<img src="images/screenshots/06_태그.png" width="900" alt="06 태그" />

- 태그 추가 시 영문은 대문자로 통일합니다.
- 기존 태그와 중복되면 경고창(“이미 존재하는 태그입니다”)을 띄웁니다.
- 태그 선택 시 해당 태그에 속하는 북마크 목록을 보여줍니다.
- 태그 삭제
  - 삭제 전 경고창을 띄웁니다.
  - 삭제 확정 시 태그와 해당 태그에 포함된 북마크 글을 함께 삭제합니다.

---

#### 6) 리마인더 (`reminder/reminder.html`)

<img src="images/screenshots/07_리마인드.png" width="900" alt="07 리마인드" />

- 상단 배너 문구가 상태에 따라 달라집니다.
  - 오늘 마감 글이 없을 때: “여유로운 하루네요! …”
  - 오늘 마감 글이 있을 때: “오늘 마감되는 글 n건 …”
- 타임라인을 3파트로 구성합니다.
  - 오늘 / 내일 / 이번주·다음주
- 링크 처리
  - 링크가 없으면 `No link`를 표시합니다.
  - 링크가 있으면 “원본 글 보기”를 제공하고, 클릭 시 원본 글로 이동합니다.
- URL 보정
  - 북마크 추가 시 `https://`를 작성하지 않아도 도메인이 자동 보정됩니다.

---

#### 7) 설정 (`setting/setting.html`)

<img src="images/screenshots/08_설정.png" width="900" alt="08 설정" />

- AI 설정, 환경 설정(알림/디자인), 데이터 관리 메뉴로 구성했습니다.
- 일부 기능은 현재 미구현 상태입니다. (예: 데이터 관리, 프로필 이미지 수정)

---

#### 8) 대시보드 - 북마크 직접 추가(모달)

<img src="images/screenshots/09_대시보드_북마크직접추가.png" width="900" alt="09 대시보드 북마크 직접 추가" />

- 모달에서 제목(필수), 텍스트, 메모, 태그, 리마인더를 설정하고 저장할 수 있습니다.

---

#### 9) 확장 프로그램 (`extension/extension.html`)

<img src="images/screenshots/10_확장프로그램_대표이미지존재x.png" width="900" alt="10 확장프로그램 대표이미지 없음" />
<img src="images/screenshots/11_확장프로그램_대표이미지존재.png" width="900" alt="11 확장프로그램 대표이미지 있음" />
<img src="images/screenshots/12_확장프로그램_리마인더설정.png" width="900" alt="12 확장프로그램 리마인더 설정" />

- 원클릭 저장을 위한 UI를 제공합니다.
- 현재 페이지 URL을 가져와 저장 흐름을 시작합니다.
- 리마인더 설정 등 확장 전용 입력 흐름을 제공합니다.

---

#### 10) 초기 화면 (`index.html`)

<img src="images/screenshots/index.html_초기화면.png" width="900" alt="index 초기화면" />

- 서비스 진입 및 기본 탐색을 위한 초기 화면입니다.

### 6.3 핵심 UX 포인트

- 대시보드 동선
  - 최근 저장 목록 / 예정된 리마인드 / 자주 쓰는 태그의 “더보기” 버튼을 통해 각각의 탭으로 이동합니다.
- 오늘 저장한 글(어제 대비)
  - 오늘 저장 개수를 어제와 비교하여 `(+n) / (-n) / 같음` 형태로 표시합니다.
- 미완료 리마인드
  - “미완료 리마인드 건수”는 리마인더가 설정된 북마크 중 **읽음 처리되지 않은 개수**입니다.
  - “오늘 마감되는 항목 n건”은 읽음 여부와 무관하게 **오늘 마감되는 항목 전체 개수**로 처리합니다.
- 가장 자주 쓴 태그(동률 처리)
  - 1개만 대표로 표시합니다.
  - 동률이면 저장 시간 순으로 정렬하고, 이후 가나다/abc 순으로 안정 정렬합니다.
  - 동률 태그가 여러 개면 `+n` 형태로 함께 표시합니다.
- 주간 읽기 달성률
  - 전체 북마크 개수와 읽음 개수로 퍼센트를 계산하여 표시합니다.

---

## 7. 배포 시 주의사항

- 경로 문제
  - 폴더 구조가 있는 정적 멀티페이지이므로, `../` 기반 상대 경로는 구조 변경 시 깨지기 쉽습니다.
  - 배포 환경에서는 `"/dashboard/dashboard.html"` 같은 절대 경로 사용을 권장합니다. - 설정 권장.

- Mixed Content(HTTPS ↔ HTTP)
  - 배포 프론트가 HTTPS인데 백엔드 API가 HTTP이면 브라우저가 요청을 차단할 수 있습니다.
  - `API_BASE_URL`을 환경별로 분리하거나 HTTPS API 구성이 필요합니다. - 설정 권장.

---

## 8. 개선 예정

- 설정 페이지 일부 기능 구현(데이터 관리/프로필 등) - 구현 예정.
- 로그인 흐름 안정화
- 확장 프로그램 저장 데이터와 웹 데이터 동기화
