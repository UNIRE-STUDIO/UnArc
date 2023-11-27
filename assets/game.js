



// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................



// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('my-canvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.querySelector(".hud #fps-counter");

// Список уровней
var levelsPanel = document.getElementById("level-menu");

// Уровни
var levelButtons = document.getElementsByClassName("level-buttoms");
for (let i = 0; i < levelButtons.length; i++) {
    levelButtons[i].onclick = function () {
        game.loadGame(i);
    }
}

// Пауза
var buttonPause = document.getElementById("pause");
buttonPause.onclick = function () {
    game.changeState(GameStates.PAUSE);
}
var buttonContinue = document.getElementById("continue");
buttonContinue.onclick = function () {
    game.changeState(GameStates.PAUSE);
}

var gameOverPanel = document.getElementById("game-over");
var buttonRestart = document.getElementById("restart");
buttonRestart.onclick = function () {
    // Костыль, который не позволяет одновременно срабатывать методу Click и Нажатию на кнопку рестарт
    setTimeout(() => {  game.changeState(GameStates.READYTOPLAY); }, 50);
}

var halfScreenButton = document.getElementById("half-screen-button");
halfScreenButton.onclick = function () {
    config.changeDividerScreen();
}

window.addEventListener('resize', function() {
    config.resizeGame();
}, true);

