'use strict';

// get elements

const gameBoard = document.querySelector('.game-board');
const startBtn = document.getElementById('start-game');
const timerEl = document.querySelector('.timer');
const leftFlags = document.querySelector('.left-flags');

const mineField = [];
const amountMine = 16;
const fieldSize = 16;
let time = 0; // secons
let timer; // timer
let flagLeft = amountMine;
const dr = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const translateToImage = num => num.toString().padStart(3, 0).split('');
const updateFlagCount = function (num) {
  const arrScore = translateToImage(num);
  leftFlags.innerHTML = '';
  console.log(arrScore);
  arrScore.forEach(function (score) {
    const html = `<div class="number${score}"></div>`;
    leftFlags.insertAdjacentHTML('beforeend', html);
  });
};

const setTimer = function () {
  const tick = function () {
    timerEl.innerHTML = '';
    const arrSecond = translateToImage(time);
    arrSecond.forEach(function (second) {
      timerEl.insertAdjacentHTML(
        'beforeend',
        `<div class="number${second}"></div>`
      );
    });
    time++;
  };
  tick();
  const timer = setInterval(tick, 1000);
  return timer;
};

const resetTimer = function () {
  clearInterval(timer);
  time = 0;
  timer = setTimer();
};

const isOnBoard = (x, y, i, j, size) =>
  x + i >= 0 && x + i < size && y + j >= 0 && y + j < size;

const disableContextMenu = e => e.preventDefault();
const getIJ = id => [+id.split('-')[1], +id.split('-')[2]];
const WinGame = field => {
  // FIXME:
  //Когда выйграли по расставленным флагам все не открытые поля должны открыться а сейчас ставится флаг
  clearInterval(timer);
  startBtn.classList.replace(startBtn.className, 'success-smile');
  for (const row of field) {
    for (const cell of row) {
      if (cell.close) {
        cell.cellHandler.classList.replace('unpin-btn', 'flag-btn');
      }
    }
  }
};
const isFlagedWin = (field, amount) => {
  let count = 0;
  for (const row of field) {
    for (const cell of row) {
      if (cell.type === 'mine' && cell.flag) count++;
    }
  }
  if (amount === count) {
    WinGame(field);
    return amount === count;
  }
};
const isOpenWin = (field, amount) => {
  let count = 0;
  const size = field.length;
  for (const row of field) {
    for (const cell of row) {
      if (!cell.close) count++;
    }
  }
  if (size * size - amount === count) {
    WinGame(field);
    return count;
  }
};

const rightBtnTmpl = [
  {
    name: 'RightBtn down Blank',
    replace: ['unpin-btn', 'pin-btn'],
    remove: 'mousedown',
    add: 'mouseup',
  },
  {
    name: 'RightBtn up set Flag',
    replace: ['pin-btn', 'flag-btn'],
    remove: 'mouseup',
    add: 'mousedown',
    func(cell) {
      flagLeft--;
      updateFlagCount(flagLeft);
      cell.flag = true;
      isFlagedWin(mineField, amountMine);
    },
  },
  {
    name: 'RightBtn down Flag',
    replace: ['flag-btn', 'pin-question-btn'],
    remove: 'mousedown',
    add: 'mouseup',
  },
  {
    name: 'RightBtn Up ?',
    replace: ['pin-question-btn', 'unpin-question-btn'],
    remove: 'mouseup',
    add: 'mousedown',
    func(cell) {
      flagLeft++;
      updateFlagCount(flagLeft);
      cell.flag = false;
    },
  },
  {
    name: 'RightBtn down ?',
    replace: ['unpin-question-btn', 'pin-btn'],
    remove: 'mousedown',
    add: 'mouseup',
  },
  {
    name: 'RightBtn up blank',
    replace: ['pin-btn', 'unpin-btn'],
    remove: 'mouseup',
    add: 'mousedown',
  },
];

const leftBtnTmpl = [
  {
    name: 'LeftBtn down Blank',
    replace: ['unpin-btn', 'pin-btn'],
    remove: 'mousedown',
    add: 'mouseup',
    func() {
      startBtn.classList.replace(startBtn.className, 'ooo-smile');
    },
  },
  {
    name: 'LeftBtn Up Blank',
    replace: ['pin-btn', 1],
    remove: 'mousedown',
    add: 'mouseup',
    func: openCell,
  },
];

const btn = [[leftBtnTmpl, 'leftBtn'], , [rightBtnTmpl, 'rightBtn']];

const btnFuncTmpl = e => {
  const [i, j] = getIJ(e.srcElement.id);
  let btnTmplIndex = mineField[i][j][btn[e.button][1]];
  let btnTmpl = btn[e.button][0][btnTmplIndex];

  if (btnTmpl.func === openCell) {
    btnTmpl.func(e);
  } else {
    e.srcElement.classList.replace(btnTmpl.replace[0], btnTmpl.replace[1]);
    e.srcElement.removeEventListener(btnTmpl.remove, btnFuncTmpl);
    e.srcElement.addEventListener(btnTmpl.add, btnFuncTmpl);
    mineField[i][j][btn[e.button][1]] =
      mineField[i][j][btn[e.button][1]] >= btn[e.button][0].length - 1
        ? 0
        : mineField[i][j][btn[e.button][1]] + 1;
    if (btnTmpl.func) {
      btnTmpl.func(mineField[i][j]);
    }
  }
};

