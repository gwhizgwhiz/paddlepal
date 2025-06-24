// src/utils/analyzeVideoLocally.js
import * as tf from '@tensorflow/tfjs-core'
import * as poseDetection from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'

export default async function analyzeVideoLocally(file) {
  // 1) Initialize the detector
  // 0) Make sure the TFJS WebGL backend is ready
  await tf.setBackend('webgl')
  await tf.ready()

  
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: 'SinglePose.Lightning' }
  )

  // 2) Load the video offscreen
  const video = document.createElement('video')
  video.src = URL.createObjectURL(file)
  await video.play()

  const events = []
  const balances = []

  // 3) Sample one frame per second, run poses + heuristics
  const duration = Math.floor(video.duration)
  for (let t = 0; t < duration; t += 1) {
    video.currentTime = t
    await new Promise((r) => (video.onseeked = r))
    const [pose] = await detector.estimatePoses(video)
    if (!pose) continue

    // Example heuristic: serve if wrist above shoulder
    const lw = pose.keypoints.find((k) => k.name === 'left_wrist')
    const ls = pose.keypoints.find((k) => k.name === 'left_shoulder')
    if (lw && ls && lw.y < ls.y) events.push({ time: t, event: 'Serve Detected' })

    // Example balance metric
    const lh = pose.keypoints.find((k) => k.name === 'left_hip')
    const rh = pose.keypoints.find((k) => k.name === 'right_hip')
    if (lh && rh) balances.push(Math.abs(lh.x - rh.x))
  }

  video.pause()
  URL.revokeObjectURL(video.src)

  // 4) Aggregate into small feature set
  const serveCount = events.filter((e) => e.event === 'Serve Detected').length
  const avgBalance = balances.reduce((a, b) => a + b, 0) / (balances.length || 1)

  return {
    duration,
    serveCount,
    avgBalance,
    events,      // optional: time-stamped events
  }
}
