import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link
} from "@react-pdf/renderer"
import { resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"
import {
  formatDeviceIdLine,
  formatGpsCoords,
  formatTrustTimestampId,
  isQrReceiveMethod,
  shortenDeviceIdForDisplay
} from "@/lib/receipt-trust"

/* ================= TYPES ================= */

type HandoverItem = {
  description: string
  photo_url?: string | null
}

type ReceiveEvent = {
  receiver_name?: string
  receiver_relation?: string
  receive_method?: string
  created_at?: string
  timestamp?: string
  timezone_label?: string
  gps_lat?: number | string | null
  gps_lng?: number | string | null
  device_id?: string | null
  device_model?: string | null
}

type ProfileBranding = {
  company_name?: string | null
  company_logo_url?: string | null
}

export type HandoverData = {
  sender_name?: string
  receiver_target_name?: string
  status?: string
  serial_number?: string | null
  received_at?: string | null
  handover_items?: HandoverItem[]
  receive_event?: ReceiveEvent[] | ReceiveEvent | null
  profiles?: ProfileBranding | null
}

/* ================= STYLES ================= */

const LABEL = "#9A8F88"
const VALUE = "#3E2723"

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 120,
    paddingHorizontal: 48,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica"
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12
  },

  logo: {
    width: 44,
    height: 44,
    marginRight: 12,
    objectFit: "contain"
  },

  headerTitles: {
    flex: 1
  },

  brandTitle: {
    fontSize: 20,
    color: VALUE,
    marginBottom: 4
  },

  docSubtitle: {
    fontSize: 11,
    color: LABEL,
    letterSpacing: 1.2
  },

  serial: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: VALUE,
    textAlign: "right",
    maxWidth: 160
  },

  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#ECE7E3",
    marginVertical: 14
  },

  section: {
    marginVertical: 6
  },

  row: {
    flexDirection: "row",
    marginBottom: 12
  },

  label: {
    fontSize: 14,
    color: LABEL,
    width: 140
  },

  value: {
    fontSize: 15,
    color: VALUE,
    flex: 1
  },

  sectionLabel: {
    fontSize: 13,
    color: LABEL,
    letterSpacing: 2,
    marginBottom: 12
  },

  sectionLabelDetail: {
    fontSize: 16,
    color: LABEL,
    letterSpacing: 1,
    marginBottom: 14
  },

  packageContainer: {
    flexDirection: "row",
    marginVertical: 10
  },

  photoWrap: {
    width: 160,
    height: 160,
    borderWidth: 1,
    borderColor: "#E5E0DB",
    borderRadius: 10,
    marginRight: 20,
    overflow: "hidden"
  },

  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  imagePlaceholder: {
    width: 160,
    height: 160,
    borderWidth: 1,
    borderColor: "#E5E0DB",
    borderRadius: 10,
    marginRight: 20,
    backgroundColor: "#FAF9F6"
  },

  packageList: {
    flex: 1,
    paddingTop: 6
  },

  itemText: {
    fontSize: 15,
    color: VALUE,
    marginBottom: 8
  },

  gpsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    marginBottom: 4
  },

  qr: {
    width: 48,
    height: 48,
    marginRight: 12
  },

  gpsTextCol: {
    flex: 1
  },

  gpsVerified: {
    fontSize: 10,
    color: LABEL,
    marginBottom: 4
  },

  gpsLink: {
    fontSize: 10,
    color: VALUE,
    textDecoration: "underline"
  },

  closingStatement: {
    marginTop: 22,
    fontSize: 15,
    color: VALUE,
    lineHeight: 1.6
  },

  trustHeading: {
    fontSize: 13,
    color: LABEL,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 6
  },

  signatureBlock: {
    borderWidth: 1,
    borderColor: "#E5E0DB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#FAF9F6"
  },

  signatureBlockTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: VALUE,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 1.2
  },

  signaturePrimaryLabel: {
    fontSize: 10,
    color: LABEL,
    marginBottom: 3
  },

  signaturePrimaryValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: VALUE,
    marginBottom: 10,
    lineHeight: 1.35
  },

  footerWrap: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48
  },

  legalStatement: {
    fontSize: 8,
    color: LABEL,
    textAlign: "center",
    lineHeight: 1.45,
    marginBottom: 8
  },

  copyrightLine: {
    fontSize: 7.5,
    color: LABEL,
    textAlign: "center",
    lineHeight: 1.35
  }
})

/* ================= HELPERS ================= */

function normalizeReceiveEvent(
  raw: HandoverData["receive_event"]
): ReceiveEvent {
  if (raw == null) return {}
  if (Array.isArray(raw)) return raw[0] || {}
  return raw
}

function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return "-"

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ]

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatIndonesianTime(dateStr?: string): string {
  if (!dateStr) return "-"

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")

  return `${h}.${m}`
}

function formatMetode(method: string | undefined): string {
  switch (method) {
    case "direct_qr":
      return "QR Code"
    case "direct_photo":
      return "Foto Tanda Terima"
    case "proxy_qr":
      return "QR Code (Diwakilkan)"
    case "proxy_photo":
      return "Foto Tanda Terima (Diwakilkan)"
    case "GPS":
      return "Validasi GPS"
    default:
      return "-"
  }
}

function formatStatus(status: string | undefined): string {
  switch (status) {
    case "draft":
      return "Draft"
    case "created":
      return "Dibuat"
    case "received":
      return "Diterima"
    case "accepted":
      return "Diterima & Disetujui"
    default:
      return status || "-"
  }
}

function parseGps(
  lat: ReceiveEvent["gps_lat"],
  lng: ReceiveEvent["gps_lng"]
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null
  const a = typeof lat === "string" ? parseFloat(lat) : Number(lat)
  const b = typeof lng === "string" ? parseFloat(lng) : Number(lng)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return { lat: a, lng: b }
}

