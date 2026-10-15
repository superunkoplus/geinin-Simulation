// ======================
// ゲーム状態
// ======================
const state = {
  name: "",
  year: 1,
  month: 4,          // 4月スタート
  neta: 30,
  talk: 25,
  popularity: 5,
  stamina: 80,
  money: 30000,
  ap: 2,             // 1ヶ月の行動力
  maxAp: 2,
  log: [],
  selectedActions: [],
  phase: "action"    // action | result
};

const MONTH_NAMES = ["", "1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

// 行動リスト
const ACTIONS = [
  {
    id: "live",
    name: "ライブ出演",
    desc: "ネタ力・知名度アップ。体力消費",
    cost: 1,
    effect: () => {
      const gain = rand(3, 8);
      state.neta = clamp(state.neta + gain, 0, 100);
      state.popularity = clamp(state.popularity + rand(1, 3), 0, 100);
      state.stamina = clamp(state.stamina - rand(8, 15), 0, 100);
      return `ライブに出演した。ネタ力+${gain}、知名度が少し上がった。`;
    }
  },
  {
    id: "write",
    name: "ネタ作り",
    desc: "ネタ力大幅アップ。体力やや消費",
    cost: 1,
    effect: () => {
      const gain = rand(5, 12);
      state.neta = clamp(state.neta + gain, 0, 100);
      state.stamina = clamp(state.stamina - rand(5, 10), 0, 100);
      return `ひたすらネタを考えた。ネタ力+${gain}。`;
    }
  },
  {
    id: "talk",
    name: "トーク練習",
    desc: "トーク力アップ",
    cost: 1,
    effect: () => {
      const gain = rand(4, 10);
      state.talk = clamp(state.talk + gain, 0, 100);
      state.stamina = clamp(state.stamina - rand(3, 8), 0, 100);
      return `フリートークの練習をした。トーク力+${gain}。`;
    }
  },
  {
    id: "audition",
    name: "テレビオーディション",
    desc: "知名度チャンス。失敗リスクあり",
    cost: 1,
    effect: () => {
      const score = state.neta * 0.4 + state.talk * 0.4 + state.popularity * 0.2 + rand(-15, 15);
      if (score > 55) {
        const popGain = rand(5, 12);
        state.popularity = clamp(state.popularity + popGain, 0, 100);
        state.money += rand(10000, 30000);
        return `オーディション合格！知名度+${popGain}、ギャラも入った。`;
      } else {
        state.stamina = clamp(state.stamina - 10, 0, 100);
        return `オーディション落選…。悔しいが経験にはなった。`;
      }
    }
  },
  {
    id: "rest",
    name: "休養",
    desc: "体力回復。行動力1消費",
    cost: 1,
    effect: () => {
      const heal = rand(15, 30);
      state.stamina = clamp(state.stamina + heal, 0, 100);
      return `しっかり休んだ。体力+${heal}。`;
    }
  },
  {
    id: "parttime",
    name: "アルバイト",
    desc: "お金を稼ぐ。知名度は下がるかも",
    cost: 1,
    effect: () => {
      const earn = rand(20000, 45000);
      state.money += earn;
      if (Math.random() < 0.3) {
        state.popularity = clamp(state.popularity - 1, 0, 100);
        return `アルバイトで¥${earn.toLocaleString()}稼いだ。少し知名度が下がった気がする…。`;
      }
      return `アルバイトで¥${earn.toLocaleString()}稼いだ。`;
    }
  }
];

// ======================
// ユーティリティ
// ======================
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function addLog(text, type = "normal") {
  state.log.push({ text, type });
  if (state.log.length > 40) state.log.shift();
  renderLog();
}

function renderLog() {
  const panel = document.getElementById("log-panel");
  panel.innerHTML = state.log.map(e =>
    `<div class="log-entry log-${e.type}">${e.text}</div>`
  ).join("");
  panel.scrollTop = panel.scrollHeight;
}

function updateUI() {
  document.getElementById("display-name").textContent = state.name;
  document.getElementById("month-title").textContent = `${state.year}年目 ${MONTH_NAMES[state.month]}`;

  document.getElementById("val-neta").textContent = state.neta;
  document.getElementById("val-talk").textContent = state.talk;
  document.getElementById("val-pop").textContent = state.popularity;
  document.getElementById("val-sta").textContent = state.stamina;
  document.getElementById("val-money").textContent = `¥${state.money.toLocaleString()}`;

  document.getElementById("bar-neta").style.width = state.neta + "%";
  document.getElementById("bar-talk").style.width = state.talk + "%";
  document.getElementById("bar-pop").style.width = state.popularity + "%";
  document.getElementById("bar-sta").style.width = state.stamina + "%";

  document.getElementById("ap-left").textContent = state.ap;

  const nextBtn = document.getElementById("next-btn");
  nextBtn.disabled = state.ap > 0;
}

function renderActions() {
  const container = document.getElementById("actions");
  container.innerHTML = "";

  ACTIONS.forEach(act => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.disabled = state.ap < act.cost || state.stamina < 10;
    btn.innerHTML = `${act.name}<span class="desc">${act.desc}</span>`;
    btn.addEventListener("click", () => doAction(act));
    container.appendChild(btn);
  });
}

