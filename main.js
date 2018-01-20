String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var civs = [
    'america', 'arabia', 'assyria', 'austria', 'aztec',
    'babylon', 'brazil', 'byzantium',
    'carthage', 'celts', 'china',
    'denmark',
    'egypt', 'england', 'ethiopia',
    'france',
    'germany', 'greece',
    'huns',
    'inca', 'india', 'indonesia', 'iroquois',
    'japan',
    'korea',
    'maya', 'mongolia', 'morocco',
    'netherlands',
    'ottomans',
    'persia', 'poland', 'polynesia', 'portugal',
    'rome', 'russia',
    'shoshone', 'siam', 'songhai', 'spain', 'sweden',
    'venice',
    'zulu'
]

var civGrid = document.getElementById('civ-grid');

for (var i = 0; i < 6; i++) {
    var column = document.createElement('div');
    column.classList.add('column');
    column.classList.add('has-text-centered');

    for (var j = 0; j <= 8; j++) {
        if (civs.length > j * 6 + i) {
            var civIndex = j * 6 + i;
            var gridImage = makeCivImage(civIndex);
            var gridImageDescription = makeDescription(civIndex);

            var gridBox = document.createElement('div');
            gridBox.id = 'grid-element-' + civs[civIndex];
            gridBox.classList.add('grid-element');

            gridBox.appendChild(gridImage);
            gridBox.appendChild(gridImageDescription);

            column.append(gridBox);
        }
    }
    civGrid.appendChild(column);
}

var gridElements = document.getElementsByClassName('grid-element');
for (var i = 0; i < gridElements.length; i++){
    gridElements[i].addEventListener('click', clickGridElement);
}

function clickGridElement(event){
    var clickedElementBox = event.target.parentElement;
    if (!clickedElementBox.classList.contains('column')) {
        var clickedImage = clickedElementBox.childNodes[0];
        var clickedText = clickedElementBox.childNodes[1];

        if (clickedImage.classList.contains('dark-image')){
            clickedImage.classList.remove('dark-image');
            reAddCiv(clickedText.innerHTML.toLowerCase());
        } else {
            clickedImage.classList.add('dark-image');
            removeCiv(clickedText.innerHTML.toLowerCase());
        }
    }
}

function removeCiv(civ){
    var civIndex = civs.indexOf(civ);
    if (civIndex > -1) {
        civs.splice(civIndex, 1)
    }
}

function reAddCiv(civ){
    civs.push(civ);
}

function makeDescription(civIndex){
    var description = document.createElement('p');
    description.innerHTML = civs[civIndex].capitalize();
    description.classList.add('has-text-weight-bold');
    return description;
}

function makeCivImage(civIndex){
    var img = document.createElement('img');
    img.setAttribute('src', 'images/' + civs[civIndex] + '.png');
    img.classList.add('image');
    img.classList.add('centered-img');
    img.setAttribute('ondragstart', "return false;");
    img.setAttribute('width', '128px');
    img.setAttribute('height', '128px');
    img.classList.add('no-select');
    return img;
}

var mainWrapper = document.getElementById('wrapper');
var chooseBtn = document.getElementById('civ-choose-btn');
chooseBtn.addEventListener('click', function(event){
    var existingChosenCivBox = document.getElementById('chosen-civ-box');
    if (existingChosenCivBox) {
        existingChosenCivBox.parentElement.removeChild(existingChosenCivBox);
    }

    if (civs.length > 0) {
        var chosenCiv = civs[Math.floor(Math.random() * civs.length)];
        var chosenCivBox = document.createElement('div');
        chosenCivBox.id = 'chosen-civ-box';
        chosenCivBox.classList.add('box');
        chosenCivBox.classList.add('has-text-centered');
        var chosenCivIndex = civs.indexOf(chosenCiv);
        var chosenCivImage = makeCivImage(chosenCivIndex);
        chosenCivImage.setAttribute('width', '200px');
        chosenCivImage.setAttribute('height', '200px');
        var chosenDescription = makeDescription(chosenCivIndex);
        chosenCivBox.appendChild(chosenCivImage);
        chosenCivBox.appendChild(chosenDescription);
        mainWrapper.appendChild(chosenCivBox);
    }
});

var showExcludedCivsBtn = document.getElementById('show-excluded-civs-btn');
var civGridBox = document.getElementById('civ-grid-box');
showExcludedCivsBtn.addEventListener('click', function(event){
    if (civGridBox.classList.contains('is-hidden')) {
        civGridBox.classList.remove('is-hidden');
    } else {
        civGridBox.classList.add('is-hidden');
    }
});
