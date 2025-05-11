/* ---------- helpers ---------- */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* encode / decode draft state into the hash */
function encodeDraft(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeDraft(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}

/* ---------- show / hide the picker grid ---------- */
function togglePicker() {
  civGridBox.classList.toggle("is-hidden");
}

/* ---------- show KHAAAAAN gif ---------- */
function showKhanGif() {
  if (document.getElementById("khan-overlay")) return; // already showing

  const overlay = document.createElement("div");
  overlay.id = "khan-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 9999,
    pointerEvents: "none",
  });

  const img = document.createElement("img");
  img.src = "images/khan.gif";
  img.style.maxWidth = "80vw";
  img.style.maxHeight = "80vh";
  overlay.appendChild(img);

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 3000);
}

/* ---------- globals ---------- */
let allCivs = {};
let gameSelected = "civilization-v";
let civs = []; // pool after exclusions
let pendingDraftData = null; // when loading from hash

/* ---------- DOM refs ---------- */
const gameSelector = document.getElementById("game-selector");
const civGrid = document.getElementById("civ-grid");
const civGridBox = document.getElementById("civ-grid-box");
const chooseBtn = document.getElementById("civ-choose-btn");
const showExcluded = document.getElementById("show-excluded-civs-btn");
const draftSection = document.getElementById("draft-results");
const draftTable = document.querySelector("#draft-table tbody");
const playerInput = document.getElementById("player-count");

/* ---------- inspect hash (shared draft link) ---------- */
if (location.hash.startsWith("#draft_id=")) {
  try {
    pendingDraftData = decodeDraft(location.hash.slice(10));
  } catch {
    console.warn("Bad draft hash ignored");
  }
}

/* ---------- load games.json (sync) ---------- */
const req = new XMLHttpRequest();
req.open("GET", "games.json", false);
req.overrideMimeType("application/json");
req.onreadystatechange = () => {
  if (req.readyState === XMLHttpRequest.DONE) {
    allCivs = JSON.parse(req.responseText);

    if (pendingDraftData) {
      gameSelected = pendingDraftData.g;
      for (const opt of gameSelector.options) {
        if (opt.dataset.gameName === gameSelected) opt.selected = true;
      }
    }

    civs = allCivs[gameSelected].factions.slice();
    populateGrid();

    if (pendingDraftData) reconstructDraft(pendingDraftData);
  }
};
req.send();

/* ---------- populate civ grid ---------- */
function populateGrid() {
  civGrid.innerHTML = "";
  const list = allCivs[gameSelected].factions;

  for (let col = 0; col < 6; col++) {
    const column = document.createElement("div");
    column.classList.add("column", "has-text-centered");

    for (let row = 0; row < 9; row++) {
      const idx = row * 6 + col;
      if (idx >= list.length) break;

      const civ = list[idx];
      const box = document.createElement("div");
      box.id = `grid-${civ}`;
      box.className = "grid-element";

      const img = document.createElement("img");
      img.src = `images/${gameSelected}/${civ}.png`;
      img.width = img.height = 128;
      img.className = "image centered-img no-select";
      img.ondragstart = () => false;

      const p = document.createElement("p");
      p.textContent = civ.capitalize();
      p.className = "has-text-weight-bold";

      box.append(img, p);
      box.addEventListener("click", toggleCiv);

      column.appendChild(box);
    }
    civGrid.appendChild(column);
  }

  draftSection.classList.add("is-hidden");
}

/* ---------- toggle include / exclude ---------- */
function toggleCiv(e) {
  const box = e.currentTarget;
  const img = box.querySelector("img");
  const civ = box.id.replace("grid-", "");

  const nowExcluded = img.classList.toggle("dark-image");
  if (nowExcluded) {
    const i = civs.indexOf(civ);
    if (i !== -1) civs.splice(i, 1);
  } else {
    if (!civs.includes(civ)) civs.push(civ);
  }
}

