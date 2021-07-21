'use strict';

const MINE = '💣';
const FLAG = '📍';
let SMILEY = '😀';

var gBoard;
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
};

var gLevel = {
    SIZE: 4,
    MINES: 2,
    LIVES: 1
};

var gEmptyCells;

function initGame() {
    preventContextMenu();
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = SMILEY;
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
    }
    gEmptyCells = [];
    gBoard = createMat(gLevel.SIZE);
    renderBoard(gBoard);
}

function setLevel(elLevel) {
    var level = +(elLevel.id);
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
    initGame();
}

function cellClicked(ev) {
    var cell = ev.target;
    var i = cell.id.split('-')[1];
    var j = cell.id.split('-')[2];
    var currCell = gBoard[i][j];
    if (!gGame.isOn) {
        gGame.isOn = true;
        getEmptyCells(gBoard);
        for (var k = 0; k < gEmptyCells.length; k++) {
            var currPos = gEmptyCells[k];
            if (currPos.i === +i && currPos.j === +j) {
                gEmptyCells.splice(k, 1);
                break;
            }
        }
        gBoard = insertMines(gBoard);
        setMinesNegsCount(gBoard);
        renderCell(cell, currCell.minesAroundCount);
    }

    if (!ev.button) {
        if (currCell.isMarked) return;
        if (currCell.isShown) return;
        currCell.isShown = true;
        gGame.shownCount++;
        if (!currCell.isMine) renderCell(cell, currCell.minesAroundCount);
        else {
            SMILEY = '🤯';
            document.querySelector('.smiley').innerText = SMILEY;
            cell.style.backgroundColor = 'red';
            renderCell(cell, MINE);
            if (gLevel.LIVES === 1) gameOver();
            else gLevel.LIVES--;
        }
        if (!currCell.isMine && !currCell.minesAroundCount) expandShown(gBoard, { i: +i, j: +j });
    }
    else if (ev.button === 2) cellMarked(cell, +i, +j);
    setTimeout(checkGameOver, 100);
}

function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (cell.isShown) return;
    cell.isMarked = !cell.isMarked;
    if (cell.isMarked) {
        renderCell(elCell, FLAG);
        gGame.markedCount++;
    } else {
        renderCell(elCell, '');
        gGame.markedCount--;
    }
}

function gameOver() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            var elTableCell = document.querySelector(`#cell-${i}-${j}`);
            if (currCell.isMine) renderCell(elTableCell, MINE);
        }
    }
}

function checkGameOver() {
    if (gLevel.SIZE ** 2 - gLevel.MINES === gGame.shownCount) {
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
        setTimeout(alert('you win!'), 100);
    }
}

function expandShown(board, pos) {
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;

        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === pos.i && j === pos.j) continue;

            var currCell = board[i][j];

            if (!currCell.isShown) {
                currCell.isShown = true;
                gGame.shownCount++;
                var elCellToRender = document.querySelector(`#cell-${i}-${j}`);
                renderCell(elCellToRender, currCell.minesAroundCount);
            }
        }
    }
}

function renderCell(cell, value) {
    cell.innerText = value;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            cell.minesAroundCount = countMinesAround({ i, j }, board)
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
        strHTML += '<tr>\n'
        for (var j = 0; j < board.length; j++) {
            strHTML += `<td id="cell-${i}-${j}" onmouseup="cellClicked(event)"></td>`;
        }
        strHTML += '</tr>\n'
    }
    var elTable = document.querySelector('tbody');
    elTable.innerHTML = strHTML;
}

function insertMines(board) {
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
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}