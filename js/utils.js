// INCLUSIVE RANDOM NUM
function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get Rangom Empty Cell
function getEmptyCell() {
    var randIdx = getRandomNum(0, gEmptyCells.length - 1);
    return gEmptyCells.splice(randIdx, 1)[0];
}

function getEmptyCells(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            gEmptyCells.push({ i, j });
        }
    }
}

function preventContextMenu() {
    var elBody = document.querySelector('body');
    elBody.addEventListener('contextmenu', e => { e.preventDefault() });
}

var interval;
function startInterval() {
    interval = setInterval(getTimer, 10);
}

function stopInterval() {
    clearInterval(interval);
}

// To get the total game time in ms.
function totalGameTime() {
    const currentTime = new Date();
    return currentTime.getTime() - startingTime.getTime();
}

function totalGameTimeAfterLose() {
    const currentTime = new Date();
    const gameTime = gLoseTime.getTime() - startingTime.getTime();
    return currentTime.getTime() - gameTime;
}

// Receives total game time from totalGameTime(), formats it using formatTime() and displays result.
function getTimer() {
    let gameTimeMs = totalGameTime();
    const formattingString = formatTime(gameTimeMs);
    document.querySelector('.stopwatch').innerText = formattingString;
}

// To proparly format minutes, seconds and milliseconds. Returns (mins):(secs):(ms).
function formatTime(totalMS) {
    let gameTimeSec = totalMS / 1000;
    let gameTimeSecNew = Math.floor(gameTimeSec);
    let gameTimeMin = gameTimeSec / 60;

    gameTimeMin = Math.floor(gameTimeMin);
    gameTimeSec = Math.floor(gameTimeSec - (gameTimeMin * 60));
    totalMS = totalMS - (gameTimeSecNew * 1000);

    let gameTimeMinFinal = gameTimeMin < 10 ? ('0' + gameTimeMin) : gameTimeMin;
    let gameTimeSecFinal = gameTimeSec < 10 ? ('0' + gameTimeSec) : gameTimeSec;
    let gameTimeMsFinal = (String(totalMS).slice(0, 2)) < 10 ? ('0' + (String(totalMS).slice(0, 2))) : (String(totalMS).slice(0, 2));
    return `${gameTimeMinFinal}:${gameTimeSecFinal}:${gameTimeMsFinal}`;
}