/* ---------- draft logic (adds Venny & Denny at END) ---------- */
function draft() {
  const realPlayers = Math.max(1, parseInt(playerInput.value) || 1);
  const extraNames = ["Venny", "Denny"];
  const totalPlayers = realPlayers + extraNames.length;
  const civsNeeded = totalPlayers * 3;

  if (civs.length < civsNeeded) {
    alert(
      `Need ${civsNeeded} available civs but only ${civs.length} remain.`
    );
    return;
  }

  const pool = shuffle(civs);
  draftTable.innerHTML = "";

  /* helper to make a row, returns the civs picked */
  const makeRow = (label) => {
    const tr = document.createElement("tr");
    const th = document.createElement("td");
    th.textContent = label;
    tr.appendChild(th);

    const rowCivs = [];
    for (let i = 0; i < 3; i++) {
      const civ = pool.pop();
      rowCivs.push(civ);

      const td = document.createElement("td");
      const img = document.createElement("img");
      img.src = `images/${gameSelected}/${civ}.png`;
      img.width = img.height = 64;
      img.className = "no-select";

      const p = document.createElement("p");
      p.textContent = civ.capitalize();
      p.style.marginTop = "4px";

      td.append(img, p);
      tr.appendChild(td);
    }
    draftTable.appendChild(tr);
    return rowCivs;
  };

  const assignments = [];

  for (let i = 0; i < realPlayers; i++) {
    assignments.push(makeRow(`Player ${i + 1}`));
  }
  extraNames.forEach((name) => assignments.push(makeRow(name)));

  draftSection.classList.remove("is-hidden");

  /* show KHAN gif if any human player got mongolia */
  const humanHasMongol = assignments
    .slice(0, realPlayers)
    .some((row) => row.includes("mongolia"));
  if (humanHasMongol) showKhanGif();

  /* encode & store in hash */
  const excluded = allCivs[gameSelected].factions.filter(
    (c) => !civs.includes(c)
  );
  const draftObj = {
    g: gameSelected,
    p: realPlayers,
    x: excluded,
    a: assignments,
  };
  location.hash = "draft_id=" + encodeDraft(draftObj);
}

/* ---------- reconstruct a draft from hash ---------- */
function reconstructDraft(data) {
  // reapply exclusions
  data.x.forEach((civ) => {
    const box = document.getElementById(`grid-${civ}`);
    if (box) box.querySelector("img").classList.add("dark-image");
  });
  civs = allCivs[gameSelected].factions.filter(
    (c) => !data.x.includes(c)
  );

  // rebuild table
  draftTable.innerHTML = "";
  const extraNames = ["Venny", "Denny"];

  data.a.forEach((rowCivs, idx) => {
    const label =
      idx < data.p ? `Player ${idx + 1}` : extraNames[idx - data.p];
    const tr = document.createElement("tr");
    const th = document.createElement("td");
    th.textContent = label;
    tr.appendChild(th);

    rowCivs.forEach((civ) => {
      const td = document.createElement("td");
      const img = document.createElement("img");
      img.src = `images/${gameSelected}/${civ}.png`;
      img.width = img.height = 64;

      const p = document.createElement("p");
      p.textContent = civ.capitalize();
      p.style.marginTop = "4px";

      td.append(img, p);
      tr.appendChild(td);
    });
    draftTable.appendChild(tr);
  });

  playerInput.value = data.p;
  draftSection.classList.remove("is-hidden");

  /* fire KHAN gif if applicable */
  const humanRows = data.a.slice(0, data.p);
  if (humanRows.some((row) => row.includes("mongolia"))) showKhanGif();
}

/* ---------- events ---------- */
gameSelector.addEventListener("change", (e) => {
  gameSelected =
    e.target.options[e.target.selectedIndex].dataset.gameName;
  civs = allCivs[gameSelected].factions.slice();
  location.hash = "";
  populateGrid();
});

chooseBtn.addEventListener("click", draft);
showExcluded.addEventListener("click", togglePicker);
