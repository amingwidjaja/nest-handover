'use client'

import { PDFViewer } from '@react-pdf/renderer'
import ReceiptPDF from '@/lib/pdf/ReceiptPDF'

export default function TestPDFPage() {

  const dummyData = {
    sender_name: "Robot",
    receiver_target_name: "Rina",
    status: "accepted",
    handover_items: [
      { description: "Kaos Hitam" },
      { description: "Kaos Putih" }
    ],
    receive_event: [
      {
        receiver_name: "Rina",
        receiver_relation: "Owner",
        receive_method: "direct_photo",
        created_at: new Date().toISOString(),
        timezone_label: "WIB"
      }
    ]
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <PDFViewer width="100%" height="100%">
        <ReceiptPDF data={dummyData} />
      </PDFViewer>
    </div>
  )
}