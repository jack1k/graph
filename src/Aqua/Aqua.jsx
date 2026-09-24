import React, { useState, useRef, useEffect, useMemo } from "react"
import Graph from "./Graph"
import { f } from "../f"

const Aqua = () => {
    const canvasRef = useRef()
    const [userInput, setUserInput] = useState("")
    const [graph, setGraph] = useState(null)
    const [activeIds, setActiveIds] = useState([])

    const toggleFunction = (fn, id, checked) => {
        if (!graph) return

        try {
            if (checked) graph.addF(fn, id)
            else graph.removeF(id)
            setActiveIds(graph.objects.map(o => o.id))   // this triggers the re-render
        } catch (error) {
            alert("Invalid function")
        }
    }

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

    useEffect(() => {
        toggleFunction(f["e^x"], "e^x", true)
        toggleFunction(f["log(x)"], "log(x)", true)
        toggleFunction(f["sin(x)"], "sin(x)", true)
        toggleFunction(f["cos(x)"], "cos(x)", true)
    }, [graph])

    return (
        <div className="aqua">
            <canvas className="canvas" ref={canvasRef}></canvas>
            <div className="box">
                {Object.entries(f).map(([key, value]) => <label key={key}>
                    <input
                        type="checkbox"
                        checked={activeIds.includes(key)}
                        onChange={(e) => toggleFunction(value, key, e.target.checked)}
                    />
                    <p>{key}</p>
                </label>)}
            </div>
        </div>
    )
}

export default Aqua
