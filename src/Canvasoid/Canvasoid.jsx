import React, { useEffect, useRef, useState } from "react"

class FunctionPlot {
    constructor(graph, func, color) {
        this.graph = graph
        this.function = func
        this.color = color
    }

    draw({ canvas, context }) {
        context.lineWidth = 4
        context.strokeStyle = this.color

        const step = 1 / this.graph.scaleAB
        let first = true
        let lastPoint = null

        context.beginPath()

        for (let bx = this.graph.a2b({ x: 0, y: 0 }).x; bx <= this.graph.a2b({ x: canvas.width, y: 0 }).x; bx += step) {
            const by = -this.function(bx)
            const aPoint = this.graph.b2a({ x: bx, y: by })

            // discontinuity
            if (lastPoint && Math.abs(aPoint.y - lastPoint.y) > canvas.height) {
                first = true
            }

            if (first) {
                context.moveTo(aPoint.x, aPoint.y)
                first = false
            } else {
                context.lineTo(aPoint.x, aPoint.y)
            }

            lastPoint = aPoint
        }

        context.stroke()
    }
}

class Graph {
    constructor(canvas) {
        this.zoom = -0.625
        this.origin = { x: canvas.width / 2, y: canvas.height / 2, tempX: 0, tempY: 0 }
        this.isDragging = false
        this.objects = []
        this.colors = ["#EF233C", "#279AF1", "#FFD639", "#00AF54", "#303030"]
    }

    get scaleAB() {
        return 256 * 10 ** this.zoom
    }

    addFunction = (f) => {
        this.objects.push(new FunctionPlot(this, f, this.colors[this.objects.length % this.colors.length]))
    }

    startDrag = (mouseX, mouseY) => {
        this.isDragging = true
        this.origin.tempX = mouseX
        this.origin.tempY = mouseY
    }

    drag = (mouseX, mouseY) => {
        if (!this.isDragging) return
        this.origin.x += mouseX - this.origin.tempX
        this.origin.y += mouseY - this.origin.tempY
        this.origin.tempX = mouseX
        this.origin.tempY = mouseY
    }

    stopDrag = () => {
        this.isDragging = false
    }

    smoothZoom = (mouseX, mouseY, delta) => {
        const zoomFactor = delta > 0 ? -1 / 16 : 1 / 16
        const newZoom = Math.max(-3, Math.min(3, this.zoom + zoomFactor))

        if (newZoom === this.zoom) return // Prevent unnecessary updates

        // Convert mouse position from screen (a-coordinates) to graph (b-coordinates)
        const bMouseBefore = this.a2b({ x: mouseX, y: mouseY })

        // Apply the zoom change
        this.zoom = newZoom

        // Convert back to screen coordinates after zoom change
        const aMouseAfter = this.b2a(bMouseBefore)

        // Adjust origin so that the point under the cursor stays in place
        this.origin.x += mouseX - aMouseAfter.x
        this.origin.y += mouseY - aMouseAfter.y
    }

