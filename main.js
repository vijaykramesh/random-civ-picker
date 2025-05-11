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
  
  /* ---------- show / hide the picker grid ---------- */
  function togglePicker() {
    civGridBox.classList.toggle("is-hidden");
  }
  
  /* ---------- globals ---------- */
  let allCivs = {};
  let gameSelected = "civilization-v";
  let civs = []; // current available pool (exclusions remove items)
  
  /* ---------- DOM refs ---------- */
  const gameSelector = document.getElementById("game-selector");
  const civGrid = document.getElementById("civ-grid");
  const civGridBox = document.getElementById("civ-grid-box");
  const chooseBtn = document.getElementById("civ-choose-btn");
  const showExcluded = document.getElementById("show-excluded-civs-btn");
  const draftSection = document.getElementById("draft-results");
  const draftTable = document.querySelector("#draft-table tbody");
  const playerInput = document.getElementById("player-count");
  
  /* ---------- load games.json (sync) ---------- */
  const req = new XMLHttpRequest();
  req.open("GET", "games.json", false);
  req.overrideMimeType("application/json");
  req.onreadystatechange = () => {
    if (req.readyState === XMLHttpRequest.DONE) {
      allCivs = JSON.parse(req.responseText);
      civs = allCivs[gameSelected].factions.slice(); // clone
      populateGrid(); // build grid but keep it hidden
    }
  };
  req.send();
  
  /* ---------- populate civ grid ---------- */
  function populateGrid() {
    civGrid.innerHTML = "";
    const list = allCivs[gameSelected].factions;
  
    // 6 columns × up to 9 rows → 54 slots (covers every civ count)
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
  
        // image
        const img = document.createElement("img");
        img.src = `images/${gameSelected}/${civ}.png`;
        img.width = img.height = 128;
        img.className = "image centered-img no-select";
        img.ondragstart = () => false;
  
        // label
        const p = document.createElement("p");
        p.textContent = civ.capitalize();
        p.className = "has-text-weight-bold";
  
        box.append(img, p);
        box.addEventListener("click", toggleCiv);
  
        column.appendChild(box);
      }
      civGrid.appendChild(column);
    }
  
    /* KEEP the grid hidden until user toggles */
    draftSection.classList.add("is-hidden"); // hide old results when grid refreshes
  }
  
  /* ---------- toggle include / exclude ---------- */
  function toggleCiv(e) {
    const box = e.currentTarget; // .grid-element
    const img = box.querySelector("img");
    const civ = box.id.replace("grid-", "");
  
    const nowExcluded = img.classList.toggle("dark-image"); // dim / undim
  
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
    draftTable.innerHTML = ""; // clear previous rows
  
    /* helper to build a row */
    const makeRow = (label) => {
      const tr = document.createElement("tr");
      const th = document.createElement("td");
      th.textContent = label;
      tr.appendChild(th);
  
      for (let i = 0; i < 3; i++) {
        const civ = pool.pop();
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
    };
  
    /* human players first */
    for (let i = 0; i < realPlayers; i++) {
      makeRow(`Player ${i + 1}`);
    }
  
    /* Venny & Denny at the end */
    extraNames.forEach((name) => makeRow(name));
  
    draftSection.classList.remove("is-hidden");
  }
  
  /* ---------- events ---------- */
  gameSelector.addEventListener("change", (e) => {
    gameSelected =
      e.target.options[e.target.selectedIndex].dataset.gameName;
    civs = allCivs[gameSelected].factions.slice(); // reset pool for new game
    populateGrid();
  });
  
  chooseBtn.addEventListener("click", draft);
  showExcluded.addEventListener("click", togglePicker);
  