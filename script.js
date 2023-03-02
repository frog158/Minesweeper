"use strict";

// get elements

const gameBoard = document.querySelector(".game-board");
const startBtn = document.getElementById("start-game");
const timerEl = document.querySelector(".timer");
const leftFlags = document.querySelector(".left-flags");
// поле
const mineField = [];
// количество мин
const amountMine = 10;
// размер
const fieldSize = 16;
let time = 0; // secons
let timer; // timer
// счетчик флагов
let flagLeft = amountMine;
// направление для обхода восьми соседей
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
// Объект ячейка
class boardCell {
  constructor(i, j) {
    this.x = i; // координаты
    this.y = j;
    // как отображается
    // unpin-btn - не нажатая
    // pin-btn - нажатая
    // и так далее
    this.displayType = "pin-btn";
    this.type = "blank";
    this.close = true; // закрыта или открыта
    this.flag = false; // с флагом или без флага
    this.amountNeighbors = 0; // количество соседей
    this.rightBtn = 0; // шаг по правой кнопке
    this.leftBtn = 0; // шаг по левой кнопке
  }
}

//перево числа в набор цифр
const translateToImage = (num) => num.toString().padStart(3, 0).split("");
//обновление счетчика флагов
const updateFlagCount = function (num) {
  const arrScore = translateToImage(num);
  leftFlags.innerHTML = "";
  arrScore.forEach(function (score) {
    leftFlags.insertAdjacentHTML(
      "beforeend",
      `<div class="number${score}"></div>`
    );
  });
};
//установка и запуск таймера
const setTimer = function () {
  // функция таймера
  const tick = function () {
    timerEl.innerHTML = "";
    const arrSecond = translateToImage(time);
    arrSecond.forEach(function (second) {
      timerEl.insertAdjacentHTML(
        "beforeend",
        `<div class="number${second}"></div>`
      );
    });
    time++;
  };
  tick();
  const timer = setInterval(tick, 1000);
  return timer; // возвращаем таймер
};

const resetTimer = function () {
  clearInterval(timer);
  time = 0;
  timer = setTimer();
};
// проверка лежит ли точка на доске
// const isOnBoard = (x, y, i, j, size) =>
const isOnBoard = (x, y, size) => x >= 0 && x < size && y >= 0 && y < size;

const disableContextMenu = (e) => e.preventDefault();
// получает координаты точки из айдишнки на экране - cell-0-14
const getIJ = (id) => [+id.split("-")[1], +id.split("-")[2]];

// победа. Надо нарисовать рожицу. Остановить таймер. Открыть не открытое
const WinGame = (field) => {
  clearInterval(timer);
  startBtn.classList.replace(startBtn.className, "success-smile");
  for (const row of field) {
    for (const cell of row) {
      // снимаем все обработчики
      cell.cellHandler.removeEventListener("mouseup", btnFuncTmpl);
      cell.cellHandler.removeEventListener("mousedown", btnFuncTmpl);
      //обрабатываем не открытые клетки
      if (cell.close && cell.displayType === "pin-blast-mine-btn") {
        // если там мина то ставим флаг
        cell.cellHandler.classList.replace("unpin-btn", "flag-btn");
      } else {
        //иначе че там для клетки прописано. или пустая или цифра
        cell.cellHandler.classList.replace("unpin-btn", cell.displayType);
      }
    }
  }
};
// проверка победы по флагам. т.е. врдуг еще не все открыто а флаги верно расставлены
const isFlagedWin = (field, amount) => {
  let count = 0;
  for (const row of field) {
    for (const cell of row) {
      if (cell.type === "mine" && cell.flag) count++;
    }
  }
  return amount === count;
};
// проверка победы по отрытым полям. Флаги не расставлены но открыто все кроме мин
const isOpenWin = (field, amount) => {
  let count = 0;
  const size = field.length;
  for (const row of field) {
    for (const cell of row) {
      if (cell.close) count++;
    }
  }
  return amount === count; // если количесто закрытых клеток равно количеству мин
};