    draw = (canvas, context) => {
        context.clearRect(0, 0, canvas.width, canvas.height)

        /**
         * grid lines
         */
        context.lineWidth = 1
        context.strokeStyle = "#f0f0f0"

        const { x: bXMin, y: bYMin } = this.a2b({ x: 0, y: 0 })
        const { x: bXMax, y: bYMax } = this.a2b({ x: canvas.width, y: canvas.height })

        // vertical
        for (let bx = Math.floor(bXMin); bx < Math.ceil(bXMax); bx++) {
            const ax = this.b2a({ x: bx, y: 0 }).x
            context.beginPath()
            context.moveTo(ax, 0)
            context.lineTo(ax, canvas.height)
            context.stroke()
        }

        // horizontal
        for (let by = Math.floor(bYMin); by < Math.ceil(bYMax); by++) {
            const ay = this.b2a({ x: 0, y: by }).y
            context.beginPath()
            context.moveTo(0, ay)
            context.lineTo(canvas.width, ay)
            context.stroke()
        }

        /**
         * origin lines
         */
        context.lineWidth = 2
        context.strokeStyle = "#d0d0d0"

        // vertical
        context.beginPath()
        context.moveTo(this.origin.x, 0)
        context.lineTo(this.origin.x, canvas.height)
        context.stroke()

        // horizontal
        context.beginPath()
        context.moveTo(0, this.origin.y)
        context.lineTo(canvas.width, this.origin.y)
        context.stroke()

        /**
         * numbers
         */
        context.font = "16px Inter"
        context.fillStyle = "#b0b0b0"

        context.textAlign = "center"
        context.textBaseline = "middle"

        for (let bx = Math.floor(bXMin); bx < Math.ceil(bXMax); bx++) {
            const ax = this.b2a({ x: bx, y: 0 }).x
            if (bx != 0) context.fillText(bx.toString(), ax, Math.max(Math.min(this.origin.y + 16, canvas.height - 16), 16))
        }

        for (let by = Math.floor(bYMin); by < Math.ceil(bYMax); by++) {
            const ay = this.b2a({ x: 0, y: by }).y
            if (by != 0) context.fillText((-by).toString(), Math.max(Math.min(this.origin.x + 16, canvas.width - 16), 16), ay)
        }

        // objects
        this.objects.forEach((object, i) => {
            object.draw({ canvas, context, color: this.colors[i % this.colors.length] })
        })
    }

    a2b = (a) => ({
        x: (a.x - this.origin.x) / this.scaleAB,
        y: (a.y - this.origin.y) / this.scaleAB
    })

    b2a = (b) => ({
        x: b.x * this.scaleAB + this.origin.x,
        y: b.y * this.scaleAB + this.origin.y
    })
}

const Canvasoid = () => {
    const canvasRef = useRef()
    const [userInput, setUserInput] = useState("sin(x)")
    const [graph, setGraph] = useState(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        canvas.width = canvas.getBoundingClientRect().width
        canvas.height = canvas.getBoundingClientRect().height

        window.addEventListener("resize", () => {
            canvas.width = canvas.getBoundingClientRect().width
            canvas.height = canvas.getBoundingClientRect().height
        })

        let tickID
        const newGraph = new Graph(canvas)
        setGraph(newGraph)

        const tick = () => {
            newGraph.draw(canvas, context)
            tickID = requestAnimationFrame(tick)
        }
        tick()

        const onMouseDown = (event) => {
            newGraph.startDrag(event.clientX, event.clientY)
        }

        const onMouseMove = (event) => {
            if (newGraph.isDragging) {
                event.preventDefault() // Prevents text selection
                newGraph.drag(event.clientX, event.clientY)
            }
        }

        const onMouseUp = () => {
            newGraph.stopDrag()
        }

        const onWheel = (event) => {
            event.preventDefault()
            newGraph.smoothZoom(event.clientX - canvas.getBoundingClientRect().x, event.clientY - canvas.getBoundingClientRect().y, event.deltaY)
        }

        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        canvas.addEventListener("wheel", onWheel)

        return () => {
            cancelAnimationFrame(tickID)
            canvas.removeEventListener("mousedown", onMouseDown)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
            canvas.removeEventListener("wheel", onWheel)
        }
    }, [])

    const handleFunctionChange = () => {
        if (!graph) return

        try {
            const safeExpression = parseMathExpression(userInput)
            const userFunction = new Function("x", `return ${safeExpression}`)
            graph.addFunction(userFunction, "#ffd639")
        } catch (e) {
            alert("Invalid function")
        }
    }

    return (
        <div className="mirror">
            <div className="reflection">
                <input type="text" placeholder="f(x)" value={userInput} onChange={(e) => setUserInput(e.target.value)} />
                <button onClick={handleFunctionChange}>Plot</button>
            </div>
            <canvas className="canvasoid" ref={canvasRef}></canvas>
        </div>
    )
}

export default Canvasoid
