// src/components/PlayerPickerModal.jsx
import React, { useState, useEffect, useRef } from 'react'
import * as tf from '@tensorflow/tfjs-core'
import * as poseDetection from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'
import '../App.css'   // make sure your CSS is imported

export default function PlayerPickerModal({ file, onConfirm, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [detector, setDetector] = useState(null)
  const [duration, setDuration] = useState(0)
  const [selectedTime, setSelectedTime] = useState(0)
  const [poses, setPoses] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(null)  // null until user picks

  // 1) Init TF + detector
  useEffect(() => {
    tf.setBackend('webgl').then(() => tf.ready()).then(() =>
      poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: 'MultiPose.Lightning' }
      ).then(det => setDetector(det))
    )
  }, [])

  // 2) Load video meta
  useEffect(() => {
    const v = videoRef.current
    v.src = URL.createObjectURL(file)
    v.onloadedmetadata = () => setDuration(v.duration)
  }, [file])

  // 3) Re-run detection whenever time or detector changes
  useEffect(() => {
    if (!detector) return
    let cancelled = false
    const run = async () => {
      const v = videoRef.current
      v.currentTime = selectedTime
      await new Promise(r => (v.onseeked = r))
      const results = await detector.estimatePoses(v)
      if (!cancelled) {
        console.log('Detected poses:', results.length)
        setPoses(results)
        draw(results)
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedTime, detector])

  const draw = (allPoses) => {
  const c = canvasRef.current
  const v = videoRef.current
  const ctx = c.getContext('2d')
  ctx.clearRect(0,0,c.width,c.height)
  ctx.drawImage(v,  0,0,c.width,c.height)

  allPoses.forEach((p, i) => {
    const isSel = i === selectedIndex
    // choose color
    ctx.strokeStyle = isSel ? 'lime' : 'yellow'
    ctx.fillStyle   = isSel ? 'lime' : 'red'
    ctx.lineWidth   = isSel ? 3 : 1

    // draw all keypoints
    p.keypoints.forEach(kp => {
      if (kp.score > 0.4) {
        const px = (kp.x / v.videoWidth)  * c.width
        const py = (kp.y / v.videoHeight) * c.height
        ctx.beginPath()
        ctx.arc(px, py, isSel ? 6 : 4, 0, 2*Math.PI)
        ctx.fill()
      }
    })

    // draw skeleton lines
    poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet)
      .forEach(([i1, i2]) => {
        const k1 = p.keypoints[i1], k2 = p.keypoints[i2]
        if (k1.score > 0.4 && k2.score > 0.4) {
          ctx.beginPath()
          ctx.moveTo((k1.x/v.videoWidth)*c.width,  (k1.y/v.videoHeight)*c.height)
          ctx.lineTo((k2.x/v.videoWidth)*c.width,  (k2.y/v.videoHeight)*c.height)
          ctx.stroke()
        }
      })

    // label index
    ctx.font = isSel ? '20px Arial' : '16px Arial'
    ctx.fillText(`P${i+1}`, 10 + i*50, 20)
  })
}


  // 4) Handlers with debug logs
  const pick = () => {
    console.log('That’s me clicked, index =', selectedIndex)
    if (selectedIndex == null) return alert('Pick a player first!')
    onConfirm(selectedIndex)
  }
  const cancel = () => {
    console.log('Cancel clicked')
    onCancel()
  }
  const onSelect = (i) => {
    console.log('Radio change, selectedIndex =', i)
    setSelectedIndex(i)
  }

  const formatTime = (t) => {
    const m = Math.floor(t/60)
    const s = String(Math.floor(t%60)).padStart(2,'0')
    return `${m}:${s}`
  }

  // Called when user clicks on the canvas
const onCanvasClick = (e) => {
  const canvas = canvasRef.current
  const rect = canvas.getBoundingClientRect()
  // Translate click to canvas coords
  const x = ((e.clientX - rect.left) / rect.width)  * canvas.width
  const y = ((e.clientY - rect.top)  / rect.height) * canvas.height

  // Find the pose whose mean keypoint position is closest to (x,y)
  let best = { idx: null, dist: Infinity }
  poses.forEach((pose, i) => {
    const pts = pose.keypoints.filter(kp => kp.score > 0.4)
    if (pts.length === 0) return
    // average the keypoints
    const avg = pts.reduce((sum, kp) => ({
      x: sum.x + kp.x * (canvas.width / videoRef.current.videoWidth),
      y: sum.y + kp.y * (canvas.height/ videoRef.current.videoHeight)
    }), { x:0, y:0 })
    avg.x /= pts.length
    avg.y /= pts.length

    // distance to click
    const dx = avg.x - x
    const dy = avg.y - y
    const d2 = dx*dx + dy*dy
    if (d2 < best.dist) best = { idx: i, dist: d2 }
  })

  if (best.idx !== null) {
    console.log('Canvas picked index:', best.idx)
    setSelectedIndex(best.idx)
    // redraw so highlight updates
    draw(poses)
  }
}


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Select Your Player</h3>
        <p className="picker-instruction">
  Drag the slider to a frame where you’re fully visible, then click your skeleton below.
</p>

        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="picker-canvas"
          style={{ cursor: 'pointer' }}
        />

        <div className="form-section">
          <label>
            Frame time: {formatTime(selectedTime)}
          </label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={selectedTime}
            onChange={e => setSelectedTime(+e.target.value)}
            className="player-picker-range"
          />
        </div>

        <div className="form-section player-picker-radio">
        <div className="section-title">Who are you?</div>
          {poses.map((_, i) => (
            <label key={i} style={{ marginRight: '1rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="playerIndex"
                value={i}
                checked={selectedIndex === i}
                onChange={() => onSelect(i)}
              />
              Player {i+1}
            </label>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className="btn-small btn-outline" onClick={pick}>
            That’s me
          </button>
          <button className="btn-small btn-outline" onClick={cancel} style={{ marginLeft:'0.5rem' }}>
            Cancel
          </button>
        </div>

        {/* hidden video for offscreen processing */}
        <video ref={videoRef} style={{display:'none'}} />
      </div>
    </div>
  )
}
