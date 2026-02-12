# KHistoryTracker

> 한반도 역사를 지도로 추적하는 인터랙티브 웹 애플리케이션

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://k-history-tracker-9afu.vercel.app/)

## 🌐 라이브 데모

**👉 [https://k-history-tracker-9afu.vercel.app/](https://k-history-tracker-9afu.vercel.app/)**

지금 바로 웹에서 체험해보세요!

## 🗺️ 프로젝트 소개

고조선 건국(BC 2333)부터 현재(2026)까지 한반도의 역사를 인터랙티브한 지도로 시각화합니다.

![KHistoryTracker Screenshot](screenshot.png)

## ✨ 주요 기능

- 📍 **지도 시각화** - 한반도, 만주, 연해주를 포함한 역사 지도
- ⏱️ **타임라인** - 4,359년의 역사를 슬라이더로 탐색
- ⌨️ **연도 입력** - 원하는 연도로 즉시 이동
- 🎨 **테마 필터** - 정치, 경제, 사회, 문화, 전쟁, 인물별 분류
- 📌 **이벤트 마커** - 역사적 사건의 정확한 위치 표시
- 📅 **상세 정보** - 날짜, 설명이 포함된 팝업

## 🚀 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/withAIcolleague/KHistoryTracker.git
cd KHistoryTracker

# 서버 실행 (Python)
python -m http.server 8000

# 또는 (Node.js)
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

## 📊 현재 데이터

- **32개 연도**
- **43개 역사 사건**
- 고조선 ~ 현대사

## 🎨 디자인

미니멀하고 세련된 UI:
- 직선적 디자인 (No rounded corners)
- 모노톤 색상 팔레트
- 지도 중심 레이아웃

## 🛠️ 기술 스택

- HTML5, CSS3, JavaScript
- Leaflet.js (지도)
- ESRI World Imagery (위성 이미지)

## 📝 데이터 추가

`data.json` 파일에 새로운 사건 추가:

```json
{
  "year": 1592,
  "events": [
    {
      "theme": "전쟁",
      "title": "임진왜란 발발",
      "description": "일본군이 부산진에 상륙하였다.",
      "location": { "lat": 35.1, "lng": 129.04 },
      "date": "1592년 4월 13일"
    }
  ]
}
```

## 🗂️ 프로젝트 구조

```
khistory/
├── index.html          # 메인 페이지
├── styles.css          # 스타일
├── app.js              # 로직
├── data.json           # 역사 데이터
├── khistoryguide.md    # 가이드
├── CLAUDE.md           # 프로젝트 문서
└── README.md           # 이 파일
```

## 🔮 향후 계획

- [ ] 월/일 단위 타임라인
- [ ] 경로 애니메이션
- [ ] 검색 기능
- [ ] 데이터 확장
- [ ] 다국어 지원

## 📚 참고 자료

- [국사편찬위원회](https://contents.history.go.kr)
- [역사 GIS](https://hgis.history.go.kr)
- [규장각 GIS](https://kyuhgis.snu.ac.kr)

## 🤝 기여

이슈와 PR을 환영합니다!

## 📄 라이선스

MIT License

---

Made with ❤️ by Claude Code
