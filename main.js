/* =========================================================
   Civilization Draft Picker – main.js  (bots mode persisted)
   ========================================================= */

/* ---------- helpers ---------- */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
const shuffle = (a) => {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/* ---------- compression detect ---------- */
const hasLZ =
  typeof LZString !== "undefined" &&
  typeof LZString.compressToEncodedURIComponent === "function" &&
  typeof LZString.decompressFromEncodedURIComponent === "function";

/* ---------- encode / decode ---------- */
function encodeDraft(obj) {
  const json = JSON.stringify(obj);
  const base = btoa(unescape(encodeURIComponent(json)));
  if (hasLZ) {
    const lz = LZString.compressToEncodedURIComponent(json);
    return lz.length < base.length
      ? { key: "d", val: lz }
      : { key: "draft_id", val: base };
  }
  return { key: "draft_id", val: base };
}
function decodeDraft(hash) {
  if (hash.startsWith("d=") && hasLZ) {
    return JSON.parse(
      LZString.decompressFromEncodedURIComponent(hash.slice(2))
    );
  }
  if (hash.startsWith("draft_id=")) {
    return JSON.parse(decodeURIComponent(escape(atob(hash.slice(9)))));
  }
  throw new Error("Unknown hash format");
}

/* ---------- KHAN gif overlay ---------- */
function showKhanGif() {
  if (document.getElementById("khan-overlay")) return;
  const overlay = Object.assign(document.createElement("div"), {
    id: "khan-overlay",
    style:
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;pointer-events:none;",
  });
  const img = document.createElement("img");
  img.src = "images/khan.gif";
  img.style.maxWidth = "80vw";
  img.style.maxHeight = "80vh";
  overlay.appendChild(img);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 10000);
}

/* ---------- toggle picker grid ---------- */
const togglePicker = () => civGridBox.classList.toggle("is-hidden");

/* ---------- globals ---------- */
let allCivs = {};
let gameSelected = "civilization-v";
let civs = [];
let pendingDraft = null;

/* ---------- DOM refs ---------- */
const qs = (s) => document.querySelector(s);
const gameSelector = qs("#game-selector");
const civGrid = qs("#civ-grid");
const civGridBox = qs("#civ-grid-box");
const chooseBtn = qs("#civ-choose-btn");
const showExcluded = qs("#show-excluded-civs-btn");
const draftSection = qs("#draft-results");
const draftTable = qs("#draft-table tbody");
const playerInput = qs("#player-count");
const botsModeSel = qs("#bots-mode"); // dropdown

/* ---------- inspect hash ---------- */
if (location.hash.length > 1) {
  try {
    pendingDraft = decodeDraft(location.hash.slice(1));
  } catch (e) {
    console.warn("Bad hash ignored", e);
  }
}

/* ---------- load games.json ---------- */
const req = new XMLHttpRequest();
req.open("GET", "games.json", false);
req.overrideMimeType("application/json");
req.onreadystatechange = () => {
  if (req.readyState === XMLHttpRequest.DONE) {
    allCivs = JSON.parse(req.responseText);

    if (pendingDraft) {
      gameSelected = pendingDraft.g;
      [...gameSelector.options].forEach((o) => {
        if (o.dataset.gameName === gameSelected) o.selected = true;
      });
      botsModeSel.value = pendingDraft.m || "always";
    }

    civs = allCivs[gameSelected].factions.slice();
    populateGrid();
    if (pendingDraft) rebuildFromDraft(pendingDraft);
  }
};
req.send();

