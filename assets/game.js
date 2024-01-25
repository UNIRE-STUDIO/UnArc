/*
    - Прибавлять скорость ракетки к горизонтальной скорости мяча
    - Исправить баг с уничтожением блока к которому шарик не касался
    - Мобильная версия
    - Плавное движение ракетки ☻

*/
// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................



// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('my-canvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.querySelector(".hud #fps-counter");
var levelCounter = document.querySelector(".hud #level-counter");

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
var pauseButton = document.getElementById("pause-button");
pauseButton.onclick = function () {
    game.changeState(GameStates.PAUSE);
}

var pausePanel = document.getElementById("pause-panel");
var buttonContinue = document.getElementById("continue-button");
buttonContinue.onclick = function () {
    game.changeState(GameStates.PAUSE);
}

var gameOverPanel = document.getElementById("game-over");
var buttonRestart = document.getElementById("restart");
buttonRestart.onclick = function () {
    game.changeState(GameStates.READYTOPLAY);
    levelManager.loadMap(levelManager.currentLevelID);
}

// Уровень пройден
var youWinPanel = document.getElementById("win");
document.getElementById("menu-button").onclick = function () {
    game.changeState(GameStates.LEVEL_SELECTION);
}
document.getElementById("next-level-button").onclick = function () {
    var nextLevelId = levelManager.currentLevelID+1;
    if (levelManager.levels.length-1 < nextLevelId)
    {
        // Если последний уровень
    }
    else
    {
        game.changeState(GameStates.READYTOPLAY);
        levelManager.loadMap(nextLevelId);
    } 
}


var halfScreenButton = document.getElementById("half-screen-button");
halfScreenButton.onclick = function () {
    if (game.currentState != GameStates.PAUSE)
    {
        game.changeState(GameStates.PAUSE);
    }
    config.changeDividerScreen();
    halfScreenButton.blur();
}

var changeControlButton = document.getElementById("change-control-button");
changeControlButton.onclick = () => 
{
    control.changeControl();
    changeControlButton.blur();
};

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
    glManager.gameLoop();
    game.changeState(GameStates.LEVEL_SELECTION);

    // Если отсутствует сохранение
    if (localStorage.getItem('unArcControl') == null)
    {
        localStorage.setItem('unArcControl', 0);
    }
    else if (localStorage.getItem('unArcControl') == 1)
    {
        control.mouseControl = false;
        changeControlButton.innerHTML = control.mouseControl ? "Mouse" : "Keyboard";
    }
});

// ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ..........................................

document.addEventListener("mousemove", (e) => control.setMouseMove(e));

// Отлавливаев клики мышкой
document.addEventListener('click', (e) => control.setClick(e), false);

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', (e) => control.setKeydown(e)); 
document.addEventListener('keyup', (e) => control.setKeyup(e)); 

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
        var newHeight = window.innerHeight * 0.76 / config.dividerScreen;
        var newWidth = window.innerWidth * 0.9 / config.dividerScreen;

        // Стараемся сохранить относительное положение шариков
            for (let i = 0; i < game.balls.length; i++) {
                var relativePosX = game.balls[i].position.x / canvas.width;
                var relativePosY = game.balls[i].position.y / canvas.height;
                game.balls[i].updatePos({x: relativePosX * newWidth, y: relativePosY * newHeight});
            }
        //

        canvas.height = newHeight;
        canvas.width = newWidth;
        
        config.h = canvas.height / 100;
        config.w = canvas.width / 100;
        
        paddle.updateFields();
        levelManager.updateFields();
        game.balls.forEach(b => b.updateFields());
        game.bonuses.forEach(b => b.updateFields());
        game.bullets.forEach(b => b.updateFields());
    }
}

