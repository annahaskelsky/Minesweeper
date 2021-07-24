'use strict';

const MINE = '💣';
const FLAG = '📍';
const LIFE = '❤️';

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    safeClicks: 3,
    hints: 3,
    isHint: false,
    isManual: false,
    isGameManual: false,
    isOver: false,
    isUndoEnabled: true
};

const gGameDefault = { ...gGame };

const gLevel = {
    SIZE: 4,
    MINES: 2,
    LIVES: 1
};

var gBoard;
var startingTime;
var gLoseTime;
var gMoves = [];
var gEmptyCells;
var mineCount;
var bestTime;
var highScores;

const elSmiley = document.querySelector('.smiley');
const elRecord = document.querySelector('.record');
const elManuallyModal = document.querySelector('.manually-modal');

const winAudio = new Audio('audio/win.mp3');

function initGame() {
    preventContextMenu();
    setLocalStorage();
    getBestTime();
    stopInterval();
    elSmiley.innerText = '😀';
    elManuallyModal.style.visibility = 'hidden';
    document.querySelector('.stopwatch').innerText = '00:00:00';
    gGame = { ...gGameDefault };
    var livesToAdd;
    if (gLevel.SIZE === 4) livesToAdd = 1;
    else if (gLevel.SIZE === 8) livesToAdd = 2;
    else livesToAdd = 3;
    gLevel.LIVES = livesToAdd;
    gMoves = [];
    gEmptyCells = [];
    gBoard = createMat(gLevel.SIZE);
    renderBoard(gBoard);
    printLives();
    printHints();
    printSafeClicks();
    mineCount = gLevel.MINES;
}

function cellClicked(ev, isUndo) {
    var elCell;
    if (!isUndo) elCell = ev.target;
    else elCell = document.querySelector(`#${ev.id}`);

    var cellIdxs = elCell.id.split('-');
    var iIdx = +cellIdxs[1];
    var jIdx = +cellIdxs[2];
    var currCell = gBoard[iIdx][jIdx];

    if (!isUndo) gMoves.push({ id: elCell.id, button: ev.button, isMine: currCell.isMine });
    
    if (gGame.isOver) return;
    if (gGame.isManual) {
        if (mineCount) {
            if (currCell.isMine) return;
            currCell.isMine = true;
            renderCell(elCell, MINE);
            mineCount--;
            if (!mineCount) setTimeout(function () {
                var isLastClicked = true;
                gGame.isManual = false;
                elManuallyModal.style.visibility = 'hidden';
                for (var i = 0; i < gBoard.length; i++) {
                    for (var j = 0; j < gBoard.length; j++) {
                        var elTableCell = document.querySelector(`#cell-${i}-${j}`);
                        renderCell(elTableCell, '', isLastClicked);
                    }
                }
            }, 10);
            else elManuallyModal.innerText = `${MINE} ${mineCount}`;
        }
    } else {
        if (!gGame.isOn) handleFirstClick(currCell, iIdx, jIdx, elCell);
        
        if (gGame.isHint) {
            var negCells = [];
            var isHint = true;
            var isSecondRender = true;
            for (var i = iIdx - 1; i <= iIdx + 1; i++) {
                if (i < 0 || i >= gBoard.length) continue;
                for (var j = jIdx - 1; j <= jIdx + 1; j++) {
                    if (j < 0 || j >= gBoard.length) continue;
                    var { isShown, isMarked, isMine, minesAroundCount } = gBoard[i][j];
                    if (isShown || isMarked) continue;
                    var cellToRender = document.querySelector(`#cell-${i}-${j}`);
                    var strToRender = isMine ? MINE : minesAroundCount;
                    renderCell(cellToRender, strToRender, isHint);
                    negCells.push(cellToRender);
                }
            }
            setTimeout(function () {
                for (i = 0; i < negCells.length; i++) {
                    cellToRender = negCells[i];
                    renderCell(cellToRender, '', isHint, isSecondRender);
                }
            }, 1000);
            gGame.isHint = false;

        } else {
            if (!ev.button) {
                if (currCell.isMarked) return;
                if (currCell.isShown) return;
                currCell.isShown = true;
                gGame.shownCount++;
                if (!currCell.isMine) renderCell(elCell, currCell.minesAroundCount);
                else {
                    elSmiley.innerText = '🤯';
                    elCell.style.backgroundColor = 'red';
                    renderCell(elCell, MINE);
                    if (!isUndo) {
                        if (gLevel.LIVES === 1) handleLose();
                        gLevel.LIVES--;
                        printLives();
                    }
                }
                if (!currCell.isMine && !currCell.minesAroundCount) expandShown(gBoard, { i: iIdx, j: jIdx });
            }
            else if (ev.button === 2) cellMarked(elCell, iIdx, jIdx);

            setTimeout(function () {
                checkGameOver();
            }, 100);
        }
    }
}

