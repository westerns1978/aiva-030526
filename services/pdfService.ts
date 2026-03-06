
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { type ChatMessage, MessageRole } from '../types';

/**
 * Downloads a specific HTML element as a PDF, preserving its style.
 * @param element The HTML element to capture.
 * @param filename The desired name of the downloaded PDF file.
 */
export async function downloadMessageAsPdf(element: HTMLElement, filename: string): Promise<void> {
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            backgroundColor: null, // Use transparent background
            useCORS: true,
        });

        const imageData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(filename);
    } catch (error) {
        console.error("Error generating PDF from element:", error);
        throw new Error("Sorry, there was an error creating the PDF. Please try again.", { cause: error });
    }
}

/**
 * Downloads the entire chat history as a text-based PDF.
 * @param messages The array of chat messages.
 * @param filename The desired name of the downloaded PDF file.
 */
export function downloadChatAsPdf(messages: ChatMessage[], filename: string): void {
    try {
        const pdf = new jsPDF();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;
        let yPos = margin;

        pdf.setFont("helvetica", "bold");
        pdf.text("Aiva Chat History - Afridroids Onboarding", margin, yPos);
        yPos += 20;
        
        messages.forEach(message => {
            const prefix = message.role === MessageRole.MODEL ? "[AIVA]" : "[USER]";
            
            // Add space before next message block
            if (yPos > margin + 20) {
                yPos += 10;
            }

            // Check for page break before adding new content
            if (yPos > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                yPos = margin;
            }

            pdf.setFont("helvetica", "bold");
            let content = `${prefix}`;
            if (message.attachment) {
                content += ` (Attachment: ${message.attachment.type})`;
            }
            pdf.text(content, margin, yPos);
            yPos += 12;

            pdf.setFont("helvetica", "normal");
            const textLines = pdf.splitTextToSize(message.content, maxLineWidth);
            
            pdf.text(textLines, margin, yPos);
            yPos += textLines.length * 10;
        });

        pdf.save(filename);
    } catch (error) {
        console.error("Error generating chat PDF:", error);
        throw new Error("Sorry, there was an error creating the chat summary PDF.", { cause: error });
    }
}