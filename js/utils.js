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
    // return gEmptyCells;
}

function preventContextMenu() {
    var elBody = document.querySelector('body');
    elBody.addEventListener('contextmenu', e => { e.preventDefault() });
}


// STOPWATCH
// var time1;
// var myTime;
// function startTimer() {
//     time1 = Date.now();
//     myTime = setInterval(timeCycle, 1);
// }
// function timeCycle() {
//     var time2 = Date.now();
//     var msTimeDiff = time2 - time1;
//     var timeDiffStr = new Date(msTimeDiff).toISOString().slice(17, -1);
//     document.querySelector('.stopwatch').innerHTML = timeDiffStr;
// }

// function stopTimer() {
//     clearInterval(myTime);
//     var finishTime = document.querySelector('.stopwatch').innerHTML;
//     alert('Done at: ' + finishTime);
// }





// ANOTHER STOPWATCH
// function updateTimer() {
//     var timeDiff = Date.now() - gStartTime;
//     var seconds = parseInt(timeDiff / 1000);
//     var timeDiffStr = timeDiff.toString();
//     var ms = timeDiffStr.substring(timeDiffStr.length - 3);
//     if (ms.length < 2) {
//         ms = `00${ms}`;
//     } else if (ms.length < 3) {
//         ms = `0${ms}`;
//     }
//     if (seconds < 10) seconds = `0${seconds}`;
//     document.querySelector('.time .value').innerText = `${seconds}.${ms}`
// }

// gStartTime = Date.now();
// gGameIntervalId = setInterval(updateTimer, 16);