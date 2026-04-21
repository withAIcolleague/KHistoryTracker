// 전역 변수
let map;
let markers = [];
let routes = [];
let boundaryLayers = [];
let historicalData = [];
let boundaryData = [];
let showBoundaries = true;
let currentYear = -2333;
let currentMonth = 1; // 1-12
let currentDay = 1; // 1-31
let currentTheme = 'all';
let currentUnit = 'year'; // 'year', 'month', 'day'
let currentPeriod = 'all'; // 현재 선택된 시대

// 상수
const START_YEAR = -2333;
const END_YEAR = 2026;
const MONTH_RANGE_YEARS = 100; // 월 단위: 앞뒤 100년 (총 200년)
const DAY_RANGE_YEARS = 1; // 일 단위: 앞뒤 1년 (총 2년)

// 시대 정의
const PERIODS = [
    { id: 'all',        name: '전체',   start: -2333, end: 2026 },
    { id: 'ancient',    name: '고조선', start: -2333, end: -57  },
    { id: 'three',      name: '삼국',   start: -57,   end: 676  },
    { id: 'north-south',name: '남북국', start: 676,   end: 918  },
    { id: 'goryeo',     name: '고려',   start: 918,   end: 1392 },
    { id: 'joseon',     name: '조선',   start: 1392,  end: 1897 },
    { id: 'modern',     name: '근현대', start: 1897,  end: 2026 },
];

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

// 경계 데이터 로드
async function loadBoundaries() {
    try {
        const res = await fetch('data/boundaries.json');
        if (!res.ok) return;
        boundaryData = await res.json();
        console.log('✅ 경계 데이터 로드 완료:', boundaryData.length, '개 국가');
    } catch(e) {
        console.warn('경계 데이터 로드 실패:', e);
    }
}

// 경계 표시 업데이트
function updateBoundaries(year) {
    boundaryLayers.forEach(l => map.removeLayer(l));
    boundaryLayers = [];

    if (!showBoundaries) return;

    boundaryData.forEach(state => {
        const period = state.periods
            .slice()
            .reverse()
            .find(p => year >= p.start && year <= p.end);
        if (!period) return;

        const polygonArrays = period.polygons ? period.polygons : [period.polygon];
        polygonArrays.forEach(coords => {
            const polygon = L.polygon(coords, {
                color: state.color,
                weight: 3,
                opacity: 0.9,
                fillColor: state.color,
                fillOpacity: 0.12,
                dashArray: '10, 6',
                interactive: true
            }).addTo(map);

            polygon.bindTooltip(
                `<span style="font-weight:600;color:${state.color}">${period.label}</span><br><span style="font-size:0.85em;color:#999">경계는 추정치입니다</span>`,
                { sticky: true, opacity: 0.9 }
            );

            boundaryLayers.push(polygon);
        });
    });
}

// 경계 토글
function toggleBoundaries() {
    showBoundaries = !showBoundaries;
    const btn = document.getElementById('boundaryToggleBtn');
    btn.classList.toggle('active', showBoundaries);
    btn.textContent = showBoundaries ? '경계 ON' : '경계 OFF';
    updateBoundaries(currentYear);
}

