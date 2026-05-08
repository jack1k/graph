import { sign, floor, ceil, max, min, clamp, log, round, abs } from "./functions"
import Solver from "./Solver"

class F {
    constructor({ graph, f, style, canvas, context }) {
        this.canvas = canvas
        this.context = context
        this.graph = graph
        this.f = f
        this.style = style

        this.solver = new Solver()
    }

    draw = () => {
        this.context.lineWidth = 4
        this.context.strokeStyle = this.style
        this.context.fillStyle = "#ffffff"

        const minX = this.graph.canvasXToGraphX(0)
        const maxX = this.graph.canvasXToGraphX(this.canvas.width)

        const canvasStep = 1
        const graphStep = canvasStep / this.graph.scale

        let first = true
        let lastY = null

        // plot

        this.context.beginPath()

        for (let graphX = minX; graphX < maxX + graphStep; graphX += graphStep) {
            const graphY = -this.f(graphX)
            const [canvasX, canvasY] = this.graph.graphToCanvas(graphX, graphY)

            // discontinuity
            if (lastY && abs(canvasY - lastY) > this.canvas.height) { first = true }

            if (first) {
                this.context.moveTo(canvasX, canvasY)
                first = false
            } else {
                this.context.lineTo(canvasX, canvasY)
            }

            lastY = canvasY
        }

        this.context.stroke()

        // y intercept

        this.context.beginPath()
        this.context.arc(...this.graph.graphToCanvas(0, - this.f(0)), 2, 0, Math.PI * 2)
        this.context.stroke()
        this.context.fill()

        // roots

        const roots = this.solver.solutionsInRange(this.f, minX, maxX)

        for (let i = 0; i < roots.length; i++) {
            this.context.beginPath()
            this.context.arc(...this.graph.graphToCanvas(roots[i], 0), 2, 0, Math.PI * 2)
            this.context.stroke()
            this.context.fill()
        }

        // stationary point

        const stationaryPoints = this.solver.stationaryPointsInRange(this.f, minX, maxX)

        for (let i = 0; i < stationaryPoints.length; i++) {
            this.context.beginPath()
            this.context.arc(...this.graph.graphToCanvas(...stationaryPoints[i]), 2, 0, Math.PI * 2)
            this.context.stroke()
            this.context.fill()
        }
    }
}

export default class Graph {
    constructor({ canvas, context }) {
        this.canvas = canvas
        this.context = context

        this.zoom = 0
        this.origin = { x: 0, y: 0, prevX: 0, prevY: 0 }
        this.isDragging = false
        this.objects = []
        this.objectColors = ["#00AF54", "#279AF1", "#EF233C", "#FFD639", "#303030"]

        this.dirty = true
        
        this.style = {
            grid: { width: 1, color: "#f0f0f0" },
            axes: { width: 2, color: "#d0d0d0" }
        }
    }

    // coordinates

    get scale() { return 256 * 10 ** this.zoom }

    canvasXToGraphX = (canvasX) => (canvasX - this.origin.x) / this.scale
    canvasYToGraphY = (canvasY) => (canvasY - this.origin.y) / this.scale
    graphXToCanvasX = (graphX) => graphX * this.scale + this.origin.x
    graphYToCanvasY = (graphY) => graphY * this.scale + this.origin.y
    canvasToGraph = (canvasX, canvasY) => [this.canvasXToGraphX(canvasX), this.canvasYToGraphY(canvasY)]
    graphToCanvas = (graphX, graphY) => [this.graphXToCanvasX(graphX), this.graphYToCanvasY(graphY)]

    originTo = (canvasX, canvasY) => {
        this.origin.x = canvasX
        this.origin.y = canvasY
    }

    // functions

    addF = (f) => {
        const style = this.objectColors[this.objects.length % this.objectColors.length]
        this.objects.push(new F({ graph: this, f: f, style: style, canvas: this.canvas, context: this.context}))

        this.dirty = true
    }
    
    // dragging

    startDrag = (mouseX, mouseY) => {
        this.isDragging = true
        this.origin.prevX = mouseX
        this.origin.prevY = mouseY
    }
    drag = (mouseX, mouseY) => {
        if (!this.isDragging) return

        this.origin.x += mouseX - this.origin.prevX
        this.origin.y += mouseY - this.origin.prevY
        this.origin.prevX = mouseX
        this.origin.prevY = mouseY

        this.dirty = true
    }
    stopDrag = () => {this.isDragging = false }

