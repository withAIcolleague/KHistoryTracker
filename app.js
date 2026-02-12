// 전역 변수
let map;
let markers = [];
let historicalData = [];
let currentYear = -2333;
let currentMonth = 1; // 1-12
let currentDay = 1; // 1-31
let currentTheme = 'all';
let currentUnit = 'year'; // 'year', 'month', 'day'

// 상수
const START_YEAR = -2333;
const END_YEAR = 2026;
const MONTH_RANGE_YEARS = 100; // 월 단위: 앞뒤 100년 (총 200년)
const DAY_RANGE_YEARS = 1; // 일 단위: 앞뒤 1년 (총 2년)

// 지도 초기화
function initMap() {
    map = L.map('map').setView([38.5, 127.5], 6);

    // 지형도만 표시 (라벨, 경계선 없음)
    // 옵션 1: 위성 이미지 (가장 깔끔)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18,
    }).addTo(map);

    // 옵션 2: 지형도 (등고선 포함, 라벨 최소화)
    // 아래 주석을 해제하고 위의 위성 이미지 부분을 주석 처리하면 전환됩니다
    /*
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design, under CC BY 3.0',
        maxZoom: 18,
        subdomains: 'abcd'
    }).addTo(map);
    */
}

// 데이터 로드
async function loadData() {
    try {
        const response = await fetch('data.json');
        historicalData = await response.json();
        console.log('데이터 로드 완료:', historicalData.length, '개 연도');
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        document.getElementById('eventContainer').innerHTML =
            '<p class="no-events">데이터를 불러오는데 실패했습니다.</p>';
    }
}

// 날짜 포맷팅 (단위에 따라)
function formatDate(year, month, day, unit) {
    let yearStr;
    if (year < 0) {
        yearStr = `기원전 ${Math.abs(year)}`;
    } else if (year === 0) {
        yearStr = '기원 0';
    } else {
        yearStr = `${year}`;
    }

    switch(unit) {
        case 'month':
            return `${yearStr}년 ${month}월`;
        case 'day':
            return `${yearStr}년 ${month}월 ${day}일`;
        case 'year':
        default:
            return `${yearStr}년`;
    }
}

// 연도 포맷팅 (하위 호환성)
function formatYear(year) {
    if (year < 0) {
        return `기원전 ${Math.abs(year)}년`;
    } else if (year === 0) {
        return '기원 0년';
    } else {
        return `${year}년`;
    }
}

// 마커 색상 선택
function getMarkerColor(theme) {
    const colors = {
        '정치': '#1976d2',
        '경제': '#7b1fa2',
        '사회': '#388e3c',
        '문화': '#f57c00',
        '전쟁': '#c62828',
        '인물': '#c2185b'
    };
    return colors[theme] || '#667eea';
}