//шаблон действий для правой кнопки
// 1. нажатие - рисем нажатую ячейку
// 2. отпускание - рисуем флаг
// 3. нажатие - рисуем нажатый вопросительный знак
// 4. отпускание - рисуем вопросителльный флаг
// 5. нажатие - рисуем нажатую ячейку
// 6. отпускание - рисуем ячейку и следующий раз начинаем сначала
// у каждой ячейки хранится ее текущий шаг
const rightBtnTmpl = [
  {
    name: "RightBtn down Blank", // это просто название нигде не используется
    replace: ["unpin-btn", "pin-btn"], // название классов что на что меняем в html
    remove: "mousedown", // с какого события снимаем лисснер
    add: "mouseup", // на какое вешаем
  },
  {
    name: "RightBtn up set Flag",
    replace: ["pin-btn", "flag-btn"],
    remove: "mouseup",
    add: "mousedown",
    func(cell) {
      // если такой мето есть он вызывается. Ему передается ячейка
      flagLeft--; // уменшьшаем счетчик флагов
      updateFlagCount(flagLeft); // обновляем
      cell.flag = true; // отмечаем в объекте
      if (isFlagedWin(mineField, amountMine)) WinGame(mineField); // проверяем победу по флагам
    },
  },
  {
    name: "RightBtn down Flag",
    replace: ["flag-btn", "pin-question-btn"],
    remove: "mousedown",
    add: "mouseup",
  },
  {
    name: "RightBtn Up ?",
    replace: ["pin-question-btn", "unpin-question-btn"],
    remove: "mouseup",
    add: "mousedown",
    func(cell) {
      // сняли флаг
      flagLeft++; // увеличили счетчик
      updateFlagCount(flagLeft); // обновили
      cell.flag = false; // пометили в ячейке
    },
  },
  {
    name: "RightBtn down ?",
    replace: ["unpin-question-btn", "pin-btn"],
    remove: "mousedown",
    add: "mouseup",
  },
  {
    name: "RightBtn up blank",
    replace: ["pin-btn", "unpin-btn"],
    remove: "mouseup",
    add: "mousedown",
  },
];
// для левой кнопки
const leftBtnTmpl = [
  {
    name: "LeftBtn down Blank",
    replace: ["unpin-btn", "pin-btn"],
    remove: "mousedown",
    add: "mouseup",
    func() {
      // рисуем испуганую рожицу
      startBtn.classList.replace(startBtn.className, "ooo-smile");
    },
  },
  {
    name: "LeftBtn Up Blank",
    replace: ["pin-btn", "pin-btn"],
    remove: "mousedown",
    add: "mouseup",
    func: openCell, // спец функция. написана отдельно
  },
];

// правая или левая кнопка нажаты
// получаем событи и просто по индексу берем шаблон нужный
// 0 - левая кнопка
// 2 - правая
const btn = [[leftBtnTmpl, "leftBtn"], , [rightBtnTmpl, "rightBtn"]];

// функция обрабатывающая нажития кнопок
const btnFuncTmpl = (e) => {
  // получаем координаты ячейки из ее айдишника
  const [i, j] = getIJ(e.srcElement.id);
  // выбираем какая кнопка нажата

  console.log(i, j);
  let btnTmplIndex = mineField[i][j][btn[e.button][1]];
  // получаем номер шага
  let btnTmpl = btn[e.button][0][btnTmplIndex];
  // перерисовываем
  e.srcElement.classList.replace(btnTmpl.replace[0], btnTmpl.replace[1]);
  // меняем обработчики
  e.srcElement.removeEventListener(btnTmpl.remove, btnFuncTmpl);
  e.srcElement.addEventListener(btnTmpl.add, btnFuncTmpl);
  //увеличиваем шаг если прошли весь путь то начинаем с нуля
  mineField[i][j][btn[e.button][1]] =
    mineField[i][j][btn[e.button][1]] >= btn[e.button][0].length - 1
      ? 0
      : mineField[i][j][btn[e.button][1]] + 1;
  // если на этом шаге есть метод вызываем его
  if (btnTmpl.func) {
    btnTmpl.func(mineField[i][j]);
  }
};
// это функция обрабатывает отпускание левоей кнопки.
function openCell(cell) {
  const openNeighbour = (field, x, y) => {
    // это ффункция применяется рекурсивно и открывает все поля  у которых нет соседей
    if (field[x][y].amountNeighbors !== 0) return; // если у клетки есть соседисразу выходим
    for (const [i, j] of dr) {
      // обходим восьмерых соседей
      if (isOnBoard(x + i, y + j, fieldSize)) {
        const cell = field[x + i][y + j];
        if (cell.close && cell.displayType !== "pin-blast-mine-btn") {
          // если клетка закрыта и не мина то открываем ее
          cell.close = false;
          cell.cellHandler.removeEventListener("mousedown", btnFuncTmpl); // снимаем лисснер
          cell.cellHandler.classList.replace(
            // перерисовываем
            cell.cellHandler.className,
            cell.displayType
          );
          if (cell.amountNeighbors === 0) openNeighbour(field, x + i, y + j); // и если у этой клетки нет соседей мин вызываем для нее открывашку
          // рекурсия в общем
        }
      }
    }
  };
  // перерисовываем илина пусто или на взорванную мину
  cell.cellHandler.classList.replace("pin-btn", cell.displayType);
  // убираем с клетки лисснер
  cell.cellHandler.removeEventListener("mouseup", btnFuncTmpl);
  cell.close = false; // помечаем как открытую
  if (cell.displayType === "pin-blast-mine-btn") {
    // если мина то проиграли
    clearInterval(timer); // снимаем таймер
    startBtn.classList.replace(startBtn.className, "unsuccess-smile"); // грустная мордочка
    for (const row of mineField) {
      // в цике обрабатываем поле
      for (const cl of row) {
        if (cl.close) {
          // для закрытых клеток
          cl.cellHandler.removeEventListener("mouseup", btnFuncTmpl); // снимаем лисснеры
          cl.cellHandler.removeEventListener("mousedown", btnFuncTmpl);
          if (cl.displayType === "pin-blast-mine-btn") {
            // если там мина рисуем мину
            cl.cellHandler.classList.replace("unpin-btn", "pin-mine-btn");
          } else if (cl.flag) {
            // если мины нет но есть флаг рискем перечеркнутую мину
            cl.cellHandler.classList.replace("flag-btn", "pin-cros-mine-btn");
          } else {
            // иначе рисуем чего там было посчитано
            cl.cellHandler.classList.replace(
              cl.cellHandler.className,
              cl.displayType
            );
          }
        }
      }
    }
  } else {
    // если не мина то
    openNeighbour(mineField, cell.x, cell.y); // открываем все что надо открыть
    startBtn.classList.replace(startBtn.className, "unpin-smile"); // перерисовываем кнопку морры
    if (isOpenWin(mineField, amountMine)) WinGame(mineField); // проверяем победу по открытым клеткам
  }
}

