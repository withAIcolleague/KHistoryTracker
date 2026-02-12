# KHistoryTracker

한반도 지도 기반 역사 추적 애플리케이션

**🌐 Live Demo**: [https://k-history-tracker-9afu.vercel.app/](https://k-history-tracker-9afu.vercel.app/)

## 프로젝트 개요

고조선 건국(BC 2333)부터 현재(2026)까지 한반도의 역사를 인터랙티브한 지도로 시각화하는 웹 애플리케이션입니다.

## 주요 기능

- **지도 시각화**: 한반도, 만주, 연해주, 일본, 중국 동북부를 포함한 위성 지도
- **타임라인**: 4,359년의 역사를 슬라이더로 탐색
- **연도 직접 입력**: 원하는 연도로 즉시 이동
- **테마 필터**: 정치, 경제, 사회, 문화, 전쟁, 인물별 분류
- **이벤트 마커**: 역사적 사건의 정확한 위치 표시
- **상세 정보**: 마커 클릭 시 날짜, 설명 팝업

## 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (Vanilla)
- **지도**: Leaflet.js + ESRI 위성 이미지
- **데이터**: JSON
- **디자인**: 미니멀 UI

## 파일 구조

```
khistory/
├── index.html          # 메인 HTML
├── styles.css          # 스타일시트
├── app.js              # JavaScript 로직
├── data.json           # 역사 데이터 (32개 연도, 43개 사건)
├── khistoryguide.md    # 프로젝트 가이드
├── README.md           # 프로젝트 소개
└── CLAUDE.md           # 이 파일
```

## 실행 방법

```bash
# Python 사용
python -m http.server 8000

# Node.js 사용
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

## 데이터 구조

```json
{
  "year": 1592,
  "events": [
    {
      "theme": "전쟁",
      "title": "임진왜란 발발",
      "description": "일본군이 부산진에 상륙하여 임진왜란이 발발하였다.",
      "location": { "lat": 35.1, "lng": 129.04 },
      "date": "1592년 4월 13일"
    }
  ]
}
```

## 디자인 컨셉

- **미니멀리즘**: 라운드 없는 직선적 디자인
- **모노톤**: 흑백 기반 색상 팔레트
- **타이포그래피**: Inter/SF Pro 계열 폰트
- **심플함**: 지도에 집중할 수 있는 깔끔한 UI

## 향후 계획

- [ ] 월/일 단위 타임라인 기능 개선
- [ ] 더 많은 역사 데이터 추가
- [ ] 경로 애니메이션 (수도 이동, 전쟁 경로)
- [ ] 검색 기능
- [ ] 데이터 크라우드소싱
- [ ] 다국어 지원

## 참고 자료

- [국사편찬위원회 콘텐츠](https://contents.history.go.kr)
- [국사편찬위원회 역사 GIS](https://hgis.history.go.kr)
- [서울대 규장각 GIS](https://kyuhgis.snu.ac.kr)
- [한국민족문화대백과](https://encykorea.aks.ac.kr)

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트 환영합니다!

---

Made with Claude Code
