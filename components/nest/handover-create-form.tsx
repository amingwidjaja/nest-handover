    if (!initialData?.handoverId) {
      const limRes = await fetch("/api/handover/limits")
      const lim = await limRes.json()
      if (lim.authenticated && lim.at_limit) {
        showToast("Batas paket aktif tercapai untuk akun Anda.")
        return
      }
    }

    const isSenderProxy = senderType === "other"
    const finalSender = isSenderProxy
      ? senderName.trim()
      : localStorage.getItem("user_name") || "Sender"

    // Normalize sender contact → WhatsApp number if starts with 08/62/8
    // Otherwise treat as email (for future use)
    const senderContactTrimmed = senderContact.trim()
    const senderWa = isSenderProxy
      ? senderContactTrimmed
      : null

    const wa = receiverWhatsapp.trim()
    const em = handoverMode === "pro" ? receiverEmail.trim() : ""

    localStorage.setItem("draft_sender_name", finalSender)
    localStorage.setItem("draft_sender_contact", senderContact)
    localStorage.setItem("draft_receiver_name", receiverName)
    localStorage.setItem("draft_receiver_whatsapp", wa)
    localStorage.setItem("draft_receiver_email", em)
    localStorage.setItem("draft_receiver_contact", wa)
    // Store proxy info for package page to include in create payload
    localStorage.setItem("draft_is_sender_proxy", isSenderProxy ? "true" : "false")
    localStorage.setItem("draft_sender_whatsapp", senderWa || "")

    if (handoverMode === "pro") {