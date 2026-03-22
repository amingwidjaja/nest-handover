'use client';

import Link from "next/link";
import { useParams } from "next/navigation";

export default function SuccessPage(){

  const params = useParams()
  const id = params.id

  return (

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-24 text-center">

        <h2 className="text-2xl font-light mb-6">
          Serah Terima berhasil
        </h2>

        <p className="text-sm opacity-60 leading-relaxed max-w-sm mx-auto mb-12">

          Dokumen Serah Terima kamu sudah tersimpan.

          <br/><br/>

          Kamu bisa cek dokumen kamu di <span className="font-medium">Log Book</span>.

        </p>

        <div className="text-xs opacity-40 mb-12">

          ID Dokumen

          <div className="mt-2 font-mono text-sm opacity-60">
            {id}
          </div>

        </div>

      </main>


      <div className="flex justify-center pb-10">

        <Link
          href="/dashboard"
          className="text-sm font-medium border border-[#3E2723] px-8 py-3 rounded-sm active:bg-[#3E2723] active:text-white transition"
        >
          Buka Log Book
        </Link>

      </div>

    </div>

  )

}