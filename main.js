let addCivBtn = document.getElementById('add-civ-btn');
let submitCiv = document.getElementById('submit-civ');
let civExclusions = document.querySelector('#civ-exclusions');
let delCivBtn = document.getElementsByClassName('delete-civ-btn')[0];
let civs = [];

function deleteCiv(button){
    let buttonRow = button.parentNode.parentNode;
    civExclusions.removeChild(buttonRow);
}

delCivBtn.addEventListener('click', (event) => { deleteCiv(event.target) });

addCivBtn.addEventListener('click', () => {
    let newRow = document.createElement('div');
    newRow.setAttribute('class', 'row');

    let newLeftCol = document.createElement('div');
    newLeftCol.setAttribute('class', 'col');

    let newRightCol = document.createElement('div');
    newRightCol.setAttribute('class', 'col');

    newRow.appendChild(newLeftCol);
    newRow.appendChild(newRightCol);

    let newInput = document.createElement('input');
    newInput.setAttribute('class', 'civ-input');
    newInput.setAttribute('type', 'text');
    newInput.setAttribute('placeholder', 'Enter a civ to exclude...');

    let newDeleteBtn = document.createElement('button');
    newDeleteBtn.setAttribute('type', 'button');
    newDeleteBtn.setAttribute('class', 'btn delete-civ-btn');
    newDeleteBtn.innerHTML = 'x';

    civExclusions.appendChild(newRow);
    newLeftCol.appendChild(newDeleteBtn);
    newDeleteBtn.addEventListener('click', (event) => { deleteCiv(event.target) });
    newRightCol.appendChild(newInput);
});

function getExcludedCivs() {
    let excludedCivInputs = Array.from(document.getElementsByClassName('civ-input'));
    let excludedCivs = [];
    excludedCivInputs.forEach(civInput => {
        excludedCivs.push(civInput.value);
    });
    return excludedCivs;
}

function remove(list, element){
    let lowercaseList = list.map(element => element.toLowerCase());
    let index = lowercaseList.indexOf(element);
    if(index !== -1){
        list.splice(index, 1);
    }
}

function initData(dlcs){
    let gameCivs = {
        base: ['America', 'Arabia', 'Aztecs',
                'China', 'Egypt', 'England',
                'France', 'Germany', 'Greece',
                'India', 'Iroquois', 'Japan',
                'Ottomans', 'Persia', 'Rome',
                'Russia', 'Siam', 'Songhai'],
        gk: ['Austria', 'Byzantium', 'Carthage',
              'Celts', 'Ethiopia', 'Huns',
              'Maya', 'Netherlands', 'Sweden'],
        bnw: ['Assyria', 'Brazil', 'Indonesia',
               'Morocco', 'Poland', 'Portugal',
               'Shoshone', 'Venice', 'Zulus'],
        babylon: ['Babylon'],
        denmark: ['Denmark'],
        spainInca: ['Spain', 'Inca'],
        korea: ['Korea'],
        mongolia: ['Mongolia'],
        polynesia: ['Polynesia']
    }

    let civList = gameCivs['base'];

    dlcs.forEach((dlc) => {
        civList = civList.concat(gameCivs[dlc])
    });

    return civList;
}

submitCiv.addEventListener('click', () => {
    let excludedCivs = getExcludedCivs();
    civs = initData(['babylon']);
    excludedCivs.forEach(civToExclude => {
        civToExclude = civToExclude.toLowerCase();
        remove(civs, civToExclude);
    });

    if(civs.length > 0){
        civs = civs[Math.floor(Math.random() * civs.length)];
    } else {
        civs = [];
    }

    let wrapper = document.getElementById('wrapper');
    let civText = document.getElementById('civ-text');
    if (civText == null) {
        civText = document.createElement('h1');
        civText.setAttribute('id', 'civ-text');
        wrapper.appendChild(civText);
    }

    civText.innerHTML = civs;
});
