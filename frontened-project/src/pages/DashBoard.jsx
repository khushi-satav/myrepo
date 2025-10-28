import React, { useEffect, useState } from 'react'
import { submitQuery, fetchAllChat, exportPdf } from '../api'

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line
  }, [])

  async function loadHistory() {
    try {
      const data = await fetchAllChat()
      // Expecting data.result to be an array; guard defensively
      if (data && Array.isArray(data.result)) {
        setHistory(data.result.slice().reverse()) // latest first
      } else if (Array.isArray(data)) {
        setHistory(data.slice().reverse())
      } else {
        setHistory([])
      }
    } catch (e) {
      console.error('Failed to load history', e)
      setHistory([])
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setError(null)
    if (!query || query.trim().length < 5) {
      setError('Query must be at least 5 characters')
      return
    }
    setLoading(true)
    try {
      const data = await submitQuery(query.trim())

      // Normalize the response into a predictable object shape:
      // - if API returns { message: {...} } or { message: "string" }, handle both
      // - if API returns a plain string, wrap it into { answer: string }
      let payload = data
      if (data && data.message !== undefined) payload = data.message

      if (typeof payload === 'string') {
        setResult({ answer: payload })
      } else if (payload && typeof payload === 'object') {
        // ensure at least answer field exists
        setResult({
          answer: payload.answer ?? (payload.text ?? payload.content ?? ''),
          summary: payload.summary ?? '',
          validation: payload.validation ?? null,
          papers: Array.isArray(payload.papers) ? payload.papers : [],
          ...payload,
        })
      } else {
        setResult({ answer: String(payload) })
      }

      await loadHistory()
      setQuery('')
    } catch (err) {
      console.error('submitQuery error', err)
      const body = err && err.body ? err.body : err
      setError(
        body && (body.error || body.message)
          ? body.error || body.message
          : 'Research processing failed'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(conversationId) {
    try {
      const blob = await exportPdf(conversationId)
      // If API returned an object instead of a Blob, handle gracefully
      if (!blob) throw new Error('No PDF data returned')
      // If a Response object (fetch) was returned, convert to blob
      let fileBlob = blob
      if (typeof blob === 'object' && typeof blob.arrayBuffer === 'function') {
        // fetch Response -> convert
        fileBlob = await blob.blob()
      }
      const url = window.URL.createObjectURL(fileBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `research-report-${conversationId || Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export PDF failed', e)
      alert((e && e.err) || (e && e.message) || 'Failed to generate PDF')
    }
  }

  // Small helper to safely render a short preview text
  const previewText = (text, max = 140) => {
    if (!text) return '—'
    const str = typeof text === 'string' ? text : JSON.stringify(text)
    return str.length > max ? str.slice(0, max) + '...' : str
  }

  return (
    <>
      {/* 
        Key idea:
        - background layer (fixed inset-0) covers entire viewport (full page dark look),
        - content is placed above it (z-10) and centered with a wide max width.
        - this ensures the dashboard appears full-page even if header or other wrappers exist.
      */}
      <div className="relative min-h-screen w-full">
        {/* Full-screen background layer (covers entire page) */}
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-900 via-gray-900 to-black"
        />

        {/* subtle vignette and glass overlay to fill full width */}
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-black/40 via-transparent to-transparent mix-blend-overlay"
        />

        {/* Main content: positioned above background */}
        <main className="relative z-10 w-full min-h-screen">
          <div className="max-w-[1400px] mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Query Card: spans 2 on large screens */}
              <section className="lg:col-span-2">
                <div className="bg-[rgba(255,255,255,0.02)] border border-slate-700/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">New Research Query</h2>
                      <p className="text-sm text-slate-400 mt-1">Ask a question and get a concise research summary.</p>
                    </div>
                    <div className="text-sm text-slate-400">Model: ResearchGPT</div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block">
                      <span className="text-sm text-slate-300">Query</span>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        rows={5}
                        placeholder="Type your research question..."
                        className="mt-2 w-full resize-none rounded-lg bg-[rgba(255,255,255,0.03)] border border-slate-700/50 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>

                    {error && (
                      <div className="rounded-md bg-red-900/70 border border-red-700 px-4 py-2 text-red-100 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        aria-disabled={loading}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${loading ? 'bg-indigo-500/60 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                            Processing...
                          </>
                        ) : 'Submit'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setQuery(''); setResult(null); setError(null) }}
                        className="px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Reset
                      </button>

                      <div className="ml-auto text-sm text-slate-500">Tip: be specific for better results</div>
                    </div>
                  </form>

                  {/* Result */}
                  {result && (
                    <div className="mt-6 bg-[rgba(255,255,255,0.02)] border border-slate-700/40 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
                      <div className="text-slate-200 space-y-3">
                        <p><span className="font-medium text-slate-300">Answer:</span> <span className="text-slate-100">{result?.answer ?? '—'}</span></p>
                        {result?.summary ? (
                          <p><span className="font-medium text-slate-300">Summary:</span> <span className="text-slate-100">{result.summary}</span></p>
                        ) : null}

                        {result?.validation && (
                          <div>
                            <span className="font-medium text-slate-300">Validation:</span>
                            <pre className="mt-2 p-3 bg-[rgba(255,255,255,0.02)] border border-slate-700 rounded text-xs text-slate-300 overflow-auto">{JSON.stringify(result.validation, null, 2)}</pre>
                          </div>
                        )}

                        {Array.isArray(result?.papers) && result.papers.length > 0 && (
                          <div className="mt-2">
                            <h4 className="font-medium text-slate-300 mb-2">Papers</h4>
                            <ul className="space-y-2">
                              {result.papers.map((p, idx) => (
                                <li key={p.paperId ?? p.id ?? idx} className="text-slate-200">
                                  <a className="text-indigo-400 hover:underline" href={p.url ?? '#'} target="_blank" rel="noreferrer">{p.title ?? p.name ?? 'Untitled'}</a>
                                  <div className="text-sm text-slate-500">{Array.isArray(p.authors) ? p.authors.join(', ') : p.authors}</div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* History / Actions */}
              <aside>
                <div className="bg-[rgba(255,255,255,0.02)] border border-slate-700/50 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">History</h2>
                    <button onClick={loadHistory} className="text-sm px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300">Refresh</button>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-slate-500 text-sm">No conversations yet</div>
                  ) : (
                    <ul className="space-y-3 overflow-auto max-h-[55vh] pr-1">
                      {history.map((h, idx) => {
                        const id = h?._id ?? h?.id ?? idx
                        return (
                          <li key={id} className="flex items-start justify-between gap-3 p-3 rounded-md border border-slate-800 hover:shadow-[0_6px_30px_rgba(0,0,0,0.6)]">
                            <div className="min-w-0">
                              <div className="text-xs text-slate-500">{h?.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</div>
                              <div className="text-sm text-slate-100 font-medium truncate mt-1">{h?.query ?? 'Untitled query'}</div>
                              <div className="text-sm text-slate-400 mt-1 line-clamp-3">{previewText(h?.answer)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={() => handleDownload(id)}
                                className="px-3 py-1 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm"
                                aria-label={`Export conversation ${id}`}
                              >
                                Export
                              </button>
                              <button
                                onClick={() => setResult({
                                  answer: h?.answer ?? '',
                                  summary: h?.summary ?? '',
                                  validation: h?.validation ?? null,
                                  papers: Array.isArray(h?.papers) ? h.papers : []
                                })}
                                className="px-3 py-1 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                              >
                                View
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  <div className="pt-3 text-xs text-slate-500">Your queries and generated summaries are stored securely.</div>
                </div>
              </aside>
            </div>

            {/* footer centered */}
            <div className="mt-12 text-center text-sm text-slate-500">
              Built with ❤️ — Research App
            </div>
          </div>
        </main>
      </div>
    </>
  )
}