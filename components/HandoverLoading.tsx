import { Shield } from 'lucide-react';

export const HandoverLoading = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">

      <div className="relative mb-8">

        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-20 scale-150"></div>

        <div className="relative w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center text-indigo-600">
          <Shield size={32}/>
        </div>

      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Mengamankan Data...
      </h2>

      <p className="text-slate-500 max-w-[240px] leading-relaxed">
        Sedang memverifikasi bukti serah terima dengan NEST76.
      </p>

    </div>
  );
};