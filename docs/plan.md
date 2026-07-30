# 장전 브리핑 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/뉴스` 브리핑을 고정 UI로 보여주는 공개 정적 사이트를 `site/`에 만들어 Vercel로 배포하고, `/뉴스` 스킬이 JSON 저장 + CLI 배포로 사이트를 갱신하게 한다.

**Architecture:** 프레임워크 없는 정적 사이트(HTML/CSS/JS). 날짜별 브리핑은 `site/data/YYYY-MM-DD.json`, 날짜 목록은 `site/data/index.json`. `app.js`가 fetch로 읽어 렌더링. 배포는 `site/` 디렉토리에서 `vercel --prod`.

**Tech Stack:** HTML/CSS/vanilla JS, Node(검증 스크립트), Vercel CLI. 빌드 없음, 의존성 없음.

## Global Constraints

- 투자 조언 생성 금지: 사이트·데이터 어디에도 매수/매도 추천·목표가·기대수익률을 넣지 않는다. 푸터에 "조언 아님" 고지 고정.
- 모든 수치·주장에 출처 라벨 `1차`/`2차`/`추정` 표시. 확인 불가 값은 문자열 `"unknown"` 그대로 — UI는 회색 이탤릭으로 렌더링.
- `club/` 자료, `context.md`·`journey.md`·`CLAUDE.md`, 타인 제출물은 `site/`에 넣지 않는다.
- 크레덴셜(.env, 토큰) 커밋 금지. 이 설계에는 비밀 값이 없어야 정상이다.
- origin `main`은 보호 브랜치 — 모든 push는 `briefing-site` 브랜치로, 반영은 PR로만.
- 색상 관례: 상승=빨강(`--up`), 하락=파랑(`--down`) (국내 관례).
- 커밋 메시지 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure

```
site/
  index.html        # 고정 UI 골격 (Task 2)
  style.css         # 디자인 고정판 (Task 2)
  app.js            # 데이터 로드·렌더링 (Task 2)
  validate.mjs      # 배포 전 데이터 검증 (Task 1)
  data/
    index.json      # {"dates":[...]} 최신이 앞 (Task 1)
    2026-07-30.json # 첫 실데이터 = 오늘 브리핑 (Task 1)
.claude/skills/뉴스/SKILL.md  # 5번 단계 교체 (Task 4)
```

---

### Task 1: 데이터 파일 + 검증 스크립트

**Files:**
- Create: `site/data/index.json`
- Create: `site/data/2026-07-30.json`
- Create: `site/validate.mjs`

**Interfaces:**
- Produces: 데이터 스키마 (Task 2의 `app.js`가 이 필드명을 그대로 읽는다): `date`, `generated_at`, `tape[{name,value,change,dir}]`, `tape_label`, `tape_source`, `tape_note`, `tape_terms[{term,def,why}]`, `items[3]{axis,title,url,why,insight{read,connect,trap},waits[],todos[],terms[],sources[{label,name,url}]}`, `crypto{text,url,label,terms[]}`, `verdict`, `opened[]`, `holes[]`
- Produces: `node site/validate.mjs <json경로>` — 통과 시 exit 0 + `OK`, 실패 시 exit 1 + 오류 목록 (Task 4의 스킬이 배포 전에 호출)

- [ ] **Step 1: `site/data/index.json` 작성**

```json
{
  "dates": ["2026-07-30"]
}
```

- [ ] **Step 2: `site/data/2026-07-30.json` 작성** (오늘 실전 브리핑 내용 그대로 — news-log.md 2026-07-30 항목과 Artifact 내용 기준)

