# Chrome Web Store 배포 가이드

## 사전 준비

- Google 계정
- 신용카드 (등록비 $5, 1회 결제)
- 완성된 빌드 (`npm run build`)
- 스크린샷 1280×800 또는 640×400 (최소 1장, 최대 5장)

---

## 1. Chrome Web Store 개발자 계정 등록

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 접속
2. Google 계정으로 로그인
3. **"개발자 등록"** 클릭
4. 개발자 약관 동의
5. 등록비 **$5** 결제 (Google Play 결제 시스템 — 카드 등록 필요)
6. 계정 활성화 완료 (즉시)

---

## 2. 배포용 zip 생성

```bash
# 프로젝트 루트에서 실행
npm run build
cd dist
zip -r ../yt-comment-filter-v1.0.0.zip .
cd ..
```

> zip 내부 최상위에 `manifest.json`이 있어야 함.
> `dist/` 폴더 자체를 감싸면 안 됨 — `dist/` 안의 파일들을 직접 압축.

---

## 3. 스크린샷 준비

Chrome Web Store 심사에 최소 1장 필요.

**방법:**
1. `chrome://extensions`에서 확장 프로그램 로드
2. YouTube 영상 댓글 페이지에서 팝업 열기
3. F12 → Device Toolbar → 해상도 **1280×800** 설정
4. 캡처 (Mac: `Cmd+Shift+4`)

**권장 스크린샷 구성:**
- 팝업 UI (키워드/설정 탭)
- 댓글 블라인드 플레이스홀더가 적용된 YouTube 페이지

---

## 4. 확장 프로그램 업로드

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **"새 항목"** 클릭
2. zip 파일 업로드
3. 업로드 완료 후 스토어 등록 정보 입력 화면으로 이동

---

## 5. 스토어 등록 정보 입력

| 항목 | 내용 |
|------|------|
| 기본 이름 (영문) | CommentGuard |
| 한국어 이름 | 댓글 가드 |
| 요약 설명 | Filter YouTube comments by keywords, nicknames & bot patterns. Korean chosung search supported. |
| 상세 설명 | 아래 참고 |
| 카테고리 | 생산성 |
| 기본 언어 | English |
| 스크린샷 | 준비한 이미지 업로드 |

> **다국어 이름 등록:** 등록 정보 하단 "번역 추가" → 한국어 선택 → 이름: `댓글 가드`, 설명 한국어로 입력

**상세 설명 (복붙용):**
```
YouTube 댓글을 키워드, 닉네임, 봇 패턴으로 자동 필터링하는 확장 프로그램입니다.

주요 기능:
• 키워드/닉네임 필터 — 직접 추가한 키워드·닉네임 포함 댓글 블라인드
• 봇 감지 — URL+홍보 문구 패턴으로 스팸 봇 자동 차단
• 프리셋 — 도박·홍보·성인 등 카테고리별 필터 묶음 제공
• 초성 검색 — 'ㅂㅋ' 같은 초성 키워드로 우회 표현 탐지
• 변형문자 정규화 — 특수문자 삽입 우회 탐지
• 고정 댓글 보호 — 크리에이터 고정 댓글은 필터링 제외
• 한국어 댓글 우선 정렬 — 한글 댓글을 목록 상단으로 이동
• 블라인드 처리 — 삭제 대신 '필터링 된 댓글입니다' 표시, 펼쳐보기 가능
• 다크 모드 지원 — Chrome/OS 테마 자동 연동
```

---

## 6. 개인정보처리방침

Web Store 제출에 **개인정보처리방침 URL**이 필요할 수 있음 (storage 권한 사용 시 필수).

**최소한의 방침 (GitHub Pages 등에 호스팅):**
```
이 확장 프로그램은 수집한 어떠한 사용자 데이터도 외부 서버로 전송하지 않습니다.
모든 설정과 통계는 chrome.storage.local에만 저장됩니다.
```

GitHub에 `privacy-policy.md`로 올리고 GitHub Pages URL을 입력해도 됨.

---

## 7. 심사 제출

1. 모든 항목 입력 완료 후 **"검토를 위해 제출"** 클릭
2. 심사 기간: **영업일 기준 1~3일** (초기 심사 기준, 길어지면 1주일 이상 가능)
3. 이메일로 승인/거절 통보

**거절 시 주요 이유:**
- 스크린샷 해상도 미달
- 설명과 기능 불일치
- 개인정보처리방침 미제공

---

## 8. 버전 업데이트 배포

```bash
# manifest.json 버전 번호 올리기 (1.0.0 → 1.0.1)
# 빌드 후 zip 재생성
npm run build
cd dist && zip -r ../yt-comment-filter-v1.0.1.zip . && cd ..
```

1. Dashboard → 해당 확장 프로그램 클릭
2. **"패키지"** 탭 → **"새 패키지 업로드"**
3. 새 zip 업로드 → 변경사항 설명 입력 → 재제출

---

## 9. 배포 URL 형식

```
https://chrome.google.com/webstore/detail/{확장-프로그램-ID}
```

ID는 Dashboard에서 확인 가능.
