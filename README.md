# CommentGuard

> YouTube 댓글 필터링 Chrome 익스텐션

키워드, 닉네임, 봇 패턴으로 YouTube 댓글을 자동 필터링합니다. 필터링된 댓글은 삭제하지 않고 블라인드 처리하여 필요 시 펼쳐볼 수 있습니다.

---

## 기능

| 기능 | 설명 |
|------|------|
| 키워드 필터 | 직접 추가한 키워드가 포함된 댓글 블라인드 |
| 닉네임 필터 | 특정 닉네임 작성자의 댓글 블라인드 |
| 봇 자동 감지 | URL + 홍보 문구 패턴으로 스팸 봇 차단 |
| 프리셋 | 도박·홍보·성인 등 카테고리별 필터 묶음 |
| 초성 검색 | `ㅂㅋ` 같은 초성 키워드로 우회 표현 탐지 |
| 변형문자 정규화 | 특수문자 삽입 우회 탐지 |
| 고정 댓글 보호 | 크리에이터 고정 댓글은 필터링 제외 |
| 한국어 댓글 우선 정렬 | 한글 댓글을 목록 상단으로 이동 (토글) |
| 블라인드 처리 | 삭제 대신 "필터링 된 댓글입니다" 표시 + 펼쳐보기 |
| 다크 모드 | Chrome/OS 테마 자동 연동 |

---

## 스크린샷

<!-- TODO: 스크린샷 추가 -->

---

## 설치 (개발자 모드)

```bash
git clone https://github.com/Junseop-Shin/commentguard.git
cd commentguard
npm install
npm run build
```

1. Chrome → `chrome://extensions`
2. 우상단 **개발자 모드** ON
3. **"압축해제된 확장 프로그램을 로드합니다"** → `dist/` 폴더 선택

---

## 개발

```bash
npm run dev      # 개발 빌드 (watch)
npm run build    # 프로덕션 빌드
npm test         # 유닛 테스트
```

### 기술 스택

- **Chrome Extension** Manifest V3
- **Vite** + **TypeScript**
- **Vue 3** + **Pinia**
- **Tailwind CSS** v3
- **es-hangul** (초성 검색)

### 프로젝트 구조

```
src/
├── content/          # 콘텐츠 스크립트 (YouTube 페이지에 주입)
│   ├── index.ts      # 메인 진입점 — 필터링, 정렬, MutationObserver
│   ├── filter.ts     # shouldBlock() 로직
│   ├── bot-detector.ts
│   └── normalizer.ts
├── popup/            # 팝업 UI (Vue 3)
│   ├── components/
│   │   ├── FilterTab.vue   # 키워드/닉네임/설정
│   │   └── StatsTab.vue    # 필터링 통계
│   └── store/filters.ts    # Pinia 스토어
└── shared/
    ├── types.ts      # 타입 정의
    ├── storage.ts    # chrome.storage 래퍼
    └── presets.ts    # 기본 필터 프리셋
```

---

## 배포

Chrome Web Store 배포 절차 → [`docs/PUBLISH.md`](docs/PUBLISH.md)

로컬 테스트 체크리스트 → [`docs/LOCAL_TEST.md`](docs/LOCAL_TEST.md)

---

## 라이선스

MIT
