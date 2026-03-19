import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/* ================= TYPES ================= */

type HandoverItem = {
  description: string;
};

type ReceiveEvent = {
  receiver_name?: string;
  receiver_relation?: string;
  receive_method?: string;
  created_at?: string;
  timezone_label?: string;
};

type HandoverData = {
  sender_name?: string;
  receiver_target_name?: string;
  status?: string;
  handover_items?: HandoverItem[];
  receive_event?: ReceiveEvent[];
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    paddingTop: 45, // 🔥 sedikit turun biar balance
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },

  header: {
    alignItems: 'center',
    marginBottom: 32, // 🔥 lebih lega dikit
  },

  title: {
    fontSize: 22, // 🔥 turunin dikit biar elegan
    color: '#3A2F2A',
    letterSpacing: 1, // 🔥 tambah karakter
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: '#9A8F88',
  },

  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#ECE7E3', // 🔥 lebih soft
    marginVertical: 14, // 🔥 lebih tight sedikit
  },

  section: {
    marginVertical: 6, // 🔥 lebih compact
  },

  row: {
    flexDirection: 'row',
    marginBottom: 12, // 🔥 lebih rapi
  },

  label: {
    fontSize: 14, // 🔥 sedikit lebih kecil dari value
    color: '#9A8F88',
    width: 140,
  },

  value: {
    fontSize: 15,
    color: '#3A2F2A',
  },

  sectionLabel: {
    fontSize: 13,
    color: '#9A8F88',
    letterSpacing: 2,
    marginBottom: 12,
  },

  sectionLabelDetail: {
    fontSize: 16,
    color: '#9A8F88',
    letterSpacing: 1,
    marginBottom: 14, // 🔥 tambah napas
  },

  packageContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },

  imagePlaceholder: {
    width: 160, // 🔥 sedikit balance dari 170
    height: 160,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    borderRadius: 10,
    marginRight: 20,
  },

  packageList: {
    flex: 1,
    paddingTop: 6, // 🔥 align sama top box
  },

  itemText: {
    fontSize: 15,
    color: '#3A2F2A',
    marginBottom: 8, // 🔥 lebih lega antar item
  },

  closingStatement: {
    marginTop: 22, // 🔥 lebih breathing
    fontSize: 15,
    color: '#3A2F2A',
    lineHeight: 1.6,
  },
});

/* ================= HELPERS ================= */

const formatIndonesianDate = (dateStr?: string): string => {
  if (!dateStr) return "-";

  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatIndonesianTime = (dateStr?: string): string => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');

  return `${h}.${m}`;
};

/* ================= COMPONENT ================= */

const HandoverReceiptPDF = ({ data }: { data: HandoverData }) => {
  const event: ReceiveEvent = data.receive_event?.[0] || {};
  const items: HandoverItem[] = data.handover_items || [];

  const formattedDate = formatIndonesianDate(event.created_at);
  const formattedTime = formatIndonesianTime(event.created_at);
  const tz = event.timezone_label || "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>BUKTI SERAH TERIMA PAKET</Text>
          <Text style={styles.subtitle}>NEST-Paket</Text>
        </View>

        <View style={styles.divider} />

        {/* MAIN INFO */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Pengirim:</Text>
            <Text style={styles.value}>{data.sender_name || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Penerima:</Text>
            <Text style={styles.value}>{data.receiver_target_name || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{data.status || "-"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* RINCIAN */}
        <View style={styles.section}>
          <View style={styles.packageContainer}>
            <View style={styles.imagePlaceholder} />

            <View style={styles.packageList}>
              <Text style={styles.sectionLabel}>RINCIAN PAKET</Text>

              {items.length > 0 ? (
                items.map((item: HandoverItem, i: number) => (
                  <Text key={i} style={styles.itemText}>
                    • {item.description}
                  </Text>
                ))
              ) : (
                <Text style={styles.itemText}>-</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* DETAIL */}
        <View style={styles.section}>
          <Text style={styles.sectionLabelDetail}>DETAIL PENERIMAAN</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Metode:</Text>
            <Text style={styles.value}>{event.receive_method || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Waktu:</Text>
            <Text style={styles.value}>
              {formattedDate} pukul {formattedTime} {tz}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Diterima oleh:</Text>
            <Text style={styles.value}>{event.receiver_name || "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hubungan:</Text>
            <Text style={styles.value}>{event.receiver_relation || "-"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* CLOSING */}
        <Text style={styles.closingStatement}>
          Paket telah diterima oleh {event.receiver_name || "-"} pada tanggal {formattedDate} pukul {formattedTime} {tz} melalui metode {event.receive_method || "-"}.
        </Text>

      </Page>
    </Document>
  );
};

export default HandoverReceiptPDF;