'use client';

import Link from "next/link";

export default function LogPage(){

  const logs = [
    {
      id:"DOC-20491",
      receiver:"Budi Santoso",
      item:"Dokumen kontrak",
      date:"2026-03-15 10:42"
    },
    {
      id:"DOC-20490",
      receiver:"Rina Wijaya",
      item:"Sample produk",
      date:"2026-03-15 09:10"
    }
  ]

  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">

      <main className="p-8 pt-16">

        <h2 className="text-xl font-light mb-12">
          Log Book
        </h2>

        <div className="space-y-6">

          {logs.map((log)=>(
            
            <Link
              key={log.id}
              href={`/handover/${log.id}`}
              className="block border border-[#E0DED7] rounded-sm p-5 active:bg-[#F2F1ED] transition"
            >

              <div className="flex justify-between items-center">

                <div>

                  <div className="text-sm font-medium mb-1">
                    {log.receiver}
                  </div>

                  <div className="text-xs opacity-60 mb-1">
                    {log.item}
                  </div>

                  <div className="text-xs opacity-40">
                    {log.date}
                  </div>

                </div>

                <div className="text-xs font-mono opacity-60">
                  {log.id}
                </div>

              </div>

            </Link>

          ))}

        </div>

      </main>


      <div className="flex justify-center pb-10 pt-12">

        <Link
          href="/create"
          className="text-sm font-medium border border-[#3E2723] px-8 py-3 rounded-sm active:bg-[#3E2723] active:text-white transition"
        >
          Buat Serah Terima Baru
        </Link>

      </div>

    </div>

  )

}