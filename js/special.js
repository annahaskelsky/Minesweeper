'use strict';

function handleHint(elBulb) {
    if (gGame.isOver || !gGame.hints || gGame.isHint || elBulb.classList.contains('used-hint')) return;
    gGame.isHint = true;
    gGame.hints--;
    elBulb.src = 'img/lightoff.png';
    elBulb.classList.add('used-hint');
    setTimeout(function() {
        elBulb.style.cursor = 'not-allowed';
    }, 1000);
}

function handleSafeClick(elLock) {
    if (gGame.isOver || !gGame.safeClicks || elLock.classList.contains('used-lock')) return;
    gGame.safeClicks--;
    elLock.src = 'img/unlocked.png';
    elLock.classList.add('used-lock');
    setTimeout(function() {
        elLock.style.cursor = 'not-allowed';
    }, 1000);

    var safeCells = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var { isMine, isShown, isMarked } = gBoard[i][j];
            if (!isMine && !isShown && !isMarked) safeCells.push({ i, j });
        }
    }
    var randIdx = getRandomNum(0, safeCells.length - 1);
    var { i, j } = safeCells.splice(randIdx, 1)[0];
    var elSafeCell = document.querySelector(`#cell-${i}-${j}`);
    elSafeCell.classList.add('blink');
    setTimeout(function () {
        elSafeCell.classList.remove('blink');
    }, 2000);
}

function printLives() {
    var str = '';
    for (var i = 0; i < gLevel.LIVES; i++) {
        str += LIFE;
    }
    document.querySelector('.lives').innerText = str;
}

function printHints() {
    var strHTML = '';
    for (var i = 0; i < gGame.hints; i++) {
        strHTML += '<img src="img/lighton.png" class="bulb" onclick="handleHint(this)" />';
    }
    document.querySelector('.hints').innerHTML = strHTML;
}

function printSafeClicks() {
    var strHTML = '';
    for (var i = 0; i < gGame.safeClicks; i++) {
        strHTML += '<img src="img/locked.png" class="lock" onclick="handleSafeClick(this)" />';
    }
    document.querySelector('.locks').innerHTML = strHTML;
}

function positionMinesManually() {
    if (gGame.isOn || gGame.isOver || !mineCount) return;
    elManuallyModal.style.visibility = 'visible';
    elManuallyModal.innerText = `${MINE} ${mineCount}`;
    gGame.isManual = true;
    gGame.isGameManual = true;
}

function handleUndo() {
    // to check if the user won
    if (!gGame.isUndoEnabled) return;
    
    // to check if the last click was on a mine
    var lastClicked = gMoves[gMoves.length - 1];
    var isLose = lastClicked.isMine && !lastClicked.button;

    if (isLose) {
        elSmiley.innerText = '😀';
        gLevel.LIVES++;
        printLives();
    }

    // to get the right time for the timer to start with
    if (gGame.isOver) {
        gGame.isOver = false;
        gGame.isOn = true;
        startingTime = new Date(totalGameTimeAfterLose());
        startInterval();
    }

    gGame = {
        ...gGame,
        markedCount: 0,
        shownCount: 0
    }

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            currCell.isShown = false;
            currCell.isMarked = false;
        }
    }

    renderBoard(gBoard);

    // to remove the last move from the array
    gMoves.pop();
    for (var i = 0; i < gMoves.length; i++) {
        cellClicked(gMoves[i], gGame.isUndoEnabled);
    }
}