function handleFirstClick(currCell, i, j, cell) {
    gGame.isOn = true;
    startingTime = new Date();
    startInterval();
    getEmptyCells(gBoard);
    for (var k = 0; k < gEmptyCells.length; k++) {
        var currPos = gEmptyCells[k];
        if (currPos.i === i && currPos.j === j) {
            gEmptyCells.splice(k, 1);
            break;
        }
    }
    if (!gGame.isGameManual) gBoard = insertMines(gBoard);
    setMinesNegsCount(gBoard);
    renderCell(cell, currCell.minesAroundCount);
    printLives();
}

function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (cell.isShown) return;
    cell.isMarked = !cell.isMarked;
    if (cell.isMarked) {
        renderCell(elCell, FLAG);
        gGame.markedCount++;
    } else {
        renderCell(elCell, '', true);
        gGame.markedCount--;
    }
}

function handleLose() {
    gLoseTime = new Date();
    gGame.isOn = false;
    gGame.isOver = true;
    stopInterval();
    printLives();
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var { isMine } = gBoard[i][j];
            var elTableCell = document.querySelector(`#cell-${i}-${j}`);
            if (isMine) renderCell(elTableCell, MINE);
        }
    }
}

function checkGameOver() {
    var counter = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var { isMine, isShown } = gBoard[i][j];
            if (!isMine && isShown) counter++;
        }
    }
    if (counter === (gLevel.SIZE ** 2 - gLevel.MINES)) {
        for (i = 0; i < gBoard.length; i++) {
            for (j = 0; j < gBoard.length; j++) {
                var currCell = gBoard[i][j];
                if (currCell.isMine) {
                    var elCell = document.querySelector(`#cell-${i}-${j}`);
                    renderCell(elCell, MINE);
                }
            }
        }
        elSmiley.innerText = '😎';
        winAudio.play();
        stopInterval();
        var gameTime = totalGameTime();
        if (!bestTime || gameTime < bestTime) {
            var index;
            if (gLevel.SIZE === 4) index = 0;
            else if (gLevel.SIZE === 8) index = 1;
            else index = 2;
            highScores[index].time = gameTime;
            localStorage.setItem('highScore', JSON.stringify(highScores));
            elRecord.innerText = formatTime(gameTime);
        }
        gGame.isOver = true;
        gGame.isUndoEnabled = false;
    }
}

function expandShown(board, pos) {
    if (board[pos.i][pos.j].minesAroundCount) return;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === pos.i && j === pos.j) continue;
            var currCell = board[i][j];
            if (currCell.isShown || currCell.isMarked) continue;
            currCell.isShown = true;
            var elTableCell = document.querySelector(`#cell-${i}-${j}`);
            renderCell(elTableCell, currCell.minesAroundCount);
            gGame.shownCount++;
            if (!currCell.minesAroundCount) expandShown(gBoard, { i, j });
        }
    }
}

function renderCell(cell, value, isRemove, isSecondRender) {
    var color;
switch (value) {
    case 1:
        color = 'blue';
        break;
    case 2:
        color = 'green';
        break;
    case 3:
        color = 'red';
        break;
    case 4:
        color = 'purple';
        break;
    case 5:
        color = 'maroon';
        break;
    case 6:
        color = 'turquoise';
        break;
    case 7:
        color = 'black';
        break;
    case 8:
        color = 'gray';
        break;

    default:
        break;
}

    if (isRemove) {
        var time = (gGame.isHint) ? 1000 : 0;
        setTimeout(function () {
            cell.classList.remove('empty-cell');
            cell.classList.remove('active-cell');
        }, time);
    }
    if (isSecondRender) {
        cell.innerText = value;
        return;
    }
    if (!value) {
        value = '';
        cell.classList.add('empty-cell');
    }
    cell.innerText = value;
    cell.style.color = color;
    cell.classList.add('active-cell');
}
