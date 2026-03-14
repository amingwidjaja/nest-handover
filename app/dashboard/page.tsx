import { HandoverList } from '@/components/HandoverList';
import Link from 'next/link';

export default function Dashboard() {

  // mock data dulu
  const handovers = [
    {
      id: "1",
      receiver_target_name: "Budi Santoso",
      item_summary: "2x Box Sepatu",
      status: "received",
      created_at: "12 Oct · 14:20"
    },
    {
      id: "2",
      receiver_target_name: "Andre",
      item_summary: "1x Dokumen",
      status: "created",
      created_at: "12 Oct · 15:10"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-28">

      <header className="px-6 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Riwayat serah terima barang Anda
        </p>
      </header>

      <main className="px-6">

        <HandoverList handovers={handovers} />

      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200">

        <Link href="/create">

          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-md active:scale-[0.97] transition">
            Kirim Barang
          </button>

        </Link>

      </div>

    </div>
  );
}