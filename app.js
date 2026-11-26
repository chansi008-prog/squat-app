// 하루 스쿼트: 홈(오늘·설정·기록 달력). 기록은 이 폰(브라우저)에만 저장된다.
import { openSquat, charSvg } from "./squat.js";

const VERSION = "v1";
const LOG_KEY = "hs-log", SET_KEY = "hs-set";
const OPT = { reps: [10, 15, 20], sets: [1, 2, 3, 4, 5], rest: [10, 20, 30] };

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let cfg = Object.assign({ reps: 10, sets: 4, rest: 10 }, load(SET_KEY, {}));
let log = load(LOG_KEY, {});            // { "2026-11-25": { reps: 40, full: 1 } }
let view = null, picked = null;           // 달력에서 보고 있는 달, 누른 날

const pad = n => String(n).padStart(2, "0");
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => new Date();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function record(total, full) {
  const k = key(today()), e = log[k] || { reps: 0, full: 0 };
  e.reps += total; if (full) e.full = (e.full || 0) + 1;
  log[k] = e; save(LOG_KEY, log);
}
function streak() {
  let d = today(), n = 0;
  if (!(log[key(d)] || {}).full) d = addDays(d, -1);   // 오늘 아직 안 했으면 어제부터 센다
  while ((log[key(d)] || {}).full) { n++; d = addDays(d, -1); }
  return n;
}

function render() {
  const t = today(), tk = key(t), te = log[tk];
  if (!view) view = new Date(t.getFullYear(), t.getMonth(), 1);
  const ym = `${view.getFullYear()}-${pad(view.getMonth() + 1)}`;
  const month = Object.entries(log).filter(([k]) => k.startsWith(ym));
  const mDays = month.filter(([, e]) => e.full).length, mReps = month.reduce((a, [, e]) => a + e.reps, 0);
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const first = view.getDay(), last = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  let cells = W.map((w, i) => `<div class="w${i === 0 ? " sun" : ""}">${w}</div>`).join("") + "<div></div>".repeat(first);
  for (let d = 1; d <= last; d++) {
    const k = `${ym}-${pad(d)}`, e = log[k];
    const cls = ["d", e ? (e.full ? "full" : "part") : "", k === tk ? "today" : "", k > tk ? "fut" : ""].join(" ");
    cells += `<button class="${cls}" data-day="${k}">${d}</button>`;
  }
  const isThisMonth = view.getFullYear() === t.getFullYear() && view.getMonth() === t.getMonth();
  const seg = (name, unit) => `<div class="seg">${OPT[name].map(v => `<button data-opt="${name}" data-v="${v}" class="${cfg[name] === v ? "on" : ""}">${v}${unit}</button>`).join("")}</div>`;

  document.getElementById("app").innerHTML = `<main>
    <div class="hd"><h1>하루 스쿼트</h1><span class="date">${t.getMonth() + 1}월 ${t.getDate()}일 ${W[t.getDay()]}요일</span></div>
    <div class="card">
      <div class="hero">${charSvg(0)}
        <div><div class="t">오늘 한 스쿼트</div>
          <div class="n">${te ? te.reps : 0}<small>회</small></div>
          ${te && te.full ? `<span class="ok">오늘 완료 ✓</span>` : `<div class="t" style="font-size:13px;margin-top:6px">${streak() ? `${streak()}일 연속 했어요! 오늘도 이어가요` : "오늘 첫 스쿼트를 시작해요"}</div>`}
        </div>
      </div>
      <button class="go" data-act="go">🏋️ 스쿼트 시작 <small>· ${cfg.reps}회 × ${cfg.sets}세트</small></button>
    </div>
    <div class="card">
      <div class="h">운동 설정</div>
      <div class="opt"><span>횟수</span>${seg("reps", "회")}</div>
      <div class="opt"><span>세트</span>${seg("sets", "")}</div>
      <div class="opt"><span>휴식</span>${seg("rest", "초")}</div>
    </div>
    <div class="card">
      <div class="h">내 기록</div>
      <div class="stats">
        <div><b>${streak()}일</b><span>연속</span></div>
        <div><b>${mDays}일</b><span>${view.getMonth() + 1}월 완료</span></div>
        <div><b>${mReps.toLocaleString()}</b><span>${view.getMonth() + 1}월 총 횟수</span></div>
      </div>
      <div class="cal-hd"><button data-act="prev">‹</button><b>${view.getFullYear()}년 ${view.getMonth() + 1}월</b><button data-act="next" ${isThisMonth ? "disabled" : ""}>›</button></div>
      <div class="cal">${cells}</div>
      <div class="day-info" id="dayinfo">${picked ? dayText(picked) : "날짜를 누르면 그날 기록이 보여요"}</div>
      <div class="legend"><span><i style="background:#2ecc71"></i>끝까지 완료</span><span><i style="background:#d6f5e3"></i>조금 했어요</span></div>
    </div>
    <div class="foot">기록은 이 폰에만 저장돼요 · ${VERSION}<br><button data-act="reset">기록 모두 지우기</button></div>
  </main>`;
}
function dayText(k) {
  const [, m, d] = k.split("-").map(Number), e = log[k];
  if (!e) return `${m}월 ${d}일 · 기록 없음`;
  return `${m}월 ${d}일 · 스쿼트 ${e.reps}회${e.full ? ` · 완료 ${e.full > 1 ? e.full + "번" : "✓"}` : ""}`;
}

function ask(text, okLabel, onOk) {
  const bg = document.createElement("div");
  bg.className = "sheet-bg";
  bg.innerHTML = `<div class="sheet"><p>${text}</p><div class="row"><button data-a="no">취소</button><button class="red" data-a="ok">${okLabel}</button></div></div>`;
  bg.onclick = e => { const a = e.target.closest("[data-a]"); if (e.target === bg || a) { bg.remove(); if (a && a.dataset.a === "ok") onOk(); } };
  document.body.append(bg);
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act],[data-opt],[data-day]"); if (!b || b.closest(".sqt")) return;
  if (b.dataset.opt) { cfg[b.dataset.opt] = Number(b.dataset.v); save(SET_KEY, cfg); render(); return; }
  if (b.dataset.day) { picked = b.dataset.day; document.getElementById("dayinfo").textContent = dayText(picked); return; }
  const a = b.dataset.act;
  if (a === "go") openSquat({
    ...cfg,
    onDone: ({ total }) => { record(total, true); render(); },
    onEnd: ({ total }) => { record(total, false); render(); },
    onClose: render,
  });
  else if (a === "prev") { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); picked = null; render(); }
  else if (a === "next") { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); picked = null; render(); }
  else if (a === "reset") ask("지금까지의 스쿼트 기록을 모두 지울까요?<br>지운 기록은 되돌릴 수 없어요.", "모두 지우기", () => { log = {}; save(LOG_KEY, log); picked = null; render(); });
});

// 자정이 지나거나 다시 열었을 때 날짜를 새로 맞춘다
let shownDay = key(today());
document.addEventListener("visibilitychange", () => { if (!document.hidden && key(today()) !== shownDay) { shownDay = key(today()); view = null; render(); } });

render();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