/* ================= COMPONENT ================= */

const HandoverReceiptPDF = ({ data }: { data: HandoverData }) => {
  const event = normalizeReceiveEvent(data.receive_event)
  const items: HandoverItem[] = data.handover_items || []

  const when = event.timestamp || event.created_at
  const formattedDate = formatIndonesianDate(when)
  const formattedTime = formatIndonesianTime(when)
  const tz = event.timezone_label || ""

  const companyName = data.profiles?.company_name?.trim()
  const hasCompanyBrand = !!companyName
  const brandTitle = hasCompanyBrand ? companyName! : "Tanda Terima"
  const logoUrl =
    hasCompanyBrand && data.profiles?.company_logo_url
      ? resolveNestEvidencePublicUrl(data.profiles.company_logo_url)
      : null

  const firstPhotoPath =
    items.find((i) => i.photo_url && String(i.photo_url).trim())?.photo_url ??
    null
  const evidenceUrl = resolveNestEvidencePublicUrl(firstPhotoPath)

  const gps = parseGps(event.gps_lat, event.gps_lng)
  const mapsUrl = gps
    ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
    : null
  const qrSrc = mapsUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=${encodeURIComponent(
        mapsUrl
      )}`
    : null

  const isQr = isQrReceiveMethod(event.receive_method)
  const handoverTs = formatTrustTimestampId(when)
  const deviceLine = formatDeviceIdLine(
    event.device_model,
    shortenDeviceIdForDisplay(event.device_id, 120)
  )
  const gpsCoords = formatGpsCoords(event.gps_lat, event.gps_lng)
  const acceptedTs =
    data.status === "accepted"
      ? formatTrustTimestampId(data.received_at || when)
      : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View style={styles.headerTitles}>
              <Text style={styles.brandTitle}>{brandTitle}</Text>
              <Text style={styles.docSubtitle}>TANDA TERIMA</Text>
            </View>
          </View>
          {data.serial_number ? (
            <Text style={styles.serial}>{data.serial_number}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Pengirim:</Text>
            <Text style={styles.value}>{data.sender_name || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Penerima:</Text>
            <Text style={styles.value}>{data.receiver_target_name || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{formatStatus(data.status)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.packageContainer}>
            {evidenceUrl ? (
              <View style={styles.photoWrap}>
                <Image src={evidenceUrl} style={styles.photo} />
              </View>
            ) : (
              <View style={styles.imagePlaceholder} />
            )}

            <View style={styles.packageList}>
              <Text style={styles.sectionLabel}>RINCIAN PAKET</Text>

              {items.length > 0 ? (
                items.map((item: HandoverItem, i: number) => (
                  <Text key={i} style={styles.itemText}>
                    • {item.description}
                  </Text>
                ))
              ) : (
                <Text style={styles.itemText}>-</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabelDetail}>DETAIL PENERIMAAN</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Metode:</Text>
            <Text style={styles.value}>
              {formatMetode(event.receive_method)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Waktu:</Text>
            <Text style={styles.value}>
              {formattedDate} pukul {formattedTime} {tz}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Diterima oleh:</Text>
            <Text style={styles.value}>{event.receiver_name || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hubungan:</Text>
            <Text style={styles.value}>{event.receiver_relation || "-"}</Text>
          </View>

          {gps && mapsUrl && qrSrc ? (
            <View style={styles.gpsRow}>
              <Image src={qrSrc} style={styles.qr} />
              <View style={styles.gpsTextCol}>
                <Text style={styles.gpsVerified}>
                  Verified Location: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                </Text>
                <Link src={mapsUrl} style={styles.gpsLink}>
                  Buka di Google Maps
                </Link>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <Text style={styles.closingStatement}>
          Paket telah diterima oleh {event.receiver_name || "-"} pada tanggal{" "}
          {formattedDate} pukul {formattedTime} {tz} melalui metode{" "}
          {formatMetode(event.receive_method)}.
        </Text>

        <View style={styles.divider} />

        {isQr ? (
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureBlockTitle}>
              TANDA TANGAN DIGITAL (QR)
            </Text>
            <Text style={styles.signaturePrimaryLabel}>Device ID</Text>
            <Text style={styles.signaturePrimaryValue}>{deviceLine}</Text>
            <Text style={styles.signaturePrimaryLabel}>Timestamp</Text>
            <Text style={styles.signaturePrimaryValue}>{handoverTs}</Text>
          </View>
        ) : null}

        <Text style={styles.trustHeading}>VERIFIKASI DIGITAL</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Metode:</Text>
            <Text style={styles.value}>
              {formatMetode(event.receive_method)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Device ID:</Text>
            <Text style={styles.value}>{deviceLine}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Timestamp:</Text>
            <Text style={styles.value}>{handoverTs}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>GPS:</Text>
            <Text style={styles.value}>{gpsCoords}</Text>
          </View>

          {data.status === "accepted" ? (
            <View style={styles.row}>
              <Text style={styles.label}>Approval:</Text>
              <Text style={styles.value}>
                Disetujui secara digital pada {acceptedTs ?? "-"}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footerWrap} fixed>
          <Text style={styles.legalStatement}>
            Dokumen ini merupakan Tanda Terima Sah yang diterbitkan secara
            otomatis oleh NEST-System. Keaslian data dijamin melalui verifikasi
            Device ID, Timestamp, dan Geo-tagging sebagai pengganti tanda tangan
            basah.
          </Text>
          <Text style={styles.copyrightLine}>
            © 2026 NEST76 Studio. Tanda Terima — generated securely. All logs are
            encrypted and archived.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default HandoverReceiptPDF