/* ---------- populate civ grid ---------- */
function populateGrid() {
  civGrid.innerHTML = "";
  const list = allCivs[gameSelected].factions;

  for (let col = 0; col < 6; col++) {
    const column = Object.assign(document.createElement("div"), {
      className: "column has-text-centered",
    });
    for (let row = 0; row < 9; row++) {
      const idx = row * 6 + col;
      if (idx >= list.length) break;

      const civ = list[idx];
      const box = Object.assign(document.createElement("div"), {
        id: `grid-${civ}`,
        className: "grid-element",
      });

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

/* ---------- toggle civ ---------- */
function toggleCiv(e) {
  const box = e.currentTarget;
  const img = box.querySelector("img");
  const civ = box.id.replace("grid-", "");
  const excluded = img.classList.toggle("dark-image");
  if (excluded) civs = civs.filter((c) => c !== civ);
  else if (!civs.includes(civ)) civs.push(civ);
}

/* ---------- draft ---------- */
function draft() {
  const realPlayers = Math.max(1, parseInt(playerInput.value) || 1);
  const mode = botsModeSel.value; // always | required | none
  const pool = shuffle(civs.slice()); // copy

  draftTable.innerHTML = "";

  const makeRow = (label) => {
    const tr = document.createElement("tr");
    tr.appendChild(Object.assign(document.createElement("td"), { textContent: label }));
    const rowCivs = [];
    for (let i = 0; i < 3; i++) {
      const civ = pool.pop();
      rowCivs.push(civ);

      const td = document.createElement("td");
      const img = document.createElement("img");
      img.src = `images/${gameSelected}/${civ}.png`;
      img.width = img.height = 64;

      const p = document.createElement("p");
      p.textContent = civ.capitalize();
      p.style.marginTop = "4px";

      td.append(img, p);
      tr.appendChild(td);
    }
    draftTable.appendChild(tr);
    return rowCivs;
  };

  // human rows
  const assignments = [];
  let venicePicked = false;
  let denmarkPicked = false;

  for (let i = 0; i < realPlayers; i++) {
    const row = makeRow(`Player ${i + 1}`);
    assignments.push(row);
    if (row.includes("venice")) venicePicked = true;
    if (row.includes("denmark")) denmarkPicked = true;
  }

  // decide bots
  const bots = [];
  if (mode === "always") {
    bots.push("Venny", "Denny");
  } else if (mode === "required") {
    if (venicePicked) bots.push("Venny");
    if (denmarkPicked) bots.push("Denny");
  }

  if (pool.length < bots.length * 3) {
    alert("Not enough civs for extra players!");
    return;
  }
  bots.forEach((b) => assignments.push(makeRow(b)));

  draftSection.classList.remove("is-hidden");

  // KHAN check
  if (assignments.slice(0, realPlayers).some((r) => r.includes("mongolia"))) {
    showKhanGif();
  }

  // save hash
  const excluded = allCivs[gameSelected].factions.filter((c) => !civs.includes(c));
  const draftObj = {
    g: gameSelected,
    p: realPlayers,
    x: excluded,
    a: assignments,
    m: mode,
  };
  const { key, val } = encodeDraft(draftObj);
  location.hash = `${key}=${val}`;
}

/* ---------- rebuild shared draft ---------- */
function rebuildFromDraft(d) {
  // exclusions
  d.x.forEach((civ) => {
    const img = document.querySelector(`#grid-${civ} img`);
    if (img) img.classList.add("dark-image");
  });
  civs = allCivs[d.g].factions.filter((c) => !d.x.includes(c));

  // table
  draftTable.innerHTML = "";
  const botsLabels = ["Venny", "Denny"];

  d.a.forEach((rowCivs, idx) => {
    const label =
      idx < d.p ? `Player ${idx + 1}` : botsLabels[idx - d.p];
    const tr = document.createElement("tr");
    tr.appendChild(Object.assign(document.createElement("td"), { textContent: label }));

    rowCivs.forEach((civ) => {
      const td = document.createElement("td");
      const img = document.createElement("img");
      img.src = `images/${d.g}/${civ}.png`;
      img.width = img.height = 64;

      const p = document.createElement("p");
      p.textContent = civ.capitalize();
      p.style.marginTop = "4px";

      td.append(img, p);
      tr.appendChild(td);
    });
    draftTable.appendChild(tr);
  });

  playerInput.value = d.p;
  botsModeSel.value = d.m || "always";
  draftSection.classList.remove("is-hidden");

  if (d.a.slice(0, d.p).some((row) => row.includes("mongolia"))) showKhanGif();
}

/* ---------- events ---------- */
gameSelector.addEventListener("change", (e) => {
  gameSelected = e.target.selectedOptions[0].dataset.gameName;
  civs = allCivs[gameSelected].factions.slice();
  location.hash = "";
  populateGrid();
});
chooseBtn.addEventListener("click", draft);
showExcluded.addEventListener("click", togglePicker);