// функция которая инициализирует игру
// на вход массив, размер, количество мин

const startGame = function (field, size, amount) {
  const randomInt = (
    // рандом
    min,
    max // генерация из диапазона
  ) => Math.floor(Math.random() * (max - min) + 1) + min;
  // генерирует пустое поле
  const generateField = () => {
    for (let i = 0; i < size; i++) {
      let row = [];
      for (let j = 0; j < size; j++) {
        row.push(new boardCell(i, j));
      }
      field.push(row);
    }
  };
  // расставляет мины
  const generateMines = () => {
    for (let i = 0; i < amount; i++) {
      let x = randomInt(0, size - 1);
      let y = randomInt(0, size - 1);
      while (field[x][y].type === "mine") {
        x = randomInt(0, size - 1);
        y = randomInt(0, size - 1);
      }
      field[x][y].type = "mine";
      field[x][y].displayType = "pin-blast-mine-btn";
    }
  };
  // вычисляет число соседей
  const calcNeighbors = () => {
    let amountNeighbors = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        amountNeighbors = 0;
        if (field[i][j].displayType === "pin-blast-mine-btn") continue;
        for (const [x, y] of dr) {
          if (
            i + x >= 0 &&
            i + x < size &&
            j + y >= 0 &&
            j + y < size &&
            field[i + x][j + y].type === "mine"
          )
            amountNeighbors++;
        }
        field[i][j].displayType =
          amountNeighbors === 0 ? `pin-btn` : `pin-digit-0${amountNeighbors}`;
        field[i][j].amountNeighbors = amountNeighbors;
      }
    }
  };
  // рисует
  const drowGameBoard = () => {
    gameBoard.innerHTML = "";
    for (let i = 0; i < size; i++) {
      let row = [];
      row.push('<div class="board-row">');
      for (let j = 0; j < size; j++) {
        row.push(`<div class="unpin-btn" id="cell-${i}-${j}"></div>`);
      }
      row.push("</div>");
      gameBoard.insertAdjacentHTML("beforeend", row.join("\n"));
    }
  };
  // берет все ID клеток
  const getCellsID = () => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        field[i][j].cellHandler = document.getElementById(`cell-${i}-${j}`);
      }
    }
  };
  // вешает обработчики
  const addEventsListeners = () => {
    for (const row of field) {
      for (const cell of row) {
        cell.cellHandler.addEventListener("mousedown", btnFuncTmpl);
        cell.cellHandler.addEventListener("contextmenu", (e) =>
          e.preventDefault()
        );
      }
    }
  };
  // количествофлагов
  flagLeft = amountMine;
  updateFlagCount(flagLeft);
  // обнуляем полу
  mineField.length = 0;

  generateField(); // генерим поле
  generateMines(); // расставляем мины
  calcNeighbors(); // считаем соседей
  drowGameBoard(); // рисуем поле
  getCellsID(); // берем ID  всех клеток
  addEventsListeners(); // вешаем обработчики
  time = 0; // секунды в ноль
  resetTimer(timer); // запускаем таймер
};

// первый хапуск игры
startGame(mineField, fieldSize, amountMine);

const initBtn = function (e) {
  const classList = e.srcElement.classList;
  if (e.type === "mousedown" && e.button === 0) {
    classList.replace(e.srcElement.className, "pin-smile");
  } else if (e.type === "mouseup" && e.button === 0) {
    // start game
    classList.replace("pin-smile", "unpin-smile");
    startGame(mineField, fieldSize, amountMine);
  }
};

startBtn.addEventListener("mousedown", initBtn);
startBtn.addEventListener("mouseup", initBtn);
startBtn.addEventListener("contextmenu", disableContextMenu);
