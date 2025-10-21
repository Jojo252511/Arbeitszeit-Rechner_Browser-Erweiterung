// scripts/exportLog.ts

import { type LogEntry, getLog } from './logbook-data.js';
import { formatMinutesToString, showPrompt, showToast } from './utils.js';

declare const html2canvas: any;
declare const jspdf: any;

/**
 * Löst den Export-Dialog aus und verarbeitet die Auswahl des Nutzers.
 */
export async function handleExport(): Promise<void> {
    const logData = await getLog();
    if (logData.length === 0) {
        showToast('Das Logbuch ist leer. Es gibt nichts zu exportieren.', 'info');
        return;
    }

    const format = await showPrompt(
        "Exportformat wählen",
        "In welchem Format möchtest du das Logbuch exportieren?",
        ['json', 'csv', 'pdf']
    );

    if (format === null) return;

    switch (format) {
        case 'json':
            exportAsJson(logData);
            break;
        case 'csv':
            exportAsCsv(logData);
            break;
        case 'pdf':
            await exportAsPdf();
            break;
    }
}

function exportAsJson(logData: LogEntry[]): void {
    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, 'arbeitszeit-logbuch.json');
}

function exportAsCsv(logData: LogEntry[]): void {
    const header = 'Datum;Kommen;Gehen;Tagessaldo;Typ\n';
    const rows = logData.map(entry => {
        const saldoPrefix = entry.dailySaldoMinutes >= 0 ? '+' : '';
        const formattedSaldo = saldoPrefix + formatMinutesToString(entry.dailySaldoMinutes);
        return `${entry.date};${entry.arrival};${entry.leaving};"${formattedSaldo}";${entry.label || 'Arbeit'}`;
    }).join('\n');

    const csvString = header + rows;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'arbeitszeit-logbuch.csv');
}

async function exportAsPdf(): Promise<void> {
    showToast('PDF wird generiert...', 'info', 2000);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.src = '/Print/index.html';
    document.body.appendChild(iframe);

    iframe.onload = async () => {
        try {
            const printDocument = iframe.contentDocument;
            if (!printDocument) throw new Error("Iframe-Inhalt konnte nicht geladen werden.");
            
            const printContent = printDocument.getElementById('print-content');
            if (!printContent) throw new Error("Druckbarer Inhalt nicht im Iframe gefunden.");

            const printControls = printDocument.querySelector('.print-controls') as HTMLElement;
            if (printControls) printControls.style.display = 'none';

            const canvas = await html2canvas(printContent, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            
            let imgWidth = pdfWidth;
            let imgHeight = imgWidth / ratio;
            
            if (imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save('Arbeitszeit-Logbuch.pdf');
        } catch (error) {
            console.error("PDF generation error:", error);
            showToast('Ein Fehler ist beim Erstellen des PDFs aufgetreten.', 'error');
        } finally {
            document.body.removeChild(iframe);
        }
    };
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}