// 데이터 로드
async function loadData() {
    const periodFiles = [
        'data/periods/ancient.json',
        'data/periods/three-kingdoms.json',
        'data/periods/north-south-states.json',
        'data/periods/goryeo.json',
        'data/periods/joseon.json',
        'data/periods/modern.json',
    ];

    try {
        console.log('데이터 로드 시작...');

        const responses = await Promise.all(periodFiles.map(f => fetch(f)));

        // 응답 상태 확인
        responses.forEach((res, i) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status} (${periodFiles[i]})`);
        });

        // 각 파일을 개별 파싱 — 빈 파일/파싱 오류 시 빈 배열로 대체
        const arrays = await Promise.all(
            responses.map(async (res, i) => {
                try {
                    const text = await res.text();
                    if (!text.trim()) return [];
                    return JSON.parse(text);
                } catch (e) {
                    console.warn(`⚠️ ${periodFiles[i]} 파싱 오류:`, e.message);
                    return [];
                }
            })
        );

        // 모든 배열 합치기 + 연도 오름차순 정렬
        historicalData = arrays.flat().sort((a, b) => a.year - b.year);

        console.log('✅ 데이터 로드 완료:', historicalData.length, '개 연도');
        console.log('첫 번째 데이터:', historicalData[0]);

        // 612년 데이터 확인 (디버깅)
        const year612 = historicalData.find(d => d.year === 612);
        if (year612 && year612.routes) {
            console.log('612년 경로 데이터:', JSON.stringify(year612.routes[0].path[0], null, 2));
        }
    } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
        console.error('Error details:', error.message, error.stack);
        alert('데이터를 불러오는데 실패했습니다. 서버가 실행 중인지 확인하세요.');
        document.getElementById('eventContainer').innerHTML =
            '<p class="no-events">데이터를 불러오는데 실패했습니다. 콘솔을 확인하세요.</p>';
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

// SVG 압정 아이콘 생성 (크기 조절 가능)
function createPinIcon(color, size = 28) {
    const h = Math.round(size * 1.5);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 28 42">
        <!-- 압정 머리 (원형 디스크) -->
        <circle cx="14" cy="13" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <!-- 하이라이트 -->
        <circle cx="9" cy="8" r="4" fill="white" fill-opacity="0.25"/>
        <!-- 중심 구멍 -->
        <circle cx="14" cy="13" r="3.5" fill="white" fill-opacity="0.7"/>
        <!-- 바늘 -->
        <path d="M12.5 24 L15.5 24 L14 42 Z" fill="${color}" stroke="white" stroke-width="0.8"/>
    </svg>`;
    return L.divIcon({
        className: 'custom-marker',
        html: svg,
        iconSize:   [size, h],
        iconAnchor: [size / 2, h]   // 바늘 끝점이 좌표에 닿도록
    });
}

// 커스텀 마커 아이콘 생성
function createCustomIcon(theme) {
    return createPinIcon(getMarkerColor(theme), 28);
}

// 이벤트 팝업 HTML 빌더
function buildEventPopupHTML(event, year) {
    const dateStr = event.date || formatYear(year);

    let html = `<div class="popup-content">`;
    html += `<div class="popup-date">${dateStr}</div>`;
    html += `<h4>${event.title}</h4>`;

    // 시대 / 국가 / 군주 뱃지
    const meta = [];
    if (event.period) meta.push(`<span class="popup-badge">${event.period}</span>`);
    if (event.state)  meta.push(`<span class="popup-badge">${event.state}</span>`);
    if (event.ruler)  meta.push(`<span class="popup-badge badge-ruler">&#128081; ${event.ruler}</span>`);
    if (meta.length)  html += `<div class="popup-meta">${meta.join('')}</div>`;

    html += `<div class="popup-theme theme-badge theme-${event.theme}">${event.theme}</div>`;
    html += `<p class="popup-desc">${event.description}</p>`;

    // 관련 장소 (locations 우선, 없으면 route)
    const places = event.locations?.length ? event.locations
                 : event.route?.length     ? event.route
                 : null;
    if (places) {
        html += `<div class="popup-locations"><strong>&#128205; 관련 장소</strong><ul>`;
        places.forEach(p => { html += `<li>${p.name}${p.modernName ? `<span class="popup-modern-name"> → ${p.modernName}</span>` : ''}</li>`; });
        html += `</ul></div>`;
    }

    html += `</div>`;
    return html;
}

// 지도에 마커 표시
function updateMarkers(year, theme) {
    // 기존 마커 제거
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const yearData = historicalData.find(d => d.year === year);
    if (!yearData) return;

    let events = yearData.events;
    if (theme !== 'all') {
        events = events.filter(e => e.theme === theme);
    }

    events.forEach(event => {
        const color = getMarkerColor(event.theme);
        const popupHTML = buildEventPopupHTML(event, year);

        // locations 우선, 없으면 route 사용
        const places = event.locations?.length ? event.locations
                     : event.route?.length     ? event.route
                     : null;

        if (places && places.length >= 2) {
            // ── 멀티 지점: 핀 마커 (+ 선은 route 또는 showLine:true 일 때만) ──
            const latLngs = places.map(p => [p.lat, p.lng]);
            const drawLine = !!event.route || event.showLine === true;

            if (drawLine) {
                const line = L.polyline(latLngs, {
                    color,
                    weight: 2.5,
                    opacity: 0.75,
                    dashArray: event.route ? '7, 5' : null
                }).addTo(map);
                line.bindPopup(popupHTML, { maxWidth: 280 });
                markers.push(line);
            }

            // 각 지점에 핀 마커 (endpoint: 큰 핀, 중간 지점: 작은 핀)
            places.forEach((place, idx) => {
                const isEndpoint = idx === 0 || idx === places.length - 1;
                const iconSize = isEndpoint ? 28 : 20;
                const cm = L.marker([place.lat, place.lng], {
                    icon: createPinIcon(color, iconSize)
                }).addTo(map);

                // 지점 팝업: 장소명 + 현재 지명 + 이벤트 요약
                const placePopup = `
                    <div class="popup-content">
                        <div class="popup-date">${event.date || formatYear(year)}</div>
                        <h4>${place.name}</h4>
                        ${place.modernName ? `<div class="place-modern-name">📍 현재: ${place.modernName}</div>` : ''}
                        <p class="popup-desc" style="font-size:0.8em;color:#888;">${event.title}</p>
                    </div>`;
                cm.bindPopup(placePopup, { maxWidth: 220 });
                markers.push(cm);
            });

        } else {
            // ── 단일 지점: 기존 아이콘 마커 ──
            const marker = L.marker(
                [event.location.lat, event.location.lng],
                { icon: createCustomIcon(event.theme) }
            ).addTo(map);
            marker.bindPopup(popupHTML, { maxWidth: 280 });
            markers.push(marker);
        }
    });
}

// 경로 표시
function updateRoutes(year) {
    // 기존 경로 제거
    routes.forEach(route => map.removeLayer(route));
    routes = [];

    // 해당 연도 데이터 찾기
    const yearData = historicalData.find(d => d.year === year);

    if (!yearData || !yearData.routes) return;

    // 경로 추가
    yearData.routes.forEach(routeData => {
        // 경로 좌표 배열 생성
        const latLngs = routeData.path.map(point => [point.lat, point.lng]);

        // 스타일 설정
        const style = {
            color: routeData.color || '#c62828',
            weight: 3,
            opacity: 0.8,
            dashArray: routeData.style === 'dashed' ? '10, 10' : null
        };

        // 폴리라인 생성
        const polyline = L.polyline(latLngs, style).addTo(map);

        // 팝업 내용
        const popupContent = `
            <div class="popup-content">
                <h4>${routeData.name}</h4>
                <p><strong>유형:</strong> ${routeData.type === 'war' ? '전쟁' : '이동'}</p>
                <p>${routeData.description}</p>
            </div>
        `;
        polyline.bindPopup(popupContent);

        routes.push(polyline);

        // 경로 포인트에 작은 마커 추가
        routeData.path.forEach((point, index) => {
            if (point.label) {
                console.log('Route point:', JSON.stringify(point, null, 2));

                // 모든 포인트에 마커 표시
                const marker = L.circleMarker([point.lat, point.lng], {
                    radius: 5,
                    fillColor: routeData.color || '#c62828',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                // 상세 팝업 내용
                let popupHTML = `<div class="route-point-popup">`;
                popupHTML += `<h4>${point.label}</h4>`;

                if (point.historicalName) {
                    popupHTML += `<p><strong>당시 지명:</strong> ${point.historicalName}</p>`;
                }
                if (point.modernName) {
                    popupHTML += `<p><strong>현재 위치:</strong> ${point.modernName}</p>`;
                }
                if (point.note) {
                    popupHTML += `<p class="note">${point.note}</p>`;
                }

                popupHTML += `</div>`;

                console.log('Popup HTML:', popupHTML);

                marker.bindPopup(popupHTML);
                routes.push(marker);
            }
        });
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

    container.innerHTML = events.map(event => {
        const stateRuler = [event.state, event.ruler].filter(Boolean).join(' · ');
        return `
            <div class="event-card" onclick="focusOnEvent(${event.location.lat}, ${event.location.lng})">
                <div class="event-card-header">
                    <span class="event-theme theme-${event.theme}">${event.theme}</span>
                    ${stateRuler ? `<span class="event-state">${stateRuler}</span>` : ''}
                </div>
                <div class="event-title">${event.title}</div>
                ${event.period ? `<div class="event-period">${event.period}</div>` : ''}
                <div class="event-description">${event.description}</div>
                ${(() => {
                    const places = event.locations?.length ? event.locations
                                 : event.route?.length     ? event.route
                                 : null;
                    return places
                        ? `<div class="event-locations">📍 ${places.map(l => l.modernName ? `${l.name}<span class="card-modern-name">(${l.modernName})</span>` : l.name).join(' &middot; ')}</div>`
                        : '';
                })()}
            </div>
        `;
    }).join('');
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
    updateBoundaries(currentYear);
    updateMarkers(currentYear, currentTheme);
    updateRoutes(currentYear);
    updateEventList(currentYear, currentTheme);
}

// 눈금 연도 표시용 포맷 (짧게)
function formatLabelYear(year) {
    if (year < 0) return `BC ${Math.abs(year)}`;
    if (year === 0) return '0';
    return `${year}`;
}

// 타임라인 눈금 라벨 갱신 (현재 시대 범위 기준)
function updateYearLabels() {
    const labels = document.querySelector('.timeline-labels');
    if (!labels) return;

    if (currentUnit === 'year') {
        const period = PERIODS.find(p => p.id === currentPeriod) || PERIODS[0];
        const left  = period.start;
        const right = period.end;
        const mid   = Math.round((left + right) / 2);

        labels.innerHTML = `
            <span>${formatLabelYear(left)}</span>
            <span>${formatLabelYear(mid)}</span>
            <span class="current-label">${formatLabelYear(currentYear)}</span>
            <span>${formatLabelYear(right)}</span>
        `;
    }
}

// 시대 탭 변경
function changePeriod(periodId) {
    currentPeriod = periodId;
    const period = PERIODS.find(p => p.id === periodId) || PERIODS[0];

    // 탭 활성화 상태 변경
    document.querySelectorAll('.period-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === periodId);
    });

    // 슬라이더 범위 조정
    const slider = document.getElementById('yearSlider');
    slider.min   = period.start;
    slider.max   = period.end;
    slider.value = period.start;

    // yearInput 범위도 업데이트
    const yearInput = document.getElementById('yearInput');
    yearInput.min = period.start;
    yearInput.max = period.end;

    updateYear(period.start);
}

// 이전 사건으로 이동
function prevEvent() {
    const period = PERIODS.find(p => p.id === currentPeriod) || PERIODS[0];
    // 현재 시대 범위 내 데이터만
    const data = historicalData.filter(d => d.year >= period.start && d.year <= period.end);
    const idx  = data.findIndex(d => d.year >= currentYear);
    const prevIdx = (idx <= 0) ? data.length - 1 : idx - 1;
    if (data[prevIdx]) {
        const slider = document.getElementById('yearSlider');
        slider.value = data[prevIdx].year;
        updateYear(data[prevIdx].year);
    }
}

// 다음 사건으로 이동
function nextEvent() {
    const period = PERIODS.find(p => p.id === currentPeriod) || PERIODS[0];
    const data = historicalData.filter(d => d.year >= period.start && d.year <= period.end);
    const idx  = data.findIndex(d => d.year > currentYear);
    if (idx === -1) {
        // 마지막이면 처음으로
        if (data[0]) {
            const slider = document.getElementById('yearSlider');
            slider.value = data[0].year;
            updateYear(data[0].year);
        }
    } else {
        const slider = document.getElementById('yearSlider');
        slider.value = data[idx].year;
        updateYear(data[idx].year);
    }
}

// 연도 슬라이더 업데이트 (하위 호환성)
function updateYear(year) {
    currentYear = parseInt(year);
    currentMonth = 1;
    currentDay = 1;

    console.log('updateYear called:', currentYear);

    // 화면 업데이트
    document.querySelector('.current-year').textContent = formatDate(currentYear, currentMonth, currentDay, currentUnit);
    updateYearLabels();

    // 지도 업데이트
    updateBoundaries(currentYear);
    updateMarkers(currentYear, currentTheme);
    updateRoutes(currentYear);
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
        const value = parseInt(e.target.value);
        updateYear(value);
    });

    // 시대 탭
    document.querySelectorAll('.period-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            changePeriod(e.target.dataset.period);
        });
    });

    // 이전/다음 사건 버튼
    document.getElementById('prevEventBtn').addEventListener('click', prevEvent);
    document.getElementById('nextEventBtn').addEventListener('click', nextEvent);

    // 테마 버튼
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            changeTheme(theme);
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
    await Promise.all([loadData(), loadBoundaries()]);
    setupEventListeners();
    updateYear(-2333); // 초기 연도 설정
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', init);
