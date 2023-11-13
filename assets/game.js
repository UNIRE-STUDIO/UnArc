



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
    game.changeState(GameStates.PAUSE);
}
var buttonContinue = document.getElementById("continue");
buttonContinue.onclick = function () {
    game.changeState(GameStates.PLAY);
}

var gameOverPanel = document.getElementById("game-over");
var buttonRestart = document.getElementById("restart");
buttonRestart.onclick = function () {
    // Костыль, который не позволяет одновременно срабатывать методу Click и Нажатию на кнопку рестарт
    setTimeout(() => {  game.changeState(GameStates.READYTOPLAY); }, 50);
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
    mapManager.loadJsonDoc();
    game.loadGame();
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
document.addEventListener('click', function (e) {
    game.changeState(GameStates.PLAY);
}, false);

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', function (e) {
    if (e.keyCode === 80){
        game.changeState(GameStates.PAUSE);
    }
    if (e.keyCode === 32) {
        game.changeState(GameStates.PLAY);
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

// Состояния в которых игра может находиться
const GameStates = {READYTOPLAY: 0, PLAY: 1, PAUSE: 2, GAMEOVER: 3}

var game = {
    score: 0,
    balls: [],
    currentState: null,
    
    changeState(state){
        switch (state) {
            case GameStates.READYTOPLAY:
                this.isPause = false;
                this.score = 0;
                scoreCounter.innerHTML = "" + game.score;
                buttonPause.style.display = "block";
                gameOverPanel.style.display = "none";
                recordCounter.innerHTML = "РЕКОРД: " + localStorage.getItem('record');
                this.balls = [];
                this.balls.push(new ball()); // Создаём один шарик
                game.currentState = GameStates.READYTOPLAY;
            break;
            case GameStates.PLAY:
                if (game.currentState != GameStates.READYTOPLAY) return;
                if (!game.balls[0].isAcrive){
                    game.balls[0].onActive();
                }
                buttonContinue.style.display = "none";
                buttonPause.style.display = ""; 
                game.currentState = GameStates.PLAY;
            break;
            case GameStates.PAUSE:
                if (game.currentState != GameStates.PLAY) return;
                buttonContinue.style.display = "block";
                buttonPause.style.display = "none";
                game.currentState = GameStates.PAUSE;
            break;
            case GameStates.GAMEOVER:
                buttonPause.style.display = "none";
                gameOverPanel.style.display = "block";
                game.currentState = GameStates.GAMEOVER;
            break;
            default:
                break;
        }
    },
    loadGame(){
        if (localStorage.getItem('record') == null) localStorage.setItem('record', 0);
        this.changeState(GameStates.READYTOPLAY);
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
    restartGame(){
        this.score = 0;
        scoreCounter.innerHTML = "" + game.score;
        buttonPause.style.display = "block";
        gameOverPanel.style.display = "none";
        recordCounter.innerHTML = "РЕКОРД: " + localStorage.getItem('record');
        

        this.balls = [];
        this.balls[0] = new ball(); // Создаём один шарик
        this.isPause = false;
    }
    
}

var config = {
    

    updateConfigForAndroid() {
        
    }
}

function ball() {
    this.speed = 4;
    this.ballRadius = 10;
    this.isAcrive = false,

    this.velocity = {
        x: 0,
        y: 0
    },
    this.position = {
        x: 0,
        y: 0
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
            if (this.isCollisionWall(this.rightPos.x + this.velocity.x)
             || this.isCollisionWall(this.leftPos.x + this.velocity.x)){
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
                game.changeState(GameStates.GAMEOVER);
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

            this.collisionDetection();
        }
    },
    this.isCollisionWall = function(posX){
        return posX > canvas.width || posX < 0;
    },

    this.collisionDetection = function(){
        for (let i = 0; i < mapManager.currentMap.length; i++) {
            var brick = mapManager.currentMap[i];
            var xPos = brick.x * mapManager.brickWidth + mapManager.brickPadding * brick.x + mapManager.brickOffsetLeft;
            var yPos = brick.y * mapManager.brickHeight + mapManager.brickPadding * brick.y + mapManager.brickOffsetTop;
            
            var nbrick = {x: xPos, y: yPos, width: mapManager.brickWidth, height: mapManager.brickHeight};
            
            var points = [this.leftPos, this.rightPos, this.topPos, this.downPos];
            points.forEach((point, index) => {
                if (isInside(point, nbrick)){
                    mapManager.currentMap.splice(i,1);
                    if (index < 2)
                        this.velocity.x = -this.velocity.x; // Инвертирем вектор по вертикали
                    else
                        this.velocity.y = -this.velocity.y; // Инвертирем вектор по вертикали
                }
            });
            
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
        this.velocity.y = this.speed;
        this.velocity.x = randomRange(0,2) == 1 ? this.speed : -this.speed;

        this.isAcrive = true;
    },
    this.offActive = function(){
        this.isAcrive = false;
        this.position.x = 10;
        this.position.y = 10;
        this.velocity.x = 0;
        this.velocity.y = 0;
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

var mapManager = {

    colorsBlock: {
        element1: "#10454F", // Цвета блоков
        element2: "#506266",
        element3: "#818274",
        element4: "#A3AB78",
        element5: "#BDE038"
    },
    healthBlock: {
        element1: 1, // Здоровье блоков
        element2: 2,
        element3: 3,
        element4: 3,
        element5: 3
    },

    brickPadding: 5,
    brickOffsetTop: 40,
    brickOffsetLeft: 5,
    brickWidth: 80,
    brickHeight: 20,

    currentMapId: 0,      // ID текущей карты
    currentMap: [],
    maps: [],             // Храним распарсенные карты
    isLoad: false,
    

    loadJsonDoc(){
        var url = 'assets/scene.json';
        fetch(url)
            .then(response => response.json())
            .then(json => {
                mapManager.initializationMaps(json);
            });
    },

    // нужно менять относительную позицию на реальную в пикселях
    initializationMaps(objMaps){ 
        for (let i = 0; i < objMaps.length; i++) { // Добавляем кирпичикам показатель здоровья
            for (let j = 0; j < objMaps[i].length; j++) {
                objMaps[i][j].health = mapManager.healthBlock[objMaps[i][j].t];
            }
        }
        mapManager.maps = objMaps;
        mapManager.loadMap();
    },

    loadMap(){
        mapManager.currentMap = mapManager.maps[mapManager.currentMapId];
        mapManager.isLoad = true;
    },

    render() {
        if (!mapManager.isLoad) return;
        for (let i = 0; i < mapManager.currentMap.length; i++) {
            var brick = mapManager.currentMap[i];
            var xPos = brick.x * mapManager.brickWidth + mapManager.brickPadding * brick.x + mapManager.brickOffsetLeft;
            var yPos = brick.y * mapManager.brickHeight + mapManager.brickPadding * brick.y + mapManager.brickOffsetTop;
            drawRect({x:xPos, y:yPos}, {x: mapManager.brickWidth, y: mapManager.brickHeight}, mapManager.colorsBlock[brick.t]);
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
        glManager.fps = (1000 / curLag).toFixed(0);
        fpsCounter.innerHTML = "FPS: " + glManager.fps;
    }
}

function update() {
    if (game.currentState == GameStates.GAMEOVER ||
        game.currentState == GameStates.PAUSE) return;
    paddle.update();
    game.balls.forEach(element => {
        element.update();
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.balls.forEach(element => {
        element.render();
    });
    paddle.render();
    mapManager.render();
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