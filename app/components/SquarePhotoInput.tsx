'use client'

import { useRef } from "react"

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

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = async ()=>{

      const size = Math.min(img.width,img.height)

      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2

      const MAX_SIZE = 1200

      let targetSize = size

      if(size > MAX_SIZE){
        targetSize = MAX_SIZE
      }

      const canvas = document.createElement("canvas")
      canvas.width = targetSize
      canvas.height = targetSize

      const ctx = canvas.getContext("2d")

      if(!ctx) return

      ctx.drawImage(
        img,
        sx,
        sy,
        size,
        size,
        0,
        0,
        targetSize,
        targetSize
      )

      canvas.toBlob((blob)=>{

        if(!blob) return

        const croppedFile = new File(
          [blob],
          "photo.jpg",
          { type:"image/jpeg" }
        )

        const preview = URL.createObjectURL(blob)

        onPhoto(croppedFile,preview)

      },"image/jpeg",0.8)

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