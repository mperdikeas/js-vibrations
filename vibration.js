const S = 260; // width and height of canvas
const PADDING = 30;
const N = 50;

// physics simulation default parameters
let DEFAULTS = {
    MASS: 3,
    KAPPA: 0.2,
    DAMPING: 0.01
};

const massInput      = document.getElementById('mass-i');
const massDisplay    = document.getElementById('mass-d');
const kappaInput     = document.getElementById('kappa-i');
const kappaDisplay   = document.getElementById('kappa-d');
const dampingInput   = document.getElementById('damping-i');
const dampingDisplay = document.getElementById('damping-d');


// physics simulation live parameters
let MASS    = DEFAULTS.MASS;
let KAPPA   = DEFAULTS.KAPPA;
let DAMPING = DEFAULTS.DAMPING;

function restoreDefaults() {
    MASS    = DEFAULTS.MASS;
    KAPPA   = DEFAULTS.KAPPA;
    DAMPING = DEFAULTS.DAMPING;
    massInput.value         = MASS;
    massDisplay.textContent = MASS;
    kappaInput.value         = KAPPA;
    kappaDisplay.textContent = KAPPA;
    dampingInput.value         = DAMPING;
    dampingDisplay.textContent = DAMPING;
}

restoreDefaults();

massInput.addEventListener('input', function() {
    MASS = massInput.value;
    massDisplay.textContent = MASS;
});


kappaInput.addEventListener('input', function() {
    KAPPA = kappaInput.value;
    kappaDisplay.textContent = KAPPA;
});

dampingInput.addEventListener('input', function() {
    DAMPING = dampingInput.value;
    dampingDisplay.textContent = DAMPING;
});
    

          
function assert(cond, msg) {
    if (!cond)
        throw msg;
}

const distance = (S-2*PADDING) / (N - 1);
const diagonal = Math.sqrt(2*sq(distance));
let balls = [];

function springForceMeasure(isDiagonal, distance2) {
    const springDistanceAtRest = isDiagonal?diagonal:distance;
    // if the distance has been shortened produce a negative value (spring pushes back)
    const rv = (distance2 - springDistanceAtRest) * KAPPA;
    return rv;
}