```json
{
  "date": "2026-07-30",
  "generated_at": "2026-07-30 KST",
  "tape": [
    {"name": "코스피", "value": "5,682.74", "change": "+0.34%", "dir": "up"},
    {"name": "나스닥100", "value": "27,396.14", "change": "-2.06%", "dir": "down"},
    {"name": "S&P500", "value": "7,346.51", "change": "-1.52%", "dir": "down"},
    {"name": "다우", "value": "51,681.33", "change": "-2.19%", "dir": "down"},
    {"name": "달러/원", "value": "1,438.76", "change": "-0.28%", "dir": "down"},
    {"name": "WTI", "value": "$84.58", "change": "+0.14%", "dir": "up"},
    {"name": "비트코인", "value": "$63,914", "change": "-0.10%", "dir": "down"}
  ],
  "tape_label": "2차",
  "tape_source": "tradingeconomics · CoinDesk",
  "tape_note": "코스피 월간 -31.56% 낙폭 속 강보합",
  "tape_terms": [
    {"term": "지수 테이프", "def": "장 시작 전 어제~오늘의 판을 숫자 한 줄로 보는 것", "why": "오늘의 특징: 코스피만 강보합, 미국 3대 지수는 -1.5~-2.2%"},
    {"term": "월간 낙폭", "def": "코스피는 최근 한 달 -31.56% (tradingeconomics, 2차)", "why": "오늘 +0.34%는 이 큰 하락 안의 반등이라는 맥락에서 읽어야 한다"},
    {"term": "달러/원 1,438원", "def": "원화가 한 달간 6.66% 강세 (2차)", "why": "환율 하락 = 원화 강세라는 방향을 헷갈리기 쉽다"}
  ],
  "items": [
    {
      "axis": "국내 거시",
      "title": "통계청, 6월 산업활동동향 오늘 발표 — 실제치는 unknown",
      "url": "https://kostat.go.kr",
      "why": "매월 말 정기 공표일. 5월 산업생산이 전월비 -3.0%로 꺾인 뒤라, 6월이 반등인지가 오늘 갈린다. 시장 예상치는 전월비 +2.9% (2차, investing.com). 발표 원문은 아직 미확보 — 실제치는 unknown.",
      "insight": {
        "read": "코스피가 한 달 -31.56% 낙폭 속에서 오늘 강보합(+0.34%)인데, 예상(+2.9%)대로 반등이 확인되면 \"실물은 버틴다\"는 쪽 재료가 된다.",
        "connect": "삼성전자 실적(③)과 같은 방향의 질문: 5월의 부진이 일시적이었나. 수출·반도체 생산 항목이 겹친다.",
        "trap": "전월비(MoM)와 전년동월비(YoY)를 섞어 읽는 것. 예상 +2.9%는 전월비고, 직전월 -3.0%의 되돌림이라 +가 나와도 회복 완료는 아니다."
      },
      "waits": ["오늘 통계청 보도자료 원문(전산업생산 MoM 실제치) — kostat.go.kr", "오늘 밤 미국 6월 PCE — 같은 날 안팎 지표가 겹친다"],
      "todos": ["통계청 보도자료에서 전산업생산 전월비 실제치 하나만 뽑아 news-log.md에 적기 (5분). 못 찾으면 unknown으로 적고 넘어간다"],
      "terms": [
        {"term": "산업활동동향", "def": "생산·소비·투자를 한 번에 담는 월간 실물 성적표. 통계청이 매월 말 발표", "why": "오늘의 1번 지표"},
        {"term": "컨센서스(예상치)", "def": "오늘의 +2.9%는 investing.com이 모은 전망치", "why": "누구의 예상인지에 따라 숫자가 다를 수 있다"},
        {"term": "기저효과", "def": "직전월이 -3.0%로 낮았기 때문에 6월 +는 그 반작용일 수 있다", "why": "두 달을 합쳐 봐야 방향이 보인다"}
      ],
      "sources": [
        {"label": "2차", "name": "investing.com 경제 캘린더", "url": "https://kr.investing.com/economic-calendar/"},
        {"label": "1차", "name": "통계청 (발표 후 확인)", "url": "https://kostat.go.kr"}
      ]
    },
    {
      "axis": "글로벌 금융",
      "title": "Fed 기준금리 3.50~3.75% 동결 — 반대표 3명은 \"인상\"을 주장",
      "url": "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm",
      "why": "현지 7/29 FOMC 정례회의 결과가 어젯밤 나왔다. 성명은 인플레이션이 \"2% 목표 대비 여전히 높다\"고 적시 (1차). Hammack·Kashkari·Logan 3명이 25bp 인상을 선호하며 반대 (1차).",
      "insight": {
        "read": "동결이었는데도 미국 3대 지수가 -1.5~-2.2% 하락했다. 반대표의 방향이 '인하'가 아니라 '인상'이라는 게 시장엔 긴축 신호로 읽혔을 수 있다 — 인과는 unknown(다른 요인 가능).",
        "connect": "미국 인플레이션은 4.1% 보도 (2차, CoinDesk — 성명 원문에는 수치 없음). 지난주 로그 기준 한국은 인상(2.75%), 미국은 동결 — \"한국은 올리고 미국은 멈춘\" 구도가 이어진다.",
        "trap": "\"동결 = 비둘기(완화)\"로 읽는 것. 이번엔 소수의견이 인상 쪽이라, 동결이 오히려 완화적 선택이었다."
      },
      "waits": ["오늘 밤 미국 6월 PCE 물가 (예상 YoY 3.7%, 근원 3.3%, 2차) — 예상을 넘으면 인상 소수의견 쪽 이야기가 커지는 갈림길"],
      "todos": ["발표 후 PCE YoY 실제치를 예상 3.7%와 비교해 한 줄 기록 (5분) — bea.gov 또는 investing 캘린더"],
      "terms": [
        {"term": "FOMC", "def": "미국의 금리 결정 회의. 연 8회. 결과는 성명서(statement)로 나온다", "why": "어제 그 결과가 나왔다"},
        {"term": "목표 범위 3.50~3.75%", "def": "미국 기준금리는 한 점이 아니라 0.25%p 폭의 범위로 정한다", "why": "동결의 대상이 이 범위"},
        {"term": "반대표(dissent)", "def": "결정에 동의하지 않은 위원의 공개 기록", "why": "방향(인상/인하)이 다음 회의의 힌트가 된다"},
        {"term": "PCE vs CPI", "def": "둘 다 물가지표지만 Fed가 목표(2%)로 삼는 건 PCE", "why": "오늘 밤 나오는 게 그 지표"}
      ],
      "sources": [
        {"label": "1차", "name": "Fed 성명 원문", "url": "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm"},
        {"label": "2차", "name": "CoinDesk", "url": "https://www.coindesk.com/markets/2026/07/29/fomc-hold-fed-holds-rates-steady-extending-pause-as-markets-await-warsh-s-policy-roadmap"}
      ]
    },
    {
      "axis": "테크",
      "title": "삼성전자 2분기 매출 171.5조 역대 최대 — 영업익 89조 보도",
      "url": "https://www.hankyung.com/article/202607304486g",
      "why": "오늘 오전 확정 실적 발표. 매출 171.5조원(분기 최대), 영업이익 89조원·전년비 +1,813% 보도 (2차, 한국경제). 미국 ADR 상장설에는 회사가 선을 그었다는 보도 (2차).",
      "insight": {
        "read": "나스닥100이 -2.06%인 날 코스피가 +0.34%로 버틴 것과 같은 화면에 있다. CoinDesk도 \"삼성 실적에 아시아 반도체 매도세 진정\"으로 보도 (2차).",
        "connect": "①의 6월 산업활동동향(반도체 생산 항목)과 같은 질문. 실물 지표와 기업 실적이 같은 방향인지 오늘 하루에 둘 다 확인 가능.",
        "trap": "증가율 표기가 매체마다 다르다: 한경 \"+1,813%\", CoinDesk \"250배(250-fold)\". 어느 이익(영업익/순이익)·어느 기준(YoY/QoQ)인지 원문 IR 확인 전엔 unknown. 배수 헤드라인만 보고 규모를 판단하지 않기."
      },
      "waits": ["삼성전자 IR 실적 발표자료·컨퍼런스콜 — 반도체(DS) 부문 영업이익이 따로 나온다. samsung.com IR"],
      "todos": ["삼성전자 IR 페이지에서 사업부별 영업이익 표를 열어 DS 부문 숫자 하나 확인 (10분). 못 찾으면 unknown으로 적고 넘어간다"],
      "terms": [
        {"term": "확정 실적 vs 잠정 실적", "def": "잠정치(속보)가 먼저 나오고 확정치가 나중에 나온다", "why": "오늘 보도가 어느 쪽인지 기사 본문에서 확인 필요"},
        {"term": "영업이익 vs 순이익", "def": "본업으로 번 돈 vs 세금·일회성까지 다 반영한 돈", "why": "배수 비교가 갈리는 흔한 원인"},
        {"term": "ADR", "def": "미국 시장에서 외국 주식을 거래하게 해주는 증서", "why": "\"상장설에 선 긋기\"는 미국 직상장 계획이 없다는 뜻"}
      ],
      "sources": [
        {"label": "2차", "name": "한경 ①영업익", "url": "https://www.hankyung.com/article/202607304486g"},
        {"label": "2차", "name": "한경 ②매출", "url": "https://www.hankyung.com/article/202607304681g"},
        {"label": "2차", "name": "한경 ③ADR", "url": "https://www.hankyung.com/article/202607305375g"}
      ]
    }
  ],
  "crypto": {
    "text": "BTC $63,914 (-0.10%) — Fed 동결 소화 구간에서 ETH·XRP 보합. 아시아 반도체 매도 진정과 같은 화면에서 움직임 없음",
    "url": "https://www.coindesk.com/markets/2026/07/30/ether-xrp-flat-as-chip-stocks-steady-on-samsung-s-250-fold-profit-surge",
    "label": "2차",
    "terms": [
      {"term": "보합(flat)", "def": "의미 있는 방향 없이 제자리", "why": "\"사건 없음\"도 기록할 가치가 있다 — 다음 움직임의 기준점이 된다"},
      {"term": "매크로 연동", "def": "크립토가 금리 이벤트(FOMC)에 주식과 같은 방향으로 반응하는 것", "why": "오늘은 그 연동이 약했다"}
    ]
  },
  "verdict": "오늘 밤 미국 6월 PCE(예상 YoY 3.7%)가 예상을 넘으면 \"Fed 인상 소수의견 3표\" 이야기가 커진다 — 내 확인 지점은 PCE 실제치 하나.",
  "opened": ["1차: Fed 성명 원문 · investing.com 경제 캘린더", "2차: tradingeconomics(지수 4종) · 한국경제 RSS · CoinDesk"],
  "holes": [
    "CNBC Markets — 403 차단 (오늘 신규 확인)",
    "Reuters — fetch 차단 (기존 구멍, 경제지표 캘린더로 대체)",
    "통계청 kostat.go.kr — mods.go.kr로 리다이렉트, 6월 산업활동동향 원문 미확보 → 실제치 unknown",
    "한국은행·기재부·금융위·BLS·SEC·TokenPost — 오늘 미확인"
  ]
}
```

