// src/pages/AnalysisResultsPage.jsx
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import supabase from '../supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AnalysisResultsPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setAnalysis(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!analysis) return <p>Not found</p>
  if (analysis.status !== 'complete')
    return <p>Analysis is {analysis.status}…</p>

  const { summary, points } = analysis.result_json
  return (
    <div className="page-container">
      <h2>Analysis Results</h2>
      <p>{summary}</p>
      <ul>
        {points.map((pt, i) => (
          <li key={i}>
            <strong>{pt.time}</strong>: {pt.event}
          </li>
        ))}
      </ul>
    </div>
  )
}
