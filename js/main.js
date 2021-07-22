'use strict';

const MINE = '💣';
const FLAG = '📍';
let SMILEY = '😀';
const LIFE = '❤️';
const HINT = '💡';

var gHighScores = localStorage.getItem('highScore');
if (!gHighScores) {
    localStorage.setItem('highScore', JSON.stringify([
        { level: 4, time: null },
        { level: 8, time: null },
        { level: 12, time: null },
    ]));
};

var gBoard;
var startingTime;
const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    safeClicks: 3,
    hints: 3,
    isHint: false,
    isManual: false,
    isGameManual: false,
    isOver: false,
};

const gLevel = {
    SIZE: 4,
    MINES: 2,
    LIVES: 1
};

var gMoves = [];
var gEmptyCells;
var mineCount;
var bestTime;
var highScores;
var elRecord = document.querySelector('.record');

function getBestTime() {
    highScores = JSON.parse(localStorage.getItem('highScore'));
    for (var i = 0; i < highScores.length; i++) {
        if (highScores[i].level === gLevel.SIZE) bestTime = highScores[i].time;
    }
    if (bestTime) {
        elRecord.innerText = formatTime(bestTime);
    } else {
        elRecord.innerText = '---------';
    }
}

function initGame() {
    preventContextMenu();
    getBestTime();
    stopInterval();
    var livesToAdd;
    var elSmiley = document.querySelector('.smiley');
    var elStopWatch = document.querySelector('.stopwatch');
    document.querySelector('.manually-modal').style.visibility = 'hidden';
    SMILEY = '😀';
    elSmiley.innerText = SMILEY;
    elStopWatch.innerText = '00:00:00';
    gGame.isOn = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.startingTime = 0;
    gGame.isManual = false;
    gGame.isGameManual = false;
    gGame.hints = 3;
    gGame.safeClicks = 3;
    gGame.isOver = false;
    if (gLevel.SIZE === 4) livesToAdd = 1;
    if (gLevel.SIZE === 8) livesToAdd = 2;
    if (gLevel.SIZE === 12) livesToAdd = 3;
    gLevel.LIVES = livesToAdd;
    
    gMoves = [];
    gEmptyCells = [];
    gBoard = createMat(gLevel.SIZE);
    renderBoard(gBoard);
    addLives();
    addHints();
    mineCount = gLevel.MINES;
}

function setLevel(size, elLevel) {
    var level = (elLevel) ? (+(elLevel.id)) : size;
    gLevel.SIZE = level;
    var mines;
    var lives;
    if (level === 4) {
        mines = 2;
        lives = 1;
    }
    if (level === 8) {
        mines = 12;
        lives = 2;
    }
    if (level === 12) {
        mines = 30;
        lives = 3;
    }
    gLevel.MINES = mines;
    gLevel.LIVES = lives;
    addLives();
    if (elLevel) initGame();
}

function cellClicked(ev) {
    var elCell = ev.target;
    var iIdx = +elCell.id.split('-')[1];
    var jIdx = +elCell.id.split('-')[2];
    var currCell = gBoard[iIdx][jIdx];
    if (gGame.isOver) return;
    if (gGame.isManual) {
        if (mineCount > 0) {
            var elManuallyModal = document.querySelector('.manually-modal');
            currCell.isMine = true;
            renderCell(elCell, MINE);
            mineCount--;
            var txt = mineCount || 'Click any cell to hide';
            if (!mineCount) elManuallyModal.style.fontSize = '14px';
            elManuallyModal.innerText = `${MINE} ${txt}`;
        } else {
            var isLastClicked = true;
            gGame.isManual = false;
            document.querySelector('.manually-modal').style.visibility = 'hidden';
            for (var i = 0; i < gBoard.length; i++) {
                for (var j = 0; j < gBoard.length; j++) {
                    var elTableCell = document.querySelector(`#cell-${i}-${j}`);
                    renderCell(elTableCell, '', isLastClicked);
                }
            }
        }
    } else {
        if (!gGame.isOn) {
            handleFirstClick(currCell, iIdx, jIdx, elCell);
        }
        if (gGame.isHint) {
            var negCells = [];
            var isHint = true;
            var isSecondRender = true;
            for (var i = iIdx - 1; i <= iIdx + 1; i++) {
                if (i < 0 || i >= gBoard.length) continue;
                for (var j = jIdx - 1; j <= jIdx + 1; j++) {
                    if (j < 0 || j >= gBoard.length) continue;
                    var currCell = gBoard[i][j];
                    if (currCell.isShown || currCell.isMarked) continue;
                    var cellToRender = document.querySelector(`#cell-${i}-${j}`);
                    var strToRender = currCell.isMine ? MINE : currCell.minesAroundCount;
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
                    SMILEY = '🤯';
                    document.querySelector('.smiley').innerText = SMILEY;
                    elCell.style.backgroundColor = 'red';
                    renderCell(elCell, MINE);
                    if (gLevel.LIVES === 1) gameOver();
                    gLevel.LIVES--;
                    addLives();
                }
                if (!currCell.isMine && !currCell.minesAroundCount) expandShown(gBoard, { i: iIdx, j: jIdx });
            }
            else if (ev.button === 2) cellMarked(elCell, +iIdx, +jIdx);

            setTimeout(function () {
                checkGameOver();
            }, 100);
        }
    }
}

