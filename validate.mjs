// 배포 전 브리핑 데이터 검증: node site/validate.mjs site/data/YYYY-MM-DD.json
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("사용법: node validate.mjs <data/YYYY-MM-DD.json>");
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
req(Array.isArray(d.opened), "opened는 배열");

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