- [ ] **Step 3: `site/validate.mjs` 작성**

```js
// 배포 전 브리핑 데이터 검증: node site/validate.mjs site/data/YYYY-MM-DD.json
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("사용법: node site/validate.mjs <data/YYYY-MM-DD.json>");
  process.exit(1);
}

let d;
try {
  d = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`JSON 파싱 실패: ${e.message}`);
  process.exit(1);
}

const errors = [];
const warns = [];
const req = (cond, msg) => { if (!cond) errors.push(msg); };

req(typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date), "date는 YYYY-MM-DD 형식");
req(Array.isArray(d.tape) && d.tape.length >= 4, "tape는 4개 이상");
(d.tape ?? []).forEach((q, i) =>
  req(q && q.name && q.value && q.change && ["up", "down", "flat"].includes(q.dir),
    `tape[${i}]: name/value/change/dir(up|down|flat) 필요`));
req(Array.isArray(d.items) && d.items.length === 3, "items는 정확히 3개");
const AXES = ["국내 거시", "글로벌 금융", "테크"];
(d.items ?? []).forEach((it, i) => {
  req(AXES.includes(it?.axis), `items[${i}].axis는 ${AXES.join("|")} 중 하나`);
  req(typeof it?.title === "string" && it.title, `items[${i}].title 필요`);
  req(typeof it?.why === "string" && it.why, `items[${i}].why 필요`);
  req(it?.insight?.read && it?.insight?.connect && it?.insight?.trap,
    `items[${i}].insight에 read/connect/trap 필요`);
  req(Array.isArray(it?.waits) && it.waits.length >= 1, `items[${i}].waits 1개 이상`);
  req(Array.isArray(it?.todos) && it.todos.length >= 1, `items[${i}].todos 1개 이상`);
  req(Array.isArray(it?.sources) && it.sources.length >= 1, `items[${i}].sources 1개 이상`);
  (it?.sources ?? []).forEach((s, j) =>
    req(["1차", "2차", "추정"].includes(s?.label), `items[${i}].sources[${j}].label은 1차|2차|추정`));
});
req(typeof d.crypto?.text === "string" && d.crypto.text, "crypto.text 필요");
req(typeof d.verdict === "string" && d.verdict, "verdict 필요");
req(Array.isArray(d.holes), "holes는 배열");

// 조언 금지 — 흔한 조언 표현이 있으면 경고 (매도세/매수세 같은 서술은 통과)
const flat = JSON.stringify(d);
["매수하", "매도하", "목표가", "기대수익률", "사라", "팔라"].forEach((w) => {
  if (flat.includes(w)) warns.push(`조언 의심 표현 발견: "${w}" — 확인 필요`);
});

warns.forEach((w) => console.warn(`경고: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`오류: ${e}`));
  process.exit(1);
}
console.log(`OK: ${d.date} (${d.items.length}개 항목, 테이프 ${d.tape.length}칸)`);
```

- [ ] **Step 4: 검증 통과 확인**

Run: `node site/validate.mjs site/data/2026-07-30.json`
Expected: `OK: 2026-07-30 (3개 항목, 테이프 7칸)` / exit 0

- [ ] **Step 5: 검증 실패 동작 확인 (음성 테스트)**

Run (스크래치패드에 items 2개짜리 깨진 파일을 만들어 실행):
```bash
printf '{"date":"2026-07-30","tape":[],"items":[],"crypto":{},"verdict":"","holes":[]}' > "$SCRATCHPAD/bad.json"
node site/validate.mjs "$SCRATCHPAD/bad.json"; echo "exit=$?"
```
Expected: `오류: tape는 4개 이상`, `오류: items는 정확히 3개` 등 출력 후 `exit=1`

- [ ] **Step 6: Commit**

```bash
git add site/data/index.json site/data/2026-07-30.json site/validate.mjs
git commit -m "site: 브리핑 데이터 스키마 + 첫 실데이터(07-30) + 검증 스크립트

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 고정 UI (index.html / style.css / app.js)

