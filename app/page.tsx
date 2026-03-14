export default function Home() {
  return (
    <main
      style={{
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
        background: "#FAFAFA",
        color: "#111",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "24px 24px 60px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <img
          src="/logo-nest-paket.png"
          style={{ width: "160px", marginBottom: "5px" }}
        />

        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#6b7280",
            marginBottom: "24px",
          }}
        >
          NEST Paket
        </div>

        <h1
          style={{
            fontSize: "34px",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: "0 0 20px 0",
            letterSpacing: "-0.02em",
            maxWidth: "300px",
          }}
        >
          Serah terima barang sekarang lebih tenang.
        </h1>

        <p
          style={{
            fontSize: "17px",
            lineHeight: 1.6,
            color: "#4b5563",
            margin: "0 0 36px 0",
            maxWidth: "320px",
          }}
        >
          Tanda terima digital gratis. No tipu-tipu.
        </p>

        <a
          href="/create"
          style={{
            background: "#1e3a8a",
            color: "white",
            padding: "18px 32px",
            borderRadius: "16px",
            fontWeight: 600,
            fontSize: "16px",
            textDecoration: "none",
            boxShadow:
              "0 8px 20px rgba(30,58,138,0.18),0 2px 4px rgba(0,0,0,0.08)",
          }}
        >
          Buat Serah Terima
        </a>

        <div
          style={{
            marginTop: "48px",
            width: "100%",
            maxWidth: "320px",
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>
            Mudah banget, cocok buat
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 16px",
              fontSize: "15px",
            }}
          >
            <div>📦 Titip paket</div>
            <div>🧺 Laundry</div>
            <div>📄 Dokumen</div>
            <div>🏢 Barang kantor</div>
          </div>
        </div>
      </div>
    </main>
  );
}