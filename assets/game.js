



// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................



// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.querySelector(".hud #fpsCounter");
var scoreCounter = document.querySelector(".game-header div #scoreCounter");
var recordCounter = document.querySelector(".game-header .hud #recordCounter");

// Пауза
var buttonPause = document.getElementById("pause");
buttonPause.onclick = function () {
    game.pauseIsActive(!game.isPause);
}
var buttonContinue = document.getElementById("continue");
buttonContinue.onclick = function () {
    game.pauseIsActive(false);
}

var gameOverPanel = document.getElementById("game-over");
var buttonRestart = document.getElementById("restart");
buttonRestart.onclick = function () {
    game.startGame();
}

var uagent = navigator.userAgent.toLowerCase();

// ЗАГРУЗКА ДОКУМЕНТА ..........................................
document.addEventListener('DOMContentLoaded', function () {

    if (uagent.search("android") > -1) {
        config.updateConfigForAndroid();         //  Меняем настройки под мобильный телефон
    }
    else {
        // // Внутренний размер окна — это ширина и высота области просмотра (вьюпорта).
        // console.log(window.innerHeight);

        // // Адаптивно меняем размер канваса
        // if (window.innerHeight < 600) {
        //     canvas.height = 304;
        // }
        // if (window.innerWidth < 544) canvas.width = 448;
        // else if (window.innerWidth < 600) canvas.width = 496;
        // else if (window.innerWidth < 700) canvas.width = 544;
    }

    // document.getElementById("size-map").innerHTML = canvas.width / 16 + "x" + canvas.height / 16

    game.startGame();
    glManager.gameLoop();
});

// ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ..........................................

document.addEventListener("mousemove", function (e){
    control.position.x = e.clientX - canvas.getBoundingClientRect().left;
    control.position.y = e.clientY - canvas.getBoundingClientRect().top;
    control.relative.x = control.position.x - canvas.offsetLeft;
    control.relative.y = control.position.y - canvas.offsetTop;
});

// Отлавливаев клики мышкой
document.addEventListener('click', function (evt) {

}, false);

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', function (e) {
    if (e.keyCode === 32) {
        game.pauseIsActive(!game.isPause);
    }
    if (game.isPause) return;

    if (e.keyCode === 37 || e.keyCode === 65) {
        control.dir = 1;
    }
    else if (e.keyCode === 38 || e.keyCode === 87) {
        control.dir = 2;
    }
    else if (e.which === 39 || e.which === 68) {
        control.dir = 3;
    }
    else if (e.which === 40 || e.which === 83) {
        control.dir = 4;
    }
});


// СУЩНОСТИ ....................................................................


var control = {
    position: {
        x: 0,
        y: 0
    },
    relative: {
        x: 0,
        y: 0
    }
}

var game = {
    score: 0,
    isPause: false,
    balls: [],

    pauseIsActive(flag) {
        this.isPause = flag;
        buttonContinue.style.display = flag ? "block" : "none";
        buttonPause.style.display = !flag ? "" : "none";
    },
    startGame() {
        this.isPause = false;
        this.score = 0;
        scoreCounter.innerHTML = "" + game.score;
        buttonPause.style.display = "block";
        gameOverPanel.style.display = "none";
        if (localStorage.getItem('record') == null) localStorage.setItem('record', 0);
        recordCounter.innerHTML = "РЕКОРД: " + localStorage.getItem('record');
        this.balls.push(new ball()); // Создаём один шарик
    },
    addScore() {
        food.spawn();
        game.score++;
        scoreCounter.innerHTML = "" + game.score;
        if (game.score > localStorage.getItem('record')) {
            localStorage.setItem('record', game.score);
            recordCounter.innerHTML = "РЕКОРД: " + game.score;
        }
    },
    gameOver() {
        buttonPause.style.display = "none";
        this.isPause = true;
        gameOverPanel.style.display = "block";
    }
}

var config = {
    

    updateConfigForAndroid() {
        
    }
}