**Files:**
- Create: `site/index.html`
- Create: `site/style.css`
- Create: `site/app.js`

**Interfaces:**
- Consumes: Task 1의 데이터 스키마와 `data/index.json`의 `dates` 배열 (최신이 앞)
- Produces: `?date=YYYY-MM-DD` 쿼리로 특정 날짜 표시. 데이터 없으면 최신으로 대체 + 안내 한 줄. 공개 URL 루트가 이 페이지다.

- [ ] **Step 1: `site/index.html` 작성**

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>장전 브리핑</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="wrap">
    <header class="masthead">
      <div class="kicker">장전 브리핑</div>
      <h1>오늘 볼 3개 + 크립토 1줄</h1>
      <nav class="datenav">
        <a id="prev" href="#" aria-label="이전 브리핑">←</a>
        <select id="datepick" aria-label="날짜 선택"></select>
        <a id="next" href="#" aria-label="다음 브리핑">→</a>
      </nav>
      <p id="fallback-note" class="note" hidden></p>
    </header>
    <main id="app" aria-live="polite">
      <p class="note">브리핑을 불러오는 중…</p>
    </main>
    <footer id="foot"></footer>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: `site/style.css` 작성** (2026-07-30 Artifact 디자인 고정판 — 토큰/라이트·다크/테이프/카드/토글/크립토/판단/푸터)

