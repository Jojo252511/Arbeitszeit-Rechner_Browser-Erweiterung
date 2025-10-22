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
    showToast('PDF wird generiert (Seite 1)...', 'info', 10000);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.width = "800"; 
    iframe.src = '/Logbook.html';
    document.body.appendChild(iframe);

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    iframe.onload = async () => {
        await wait(750); 

        try {
            const printDocument = iframe.contentDocument;
            if (!printDocument) throw new Error("Iframe-Inhalt konnte nicht geladen werden.");
            
            const titleElement = printDocument.querySelector('#logbook-card h2') as HTMLElement;
            const logItems = printDocument.querySelectorAll('.log-item') as NodeListOf<HTMLElement>;

            if (!titleElement || logItems.length === 0) {
                throw new Error("Logbuch-Titel oder -Einträge nicht im Iframe gefunden.");
            }
            
            const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfPageWidth = pdf.internal.pageSize.getWidth();
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pdfPageWidth - (margin * 2);
            const pageBreakThreshold = pdfPageHeight - margin; 
            
            let currentY = margin;
            let pageCount = 1;

            const titleCanvas = await html2canvas(titleElement, { scale: 2, backgroundColor: '#ffffff' });
            const titleRatio = titleCanvas.width / titleCanvas.height;
            const titleHeight = contentWidth / titleRatio;
            
            pdf.addImage(titleCanvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, titleHeight);
            currentY += titleHeight + 5;

            for (let i = 0; i < logItems.length; i++) {
                const item = logItems[i];
                
                if (i > 0 && i % 15 === 0) { 
                     showToast(`PDF wird generiert (Seite ${pageCount})...`, 'info', 3000);
                }

                const canvas = await html2canvas(item, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                });

                const ratio = canvas.width / canvas.height;
                const scaledHeight = contentWidth / ratio;
                const itemGap = 2; 

                if (currentY + scaledHeight + itemGap > pageBreakThreshold) {
                    pdf.addPage();
                    pageCount++;
                    currentY = margin;
                }
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, scaledHeight);
                currentY += scaledHeight + itemGap;
            }
            pdf.save('Arbeitszeit-Logbuch.pdf');
            showToast('PDF erfolgreich exportiert!', 'success');

        } catch (error) {
            console.error("PDF generation error:", error);
            const errorMsg = (error instanceof Error) ? error.message : 'Ein Fehler ist beim Erstellen des PDFs aufgetreten.';
            showToast(errorMsg, 'error', 4000);
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