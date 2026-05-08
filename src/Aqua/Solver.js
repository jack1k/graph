import { round, sign, max, abs } from "./functions"

export default class Solver {
    constructor() {}

    derivative = (f) => (x) => {
        const delta = max(1e-6, abs(x) * 1e-6)

        const x1 = x - delta
        const x2 = x + delta

        const y1 = f(x1)
        const y2 = f(x2)

        return round((y2 - y1) / (x2 - x1))
    }

    solve = (f) => {

    }

    stationaryPointsInRange = (f, minX, maxX) => {
        const g = this.derivative(f)
        const xValues = this.solutionsInRange(g, minX, maxX)
        return xValues.map(x => [x, -f(x)])
    }

    solutionsInRange = (f, minX, maxX) => {
        if (maxX <= minX) throw new Error("maxX must be greater than minX")

        const solutions = []
        const interval = (maxX - minX) * 0.01
        let prevY = f(minX - interval)

        for (let x = minX; x <= maxX; x += interval) {
            const y = f(x)
            if (y === 0) continue
            if (sign(y) != sign(prevY)) solutions.push(this.newtonRaphson(f, x))
            prevY = y
        }

        return solutions
    }

    //

    newtonRaphson = (f, startX) => {
        let x = startX

        for (let i = 0; i < 16; i++) {
            const newX = this.newtonRaphsonIteration(f, x)
            if (x == newX) break
            x = newX
        }

        return x
    }

    newtonRaphsonIteration = (f, x) => x - f(x) / this.derivative(f)(x)
}