function ball() {
    this.speed = 2;
    this.ballRadius = 10;
    this.isAcrive = false,

    this.velocity = {
        x: 0,
        y: 0
    },
    this.position = {
        x: canvas.width / 2 - 90,
        y: canvas.height - 30
    },

    this.leftPos = {
        x: 0,
        y: 0
    },
    this.rightPos = {
        x: 0,
        y: 0
    },
    this.topPos = {
        x: 0,
        y: 0
    },
    this.downPos = {
        x: 0,
        y: 0
    },

    this.update = function(){

        // Если шарик не активен
        if (this.isAcrive == false){
            
            // привязываем его положение к ракетке
            this.position.x = paddle.position.x + paddle.size.x/2;
            this.position.y = paddle.position.y - 10;
            return;
        }
        else {
            
            // Если касаемся левой или правой стены
            if (isCollisionWall(this.rightPos.x + this.velocity.x)
             || isCollisionWall(this.leftPos.x + this.velocity.x)){
                // Инвертирем вектор по горизонтали
                this.velocity.x = -this.velocity.x;
            }

            
            // Шарик находится над ракеткой по оси Х?
            var isOverPaddle = 
            this.position.x + this.ballRadius > paddle.position.x 
            && this.position.x < paddle.position.x + paddle.size.x;

            // Шарик опускается до высоты ракетки по оси Y?
            var isOnALevelPaddle = 
            this.position.y + this.velocity.y > canvas.height-this.ballRadius-paddle.size.y

            // Шарик опускается ниже высоты ракетки?
            var isUnderPaddle =
            this.position.y + this.velocity.y > canvas.height-this.ballRadius;
                
            // Если шарик косается ракетки
            if (isOverPaddle && isOnALevelPaddle){
                this.velocity.y = -this.velocity.y;
            }
            // Если шарик коснулся верхней стенки
            else if (this.position.y + this.velocity.y < this.ballRadius){
                    this.velocity.y = -this.velocity.y;
            }
            // Если шарик ниже ракетки
            else if (isUnderPaddle){
                game.gameOver();
            }

            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;

            this.leftPos.x = this.position.x - this.ballRadius;
            this.leftPos.y = this.position.y;

            this.rightPos.x = this.position.x + this.ballRadius;
            this.rightPos.y = this.position.y;

            this.topPos.x = this.position.x;
            this.topPos.y = this.position.y  - this.ballRadius;

            this.downPos.x = this.position.x;
            this.downPos.y = this.position.y + this.ballRadius;
        }
    },

    this.render = function(){
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.ballRadius,0,Math.PI*2,false);
        ctx.fillStyle = "#90EBB1";
        ctx.fill();
        ctx.closePath();
    },
    this.onActive = function(){
        this.isAcrive = true;
    },
    this.offActive = function(){
        this.isAcrive = false;

        this.position.x = paddle.position.x + paddle.size/2;
        this.position.y = paddle.position.y - paddle.size.y;
    }
}

// РЛК 14 00 Ту 204 РСД-391 64524 Сочи-Внуково

var paddle = {
    size: {
        x: 75,
        y: 10
    },
    position: {
        x: 0,
        y: canvas.height-10
    },
    
    update(){
        if (control.relative.x > 0 && control.relative.x < canvas.width){
            paddle.position.x = control.relative.x - paddle.size.x / 2;
            if (paddle.position.x + paddle.size.x > canvas.width){
                paddle.position.x = canvas.width - paddle.size.x;
            }
            if (paddle.position.x + paddle.size.x < paddle.size.x){ //    <----------------
                paddle.position.x = 0;
            }
        }
    },
    render(){
        ctx.beginPath();
        ctx.rect(paddle.position.x, paddle.position.y, paddle.size.x, paddle.size.y);
        ctx.fillStyle = "#EAF33A";
        ctx.fill();
        ctx.closePath();
    }
}