function openCell(e) {
  const openNeighbour = (field, x, y) => {
    if (field[x][y].amountNeighbors !== 0) return;
    for (const [i, j] of dr) {
      if (isOnBoard(x, y, i, j, fieldSize)) {
        const cell = field[x + i][y + j];
        if (cell.close && cell.displayType !== 'pin-blast-mine-btn') {
          cell.close = false;
          cell.cellHandler.removeEventListener('mousedown', btnFuncTmpl);
          cell.cellHandler.classList.replace(
            cell.cellHandler.className,
            cell.displayType
          );
          if (cell.amountNeighbors === 0) openNeighbour(field, x + i, y + j);
        }
      }
    }
  };

  const [i, j] = getIJ(e.srcElement.id);
  e.srcElement.classList.replace('pin-btn', mineField[i][j].displayType);
  e.srcElement.removeEventListener('mouseup', btnFuncTmpl);
  mineField[i][j].close = false;
  if (mineField[i][j].displayType === 'pin-blast-mine-btn') {
    clearInterval(timer);
    startBtn.classList.replace(startBtn.className, 'unsuccess-smile');
    for (const row of mineField) {
      for (const cell of row) {
        cell.close = false;
        cell.cellHandler.classList.replace(
          cell.cellHandler.className,
          cell.displayType
        );
      }
    }
  } else {
    openNeighbour(mineField, i, j);
    startBtn.classList.replace(startBtn.className, 'unpin-smile');
    isOpenWin(mineField, amountMine);
  }
}

const startGame = function (field, size, amount) {
  const randomInt = (
    min,
    max // генерация из диапазона
  ) => Math.floor(Math.random() * (max - min) + 1) + min;

  const generateField = () => {
    for (let i = 0; i < size; i++) {
      let row = [];
      for (let j = 0; j < size; j++) {
        let cell = {
          x: i,
          y: j,
          type: 'blank',
          close: true,
          flag: false,
          amountNeighbors: 0,
          rightBtn: 0,
          leftBtn: 0,
          mouseDown: '',
        };
        row.push(cell);
      }
      field.push(row);
    }
  };
  const generateMines = () => {
    for (let i = 0; i < amount; i++) {
      let x = randomInt(0, size - 1);
      let y = randomInt(0, size - 1);
      while (field[x][y].type === 'mine') {
        x = randomInt(0, size - 1);
        y = randomInt(0, size - 1);
      }
      field[x][y].type = 'mine';
      field[x][y].displayType = 'pin-blast-mine-btn';
    }
  };
  const calcNeighbors = () => {
    let amountNeighbors = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        amountNeighbors = 0;
        if (field[i][j].displayType === 'pin-blast-mine-btn') continue;
        for (const [x, y] of dr) {
          if (
            i + x >= 0 &&
            i + x < size &&
            j + y >= 0 &&
            j + y < size &&
            field[i + x][j + y].type === 'mine'
          )
            amountNeighbors++;
        }
        field[i][j].displayType =
          amountNeighbors === 0 ? `pin-btn` : `pin-digit-0${amountNeighbors}`;
        field[i][j].amountNeighbors = amountNeighbors;
      }
    }
  };
  const drowGameBoard = () => {
    gameBoard.innerHTML = '';
    for (let i = 0; i < size; i++) {
      let row = [];
      row.push('<div class="board-row">');
      for (let j = 0; j < size; j++) {
        row.push(`<div class="unpin-btn" id="cell-${i}-${j}"></div>`);
      }
      row.push('</div>');
      gameBoard.insertAdjacentHTML('beforeend', row.join('\n'));
    }
  };
  const getCellsID = () => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        field[i][j].cellHandler = document.getElementById(`cell-${i}-${j}`);
      }
    }
  };
  const addEventsListeners = () => {
    for (const row of field) {
      for (const cell of row) {
        cell.cellHandler.addEventListener('mousedown', btnFuncTmpl);
        cell.cellHandler.addEventListener('contextmenu', e =>
          e.preventDefault()
        );
      }
    }
  };
  flagLeft = amountMine;
  updateFlagCount(flagLeft);
  mineField.length = 0;
  generateField();
  generateMines();
  calcNeighbors();
  drowGameBoard();
  getCellsID();
  addEventsListeners();
  time = 0;
  resetTimer(timer);
  // timer = setTimer();
};

startGame(mineField, fieldSize, amountMine);

/* 

*/

const initBtn = function (e) {
  console.log(e.srcElement.classList);
  const classList = e.srcElement.classList;
  if (e.type === 'mousedown' && e.button === 0) {
    classList.replace(e.srcElement.className, 'pin-smile');
  } else if (e.type === 'mouseup' && e.button === 0) {
    // start game
    classList.replace('pin-smile', 'unpin-smile');
    startGame(mineField, fieldSize, amountMine);
    // resetTimer();
  }
};

startBtn.addEventListener('mousedown', initBtn);
startBtn.addEventListener('mouseup', initBtn);
startBtn.addEventListener('contextmenu', disableContextMenu);