// 커스텀 마커 아이콘 생성
function createCustomIcon(theme) {
    const color = getMarkerColor(theme);
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

// 지도에 마커 표시
function updateMarkers(year, theme) {
    // 기존 마커 제거
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // 해당 연도 데이터 찾기
    const yearData = historicalData.find(d => d.year === year);

    if (!yearData) return;

    // 필터링된 이벤트 가져오기
    let events = yearData.events;
    if (theme !== 'all') {
        events = events.filter(e => e.theme === theme);
    }

    // 마커 추가
    events.forEach(event => {
        const marker = L.marker(
            [event.location.lat, event.location.lng],
            { icon: createCustomIcon(event.theme) }
        ).addTo(map);

        // 날짜 포맷팅
        let dateStr = formatYear(year);
        if (event.date) {
            // 이벤트에 date 필드가 있으면 더 자세한 날짜 표시
            dateStr = event.date;
        }

        // 팝업 내용
        const popupContent = `
            <div class="popup-content">
                <div class="popup-date">${dateStr}</div>
                <h4>${event.title}</h4>
                <p><strong>테마:</strong> ${event.theme}</p>
                <p>${event.description}</p>
            </div>
        `;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// 이벤트 목록 업데이트
function updateEventList(year, theme) {
    const container = document.getElementById('eventContainer');
    const yearData = historicalData.find(d => d.year === year);

    if (!yearData) {
        container.innerHTML = '<p class="no-events">해당 연도에는 기록된 사건이 없습니다.</p>';
        document.querySelector('.event-count').textContent = '0개 사건';
        return;
    }

    let events = yearData.events;
    if (theme !== 'all') {
        events = events.filter(e => e.theme === theme);
    }

    if (events.length === 0) {
        container.innerHTML = '<p class="no-events">선택한 테마의 사건이 없습니다.</p>';
        document.querySelector('.event-count').textContent = '0개 사건';
        return;
    }

    document.querySelector('.event-count').textContent = `${events.length}개 사건`;

    container.innerHTML = events.map(event => `
        <div class="event-card" onclick="focusOnEvent(${event.location.lat}, ${event.location.lng})">
            <span class="event-theme theme-${event.theme}">${event.theme}</span>
            <div class="event-title">${event.title}</div>
            <div class="event-description">${event.description}</div>
        </div>
    `).join('');
}

// 특정 이벤트에 포커스
function focusOnEvent(lat, lng) {
    map.setView([lat, lng], 8);
}

// 슬라이더 값에서 날짜 계산
function sliderValueToDate(value, unit) {
    const numValue = parseInt(value);

    switch(unit) {
        case 'year':
            // 연 단위: 슬라이더 값이 바로 연도
            return {
                year: numValue,
                month: 1,
                day: 1
            };

        case 'month':
            // 현재 연도를 중심으로 앞뒤 100년 (총 200년 = 2400개월)
            // 슬라이더: 0 ~ 2399
            // 중간값: 1200 (= 100년 * 12개월)
            const startYear = currentYear - MONTH_RANGE_YEARS;
            const totalMonthsFromStart = numValue; // 0 ~ 2399

            const yearOffset = Math.floor(totalMonthsFromStart / 12);
            const monthValue = (totalMonthsFromStart % 12) + 1; // 1~12

            return {
                year: startYear + yearOffset,
                month: monthValue,
                day: 1
            };

        case 'day':
            // 현재 연월을 중심으로 앞뒤 1년 (총 2년 = 730일)
            // 슬라이더: 0 ~ 729
            // 중간값: 365 (= 1년)

            // 시작 날짜: (currentYear - 1)년 currentMonth월 currentDay일
            // 양수 연도로 계산하기 위해 기준 연도 사용
            const baseYear = 2000;
            let tempDate = new Date(baseYear, currentMonth - 1, currentDay);

            // 1년 전으로 이동
            tempDate.setFullYear(baseYear - DAY_RANGE_YEARS);

            // numValue 일수만큼 더하기
            tempDate.setDate(tempDate.getDate() + numValue);

            // 실제 연도 계산
            const yearDiff = tempDate.getFullYear() - baseYear;
            const actualYear = currentYear + yearDiff;

            return {
                year: actualYear,
                month: tempDate.getMonth() + 1,
                day: tempDate.getDate()
            };

        default:
            return {
                year: numValue,
                month: 1,
                day: 1
            };
    }
}

// 타임라인 단위 변경
function changeTimelineUnit(unit) {
    currentUnit = unit;

    // 버튼 활성화 상태 변경
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.unit === unit) {
            btn.classList.add('active');
        }
    });

    const slider = document.getElementById('yearSlider');
    const labels = document.querySelector('.timeline-labels');

    switch(unit) {
        case 'year':
            // 전체 연도 범위 (BC 2333 ~ 2026)
            slider.min = START_YEAR;
            slider.max = END_YEAR;
            slider.value = currentYear;
            slider.step = 1;
            labels.innerHTML = `
                <span>BC 2333</span>
                <span>0</span>
                <span>1000</span>
                <span>2026</span>
            `;
            break;

        case 'month':
            // 현재 연도 기준 앞뒤 100년 (총 200년 = 2400개월)
            const totalMonths = MONTH_RANGE_YEARS * 2 * 12; // 2400
            slider.min = 0;
            slider.max = totalMonths - 1;
            slider.value = MONTH_RANGE_YEARS * 12; // 중간값 (1200개월, 즉 100년)
            slider.step = 1;

            const startYear = currentYear - MONTH_RANGE_YEARS;
            const endYear = currentYear + MONTH_RANGE_YEARS;
            labels.innerHTML = `
                <span>${startYear < 0 ? 'BC ' + Math.abs(startYear) : startYear}년</span>
                <span>${currentYear < 0 ? 'BC ' + Math.abs(currentYear) : currentYear}년</span>
                <span>${endYear < 0 ? 'BC ' + Math.abs(endYear) : endYear}년</span>
            `;
            break;

        case 'day':
            // 현재 연월 기준 앞뒤 1년 (총 2년 = 730일)
            const totalDays = DAY_RANGE_YEARS * 2 * 365; // 730
            slider.min = 0;
            slider.max = totalDays - 1;
            slider.value = DAY_RANGE_YEARS * 365; // 중간값 (365일, 즉 1년)
            slider.step = 1;

            const startDateYear = currentDate.getFullYear() - DAY_RANGE_YEARS;
            const endDateYear = currentDate.getFullYear() + DAY_RANGE_YEARS;
            labels.innerHTML = `
                <span>${startDateYear < 0 ? 'BC ' + Math.abs(startDateYear) : startDateYear}년</span>
                <span>${currentYear < 0 ? 'BC ' + Math.abs(currentYear) : currentYear}년</span>
                <span>${endDateYear < 0 ? 'BC ' + Math.abs(endDateYear) : endDateYear}년</span>
            `;
            break;
    }

    updateTimeline(slider.value);
}

// 타임라인 업데이트
function updateTimeline(value) {
    const dateInfo = sliderValueToDate(value, currentUnit);
    currentYear = dateInfo.year;
    currentMonth = dateInfo.month;
    currentDay = dateInfo.day;

    document.querySelector('.current-year').textContent = formatDate(currentYear, currentMonth, currentDay, currentUnit);
    updateMarkers(currentYear, currentTheme);
    updateEventList(currentYear, currentTheme);
}

// 연도 슬라이더 업데이트 (하위 호환성)
function updateYear(year) {
    currentYear = parseInt(year);
    currentMonth = 1;
    currentDay = 1;
    document.querySelector('.current-year').textContent = formatDate(currentYear, currentMonth, currentDay, currentUnit);
    updateMarkers(currentYear, currentTheme);
    updateEventList(currentYear, currentTheme);
}

// 테마 변경
function changeTheme(theme) {
    currentTheme = theme;

    // 버튼 활성화 상태 변경
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    updateMarkers(currentYear, currentTheme);
    updateEventList(currentYear, currentTheme);
}

// 연도 입력으로 이동
function goToYear() {
    const input = document.getElementById('yearInput');
    const yearValue = parseInt(input.value);

    // 유효성 검사
    if (isNaN(yearValue)) {
        alert('올바른 연도를 입력해주세요.');
        return;
    }

    if (yearValue < START_YEAR || yearValue > END_YEAR) {
        alert(`연도는 ${START_YEAR}년부터 ${END_YEAR}년 사이여야 합니다.`);
        return;
    }

    // 슬라이더와 화면 업데이트
    const slider = document.getElementById('yearSlider');
    slider.value = yearValue;
    updateYear(yearValue);

    // 입력 필드 초기화
    input.value = '';
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 연도 슬라이더
    const slider = document.getElementById('yearSlider');
    slider.addEventListener('input', (e) => {
        if (currentUnit === 'year') {
            updateYear(e.target.value);
        } else {
            updateTimeline(e.target.value);
        }
    });

    // 테마 버튼
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            changeTheme(theme);
        });
    });

    // 타임라인 단위 버튼
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const unit = e.target.dataset.unit;
            changeTimelineUnit(unit);
        });
    });

    // 연도 입력 - 버튼 클릭
    document.getElementById('yearGoBtn').addEventListener('click', goToYear);

    // 연도 입력 - Enter 키
    document.getElementById('yearInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            goToYear();
        }
    });
}

// 초기화
async function init() {
    initMap();
    await loadData();
    setupEventListeners();
    updateYear(-2333); // 초기 연도 설정
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', init);
