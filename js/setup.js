'use strict';

function createMat(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                id: `cell-${i}-${j}`,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board.length; j++) {
            strHTML += `<td><div id="cell-${i}-${j}" onmouseup="cellClicked(event)"></div></td>`;
        }
        strHTML += '</tr>\n';
    }
    document.querySelector('tbody').innerHTML = strHTML;
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

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            cell.minesAroundCount = countMinesAround({ i, j }, board);
        }
    }
}

function insertMines(board) {
    for (var i = 0; i < gLevel.MINES; i++) {
        var pos = getEmptyCell();
        board[pos.i][pos.j].isMine = true;
    }
    return board;
}

function setLevel(size, elLevel) {
    var level = elLevel ? (+(elLevel.id)) : size;
    gLevel.SIZE = level;
    var mines;
    var lives;
    if (level === 4) {
        mines = 2;
        lives = 1;
    } else if (level === 8) {
        mines = 12;
        lives = 2;
    } else {
        mines = 30;
        lives = 3;
    }
    gLevel.MINES = mines;
    gLevel.LIVES = lives;
    printLives();
    if (elLevel) initGame();
}

function getBestTime() {
    highScores = JSON.parse(localStorage.getItem('highScore'));
    for (var i = 0; i < highScores.length; i++) {
        if (highScores[i].level === gLevel.SIZE) bestTime = highScores[i].time;
    }
    if (bestTime) elRecord.innerText = formatTime(bestTime); 
    else elRecord.innerText = '---------';
}

function setLocalStorage() {
    const isLocalStorage = localStorage.getItem('highScore');
if (!isLocalStorage) {
    localStorage.setItem('highScore', JSON.stringify([
        { level: 4, time: null },
        { level: 8, time: null },
        { level: 12, time: null },
    ]));
};
}