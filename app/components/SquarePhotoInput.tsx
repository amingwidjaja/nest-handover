'use client'

import { useRef } from "react"
import {
  blobToDataUrl,
  compressEvidenceWebpUnder100kb
} from "@/lib/image-evidence"

type Props = {
  onPhoto:(file:File, preview:string)=>void
  disabled?:boolean
}

export default function SquarePhotoInput({
  onPhoto,
  disabled
}:Props){

  const inputRef = useRef<HTMLInputElement>(null)

  function openCamera(){

    if(disabled) return

    inputRef.current?.click()

  }

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){

    if(!e.target.files) return

    const file = e.target.files[0]

    try {
      const cropped = await compressEvidenceWebpUnder100kb(file)
      const dataUrl = await blobToDataUrl(cropped)
      const ext = cropped.type.includes("webp") ? "webp" : "jpg"
      const croppedFile = new File([cropped], `photo.${ext}`, {
        type: cropped.type || "image/webp"
      })
      onPhoto(croppedFile, dataUrl)
    } catch {
      /* ignore */
    }

  }

  return(

    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={openCamera}
        disabled={disabled}
        className="
        aspect-square
        border border-[#E0DED7]
        flex flex-col items-center justify-center
        rounded-sm
        active:bg-[#F2F1ED]
        disabled:opacity-40
        disabled:cursor-not-allowed
        "
      >
        Ambil Foto
      </button>
    </>

  )

}