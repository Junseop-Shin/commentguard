# CommentGuard

YouTube 댓글을 키워드, 닉네임, 봇 패턴으로 자동 필터링하는 Chrome 확장 프로그램입니다.

## 주요 기능

- **키워드 필터링** — 설정한 단어가 포함된 댓글 자동 숨김
- **닉네임 차단** — 특정 유저 댓글 차단
- **봇 감지** — 홍보성 봇 댓글 자동 탐지
- **초성 검색** — ㅅㅍ, ㅂㄱ 등 초성만으로도 필터링
- **변형 문자 정규화** — 띄어쓰기/특수문자로 우회한 변형 문자 감지
- **프리셋 제공** — 도박/스팸, 자기홍보, 성인 콘텐츠 기본 제공
- **펼쳐보기/접기** — 필터링된 댓글도 버튼으로 확인 가능
- **차단 통계** — 키워드별 차단 횟수 확인
- **한국어 댓글 우선 정렬** — 한국어 댓글을 상단으로 정렬
- **다크 모드 지원**

## 설치

[Chrome Web Store](https://chromewebstore.google.com) 에서 설치 (출시 예정)

또는 직접 빌드:

```bash
npm install
npm run build
```

`dist/` 폴더를 Chrome 확장 관리 페이지(`chrome://extensions`)에서 **압축 해제된 확장 프로그램 로드**로 설치.

## 기술 스택

- Vue 3 + Pinia + TypeScript
- Vite (IIFE content script 빌드)
- Tailwind CSS
- Chrome Extension Manifest V3

## 개인정보처리방침

[Privacy Policy](https://gist.github.com/Junseop-Shin/21b76ae5187b9b61f7caf571d94676c4)

수집하는 개인정보 없음. 모든 설정은 브라우저 로컬 저장소에만 저장됩니다.

## 라이선스

MIT
