import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PrintOptions {
    documentTitle?: string;
    pageSize?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
}

export interface PDFOptions extends PrintOptions {
    filename?: string;
    scale?: number;
}

export function usePrintExport() {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Document',
    });

    const exportToPDF = async (options: PDFOptions = {}) => {
        if (!printRef.current) {
            console.error('Print ref not attached');
            return;
        }

        const {
            filename = 'document.pdf',
            pageSize = 'a4',
            orientation = 'portrait',
            scale = 2,
        } = options;

        try {
            const canvas = await html2canvas(printRef.current, {
                scale,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF(orientation, 'mm', pageSize);

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(filename);
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            return false;
        }
    };

    const printWithOptions = (options: PrintOptions = {}) => {
        if (!printRef.current) {
            console.error('Print ref not attached');
            return;
        }

        const { documentTitle = 'Document' } = options;

        const printInstance = useReactToPrint({
            contentRef: printRef,
            documentTitle,
        });

        printInstance();
    };

    return {
        printRef,
        handlePrint,
        exportToPDF,
        printWithOptions,
    };
}

export default usePrintExport;
