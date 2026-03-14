'use client';

import React from 'react';
import { Package, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type HandoverItem = {
  id: string;
  receiver_target_name: string;
  item_summary: string;
  status: 'created' | 'received';
};

export const HandoverList = ({ handovers }: { handovers: HandoverItem[] }) => {
  return (
    <div className="space-y-3">

      {handovers.map((item) => (

        <Link
          href={`/handover/${item.id}`}
          key={item.id}
          className="block bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98]"
        >

          <div className="flex items-center gap-4">

            {/* Status Icon */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                item.status === 'created'
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-emerald-50 text-emerald-500'
              }`}
            >
              {item.status === 'created' ? (
                <Clock size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">

              <p className="font-bold text-slate-900 truncate">
                {item.receiver_target_name}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">

                <Package size={12} />

                <span className="truncate">
                  {item.item_summary}
                </span>

              </div>

            </div>

            {/* Arrow */}
            <ChevronRight size={20} className="text-slate-300" />

          </div>

        </Link>

      ))}

    </div>
  );
};