'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Check, CheckCheck, Circle, Download, Loader2 } from "lucide-react"
import Image from "next/image"

export default function DocumentPage() {

  const params = useParams()

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : ""

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    async function fetchData(){

      try{

        const res = await fetch(`/api/handover/detail?id=${id}`)

        const json = await res.json()

        setData(json)

      }catch(error){

        console.error("Gagal mengambil data dokumen:",error)

      }finally{

        setLoading(false)

      }

    }

    if(id){
      fetchData()
    }

  },[id])


  if(loading){

    return(

      <div className="flex h-screen items-center justify-center bg-white">

        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />

      </div>

    )

  }


  if(!data || !data.handover){

    return(

      <div className="flex h-screen items-center justify-center p-8 text-center text-sm text-gray-500">

        Dokumen tidak ditemukan atau terjadi kesalahan.

      </div>

    )

  }


  const { handover, items, receive_event } = data

  const firstItemPhoto = items?.[0]?.photo_url
  const proofPhoto = receive_event?.photo_url

  const receiveMethod =
    receive_event?.receive_method
      ? receive_event.receive_method.replace('_',' ')
      : '-'

  const receiveTime =
    receive_event?.timestamp
      ? new Date(receive_event.timestamp).toLocaleString(
          'id-ID',
          { dateStyle:'long', timeStyle:'short' }
        )
      : "-"


  return(

    <div className="min-h-screen bg-white text-[#3E2723] antialiased print:p-0">

      <div className="mx-auto max-w-2xl px-6 py-12 md:px-12">


        {/* HEADER */}

        <header className="mb-12 flex items-end justify-between border-b border-gray-100 pb-6">

          <div>

            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              NEST Paket
            </div>

            <h1 className="mt-1 text-2xl font-light tracking-tight">
              Bukti Serah Terima
            </h1>

          </div>


          <div className="text-right">

            <div className="text-[10px] uppercase tracking-widest text-gray-400">
              ID Referensi
            </div>

            <div className="text-xs font-mono">
              {id.split('-')[0]?.toUpperCase()}
            </div>

          </div>

        </header>



        {/* INFO UTAMA */}

        <section className="mb-12 grid grid-cols-2 gap-8 text-sm">

          <div>

            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Pengirim
            </h3>

            <p className="font-medium">
              {handover.sender_name || '-'}
            </p>

          </div>


          <div>

            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Tujuan
            </h3>

            <p className="font-medium">
              {handover.receiver_target_name || '-'}
            </p>

          </div>


          <div className="col-span-2">

            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Deskripsi Paket
            </h3>

            <p className="italic text-gray-600">

              {items?.length
                ? items.map((it:any)=>it.description).join(", ")
                : "Tidak ada deskripsi"}

            </p>

          </div>

        </section>



        {/* FOTO PAKET */}

        {firstItemPhoto && (

          <section className="mb-12">

            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Foto Paket
            </h3>

            <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-gray-100 bg-gray-50 md:max-w-md">

              <Image
                src={firstItemPhoto}
                alt="Foto Paket"
                fill
                className="object-cover"
                unoptimized
              />

            </div>

          </section>

        )}



        {/* DETAIL PENERIMAAN */}

        {receive_event ? (

          <section className="mb-12 rounded-sm border border-gray-100 p-6 shadow-sm">

            <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Rincian Penerimaan
            </h3>


            <div className="space-y-4 text-sm">

              <div className="flex justify-between border-b border-gray-50 pb-2">

                <span className="text-gray-400">
                  Diterima oleh
                </span>

                <span className="font-medium">

                  {receive_event.receiver_name
                    || handover.receiver_target_name}

                </span>

              </div>


              <div className="flex justify-between border-b border-gray-50 pb-2">

                <span className="text-gray-400">
                  Hubungan
                </span>

                <span className="font-medium">

                  {receive_event.receiver_relation
                    || 'Penerima Langsung'}

                </span>

              </div>


              <div className="flex justify-between border-b border-gray-50 pb-2">

                <span className="text-gray-400">
                  Metode
                </span>

                <span className="font-medium uppercase tracking-tighter">

                  {receiveMethod}

                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-gray-400">
                  Waktu
                </span>

                <span className="font-medium">

                  {receiveTime}

                </span>

              </div>

            </div>

          </section>

        ) : (

          <div className="mb-12 rounded-sm bg-gray-50 p-6 text-center text-xs italic text-gray-400">

            Data serah terima belum tersedia.

          </div>

        )}



        {/* FOTO BUKTI */}

        {proofPhoto && (

          <section className="mb-12">

            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Foto Serah Terima
            </h3>

            <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-gray-100 bg-gray-50 md:max-w-md">

              <Image
                src={proofPhoto}
                alt="Bukti Serah Terima"
                fill
                className="object-cover"
                unoptimized
              />

            </div>

          </section>

        )}



        {/* STATUS */}

        <section className="mt-16 flex flex-col items-center border-t border-gray-100 pt-12 text-center print:mt-8">

          <div className="mb-8 flex flex-col items-center">


            {handover.status === "pending" && (

              <>
                <Circle className="mb-2 text-gray-300" size={32} strokeWidth={1} />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  Pending
                </span>
              </>

            )}


            {handover.status === "delivered" && (

              <>
                <Check className="mb-2 text-green-600" size={32} strokeWidth={1.5} />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-green-600">
                  Delivered
                </span>
              </>

            )}


            {handover.status === "accepted" && (

              <>
                <CheckCheck className="mb-2 text-blue-600" size={32} strokeWidth={1.5} />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
                  Accepted
                </span>
              </>

            )}

          </div>



          {/* DOWNLOAD PDF */}

          {handover.status === "accepted" && (

            <a
              href={`/api/handover/pdf?token=${handover.share_token}`}
              className="flex items-center gap-2 rounded-sm bg-[#3E2723] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-black active:scale-95 print:hidden"
            >

              <Download size={14} />

              Download PDF

            </a>

          )}

        </section>



        <footer className="mt-24 text-center text-[9px] uppercase tracking-widest text-gray-300 print:mt-12">

          NEST76 Studio • Dokumen Digital Sah

        </footer>

      </div>

    </div>

  )

}