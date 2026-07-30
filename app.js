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
