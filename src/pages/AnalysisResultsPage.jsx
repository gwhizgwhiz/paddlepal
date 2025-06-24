// src/pages/AnalysisResultsPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import supabase from '../supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AnalysisResultsPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('analyses')
          .select('result_json')
          .eq('id', id)
          .single()

        if (err) throw err
        setAnalysis(data.result_json)
      } catch (err) {
        console.error('Fetch analysis error:', err)
        setError('Unable to load results.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <LoadingSpinner />

  if (error)
    return (
      <div className="page-container">
        <p className="error">{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    )

  // Destructure with defaults so we never call .map on undefined
  const {
    summary = 'No summary provided.',
    recommendations = [],
    events = [],
  } = analysis || {}

  return (
    <div className="page-container">
      <h2>Analysis Results</h2>

      <section className="results-summary">
        <h3>Summary</h3>
        <p>{summary}</p>
      </section>

      <section className="results-recommendations">
        <h3>Recommendations</h3>
        {recommendations.length ? (
          <ul>
            {recommendations.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p>No recommendations provided.</p>
        )}
      </section>

      <section className="results-events">
        <h3>Events</h3>
        {events.length ? (
          <ul>
            {events.map((pt, i) => (
              <li key={i}>
                <strong>{pt.time}</strong>: {pt.event}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events detected.</p>
        )}
      </section>

      <Link to="/dashboard" className="btn-outline">
        Back to Dashboard
      </Link>
    </div>
  )
}
