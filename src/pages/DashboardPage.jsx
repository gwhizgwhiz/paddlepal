// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PlayerPickerModal from '../components/PlayerPickerModal'
import supabase from '../supabaseClient'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import analyzeVideoLocally from '../utils/analyzeVideoLocal'
import '../App.css'

const PROJECT_REF  = import.meta.env.VITE_SUPABASE_PROJECT_REF
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY
const FUNCTION_URL = `https://${PROJECT_REF}.functions.supabase.co/process-analysis`

export default function DashboardPage() {
  const navigate = useNavigate()
     const [loading, setLoading] = useState(true)

  // Analysis state
  const [uploading, setUploading]   = useState(false)
  const [analysisId, setAnalysisId] = useState(null)
  const [analysis, setAnalysis]     = useState(null)
  const [history, setHistory]       = useState([])

  // Player picker state
  const [pickerOpen, setPickerOpen]               = useState(false)
  const [pendingFile, setPendingFile]             = useState(null)
  const [pendingAnalysisId, setPendingAnalysisId] = useState(null)

  useEffect(() => {
    const loadHistory = async () => {
      const { data: all, error: histErr } = await supabase
        .from('analyses')
        .select('id, inserted_at, status')
        .eq('user_id', (await supabase.auth.getUser()).data.user.id)
        .order('inserted_at', { ascending: false })

      if (histErr) console.error('Error loading history:', histErr)
      else {
        setHistory(all)
        if (all.length && !analysisId) setAnalysisId(all[0].id)
      }
    setLoading(false)
    }
    loadHistory()
  }, [analysisId])

  // 3a) Poll analysis status history
  useEffect(() => {
  const loadHistory = async () => {
    const {
      data: all,
      error: histErr
    } = await supabase
      .from('analyses')
      .select('id, inserted_at, status')
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)
      .order('inserted_at', { ascending: false })

    if (histErr) console.error('Error loading history:', histErr)
    else {
      setHistory(all)
      if (all.length && !analysisId) setAnalysisId(all[0].id)
    }
    setLoading(false)    // ← stop showing the spinner!
  }
  loadHistory()
}, [analysisId])

// 3b) Poll analysis status 
useEffect(() => {
  if (!analysisId) return
  let timer

  const poll = async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Analysis select error:', error)
      return
    }
    if (!data) {
      // still queued in the DB, try again
      timer = setTimeout(poll, 2000)
      return
    }

    setAnalysis(data)
    if (data.status === 'pending' || data.status === 'running') {
      // still working? keep polling
      timer = setTimeout(poll, 2000)
    }
  }

  poll()
  return () => clearTimeout(timer)
}, [analysisId])

  // 4) Upload handler opens picker and defers analysis
  const handleUpload = async (e) => {
    console.log('handleUpload start')
    const file = e.target.files[0]
    if (!file) return   
    // 🚫 enforce size limit (50 MB)
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Please pick a video smaller than ${MAX_MB} MB (yours is ${(file.size/1024/1024).toFixed(1)} MB).`)
      return
    }
    setUploading(true)

    // a) upload to storage
    const filename = `${Date.now()}_${file.name}`
    const { error: upErr } = await supabase
      .storage.from('match-videos').upload(filename, file, { upsert: true })
    if (upErr) {
      console.error('Storage upload failed:', upErr)
      setUploading(false)
      return
    }

    // b) enqueue in DB
    const { data: newId, error: rpcErr } = await supabase
      .rpc('start_analysis', { video_path: filename })
    if (rpcErr) {
      console.error('start_analysis failed:', rpcErr)
      setUploading(false)
      return
    }

    // c) store for picker & open
    setPendingFile(file)
    setPendingAnalysisId(newId)
    console.log('opening picker for file:', file.name)
    setPickerOpen(true)
    setUploading(false)
    return
  }

  // 5) Called by picker: run heuristics and edge function
  const handlePick = async (selectedIndex) => {
    setPickerOpen(false)

    let features
    try {
      features = await analyzeVideoLocally(pendingFile, selectedIndex)
    } catch (err) {
      console.error('Local analysis failed:', err)
      return
    }

    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ id: pendingAnalysisId, features }),
    })
    if (!res.ok) console.error('process-analysis failed:', await res.text())

    setAnalysisId(pendingAnalysisId)
    setHistory(h => [
      { id: pendingAnalysisId, inserted_at: new Date().toISOString(), status: 'pending' },
      ...h,
    ])

    setPendingFile(null)
    setPendingAnalysisId(null)
  }

  if (loading) return <LoadingSpinner />

    return (
    <Card>
      <div className="dashboard-grid">

        {/* LEFT SIDEBAR */}
        <div className="dashboard-sidebar">
  <div className="dashboard-section">
    <h3 className="section-header">My Analyses</h3>
    <div className="profile-card">
      <label className="btn-small btn-outline">
        {uploading ? 'Uploading…' : 'Upload Video'}
        <input
          type="file"
          accept="video/*"
          onChange={handleUpload}
          hidden
        />
      </label>

      {/* move the “My Analyses” header & list inside the same card */}
      <h3 className="section-header" style={{ marginTop: '1.5rem' }}>
        {/* My Analyses */}
      </h3>
      <ul className="history-list">
        {history.map(({ id, inserted_at }) => (
          <li key={id} className="history-item">
            <Link to={`/analysis/${id}`} className="history-link">
              {format(new Date(inserted_at), 'PPP p')}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
</div>


        {/* RIGHT MAIN PANEL */}
        <div className="dashboard-main">
          {/* Show spinner until history/loadHistory completes */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="dashboard-section">
              <h3 className="section-header">Upload & AI Analysis</h3>

              {/* CASE A: no analysis yet */}
              {!analysis ? (
                <p className="muted">Upload a video to get started.</p>
              ) : 
                /* CASE B: analysis in-flight */
                analysis.status !== 'complete' ? (
                <p className="muted">Analysis is {analysis.status}…</p>
              ) : (
                /* CASE C: analysis complete */
                <div className="results-card">
                  <h4>
                    Results —{' '}
                    {format(new Date(analysis.inserted_at), 'PPP p')}
                  </h4>
                  <p>{analysis.result_json.summary}</p>
                  <ul>
                    {analysis.result_json.recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PLAYER PICKER MODAL */}
      {pickerOpen && (
        <PlayerPickerModal
          file={pendingFile}
          onConfirm={handlePick}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </Card>
  )
}