```css
:root {
  --bg: #FBFAF6; --surface: #FFFFFF; --ink: #23272E; --ink-soft: #5C636E;
  --line: #E5E2D9; --accent: #315C4F; --accent-ink: #FFFFFF;
  --up: #C0392B; --down: #2166AC;
  --crypto-bg: #F4EEE2; --crypto-line: #D8CCB2;
  --est: #8A6D1F; --est-bg: #FBF3DC; --unknown: #9AA0A8;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #15181D; --surface: #1C2026; --ink: #E7E9EC; --ink-soft: #9BA3AD;
    --line: #2C313A; --accent: #6FAE9C; --accent-ink: #10231D;
    --up: #E06C5B; --down: #6FA8DC;
    --crypto-bg: #221F17; --crypto-line: #3E3827;
    --est: #D9B45B; --est-bg: #2A2415; --unknown: #6C737C;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif;
  line-height: 1.6; font-size: 16px;
}
.wrap { max-width: 640px; margin: 0 auto; padding: 20px 16px 48px; }
a { color: inherit; }
.masthead { padding: 8px 0 14px; border-bottom: 2px solid var(--ink); }
.kicker { font-size: 12px; letter-spacing: .14em; color: var(--accent); font-weight: 700; }
.masthead h1 { margin: 2px 0 6px; font-size: 26px; letter-spacing: -.01em; text-wrap: balance; }
.datenav { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.datenav a { text-decoration: none; padding: 2px 8px; border: 1px solid var(--line); border-radius: 6px; }
.datenav a[aria-disabled="true"] { opacity: .35; pointer-events: none; }
.datenav select { font: inherit; font-size: 13px; padding: 2px 6px; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 6px; }
.note { font-size: 13px; color: var(--ink-soft); }
.tape { display: flex; gap: 8px; overflow-x: auto; padding: 14px 0 6px; }
.q { flex: 0 0 auto; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 6px 10px; min-width: 96px; }
.q .n { font-size: 11px; color: var(--ink-soft); letter-spacing: .06em; }
.q .v { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 14px; }
.q .d { font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 600; }
.up { color: var(--up); } .down { color: var(--down); } .flat { color: var(--ink-soft); }
.tape-note { font-size: 12px; color: var(--ink-soft); margin: 0 0 4px; }
.cards { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 16px 16px 12px; }
.axis { font-size: 11px; font-weight: 700; letter-spacing: .12em; color: var(--accent); }
.card h2 { margin: 4px 0 6px; font-size: 18px; line-height: 1.4; text-wrap: balance; }
.card h2 a { text-decoration-color: var(--accent); text-underline-offset: 3px; }
.why { font-size: 14px; color: var(--ink-soft); margin: 0 0 10px; }
.why b { color: var(--ink); }
.lbl { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 4px; padding: 1px 6px; vertical-align: 1px; }
.lbl-1 { background: var(--ink); color: var(--bg); }
.lbl-2 { border: 1px solid var(--ink-soft); color: var(--ink-soft); }
.lbl-est { background: var(--est-bg); color: var(--est); border: 1px dashed var(--est); }
.unk { color: var(--unknown); font-style: italic; }
details { border-top: 1px dashed var(--line); margin-top: 10px; }
summary { cursor: pointer; padding: 8px 0; font-size: 13px; font-weight: 600; color: var(--ink-soft); list-style: none; display: flex; align-items: center; gap: 6px; }
summary::before { content: "▸"; color: var(--accent); transition: transform .15s; }
details[open] summary::before { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) { summary::before { transition: none; } }
details .body { font-size: 14px; padding: 0 0 10px; }
details .body p { margin: 6px 0; }
.chip { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 1px 8px; margin-right: 4px; background: var(--accent); color: var(--accent-ink); }
.terms { margin: 6px 0; padding-left: 18px; }
.terms li { margin: 4px 0; font-size: 13.5px; }
.src { font-size: 12.5px; color: var(--ink-soft); margin-top: 8px; }
.crypto { margin-top: 16px; background: var(--crypto-bg); border: 1px solid var(--crypto-line); border-radius: 10px; padding: 14px 16px 10px; }
.crypto .axis { color: var(--est); }
.crypto p { margin: 6px 0; font-size: 14.5px; }
.verdict { margin-top: 16px; border: 1.5px dashed var(--accent); border-radius: 10px; padding: 12px 16px; font-size: 14.5px; }
.verdict .axis { display: block; margin-bottom: 4px; }
footer { margin-top: 24px; border-top: 2px solid var(--ink); padding-top: 12px; font-size: 12.5px; color: var(--ink-soft); }
footer h3 { font-size: 12px; letter-spacing: .1em; margin: 10px 0 4px; color: var(--ink); }
footer ul { margin: 4px 0; padding-left: 18px; }
footer li { margin: 2px 0; }
.notice { margin-top: 12px; padding: 8px 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 3: `site/app.js` 작성**

```js
const $ = (s) => document.querySelector(s);
const esc = (t) => { const d = document.createElement("div"); d.textContent = t ?? ""; return d.innerHTML; };
// "unknown"은 회색 이탤릭으로 (Global Constraints)
const uw = (t) => esc(t).replaceAll("unknown", '<span class="unk">unknown</span>');
const lblClass = (l) => (l === "1차" ? "lbl-1" : l === "추정" ? "lbl-est" : "lbl-2");
const lbl = (l) => `<span class="lbl ${lblClass(l)}">${esc(l)}</span>`;

