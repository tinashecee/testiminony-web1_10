"use client"

import { useEffect, useMemo, useState } from "react"
import Layout from "../../components/Layout"
import SearchBar from "../../components/SearchBar"
import { recordingsApi, type Recording, type Court, type Courtroom } from "@/services/api"
import { RecordingList } from "@/components/RecordingList"

export default function Search() {
  const [loading, setLoading] = useState(true)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [courtrooms, setCourtrooms] = useState<Courtroom[]>([])
  const [term, setTerm] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [recs, crts, rms] = await Promise.all([
          recordingsApi.getAllRecordings(),
          recordingsApi.getCourts(),
          recordingsApi.getCourtrooms(),
        ])
        setRecordings(recs)
        setCourts(crts)
        setCourtrooms(rms)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const normalized = (value: string) => value.toLowerCase()

  const filtered = useMemo(() => {
    if (!term.trim()) return recordings
    const q = normalized(term)
    return recordings.filter((r) => {
      return (
        normalized(r.case_number || "").includes(q) ||
        normalized(r.title || "").includes(q) ||
        normalized(r.judge_name || "").includes(q) ||
        normalized(r.court || "").includes(q) ||
        normalized(r.courtroom || "").includes(q) ||
        normalized(r.notes || "").includes(q) ||
        normalized(r.transcript || "").includes(q)
      )
    })
  }, [recordings, term])

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <SearchBar onSearch={setTerm} defaultValue={term} />

      {loading ? (
        <div className="mt-6">Loading...</div>
      ) : (
        <div className="mt-6">
          <RecordingList recordings={filtered} pageSize={10} courts={courts} courtrooms={courtrooms} />
        </div>
      )}
    </Layout>
  )
}

