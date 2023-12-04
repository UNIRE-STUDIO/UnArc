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

    // За левой гранью     и      перед правой гранью    и  за нижней гренью              и  перед верхней гранью
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y;
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

function moveTo(current, target, step){
    var moveStep = (target - current)/step;
    return current + moveStep;
}