const termsBlock = (terms, title) => {
  if (!terms || !terms.length) return "";
  const lis = terms.map((t) =>
    `<li><b>${esc(t.term)}</b> — ${uw(t.def)}. ${uw(t.why)}</li>`).join("");
  return `<details><summary>${esc(title)} ${terms.length}개</summary>
    <div class="body"><ul class="terms">${lis}</ul></div></details>`;
};

const card = (it) => {
  const waits = it.waits.map(uw).join(" / ");
  const todos = it.todos.map(uw).join(" / ");
  const srcs = it.sources.map((s) =>
    `${lbl(s.label)} <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(" · ");
  return `<article class="card">
    <div class="axis">${esc(it.axis)}</div>
    <h2><a href="${esc(it.url)}" target="_blank" rel="noopener">${uw(it.title)}</a></h2>
    <p class="why"><b>왜 지금</b> — ${uw(it.why)}</p>
    <details><summary><span class="lbl lbl-est">추정</span> 인사이트 — 기다릴 것 ${it.waits.length} · 오늘 할 것 ${it.todos.length}</summary>
      <div class="body">
        <p>① <b>오늘 어떻게 읽히나</b> — ${uw(it.insight.read)}</p>
        <p>② <b>무엇과 연결되나</b> — ${uw(it.insight.connect)}</p>
        <p>③ <b>놓치기 쉬운 지점</b> — ${uw(it.insight.trap)}</p>
        <p><span class="chip">기다릴 것</span> ${waits}</p>
        <p><span class="chip">오늘 할 것</span> ${todos}</p>
      </div>
    </details>
    ${termsBlock(it.terms, "용어")}
    <p class="src">출처: ${srcs}</p>
  </article>`;
};

function render(d) {
  const tape = d.tape.map((q) =>
    `<div class="q"><div class="n">${esc(q.name)}</div><div class="v">${esc(q.value)}</div>
     <div class="d ${q.dir}">${esc(q.change)}</div></div>`).join("");
  $("#app").innerHTML = `
    <div class="tape" aria-label="지수 테이프">${tape}</div>
    <p class="tape-note">${lbl(d.tape_label)} ${esc(d.tape_source)} · ${uw(d.tape_note)} · 상승=빨강 / 하락=파랑 (국내 관례)</p>
    ${termsBlock(d.tape_terms, "테이프 용어")}
    <div class="cards">${d.items.map(card).join("")}</div>
    <section class="crypto"><div class="axis">🪙 크립토 1줄</div>
      <p>${uw(d.crypto.text)} ${lbl(d.crypto.label)}${d.crypto.url ? ` <a href="${esc(d.crypto.url)}" target="_blank" rel="noopener">기사</a>` : ""}</p>
      ${termsBlock(d.crypto.terms, "용어")}
    </section>
    <section class="verdict"><span class="axis">내 판단이 바뀌는 지점</span>${uw(d.verdict)}
      <details><summary>이 줄의 성격</summary><div class="body">
        <p>이 줄은 사라/팔라가 아니다. 무엇이 확인되면 위 해석이 갈리는지를 적어둔 확인 지점이다.</p>
      </div></details>
    </section>`;
  $("#foot").innerHTML = `
    <h3>오늘 연 소스</h3><ul>${d.opened.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <h3>구멍 (못 연 것)</h3><ul>${d.holes.map((s) => `<li>${uw(s)}</li>`).join("")}</ul>
    <p class="notice">인사이트(<span class="lbl lbl-est">추정</span>)는 해석이지 조언이 아니다.
    이 페이지는 매수·매도·목표가를 제시하지 않는다. 확인 안 된 수치는 unknown으로 표기한다.</p>`;
}

function nav(dates, date) {
  const pick = $("#datepick");
  pick.innerHTML = dates.map((x) =>
    `<option value="${esc(x)}"${x === date ? " selected" : ""}>${esc(x)}</option>`).join("");
  pick.onchange = () => { location.search = `?date=${pick.value}`; };
  const i = dates.indexOf(date); // dates는 최신이 앞
  const prev = dates[i + 1], next = dates[i - 1];
  $("#prev").href = prev ? `?date=${prev}` : "#";
  $("#prev").setAttribute("aria-disabled", prev ? "false" : "true");
  $("#next").href = next ? `?date=${next}` : "#";
  $("#next").setAttribute("aria-disabled", next ? "false" : "true");
  document.title = `장전 브리핑 · ${date}`;
  $(".masthead h1").textContent = `오늘 볼 3개 + 크립토 1줄 — ${date}`;
}

async function main() {
  try {
    const idx = await (await fetch("data/index.json")).json();
    const dates = idx.dates;
    const want = new URLSearchParams(location.search).get("date");
    const date = want && dates.includes(want) ? want : dates[0];
    if (want && !dates.includes(want)) {
      const n = $("#fallback-note");
      n.hidden = false;
      n.textContent = `${want} 브리핑이 없어 가장 최근(${date})을 보여줍니다.`;
    }
    const d = await (await fetch(`data/${date}.json`)).json();
    nav(dates, date);
    render(d);
  } catch (e) {
    $("#app").innerHTML = `<p class="note">브리핑을 불러오지 못했습니다 (${esc(e.message)}). 새로고침해 보세요.</p>`;
  }
}
main();
```

- [ ] **Step 4: 로컬 서버로 렌더링 확인**

Run: `python -m http.server 8899 --directory site` (백그라운드) 후
```bash
curl -s http://localhost:8899/ | grep -c "장전 브리핑"
curl -s http://localhost:8899/data/2026-07-30.json | head -c 80
```
Expected: 첫 명령 `1` 이상, 둘째 명령 JSON 앞부분 출력. 이어서 브라우저(claude-in-chrome 가능 시)로 `http://localhost:8899/`를 열어 확인: 테이프 7칸(코스피만 빨강) / 카드 3장 / 인사이트·용어 토글 기본 접힘 / `unknown` 회색 이탤릭 / 다크 모드 전환 정상. 확인 후 서버 종료.

- [ ] **Step 5: `?date=` 동작 확인**

`http://localhost:8899/?date=2026-01-01` 접속 → "2026-01-01 브리핑이 없어 가장 최근(2026-07-30)을 보여줍니다." 안내 + 최신 브리핑 표시.

- [ ] **Step 6: Commit**

```bash
git add site/index.html site/style.css site/app.js
git commit -m "site: 고정 UI — 테이프/카드3/크립토/판단/구멍, 라이트·다크, ?date= 아카이브

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Vercel 첫 배포

**Files:**
- Create: `site/.vercel/` (CLI가 생성 — `site/.gitignore`에 `.vercel` 추가하여 커밋 제외)
- Create: `site/.gitignore`

**Interfaces:**
- Consumes: Task 2의 `site/` 정적 파일 일체
- Produces: 공개 프로덕션 URL (예: `https://<project>.vercel.app`) — Task 4의 SKILL.md와 news-log가 이 URL을 기록

- [ ] **Step 1: Vercel CLI 확인/설치**

Run: `vercel --version`
없으면: `npm i -g vercel` 후 재확인. npm도 없으면 소유자에게 Node.js 설치 안내 후 중단.

- [ ] **Step 2: 로그인 확인**

Run: `vercel whoami`
Expected: 계정명 출력. 미로그인이면 소유자에게 `! vercel login` 직접 실행 요청 (대화형이라 AI가 대신 못 함).

- [ ] **Step 3: `site/.gitignore` 작성**

```
.vercel
```

- [ ] **Step 4: 첫 프로덕션 배포**

Run (site/ 디렉토리에서): `vercel --prod --yes --name briefing`
Expected: `https://...vercel.app` 프로덕션 URL 출력. 프로젝트 생성 프롬프트가 나오면 기본값 수락(정적, 빌드 없음).

- [ ] **Step 5: 공개 접근 검증**

```bash
curl -s -o /dev/null -w "%{http_code}" <프로덕션URL>
curl -s <프로덕션URL>/data/index.json
```
Expected: `200` / `{"dates":["2026-07-30"]}`. 로그인 화면이 뜨면 Vercel 대시보드에서 Deployment Protection을 꺼야 함 — 소유자에게 안내.

- [ ] **Step 6: Commit**

```bash
git add site/.gitignore
git commit -m "site: vercel 배포 설정(.vercel 제외)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: /뉴스 스킬 5번 단계 교체

**Files:**
- Modify: `.claude/skills/뉴스/SKILL.md` (실행 순서 5번 섹션, "이 스킬은" 블록, 6번 news-log 문구)

**Interfaces:**
- Consumes: Task 1 스키마·`validate.mjs`, Task 3 프로덕션 URL
- Produces: `/뉴스` 실행 마지막이 "JSON 저장 → 검증 → vercel --prod → 사이트 URL 안내"가 된다

- [ ] **Step 1: SKILL.md 5번 섹션 교체**

기존 "### 5. 형식 — 터미널이 아니라 **한 페이지로 뽑는다**" 섹션 전체(하이퍼링크/인사이트/용어 토글/규칙 포함)를 아래로 교체한다. 단, 하이퍼링크·인사이트 3줄 구성·so what 칩·용어 토글·규칙 등 **내용 규칙은 그대로 유지**하고, "HTML을 만들어 Artifact로 발행" 부분만 바꾼다:

```markdown
### 5. 형식 — 사이트에 올린다 (고정 UI)

브리핑은 매번 새 HTML을 그리지 않는다. **`site/data/YYYY-MM-DD.json`을 쓰고 배포하면, 고정 UI(site/)가 그대로 보여준다.**

1. 아래 스키마로 `site/data/YYYY-MM-DD.json` 저장:
   - `date`, `generated_at`, `tape[{name,value,change,dir:up|down|flat}]`, `tape_label`, `tape_source`, `tape_note`, `tape_terms[]`
   - `items[정확히 3개]{axis: 국내 거시|글로벌 금융|테크, title, url(기사 본문), why, insight{read,connect,trap}, waits[], todos[], terms[], sources[{label:1차|2차|추정, name, url}]}`
   - `crypto{text,url,label,terms[]}`, `verdict`, `opened[]`, `holes[]`
   - 확인 불가 값은 문자열 `unknown` 그대로. 제목 링크는 섹션 페이지가 아니라 기사 본문.
2. `site/data/index.json`의 `dates` 맨 앞에 오늘 날짜 추가 (이미 있으면 그대로).
3. 검증: `node site/validate.mjs site/data/YYYY-MM-DD.json` — 오류가 있으면 배포하지 않고 고친다.
4. 배포: site/ 디렉토리에서 `vercel --prod --yes` → 나온 URL을 참가자에게 준다.
5. 배포 실패 시: JSON은 로컬에 남아 있으니 유실 없음. 그날은 예전 방식(Artifact)으로 임시 발행하고, holes와 news-log에 "배포 실패"를 적는다. 다음 실행 배포에 함께 실린다.

내용 규칙(그대로 유지): 인사이트는 read/connect/trap 세 줄 + `기다릴 것`/`오늘 할 것` 칩 — 확인·기록 행동만, 매매·비중 조절 금지. 용어는 3~5개, 숫자를 오독하게 만드는 지점 우선. 제목·요약은 사실만. `unknown`은 지어내지 않는다. 못 연 소스는 `holes`에 반드시 적는다.
```

- [ ] **Step 2: "이 스킬은" 블록의 산출물 문구 갱신**

"입력 → 남는 것" 줄의 "브리핑 페이지(HTML)"를 "브리핑 사이트(고정 UI, Vercel)"로, "아직 안 되는 것"은 유지. 사이트 URL을 한 줄 추가:
```markdown
- 브리핑 사이트: <Task 3에서 나온 프로덕션 URL>
```

- [ ] **Step 3: 6번(파일에 남긴다) 문구 갱신**

`news-log.md` append 항목에 "브리핑 페이지: <Artifact URL>" 대신 "브리핑: <사이트URL>/?date=YYYY-MM-DD"를 적도록 한 줄 수정.

- [ ] **Step 4: 발동 확인 (드라이런)**

`/뉴스`를 실제로 재실행하지 않고, SKILL.md를 다시 읽어 5번 단계가 스키마→검증→배포 순서로 읽히는지, Task 1 스키마와 필드명이 일치하는지 대조한다. 불일치 발견 시 SKILL.md를 고친다 (스키마가 진실의 원천).

- [ ] **Step 5: Commit**

```bash
git add ".claude/skills/뉴스/SKILL.md"
git commit -m "뉴스 스킬: Artifact 발행 → site/data JSON + vercel 배포로 교체 (v3)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: PR 올리기

**Files:** 없음 (git/GitHub 작업만)

**Interfaces:**
- Consumes: Task 1~4의 커밋들 (`briefing-site` 브랜치)
- Produces: `briefing-site` → `main` PR (main 보호 규칙 준수)

- [ ] **Step 1: 브랜치 push**

```bash
git push origin briefing-site
```

- [ ] **Step 2: PR 생성**

```bash
"/c/Program Files/GitHub CLI/gh.exe" pr create --base main --head briefing-site \
  --title "장전 브리핑 사이트: site/ 정적 UI + /뉴스 스킬 v3 (JSON+vercel 배포)" \
  --body-file <스크래치패드에 작성한 본문 파일>
```
본문에는: 설계 문서 경로, 사이트 프로덕션 URL, 스킬 변경 요약, "club/ 자료·판단 기록은 사이트에 포함되지 않음" 명시. 끝에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 3: 최종 확인**

PR URL과 사이트 URL을 소유자에게 전달. 다음 아침 `/뉴스` 실행이 첫 실전 갱신 테스트임을 안내.

---

## Self-Review 결과

- **Spec coverage**: 요구 1(공개)=Task 3 Step 5, 요구 2(메인=오늘, 날짜 이동)=Task 2, 요구 3(git 없이 즉시)=Task 4 Step 1, 요구 4(비포함 목록)=Global Constraints+PR 본문, 요구 5(조언 금지/라벨/unknown)=validate.mjs+app.js(uw)+푸터 고지. 실패 처리=Task 4 Step 1의 5항. 1회 설정=Task 3. 성공 기준 1~4 각각 Task 4/3/2/1에 대응. 누락 없음.
- **Placeholder scan**: "TBD/TODO/적절히" 없음. 모든 코드 스텝에 실제 코드 포함.
- **Type consistency**: `validate.mjs`의 필수 필드 = `app.js`가 읽는 필드 = SKILL.md 스키마 요약 = Task 1 데이터 파일. `dir` 값 `up|down|flat`, 라벨 `1차|2차|추정` 전 구간 일치 확인.
