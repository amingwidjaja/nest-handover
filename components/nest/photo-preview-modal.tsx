"use client"

type PhotoPreviewModalProps = {
  previewUrl: string
  onConfirm: () => void
  onRetake: () => void
}

export function PhotoPreviewModal({ previewUrl, onConfirm, onRetake }: PhotoPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/80 px-6">
      <p className="text-[12px] font-medium text-white mb-4">Preview Foto</p>
      <div className="w-full max-w-sm aspect-square overflow-hidden rounded-xl">
        <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
      </div>
      <p className="text-[12px] text-white mt-3 text-center">
        Foto akan dipotong menjadi kotak seperti di atas
      </p>
      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 py-3.5 rounded-xl border border-white/20 text-[12px] font-medium text-white active:scale-[0.97] transition-transform"
        >
          Ambil Ulang
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-[2] py-3.5 rounded-xl bg-[#FAF9F6] text-[12px] font-bold uppercase tracking-wider text-[#3E2723] active:scale-[0.97] transition-transform"
        >
          Gunakan Foto →
        </button>
      </div>
    </div>
  )
}