function Ball(i, j) {
    this.radius = 1;
    this.i = i;
    this.j = j;
    this.dx = 0;
    this.dy = 0;
    this.vx = 0; // velocity
    this.vy = 0;
    this.px = function() {
        return ( (S - 2*PADDING) * i ) / (N-1) + PADDING + this.dx;
    };
    this.py = function() {
        return ( (S - 2*PADDING) * j ) / (N-1) + PADDING + this.dy;
    };
    this.paint = function(ctx) {
        ctx.beginPath();
        if ((this.i===N-1) && (this.j===N-1))
            ctx.strokeStyle='red';
        else if ( (((N-1)-i) + ((N-1)-j)) % 10 == 0)
            ctx.strokeStyle = 'green';
        else
            ctx.strokeStyle='black';
        ctx.ellipse(this.px(), this.py(), this.radius, this.radius, 0, 0, 2*Math.PI);
        ctx.stroke();
    };
    this.idxij = function(i, j) {
        return i*N+j;
    };
    this.idx = function() {
        return this.idxij(this.i, this.j);
    };
    this.idxNorth = function() {
        if (this.i === 0)
            return null;
        else
            return this.idxij(this.i - 1, this.j);
    };
    this.idxNE = function() {
        if (this.i === 0)
            return null;
        else if (this.j === N-1)
            return null;
        else
            return this.idxij(this.i - 1, this.j + 1);        
    };
    this.idxEast = function() {
        if (this.j === N-1)
            return null;
        else
            return this.idxij(this.i, this.j + 1);
    };
    this.idxSE = function() {
        if (this.i === N-1)
            return null;
        else if (this.j === N-1)
            return null;
        else
            return this.idxij(this.i + 1, this.j + 1);
    };
    this.idxSouth = function() {
        if (this.i === N-1)
            return null;
        else
            return this.idxij(this.i + 1, this.j);
    };
    this.idxSW = function() {
        if (this.i === N-1)
            return null;
        else if (this.j === 0)
            return null;
        else
            return this.idxij(this.i + 1, this.j - 1);
    };
    this.idxWest = function() {
        if (this.j === 0)
            return null;
        else
            return this.idxij(this.i, this.j - 1);
    };
    this.idxNW = function() {
        if (this.i === 0)
            return null;
        else if (this.j === 0)
            return null;
        else
            return this.idxij(this.i - 1, this.j - 1);
    };
    this.vectorTo = function(indx) {
        const pxN = balls[indx].px();
        const pyN = balls[indx].py();
        return (new Vector(pxN - this.px(), -(pyN - this.py())  )); // the y coordinates is upside down because computer graphics
    };
    this.force = function(direction) {
        const idxN = this['idx'+direction]();
        if (idxN===null) {
            return new Vector(0, 0);
        } else {
            const diagonals = ['NE', 'SE', 'SW', 'NW'];
            const springLength = this.vectorTo(idxN).measure();
            const forceMeasure = springForceMeasure(diagonals.indexOf(direction)!==-1, springLength);
            const rv = this.vectorTo(idxN).normalize(forceMeasure);
            return rv;
        }
    };
    this.sumOfForces = function() {
        return this.force('North')
            .add(this.force('NE'))
            .add(this.force('East'))
            .add(this.force('SE'))
            .add(this.force('South'))
            .add(this.force('SW'))
            .add(this.force('West'))
            .add(this.force('NW'));
    };
    this.applyAcceleration = function(g) {
        this.vx += g.x;
        this.vy += g.y;
    };
    this.move = function(n) {
        if ((this.i === N-1) && (this.j === N-1)) {
            const CYCLE = 40;
            const AMPLITUDE = 15;
            const PHASE_CUTOFF = 0.5;
            const increasing = ((n % CYCLE) < CYCLE*PHASE_CUTOFF)?true:false;
            const stepIncreasing =  AMPLITUDE/(CYCLE*PHASE_CUTOFF);
            const stepDecreasing = -AMPLITUDE/(CYCLE*(1-PHASE_CUTOFF));
            const step = increasing?stepIncreasing:stepDecreasing;
            this.dx += step;
            this.dy += step;
        } else {
            this.dx += this.vx;
            this.dy -= this.vy; // y coordinate is upside-down because computer graphics

            // damping - E=(1/2)*m*v^2 => v = Math.sqrt ( 2*E / m )
            const currentEnergy = 0.5*MASS*(sq(this.vx)+sq(this.vy));
            const newEnergy = (1-DAMPING)*currentEnergy;
            const newVelocityMeasure = Math.sqrt( (2*newEnergy) / MASS );
            const currentVelocity = new Vector(this.vx, this.vy);
            const newVelocity = currentVelocity.normalize(newVelocityMeasure);
            this.vx = newVelocity.x;
            this.vy = newVelocity.y;
        }
    };
}




// initialization
const canvas = document.getElementById('canvas');
canvas.width = S;
canvas.height = S;
const ctx = canvas.getContext('2d');

function init() {
    balls = [];
    for (let i = 0; i < N ; i++) {
        for (let j = 0; j < N; j++) {
            const ball = new Ball(i, j);
            assert(ball.idx()===balls.length, 'ball at ['+i+':'+j+'] was evaluated at idx ['+ball.idx()+']');
            balls.push(ball);
        }
    }
    for (let b = 0; b < balls.length; b++)
        balls[b].paint(ctx);
}



let n = 0;
function life() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('tick').textContent = n;
    for (let b = 0; b < balls.length; b++) {
        const forceOnBall = balls[b].sumOfForces();
        const accelerationOnBall = forceOnBall.mul(1/MASS);
        balls[b].applyAcceleration(accelerationOnBall);
    }
    for (let b = 0; b < balls.length; b++) {
        balls[b].move(n);
        balls[b].paint(ctx);
    }
    n += 1;
}


let intervalId = null;

let paused = false;

function springToLife() {
    intervalId = window.setInterval(life, 50);
    paused = false;
}

init();
springToLife();

const btnPauseRes = document.getElementById('btn-pauseres');

function restart() {
    n = 0;
    window.clearInterval(intervalId);
    init();
    springToLife();
}

function pauseResume() {
    if (paused) {
        springToLife();
        btnPauseRes.value = 'pause';
    } else {
        window.clearInterval(intervalId);
        paused = true;
        btnPauseRes.value = 'resume';
    }
}

function manualStep() {
    window.clearInterval(intervalId);
    paused = true;
    btnPauseRes.value = 'resume';
    life();
}


