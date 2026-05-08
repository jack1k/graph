import React, { useState, useRef, useEffect } from "react"
import Graph from "./Graph"

const Aqua = () => {
    const canvasRef = useRef()
    const [userInput, setUserInput] = useState("")
    const [graph, setGraph] = useState(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        // graph

        const graphZero = new Graph({ canvas, context })
        setGraph(graphZero)

        // canvas size

        canvas.width = canvas.getBoundingClientRect().width
        canvas.height = canvas.getBoundingClientRect().height
        graphZero.dirty = true
        graphZero.originTo(canvas.width / 2, canvas.height / 2)

        window.addEventListener("resize", () => {
            canvas.width = canvas.getBoundingClientRect().width
            canvas.height = canvas.getBoundingClientRect().height
            graphZero.dirty = true
        })

        // tick

        let rafID

        const tick = () => {
            graphZero.tick()
            rafID = requestAnimationFrame(tick)
        }
        tick()

        // events

        const onMouseDown = (event) => { graphZero.startDrag(event.clientX, event.clientY) }
        const onMouseMove = (event) => {
            if (!graphZero.isDragging) return
            event.preventDefault()
            graphZero.drag(event.clientX, event.clientY)
        }
        const onMouseUp = () => { graphZero.stopDrag() }

        const onWheel = (event) => {
            event.preventDefault()
            graphZero.zoomIt(event.clientX, event.clientY, event.deltaY)
        }

        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        canvas.addEventListener("wheel", onWheel)

        // unsubscribe

        return () => {
            cancelAnimationFrame(rafID)
            canvas.removeEventListener("mousedown", onMouseDown)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
            canvas.removeEventListener("wheel", onWheel)
        }
    }, [])

    const handleFunction = () => {
        if (!graph) return

        const a = Math.random() + 1
        const b = Math.random() + 1
        const c = Math.random() * Math.PI * 2

        try {
            // graph.addF((x) => Math.sin(x / a + c) * b)

            graph.addF((x) => Math.sin(2 ** x))

        } catch (error) {
            alert("Invalid function")
        }
    }

    handleFunction()

    return (
        <div className="aqua">
            <canvas className="canvas" ref={canvasRef}></canvas>
        </div>
    )
}

export default Aqua
