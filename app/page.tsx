'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

export default function Home() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 }
    })
    engineRef.current = engine

    // Create renderer
    const render = Matter.Render.create({
      element: canvasRef.current,
      engine: engine,
      options: {
        width: 1200,
        height: 600,
        wireframes: false,
        background: '#87ceeb'
      }
    })

    // Create character parts (Pogo Stickman)
    const headRadius = 15
    const bodyHeight = 40
    const legLength = 30
    const pogoLength = 60

    // Head (circle)
    const head = Matter.Bodies.circle(100, 300, headRadius, {
      render: { fillStyle: '#ffdbac' },
      density: 0.001
    })

    // Body (rectangle)
    const body = Matter.Bodies.rectangle(100, 320, 8, bodyHeight, {
      render: { fillStyle: '#ff0000' },
      density: 0.001
    })

    // Upper leg
    const upperLeg = Matter.Bodies.rectangle(100, 350, 6, legLength, {
      render: { fillStyle: '#0000ff' },
      density: 0.001
    })

    // Lower leg (pogo stick)
    const lowerLeg = Matter.Bodies.rectangle(100, 390, 8, pogoLength, {
      render: { fillStyle: '#666' },
      density: 0.002,
      friction: 0.3
    })

    // Spring at bottom of pogo
    const spring = Matter.Bodies.circle(100, 420, 10, {
      render: { fillStyle: '#ff0000' },
      density: 0.005,
      restitution: 1.2,
      friction: 0.5
    })

    // Connect body parts with constraints
    const headToBody = Matter.Constraint.create({
      bodyA: head,
      bodyB: body,
      length: 5,
      stiffness: 0.6
    })

    const bodyToLeg = Matter.Constraint.create({
      bodyA: body,
      bodyB: upperLeg,
      length: 10,
      stiffness: 0.5
    })

    const legToPogo = Matter.Constraint.create({
      bodyA: upperLeg,
      bodyB: lowerLeg,
      length: 5,
      stiffness: 0.7
    })

    const pogoToSpring = Matter.Constraint.create({
      bodyA: lowerLeg,
      bodyB: spring,
      length: 0,
      stiffness: 0.9
    })

    // Ground and platforms
    const ground = Matter.Bodies.rectangle(400, 580, 800, 40, {
      isStatic: true,
      render: { fillStyle: '#8b4513' }
    })

    const platform1 = Matter.Bodies.rectangle(300, 450, 200, 20, {
      isStatic: true,
      render: { fillStyle: '#654321' }
    })

    const platform2 = Matter.Bodies.rectangle(550, 380, 150, 20, {
      isStatic: true,
      render: { fillStyle: '#654321' }
    })

    const platform3 = Matter.Bodies.rectangle(800, 320, 180, 20, {
      isStatic: true,
      render: { fillStyle: '#654321' }
    })

    const platform4 = Matter.Bodies.rectangle(1000, 250, 200, 20, {
      isStatic: true,
      render: { fillStyle: '#654321' }
    })

    // Obstacles (spikes)
    const spike1 = Matter.Bodies.polygon(450, 430, 3, 20, {
      isStatic: true,
      render: { fillStyle: '#ff0000' },
      label: 'spike'
    })

    const spike2 = Matter.Bodies.polygon(650, 360, 3, 20, {
      isStatic: true,
      render: { fillStyle: '#ff0000' },
      label: 'spike'
    })

    const spike3 = Matter.Bodies.polygon(900, 300, 3, 20, {
      isStatic: true,
      render: { fillStyle: '#ff0000' },
      label: 'spike'
    })

    // Goal flag
    const goalPole = Matter.Bodies.rectangle(1100, 190, 10, 100, {
      isStatic: true,
      render: { fillStyle: '#000' },
      label: 'goal'
    })

    const goalFlag = Matter.Bodies.rectangle(1130, 160, 60, 40, {
      isStatic: true,
      render: { fillStyle: '#00ff00' },
      label: 'goal'
    })

    // Add all bodies to world
    Matter.World.add(engine.world, [
      head, body, upperLeg, lowerLeg, spring,
      headToBody, bodyToLeg, legToPogo, pogoToSpring,
      ground, platform1, platform2, platform3, platform4,
      spike1, spike2, spike3,
      goalPole, goalFlag
    ])

    // Keyboard controls
    const keys: { [key: string]: boolean } = {}

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true
      if (!started && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ')) {
        setStarted(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Game loop
    Matter.Events.on(engine, 'beforeUpdate', () => {
      if (gameOver || won) return

      const torqueStrength = 0.0003
      const jumpForce = 0.015
      const horizontalForce = 0.002

      // Tilt forward/backward
      if (keys['ArrowRight']) {
        Matter.Body.applyForce(body, body.position, { x: horizontalForce, y: 0 })
        Matter.Body.rotate(body, torqueStrength * 2)
        Matter.Body.rotate(upperLeg, torqueStrength)
      }
      if (keys['ArrowLeft']) {
        Matter.Body.applyForce(body, body.position, { x: -horizontalForce, y: 0 })
        Matter.Body.rotate(body, -torqueStrength * 2)
        Matter.Body.rotate(upperLeg, -torqueStrength)
      }

      // Jump (pogo bounce)
      if (keys[' ']) {
        Matter.Body.applyForce(spring, spring.position, { x: 0, y: -jumpForce })
      }
    })

    // Collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair

        // Check if head hit spike
        if ((bodyA === head || bodyB === head) &&
            (bodyA.label === 'spike' || bodyB.label === 'spike')) {
          setGameOver(true)
        }

        // Check if reached goal
        if ((bodyA === head || bodyB === head) &&
            (bodyA.label === 'goal' || bodyB.label === 'goal')) {
          setWon(true)
        }
      })
    })

    // Run the engine and renderer
    Matter.Runner.run(engine)
    Matter.Render.run(render)

    return () => {
      Matter.Render.stop(render)
      Matter.Engine.clear(engine)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameOver, won, started])

  const restart = () => {
    setGameOver(false)
    setWon(false)
    setStarted(false)
    window.location.reload()
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '36px',
        marginBottom: '20px',
        color: '#333',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        Happy Wheels Clone - Pogo Stickman
      </h1>

      {!started && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          zIndex: 100
        }}>
          <h2 style={{ marginBottom: '15px' }}>Controls</h2>
          <p style={{ marginBottom: '10px' }}><strong>Arrow Left/Right:</strong> Tilt & Move</p>
          <p style={{ marginBottom: '20px' }}><strong>Spacebar:</strong> Bounce/Jump</p>
          <p style={{ fontSize: '18px', color: '#666' }}>Press any control key to start!</p>
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center',
          zIndex: 100
        }}>
          <h2 style={{ color: 'white', fontSize: '48px', marginBottom: '20px' }}>WASTED!</h2>
          <button
            onClick={restart}
            style={{
              padding: '15px 30px',
              fontSize: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Restart
          </button>
        </div>
      )}

      {won && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 255, 0, 0.9)',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center',
          zIndex: 100
        }}>
          <h2 style={{ color: 'white', fontSize: '48px', marginBottom: '20px' }}>YOU WIN!</h2>
          <button
            onClick={restart}
            style={{
              padding: '15px 30px',
              fontSize: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Play Again
          </button>
        </div>
      )}

      <div ref={canvasRef} style={{ border: '3px solid #333', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }} />

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '8px',
        maxWidth: '800px'
      }}>
        <p style={{ marginBottom: '10px' }}><strong>Objective:</strong> Guide Pogo Stickman to the green flag!</p>
        <p><strong>Warning:</strong> Avoid the red spikes - they're deadly!</p>
      </div>
    </main>
  )
}