// ======================
// ゲームフロー
// ======================
function startGame() {
  const nameInput = document.getElementById("player-name");
  const name = nameInput.value.trim() || "無名の芸人";
  state.name = name;
  state.log = [{ text: `${name}、事務所に所属した。これからが本番だ。`, type: "normal" }];

  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  updateUI();
  renderLog();
  renderActions();
}

function doAction(act) {
  if (state.ap < act.cost) return;

  state.ap -= act.cost;
  state.selectedActions.push(act.id);

  const result = act.effect();
  addLog(result, "normal");

  if (state.stamina < 20) {
    addLog("体力がかなり落ちている…。無理は禁物だ。", "bad");
  }

  updateUI();
  renderActions();
}

function endMonth() {
  // 月末ランダムイベント
  const events = [
    {
      cond: () => state.popularity > 20 && Math.random() < 0.25,
      text: "雑誌の取材が来た！知名度が少し上がった。",
      effect: () => { state.popularity = clamp(state.popularity + rand(2, 5), 0, 100); },
      type: "event"
    },
    {
      cond: () => state.stamina < 30 && Math.random() < 0.4,
      text: "過労で体調を崩した…。来月は休め。",
      effect: () => { state.stamina = clamp(state.stamina - 10, 0, 100); },
      type: "bad"
    },
    {
      cond: () => Math.random() < 0.15,
      text: "先輩芸人からアドバイスをもらった。ネタ力とトーク力が少し上がった。",
      effect: () => {
        state.neta = clamp(state.neta + 2, 0, 100);
        state.talk = clamp(state.talk + 2, 0, 100);
      },
      type: "good"
    },
    {
      cond: () => state.money < 10000 && Math.random() < 0.5,
      text: "生活が苦しい…。アルバイトを考えた方がいいかも。",
      effect: () => {},
      type: "bad"
    }
  ];

  events.forEach(ev => {
    if (ev.cond()) {
      ev.effect();
      addLog(ev.text, ev.type);
    }
  });

  // 月を進める
  state.month++;
  if (state.month > 12) {
    state.month = 1;
    state.year++;
    addLog(`—— ${state.year}年目が始まった ——`, "event");
  }

  // 体力の自然回復
  state.stamina = clamp(state.stamina + rand(5, 12), 0, 100);

  // 行動力リセット
  state.ap = state.maxAp;
  state.selectedActions = [];

  // 簡易勝利チェック
  if (state.popularity >= 80 && state.neta >= 70) {
    addLog("【快挙】全国区の人気芸人として認知され始めた！", "good");
  }

  updateUI();
  renderActions();
}

// ======================
// 初期化
// ======================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("next-btn").addEventListener("click", endMonth);

  // Enterキーでもスタートできるように
  document.getElementById("player-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") startGame();
  });
});