var grid = {
    maxRowCount: 5,
    maxColumnCount: 5,
    brickPadding: 10,
    brickOffsetTop: 30,
    brickOffsetLeft: 65,

    maxCountChar: 24, // Временно

    brickWidth: 75,
    brickHeight: 20,

    bricks: [],

    initializationBricks(){
        grid.bricks = [];

        for (let i = 0; i < grid.maxRowCount; i++) {
            grid.bricks[i] = [];
        }
        
        var r = 0;
        var c = 0;
        for (var charCounter = 0; r < grid.maxCountChar; charCounter++){
            var ch = game.levels[game.curLevel][charCounter];
            if (ch == "-"){
                grid.bricks[r][c] = {x: 0, y: 0, status: 1, type: 0};
                c++;
                game.maxScore++;
            }
            else if (ch == "="){
                grid.bricks[r][c] = {x: 0, y: 0, status: 1, type: 1};
                c++;
                game.maxScore++;
            }
            else if (ch == "#"){
                r++;
                c = 0;
                continue;
            }
            else if (ch == "%") {
                grid.rowCount = r+1;
                break;
            }
            else{
                grid.bricks[r][c] = {x: 0, y: 0, status: 0, type: 0};
                c++;
            }
        }
    },

    render(){
        for (var r = 0; r < grid.bricks.length; r++){
            for (var c = 0; c < grid.bricks[r].length; c++){
                if (grid.bricks[r][c].status == 1){
                    var brickX = (c*(grid.brickWidth + grid.brickPadding)) + grid.brickOffsetLeft;
                    var brickY = (r*(grid.brickHeight + grid.brickPadding)) + grid.brickOffsetTop;
                    grid.bricks[r][c].x = brickX;
                    grid.bricks[r][c].y = brickY;
                    ctx.beginPath();
                    ctx.rect(brickX, brickY, grid.brickWidth, grid.brickHeight);
                    if (grid.bricks[r][c].type == 0){
                        ctx.fillStyle = "#123412";
                    }
                    else {
                        if (grid.bricks[r][c].hp == 2) ctx.fillStyle = "#343434";
                        else ctx.fillStyle = "#898989";
                    }
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }
}

// Проверка касания боковых границ
function isCollisionWall(posX){
    return posX > canvas.width 
    || posX < 0;
}

function collisionDetection (){
    for (var r = 0; r < grid.bricks.length; r++) {
        for (var c = 0; c < grid.bricks.length; c++) {
            if (grid.bricks[r][c] == null) break;
            var b = grid.bricks[r][c];
            var bWidth = grid.brickWidth;
            var bHeight = grid.brickHeight;
            if (b.status == 1){
                    //
            }
        }
    }
}



// ИГРОВОЙ ЦИКЛ ................................................................

var glManager = {
    ms_per_update: 17,    // Интервал между вычислениями
    fps: 0,
    elapsed: 0,            // Счетчик времени между кадрами
    currentTime: 0,
    pervious: Date.now(),
    lag: 0.0,
    frames: 0,

    gameLoop() {
        if (glManager.frames == 10000) glManager.frames = 0;

        // Текущее вермя
        glManager.currentTime = Date.now();
        glManager.elapsed = glManager.currentTime - glManager.pervious; // Время между предыдущим и текущим кадром
        glManager.pervious = glManager.currentTime;             // Сохраняем время текущего кадра
        glManager.lag += glManager.elapsed;                     // Суммированное время между кадрами

        // Сохраняем лаг, т.е время с предыдущего РАБОЧЕГО кадра (для подсчета ФПС)
        // Так-как потом мы изменяем glManager.lag
        var curLag = glManager.lag;

        update();
        glManager.lag -= glManager.elapsed;
        /*
        // При накоплении лагов, змейка начнёт отставать на несколько итераций т.е перемещений
        // с помощью этого цикла мы нагоняем змейку к её нужному положению
        */
        while (glManager.lag >= glManager.ms_per_update) {
            update();
            glManager.lag -= glManager.ms_per_update;
        }

        // Рендерим кадр с нужны интервалом (glManager.ms_per_update)
        render();

        // Ограничем показ ФПС
        if (Date.now() % 5 === 0) glManager.fpsUpdate(curLag);
        requestAnimFrame(glManager.gameLoop);
    },
    fpsUpdate(curLag) {
        glManager.fps = (1000 / curLag).toFixed(1);
        fpsCounter.innerHTML = "FPS: " + glManager.fps;
    }
}

function update() {
    if (game.isPause) return;
    paddle.update();
    game.balls.forEach(element => {
        element.update();
    });
    collisionDetection();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.balls.forEach(element => {
        element.render();
    });
    paddle.render();
    grid.render();
}

// ВСПОМОГАТЕЛЬНЫЕ, УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ................................................................

var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 20);
        };
})();

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Функция проверяет попадает ли точка в область прямоугольника
function isInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y
}

function drawRect(pos, scale, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(pos.x, pos.y, scale.x, scale.y);
    ctx.fill();
}

function drawRoundRect(pos, scale, round, color) {
    if (typeof ctx.roundRect === 'function'){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.roundRect(pos.x, pos.y, scale.x, scale.y, round);
        ctx.fill();
    }
    else { // Если браузер не поддерживает ctx.roundRect, то рисуем круги
        drawCircle({x:pos.x + 8, y:pos.y + 8}, scale, color);
    }
}

function drawCircle(pos, radius, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(pos.x, pos.y, radius.x/2, 0, 2 * Math.PI, false);
    ctx.fill();
}


//Function to get the mouse position
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawText(text){
    ctx.font = '10pt arial';
    ctx.fillStyle = '#000000'
    ctx.fillText('label: ' + text, 13, 50);
}