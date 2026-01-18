import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Decision {
    id: string;
    type: string;
    question: string;
    optionLabel: string;
    createdAt: string;
}

export interface ProjectSummary {
    northGoal: string;
    totalDecisions: number;
    dateRange: {
        start: string;
        end: string;
    };
    stats?: {
        coherence?: number;
        drift?: number;
        velocity?: number;
    };
}

/**
 * Export decision history to PDF
 * 
 * @param decisions - Array of decision objects
 * @param summary - Project summary information
 * @returns jsPDF document ready to save/download
 */
export async function exportDecisionsToPDF(
    decisions: Decision[],
    summary: ProjectSummary
): Promise<jsPDF> {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Decision History Report', 14, 20);

    // Subtitle - Project Goal
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Project Goal:', 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(60);
    const goalLines = doc.splitTextToSize(summary.northGoal, 180);
    doc.text(goalLines, 14, 36);

    const goalHeight = goalLines.length * 5;

    // Metadata
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 44 + goalHeight);
    doc.text(`Total Decisions: ${summary.totalDecisions}`, 14, 49 + goalHeight);

    // Line separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 54 + goalHeight, 196, 54 + goalHeight);

    // Decisions Table
    if (decisions.length > 0) {
        autoTable(doc, {
            startY: 60 + goalHeight,
            head: [['Date', 'Type', 'Question', 'Selected Option']],
            body: decisions.map(d => [
                new Date(d.createdAt).toLocaleDateString(),
                d.type,
                d.question.length > 50 ? d.question.substring(0, 47) + '...' : d.question,
                d.optionLabel.length > 30 ? d.optionLabel.substring(0, 27) + '...' : d.optionLabel,
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [100, 100, 180],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 250],
            },
            margin: { top: 60 + goalHeight },
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('No decisions recorded yet.', 14, 70 + goalHeight);
    }

    // Summary Statistics (if available)
    if (summary.stats) {
        const finalY = (doc as any).lastAutoTable?.finalY || 70 + goalHeight;

        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text('Project Metrics', 14, finalY + 15);

        doc.setFontSize(10);
        doc.setTextColor(60);

        let statsY = finalY + 22;

        if (summary.stats.coherence !== undefined) {
            doc.text(`Coherence Score: ${Math.round(summary.stats.coherence)}%`, 14, statsY);
            statsY += 6;
        }

        if (summary.stats.drift !== undefined) {
            doc.text(`Drift: ${Math.round(summary.stats.drift)}%`, 14, statsY);
            statsY += 6;
        }

        if (summary.stats.velocity !== undefined) {
            doc.text(`Velocity: ${summary.stats.velocity.toFixed(1)} actions/day`, 14, statsY);
        }
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc;
}

/**
 * Generate filename for PDF export
 */
export function generatePDFFilename(projectName?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const name = projectName ? projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'project';
    return `${name}_decisions_${timestamp}.pdf`;
}
