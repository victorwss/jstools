if (!Object.prototype.checkFinal) {
    Object.prototype.checkFinal = function checkFinal(myClass) {
        if (this.constructor !== myClass) throw new TypeError(`The class ${myClass.name} isn't extensible.`);
    };
}

if (!Object.prototype.checkAbstract) {
    Object.prototype.checkAbstract = function checkAbstract(myClass) {
        if (this.constructor === myClass) throw new TypeError(`The class ${myClass.name} is abstract.`);
    };
}

if (NodeList) {

    if (!NodeList.prototype.at) {
        NodeList.prototype.at = function filter(...params) {
            return [...this].at(...params);
        };
    }

    if (!NodeList.prototype.includes) {
        NodeList.prototype.includes = function filter(...params) {
            return [...this].includes(...params);
        };
    }

    if (!NodeList.prototype.find) {
        NodeList.prototype.find = function filter(...params) {
            return [...this].find(...params);
        };
    }

    if (!NodeList.prototype.findIndex) {
        NodeList.prototype.findIndex = function filter(...params) {
            return [...this].findIndex(...params);
        };
    }

    if (!NodeList.prototype.findLast) {
        NodeList.prototype.findLast = function filter(...params) {
            return [...this].findLast(...params);
        };
    }

    if (!NodeList.prototype.findLastIndex) {
        NodeList.prototype.findLastIndex = function filter(...params) {
            return [...this].findLastIndex(...params);
        };
    }

    if (!NodeList.prototype.every) {
        NodeList.prototype.every = function every(...params) {
            return [...this].every(...params);
        };
    }

    if (!NodeList.prototype.some) {
        NodeList.prototype.some = function some(...params) {
            return [...this].some(...params);
        };
    }

    if (!NodeList.prototype.map) {
        NodeList.prototype.map = function map(...params) {
            return [...this].map(...params);
        };
    }

    if (!NodeList.prototype.filter) {
        NodeList.prototype.filter = function filter(...params) {
            return [...this].filter(...params);
        };
    }

    if (!NodeList.prototype.reduce) {
        NodeList.prototype.reduce = function filter(...params) {
            return [...this].reduce(...params);
        };
    }

    if (!NodeList.prototype.reduceRight) {
        NodeList.prototype.reduceRight = function filter(...params) {
            return [...this].reduceRight(...params);
        };
    }

    if (!NodeList.prototype.slice) {
        NodeList.prototype.slice = function filter(...params) {
            return [...this].slice(...params);
        };
    }

    if (!NodeList.prototype.toReversed) {
        NodeList.prototype.toReversed = function filter(...params) {
            return [...this].toReversed(...params);
        };
    }

    if (!NodeList.prototype.toSpliced) {
        NodeList.prototype.toSpliced = function filter(...params) {
            return [...this].toSpliced(...params);
        };
    }
}