// ЗАГРУЗКА ДОКУМЕНТА ..........................................
var uagent = navigator.userAgent.toLowerCase();
document.addEventListener('DOMContentLoaded', function () {

    if (uagent.search("android") > -1) {
        config.updateConfigForAndroid();         //  Меняем настройки под мобильный телефон
    }
    else {
        // Внутренний размер окна — это ширина и высота области просмотра (вьюпорта).

        // // Адаптивно меняем размер канваса
        // if (window.innerHeight < 600) {
        //     canvas.height = 304;
        // }
        // if (window.innerWidth < 544) canvas.width = 448;
        // else if (window.innerWidth < 600) canvas.width = 496;
        // else if (window.innerWidth < 700) canvas.width = 544;
    }

    // document.getElementById("size-map").innerHTML = canvas.width / 16 + "x" + canvas.height / 16
    config.resizeGame();
    levelManager.loadJsonDoc();
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

var config = {
    dividerScreen: 1,
    h: canvas.height / 100,
    w: canvas.width / 100,

    updateConfigForAndroid() {
        
    },

    changeDividerScreen(){
        if (config.dividerScreen == 1) config.dividerScreen = 2;
        else config.dividerScreen = 1;
        config.resizeGame();
    },

    resizeGame(){
        canvas.height = window.innerHeight * 0.76 / config.dividerScreen;
        canvas.width = window.innerWidth * 0.9 / config.dividerScreen;
        config.h = canvas.height / 100;
        config.w = canvas.width / 100;
        paddle.initialization();
        levelManager.initialization();
        for (let i = 0; i < game.balls.length; i++) {
            game.balls[i].initialization();
        }
    }
}

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
const GameStates = {LEVEL_SELECTION: 0, READYTOPLAY: 1, PLAY: 2, PAUSE: 3, GAMEOVER: 4}

var game = {
    score: 0,
    balls: [],
    currentState: null,
    
    changeState(state){
        switch (state) {
            case GameStates.LEVEL_SELECTION:
                game._LevelSelection();    
            break;
            case GameStates.READYTOPLAY:
                game._ReadyToPlay();
            break;
            case GameStates.PLAY:
                if (game.currentState != GameStates.READYTOPLAY) return;
                game._Play();
            break;
            case GameStates.PAUSE:
                game._Pause();
            break;
            case GameStates.GAMEOVER:
                game._Gameover();
            break;
            default:
                break;
        }
    },

    // Режимы игры ...............................................
    _LevelSelection(){
        levelsPanel.style.display = "block";
    },
    _ReadyToPlay(){
        this.isPause = false;
        buttonPause.style.display = "block";
        levelsPanel.style.display = "none";
        gameOverPanel.style.display = "none";
        this.balls = [];
        this.balls.push(new ball()); // Создаём один шарик
        game.currentState = GameStates.READYTOPLAY;
    },
    _Play(){
        if (!game.balls[0].isAcrive){
            game.balls[0].onActive();
        }
        buttonContinue.style.display = "none";
        buttonPause.style.display = ""; 
        game.currentState = GameStates.PLAY;
    },
    _Pause(){
        if (game.currentState == GameStates.PAUSE) {
            game._Play();
            return;
        }
        if (game.currentState != GameStates.PLAY) return;
        buttonContinue.style.display = "block";
        buttonPause.style.display = "none";
        game.currentState = GameStates.PAUSE;
    },
    _Gameover(){
        buttonPause.style.display = "none";
        gameOverPanel.style.display = "block";
        game.currentState = GameStates.GAMEOVER;
    },
    //................................................................

    loadGame(level){
        this.changeState(GameStates.READYTOPLAY);
        levelManager.loadMap(level);
        glManager.gameLoop();
    },
    restartGame(){
        buttonPause.style.display = "block";
        gameOverPanel.style.display = "none";
        

        this.balls = [];
        this.balls[0] = new ball(); // Создаём один шарик
        this.isPause = false;
    }
    
}

function ball() {
    this.speed = (0.2 * config.w) + (0.2 * config.h);
    this.ballRadius = 1 * config.w;
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

    this.initialization = function(){
        this.ballRadius = 1 * config.w;
        this.speed = (0.2 * config.w) + (0.2 * config.h);
    },

    this.update = function(){
        // Если шарик не активен
        if (this.isAcrive == false){
            
            // привязываем его положение к ракетке
            this.position.x = paddle.position.x + paddle.size.x/2;
            this.position.y = paddle.position.y - paddle.size.y/2 - this.ballRadius/2;
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
        for (let i = 0; i < levelManager.currentLevel.length; i++) {
            var brick = levelManager.currentLevel[i];
            var xPos = brick.x * levelManager.brickWidth + levelManager.brickPaddingX * brick.x + levelManager.brickOffsetLeft;
            var yPos = brick.y * levelManager.brickHeight + levelManager.brickPaddingY * brick.y + levelManager.brickOffsetTop;
            
            var nbrick = {x: xPos, y: yPos, width: levelManager.brickWidth, height: levelManager.brickHeight};
            
            var points = [this.leftPos, this.rightPos, this.topPos, this.downPos];
            points.forEach((point, index) => {
                if (isInside(point, nbrick)){
                    levelManager.currentLevel.splice(i,1);
                    if (index < 2)
                        this.velocity.x = -this.velocity.x; // Инвертирем вектор по горизонтали
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
        x: 0,
        y: 0
    },
    position: {
        x: 0,
        y: 0
    },

    initialization(){
        paddle.size.x = 8 * config.w;
        paddle.size.y = 2 * config.h;
        paddle.position.y = canvas.height - paddle.size.y;
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

var levelManager = {

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

    brickPaddingX: 0,
    brickPaddingY: 0,
    brickOffsetTop: 0,
    brickOffsetLeft: 0,
    brickWidth: 0,
    brickHeight: 0,

    currentLevelId: 0,      // ID текущей карты
    currentLevel: [],
    levels: [],             // Храним распарсенные карты
    isLoad: false,
    
    initialization(){
        levelManager.brickPaddingX = config.w * 0.26;
        levelManager.brickPaddingY = config.h * 1;
        levelManager.brickOffsetTop = config.h * 1;
        levelManager.brickOffsetLeft = config.w * 0.26;
        levelManager.brickHeight = config.h * 4;
        levelManager.brickWidth = config.w * 8.8;
    },

    loadJsonDoc(){
        var url = 'assets/scene.json';
        fetch(url)
            .then(response => response.json())
            .then(json => {
                levelManager.initializationMaps(json);
            });
    },

    // нужно менять относительную позицию на реальную в пикселях
    initializationMaps(objLevel){ 
        for (let i = 0; i < objLevel.length; i++) { // Добавляем кирпичикам показатель здоровья
            for (let j = 0; j < objLevel[i].length; j++) {
                objLevel[i][j].health = levelManager.healthBlock[objLevel[i][j].t];
            }
        }
        levelManager.levels = objLevel;
    },

    loadMap(levelId){
        levelManager.currentLevelId = levelId;
        levelManager.currentLevel = levelManager.levels[levelManager.currentLevelId];
        levelManager.isLoad = true;
    },

    render() {
        if (!levelManager.isLoad) return;
        for (let i = 0; i < levelManager.currentLevel.length; i++) {
            var brick = levelManager.currentLevel[i];
            var xPos = brick.x * levelManager.brickWidth + levelManager.brickPaddingX * brick.x + levelManager.brickOffsetLeft;
            var yPos = brick.y * levelManager.brickHeight + levelManager.brickPaddingY * brick.y + levelManager.brickOffsetTop;
            drawRect({x:xPos, y:yPos}, {x: levelManager.brickWidth, y: levelManager.brickHeight}, levelManager.colorsBlock[brick.t]);
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
    levelManager.render();
}