var control = {
    mouseControl: true,
    speed: 1,
    positive: false,
    negative: false,
    position: {
        x: 0,
        y: 0
    },
    changeControl()
    {
        control.mouseControl = !control.mouseControl;
        changeControlButton.innerHTML = control.mouseControl ? "Mouse" : "Keyboard";
        localStorage.setItem('unArcControl', control.mouseControl ? 0 : 1);
    },
    setClick(e)
    {
        if (!isInside({x: control.position.x, y: control.position.y},
            {x: 0, y: 0, width: canvas.width, height: canvas.height})) return;
        // Добавить условие "В пределах канваса"
        game.changeState(GameStates.PLAY);
    },
    setMouseMove(e)
    {
        if (!control.mouseControl) return;
        var posX = e.clientX - canvas.getBoundingClientRect().left;
        var posY = e.clientY - canvas.getBoundingClientRect().top;
        control.position.x = posX - canvas.offsetLeft;
        control.position.y = posY - canvas.offsetTop;
    },
    setKeydown(e)
    {
        if (e.keyCode === 80){
            game.changeState(GameStates.PAUSE);
        }
        if (e.keyCode === 32) {
            game.changeState(GameStates.PLAY);
        }

        if (control.mouseControl) return;

        if (e.keyCode === 37) 
        {
            control.negative = true;
        }
        if (e.keyCode === 39) 
        {
            control.positive = true;
        }
    },
    setKeyup(e){
        if (e.keyCode === 37) 
        {
            control.negative = false;
        }
        if (e.keyCode === 39) 
        {
            control.positive = false;
        }
    },
    update(){
        if (control.mouseControl) return;

        if (control.negative) {
            control.position.x -= control.speed * canvas.width / 100;
            if (control.position.x < paddle.size.x/2) 
            control.position.x = paddle.size.x/2;
        }
        if (control.positive) 
        {
            
            control.position.x += control.speed * canvas.width / 100;
            if (control.position.x > canvas.width) control.position.x = canvas.width - paddle.size.x / 2;
        }
    }
}

// Состояния в которых игра может находиться
const GameStates = {LEVEL_SELECTION: 0, READYTOPLAY: 1, PLAY: 2, PAUSE: 3, GAMEOVER: 4, WIN: 5}

var game = {
    score: 0,
    balls: [],
    bonuses: [],
    bullets: [],
    bonusProbability: 6,
    currentState: GameStates.LEVEL_SELECTION,
    
    changeState(state){
        switch (state) {
            case GameStates.LEVEL_SELECTION:
                game._LevelSelection();    
            break;
            case GameStates.READYTOPLAY:
                    // Костыль, который не позволяет одновременно срабатывать методу Click и Нажатию на кнопку рестарт или выбор уровня
                    setTimeout(game._ReadyToPlay, 20);
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
            case GameStates.WIN:
                game._Win();
            break;
            default:
                break;
        }
    },

    // Режимы игры ...............................................
    _LevelSelection(){
        game.currentState = GameStates.LEVEL_SELECTION;
        clearCanvas();
        game.balls = [];
        levelsPanel.style.display = "block";
        youWinPanel.style.display = "none";
        pauseButton.style.display = "none";
        pausePanel.style.display = "none";
    },
    _ReadyToPlay(){
        pauseButton.style.display = "block";
        levelsPanel.style.display = "none";
        gameOverPanel.style.display = "none";
        youWinPanel.style.display = "none";
        game.balls = [];
        game.bullets = [];
        game.bonuses = [];
        game.balls.push(new ball()); // Создаём один шарик
        game.currentState = GameStates.READYTOPLAY;
    },
    _Play(){
        if (!game.balls[0].isAcrive){
            game.balls[0].onActive();
        }
        pausePanel.style.display = "none";
        pauseButton.style.display = ""; 
        game.currentState = GameStates.PLAY;
    },
    _Pause(){
        if (game.currentState == GameStates.PAUSE) {
            game._Play();
            return;
        }
        if (game.currentState != GameStates.PLAY) return;
        pausePanel.style.display = "block";
        pauseButton.style.display = "none";
        game.currentState = GameStates.PAUSE;
    },
    _Gameover(){
        pauseButton.style.display = "none";
        gameOverPanel.style.display = "block";
        game.currentState = GameStates.GAMEOVER;
    },
    _Win()
    {
        console.log("Win!");
        youWinPanel.style.display = "block";
        game.currentState = GameStates.WIN;
    },
    //................................................................

    loadGame(level){
        if (levelManager.levels.length-1 < level) return; // Если уровня нет, то ничего не делаем
        game.changeState(GameStates.READYTOPLAY);
        levelManager.loadMap(level);
    }
    
}

