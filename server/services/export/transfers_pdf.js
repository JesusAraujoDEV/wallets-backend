'use strict';

const dayjs = require('dayjs');
let reactPdf; try { reactPdf = require('@react-pdf/renderer'); } catch (_) { reactPdf = null; }
const React = reactPdf ? require('react') : null;

async function createTransfersPdfBuffer({ rows }) {
  const { pdf, Document, Page, Text, View, StyleSheet } = reactPdf;
  const h = React.createElement;
  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 9, color: '#111827', fontFamily: 'Helvetica' },
    title: { fontSize: 16, textAlign: 'center', marginBottom: 6, fontWeight: 700 },
    meta: { fontSize: 9, textAlign: 'center', color: '#6B7280', marginBottom: 12 },
    table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6 },
    headerRow: { flexDirection: 'row', backgroundColor: '#111827', color: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 6 },
    row: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    rowAlt: { backgroundColor: '#F9FAFB' },
    cell: { paddingRight: 4 },
    colId: { width: 30 },
    colDate: { width: 50 },
    colFrom: { width: 70 },
    colTo: { width: 70 },
    colCurr: { width: 26 },
    colAmount: { width: 55, textAlign: 'right' },
    colCommission: { width: 55, textAlign: 'right' },
    colConcept: { width: 90 },
    colCreated: { width: 70 },
  });

  const headerCells = [
    h(Text, { style: [styles.cell, styles.colId] }, 'id'),
    h(Text, { style: [styles.cell, styles.colDate] }, 'date'),
    h(Text, { style: [styles.cell, styles.colFrom] }, 'from'),
    h(Text, { style: [styles.cell, styles.colTo] }, 'to'),
    h(Text, { style: [styles.cell, styles.colCurr] }, 'curr'),
    h(Text, { style: [styles.cell, styles.colAmount] }, 'amount'),
    h(Text, { style: [styles.cell, styles.colCommission] }, 'commission'),
    h(Text, { style: [styles.cell, styles.colConcept] }, 'concept'),
    h(Text, { style: [styles.cell, styles.colCreated] }, 'created_by'),
  ];

  const rowsElements = rows.map((r, idx) => h(View, { key: String(r.id ?? idx), style: [styles.row, idx % 2 ? styles.rowAlt : null] }, [
    h(Text, { style: [styles.cell, styles.colId] }, String(r.id ?? '')),
    h(Text, { style: [styles.cell, styles.colDate] }, String(r.date ?? '')),
    h(Text, { style: [styles.cell, styles.colFrom] }, String(r.from_account ?? '')),
    h(Text, { style: [styles.cell, styles.colTo] }, String(r.to_account ?? '')),
    h(Text, { style: [styles.cell, styles.colCurr] }, String(r.currency ?? '')),
    h(Text, { style: [styles.cell, styles.colAmount] }, String(r.amount ?? '')),
    h(Text, { style: [styles.cell, styles.colCommission] }, r.commission ? String(r.commission) : '-'),
    h(Text, { style: [styles.cell, styles.colConcept] }, String(r.concept ?? '')),
    h(Text, { style: [styles.cell, styles.colCreated] }, String(r.created_by ?? '')),
  ]));

  const doc = h(Document, null,
    h(Page, { size: 'A4', style: styles.page }, [
      h(Text, { style: styles.title }, 'Transfers Report'),
      h(Text, { style: styles.meta }, `Generado ${dayjs().format('YYYY-MM-DD HH:mm')}`),
      h(View, { style: styles.table }, [
        h(View, { style: styles.headerRow }, headerCells),
        ...rowsElements,
      ]),
    ]),
  );

  const buffer = await pdf(doc).toBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

module.exports = { createTransfersPdfBuffer, reactPdf, React };
