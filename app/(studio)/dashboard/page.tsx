  const load = useCallback(async function load() {
    // Send mode so API can apply correct visibility rule
    const modeParam = handoverMode ? `?mode=${handoverMode}` : ""
    const res = await fetch(`/api/handover/list${modeParam}`, { cache: "no-store" })
    const data = await res.json()
    const rows = data.handovers || []
    setHandovers(rows)

    if (rows.length) {
      window.scrollTo({ top: 0 })
      setHighlightId(rows[0].id)
      setTimeout(() => setHighlightId(null), 3000)
    }
  }, [handoverMode])