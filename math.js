function sq(x) {
    return x*x;
}

function Vector(x, y) {
    this.x = x;
    this.y = y;
    this.normalize = function(measure) {
        if ((this.x === 0) && (this.y === 0)) {
            if (measure === 0)
                return this;
            else
                throw 'vector of size 0 cannot be normalized to non-zero value';
        }
        const currentMeasure = this.measure();
        const x2 = (x * measure) / currentMeasure;
        const y2 = (y * measure) / currentMeasure;
        return new Vector(x2, y2);
    };
    this.measure = function() {
        return Math.sqrt(sq(x) + sq(y));
    };
    this.add = function(v) {
        return new Vector(this.x+v.x, this.y+v.y);
    };
    this.mul = function (scalar) {
        return new Vector(this.x*scalar, this.y*scalar);
    };
}


