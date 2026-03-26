export type HandoverCreateInitialData = {
  handoverId: string
  serialNumber: string | null
  mode: "lite" | "pro"
  senderName: string
  senderType: "self" | "other"
  senderContact: string
  receiverName: string
  receiverWhatsapp: string
  receiverEmail: string
  destinationAddress: string
  destinationCity: string
  destinationPostalCode: string
  destinationLat: number | null
  destinationLng: number | null
  items: { description: string; photo_url: string | null }[]
  firstItemPhotoPublicUrl: string | null
}