function ball() {
    this.speedRatio = 14;
    this.speed = config.w + config.h;
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

    this.updateFields = function(){
        this.ballRadius = 1 * config.w;
        this.speed = (config.w + config.h) * this.speedRatio; // Скорость зависит от размера карты
        this.velocity.x = this.velocity.x > 0 ? 1 : -1;
        this.velocity.y = this.velocity.y > 0 ? 1 : -1;
    },

    this.update = function(){
        // Если шарик не активен
        if (this.isAcrive == false){
            
            // привязываем его положение к ракетке
            this.position.x = paddle.position.x + paddle.size.x/2;
            this.position.y = paddle.position.y - paddle.size.y/2 - this.ballRadius/2 - 1; // -1  Что-бы шарик был чуть выше над ракеткой
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
            
            var newPosX = this.position.x + (this.velocity.x * this.speed * (glManager.lag/1000));
            var newPosY = this.position.y + (this.velocity.y * this.speed * (glManager.lag/1000));
            this.updatePos({x: newPosX, y: newPosY});

            this.collisionDetection();
        }
    },

    this.updatePos = function(newPos){
        this.position.x = newPos.x;
        this.position.y = newPos.y;

        this.leftPos.x = this.position.x - this.ballRadius;
        this.leftPos.y = this.position.y;

        this.rightPos.x = this.position.x + this.ballRadius;
        this.rightPos.y = this.position.y;

        this.topPos.x = this.position.x;
        this.topPos.y = this.position.y  - this.ballRadius;

        this.downPos.x = this.position.x;
        this.downPos.y = this.position.y + this.ballRadius;
    },
    this.isCollisionWall = function(posX){
        return posX > canvas.width || posX < 0;
    },

    this.collisionDetection = function(){
        for (let i = 0; i < levelManager.currentLevel.length; i++) {
            var brick = levelManager.currentLevel[i];
            var xPos = (brick.x * levelManager.brickWidth) + (levelManager.brickPaddingX * brick.x) + levelManager.brickOffsetLeft;
            var yPos = (brick.y * levelManager.brickHeight) + (levelManager.brickPaddingY * brick.y) + levelManager.brickOffsetTop;
            
            var nbrick = {x: xPos, y: yPos, width: levelManager.brickWidth, height: levelManager.brickHeight};
            
            var points = [this.leftPos, this.rightPos, this.topPos, this.downPos];
            points.forEach((point, index) => {
                if (isInside(point, nbrick)){
                    if (--brick.health == 0)
                    {
                        levelManager.currentLevel.splice(i,1); // Вынести в гейм
                        if (randomRange(0, game.bonusProbability) == 0){ // Создаём bonus
                            var b = new bonus({x: xPos + levelManager.brickWidth/2, y: yPos});
                            b.updateFields();
                            game.bonuses.push(b); 
                        }
                        
                        if (levelManager.currentLevel.length === 0)
                        {
                            render();
                            game.changeState(GameStates.WIN);
                        }
                    }
                    else // Принудительно вытесняем шарик из кирпичика
                    {
                        // Переделать!!             <------------------------------------------------------------------------
                        var centerBrickY = yPos + levelManager.brickHeight / 2;
                        var centerBrickX = xPos + levelManager.brickWidth / 2;
                        switch (index) {
                            case 0:
                                    this.position.x = centerBrickX + this.ballRadius + (levelManager.brickWidth / 2);
                                break;
                            case 1:
                                    this.position.x = centerBrickX - this.ballRadius - (levelManager.brickWidth / 2);
                                break;
                            case 2:
                                    this.position.y = centerBrickY + this.ballRadius + (levelManager.brickHeight / 2);
                                break;
                            case 3:
                                    this.position.y = centerBrickY - this.ballRadius - (levelManager.brickHeight / 2);
                                break;
                        }
                    }
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
        this.velocity.y = -1;
        this.velocity.x = randomRange(0,2) == 1 ? 1 : -1;
        this.updateFields();
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
    smooth: 3,
    fire: false,
    size: {
        x: 0,
        y: 0
    },
    position: {
        x: 0,
        y: 0
    },

    updateFields(){
        paddle.size.x = 8 * config.w;
        paddle.size.y = 2 * config.h;
        paddle.position.y = canvas.height - paddle.size.y;
    },
    
    update(){
        var targetPos = control.position.x - paddle.size.x / 2;
        paddle.position.x = moveTo(paddle.position.x, targetPos, (glManager.lag/10) * paddle.smooth);
        if (paddle.position.x + paddle.size.x > canvas.width){
            paddle.position.x = canvas.width - paddle.size.x;
        }
        if (paddle.position.x + paddle.size.x < paddle.size.x){
            paddle.position.x = 0;
        }
    },
    render(){
        ctx.beginPath();
        ctx.rect(paddle.position.x, paddle.position.y, paddle.size.x, paddle.size.y);
        ctx.fillStyle = "#EAF33A";
        ctx.fill();
        ctx.closePath();
    }, 

    startFire(){
        if (this.fire) return;
        this.fire = true;
        // повторить с интервалом 2 секунды
        let fire = setInterval(() => {
            var b = new bullet({x:this.position.x + this.size.x/2, y:this.position.y});
            b.updateFields();
            game.bullets.push(b);
        }, 500);

        // остановить вывод через 5 секунд
        setTimeout(() => { clearInterval(fire); this.fire = false; }, 6000);
    }
}

function bullet(pos) {
    this.speedRatio = 1;
    this.speed = config.w + config.h;
    this.widthRatio = 1;
    this.heightRatio = 3;
    this.width = 1 * config.w;
    this.height = 1 * config.h;

    this.position = {
        x: pos.x - this.width/2,
        y: pos.y
    },

    this.updateFields = function(){
        this.width = config.w * this.widthRatio;
        this.height = config.h * this.height;
        this.speed = (config.w + config.h) * this.speedRatio; // Скорость зависит от размера карты
    },

    this.update = function(){
        this.position.y -= this.speed;
        this.collisionDetection();
    },

    this.collisionDetection = function(){
        if (this.position.y < 0) game.bullets.splice(game.bullets.indexOf(this), 1);
        for (let i = 0; i < levelManager.currentLevel.length; i++) {
            var brick = levelManager.currentLevel[i];
            var xPos = (brick.x * levelManager.brickWidth) + (levelManager.brickPaddingX * brick.x) + levelManager.brickOffsetLeft;
            var yPos = (brick.y * levelManager.brickHeight) + (levelManager.brickPaddingY * brick.y) + levelManager.brickOffsetTop;
            
            var nbrick = {x: xPos, y: yPos, width: levelManager.brickWidth, height: levelManager.brickHeight};
            
            if (isInside(this.position, nbrick)){
                if (--brick.health == 0)
                {
                    levelManager.currentLevel.splice(i,1); // Вынести в гейм
                    if (randomRange(0, game.bonusProbability) == 0){ // Создаём bonus
                        var b = new bonus({x: xPos + levelManager.brickWidth/2, y: yPos});
                        b.updateFields();
                        game.bonuses.push(b); 
                    }
                    
                    if (levelManager.currentLevel.length === 0)
                    {
                        render();
                        game.changeState(GameStates.WIN);
                    }
                }
                game.bullets.splice(game.bullets.indexOf(this), 1);
            }
        }
    },
    this.render = function(){
        drawRect({x: this.position.x, y: this.position.y}, {x: this.width, y: this.height}, "#d13131");
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

    currentLevelID: 0,      // ID текущей карты
    currentLevel: [],
    levels: [],             // Храним распарсенные карты
    isLoad: false,
    
    updateFields(){
        levelManager.brickPaddingX = config.w * 0.26; // в процентах
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
    initializationMaps(objLevels){
        for (let i = 0; i < objLevels.length; i++) // Добавляем кирпичикам показатель здоровья
        { 
            for (let j = 0; j < objLevels[i].length; j++) 
            {
                objLevels[i][j].health = levelManager.healthBlock[objLevels[i][j].t];

            }
        }
        levelManager.levels = objLevels;
    },

    loadMap(levelId){
        levelManager.currentLevelID = levelId;
        var curLevel = levelManager.levels[levelManager.currentLevelID];
        var bricks = [];
        for (let i = 0; i < curLevel.length; i++) {
            bricks.push(Object.create(curLevel[i]));
        }
        levelManager.currentLevel = bricks;
        levelManager.isLoad = true;

        levelCounter.innerHTML = "УРОВЕНЬ: " + (levelId+1);
    },

    render() 
    {
        if (!levelManager.isLoad) return;
        for (let i = 0; i < levelManager.currentLevel.length; i++) 
        {
            var brick = levelManager.currentLevel[i];
            var xPos = brick.x * levelManager.brickWidth + levelManager.brickPaddingX * brick.x + levelManager.brickOffsetLeft;
            var yPos = brick.y * levelManager.brickHeight + levelManager.brickPaddingY * brick.y + levelManager.brickOffsetTop;
            drawRect({x:xPos, y:yPos}, {x: levelManager.brickWidth, y: levelManager.brickHeight}, levelManager.colorsBlock["element"+brick.health]);
        }
    }
}

function bonus(pos) {
    this.speedRatio = 0.1;
    this.speed = config.w + config.h;
    this.widthRatio = 3;
    this.width = 1 * config.w;
    this.type = 0,

    this.position = {
        x: pos.x - this.width/2,
        y: pos.y
    },

    this.updateFields = function(){
        this.width = config.w * this.widthRatio;
        this.speed = (config.w + config.h) * this.speedRatio; // Скорость зависит от размера карты
    },

    this.update = function(){
        this.position.y += this.speed;
        this.collisionDetection();
    },

    this.collisionDetection = function(){
        if (this.position.y + this.width >= canvas.height){
            game.bonuses.splice(game.bonuses.indexOf(this), 1);
        }
        if (this.position.y + this.width >= canvas.height - paddle.size.y &&
            this.position.x + this.width > paddle.position.x &&
            this.position.x < paddle.position.x + paddle.size.x)
        {
            switch (this.type) {
                case 0:
                    game.bonuses.splice(game.bonuses.indexOf(this), 1);
                    paddle.startFire();
                    break;
            }
        }
    },
    this.render = function(){
        drawRect({x: this.position.x, y: this.position.y}, {x: this.width, y: this.width}, "#31af2e");
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
    if (game.currentState != GameStates.READYTOPLAY &&
        game.currentState != GameStates.PLAY) return;
    
    control.update();
    paddle.update();
    game.balls.forEach(b => b.update());
    game.bonuses.forEach(b => b.update());
    game.bullets.forEach(b => b.update());
}

function render() {
    if (game.currentState != GameStates.READYTOPLAY &&
        game.currentState != GameStates.PLAY &&
        game.currentState != GameStates.PAUSE) return;
    clearCanvas();
    game.balls.forEach(b => b.render());
    game.bonuses.forEach(b => b.render());
    game.bullets.forEach(b => b.render());
    paddle.render();
    levelManager.render();
}