    // zooming

    zoomIt = (mouseX, mouseY, delta) => {
        const canvasX = mouseX - this.canvas.getBoundingClientRect().x
        const canvasY = mouseY - this.canvas.getBoundingClientRect().y

        const zoomIncrement = 1/16
        const deltaZoom = - zoomIncrement * sign(delta)
        const newZoom = clamp(-1, this.zoom + deltaZoom, 1)

        if (newZoom === this.zoom) return

        const graphMousePositionBefore = this.canvasToGraph(canvasX, canvasY)

        this.zoom = newZoom

        const canvasMousePositionAfter = this.graphToCanvas(...graphMousePositionBefore)

        this.origin.x += canvasX - canvasMousePositionAfter[0]
        this.origin.y += canvasY - canvasMousePositionAfter[1]

        this.dirty = true
    }

    // drawing

    drawHorizontalLine = (canvasY) => {
        this.context.beginPath()
        this.context.moveTo(0, canvasY)
        this.context.lineTo(this.canvas.width, canvasY)
        this.context.stroke()
    }

    drawVerticalLine = (canvasX) => {
        this.context.beginPath()
        this.context.moveTo(canvasX, 0)
        this.context.lineTo(canvasX, this.canvas.height)
        this.context.stroke()
    }

    drawGrid = () => {
        const [graphXMin, graphYMin] = this.canvasToGraph(0, 0)
        const [graphXMax, graphYMax] = this.canvasToGraph(this.canvas.width, this.canvas.height)

        // increment

        const graphCanvasHeight = (graphYMax - graphYMin) / 10
        const orderOfMagnitude = floor(log(10, graphCanvasHeight))
        const normalised = graphCanvasHeight / 10 ** orderOfMagnitude
        const increment = (normalised > 2 ? (normalised > 5 ? 5 : 2) : 1) * 10 ** orderOfMagnitude

        // grid lines

        this.context.lineWidth = this.style.grid.width
        this.context.strokeStyle = this.style.grid.color

        for (let graphX = - increment; graphX >= graphXMin - 1; graphX -= increment) { this.drawVerticalLine(this.graphXToCanvasX(graphX)) }
        for (let graphX = increment; graphX <= graphXMax + 1; graphX += increment) { this.drawVerticalLine(this.graphXToCanvasX(graphX)) }
        
        for (let graphY = - increment; graphY >= graphYMin - 1; graphY -= increment) { this.drawHorizontalLine(this.graphYToCanvasY(graphY)) }
        for (let graphY = increment; graphY <= graphYMax + 1; graphY += increment) { this.drawHorizontalLine(this.graphYToCanvasY(graphY)) }

        // axes

        this.context.lineWidth = this.style.axes.width
        this.context.strokeStyle = this.style.axes.color

        this.drawVerticalLine(this.graphXToCanvasX(0))
        this.drawHorizontalLine(this.graphYToCanvasY(0))

        // numeric axis labels

        this.context.font = "16px Inter"
        this.context.fillStyle = "#b0b0b0"
        this.context.textAlign = "center"
        this.context.textBaseline = "middle"

        for (let graphX = - increment; graphX >= graphXMin - 1; graphX -= increment) { 
            this.context.fillText(round(graphX).toString(), this.graphXToCanvasX(graphX), clamp(16, this.origin.y + 16, this.canvas.height - 16))
        }
        for (let graphX = increment; graphX <= graphXMax + 1; graphX += increment) {
            this.context.fillText(round(graphX).toString(), this.graphXToCanvasX(graphX), clamp(16, this.origin.y + 16, this.canvas.height - 16))
        }
        
        for (let graphY = - increment; graphY >= graphYMin - 1; graphY -= increment) {
            this.context.fillText((-round(graphY)).toString(), clamp(16, this.origin.x + 16, this.canvas.width - 16), this.graphYToCanvasY(graphY))
        }
        for (let graphY = increment; graphY <= graphYMax + 1; graphY += increment) {
            this.context.fillText((-round(graphY)).toString(), clamp(16, this.origin.x + 16, this.canvas.width - 16), this.graphYToCanvasY(graphY))
        }
    }

    draw = () => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.drawGrid()

        this.objects.forEach((object) => {
            object.draw()
        })
    }

    // tick

    tick = () => {
        if (this.dirty) {
            this.draw()
            this.dirty = false
        }
    }
}