function handleFirstClick(currCell, i, j, cell) {
    console.log('First Click');
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
    addLives();
}

function addLives() {
    var str = '';
    for (var i = 0; i < gLevel.LIVES; i++) {
        str += LIFE;
    }
    document.querySelector('.lives').innerText = str;
}

function addHints() {
    var strHTML = '';
    for (var i = 0; i < gGame.hints; i++) {
        strHTML += `<span onclick="handleHint()">${HINT}</span>`;
    }
    document.querySelector('.hints').innerHTML = strHTML;
}

function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (cell.isShown) return;
    cell.clickType = 2;
    cell.isMarked = !cell.isMarked;
    if (cell.isMarked) {
        renderCell(elCell, FLAG);
        gGame.markedCount++;
    } else {
        renderCell(elCell, '');
        gGame.markedCount--;
    }
}

function positionMinesManually() {
    if (!mineCount) return;
    document.querySelector('.manually-modal').style.visibility = 'visible';
    document.querySelector('.manually-modal').innerText = `${MINE} ${mineCount}`;
    gGame.isManual = true;
    gGame.isGameManual = true;
}

function gameOver() {
    gGame.isOn = false;
    gGame.isOver = true;
    stopInterval();
    addLives();
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            var elTableCell = document.querySelector(`#cell-${i}-${j}`);
            if (currCell.isMine) renderCell(elTableCell, MINE);
        }
    }
}

function checkGameOver() {
    var counter = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isMine && cell.isShown) counter++;
        }
    }
    if (gLevel.SIZE ** 2 - gLevel.MINES === counter) {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard.length; j++) {
                var currCell = gBoard[i][j];
                if (currCell.isMine) {
                    var elCell = document.querySelector(`#cell-${i}-${j}`);
                    renderCell(elCell, FLAG);
                }
            }
        }
        SMILEY = '😎';
        document.querySelector('.smiley').innerText = SMILEY;
        stopInterval();
        var gameTime = totalGameTime();
        if (!bestTime || gameTime < bestTime) {
            var index;
            if (gLevel.SIZE === 4) index = 0;
            if (gLevel.SIZE === 8) index = 1;
            if (gLevel.SIZE === 12) index = 2;
            highScores[index].time = gameTime;
            localStorage.setItem('highScore', JSON.stringify(highScores));
            elRecord.innerText = formatTime(gameTime);
        }

        gGame.isOver = false;
        setTimeout(alert('you win!'), 100);
    }
}

function handleHint() {
    if (!gGame.hints) return;
    gGame.isHint = true;
    gGame.hints--;
    addHints();
}

function handleSafeClick() {
    if (!gGame.safeClicks) return;
    gGame.safeClicks--;
    var safeCells = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            if (!currCell.isMine && !currCell.isShown && !currCell.isMarked) safeCells.push({ i, j });
        }
    }
    var randIdx = getRandomNum(0, safeCells.length - 1);
    var safeCellPos = safeCells.splice(randIdx, 1)[0];
    var elSafeCell = document.querySelector(`#cell-${safeCellPos.i}-${safeCellPos.j}`);
    elSafeCell.classList.add('blink');
    setTimeout(function () {
        elSafeCell.classList.remove('blink');
    }, 2000);
}

function expandShown(board, pos) {
    if (board[pos.i][pos.j].minesAroundCount) return;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === pos.i && j === pos.j) continue;
            var currCell = board[i][j];
            console.log('i', i, 'j', j);
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
    if (isRemove) {
        setTimeout(function () {
            cell.classList.remove('empty-cell');
            cell.classList.remove('active-cell');
        }, 1000)
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
    cell.classList.add('active-cell');
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            cell.minesAroundCount = countMinesAround({ i, j }, board);
        }
    }
}

function countMinesAround(pos, board) {
    var count = 0;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;

        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === pos.i && j === pos.j) continue;

            var cell = board[i][j];
            if (cell.isMine) count++;
        }
    }
    return count;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board.length; j++) {
            strHTML += `<td id="cell-${i}-${j}" onmouseup="cellClicked(event)"><div></div></td>`;
        }
        strHTML += '</tr>\n';
    }
    var elTable = document.querySelector('tbody');
    elTable.innerHTML = strHTML;
}

function insertMines(board) {
    console.log('insert mines');
    for (var i = 0; i < gLevel.MINES; i++) {
        var pos = getEmptyCell();
        board[pos.i][pos.j].isMine = true;
    }
    return board;
}

function createMat(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                id: `cell-${i}-${j}`,
                clickType: 0,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}