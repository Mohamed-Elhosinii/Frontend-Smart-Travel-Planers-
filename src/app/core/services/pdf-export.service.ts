import { Injectable } from '@angular/core';
import { UserTrip } from '../models';

// Brand palette as RGB tuples for jsPDF (mirrors the CSS design tokens).
const PRIMARY: [number, number, number] = [181, 67, 4]; // --primary-orange
const DARK: [number, number, number] = [38, 24, 20]; // --text-deep
const MUTED: [number, number, number] = [107, 107, 107]; // --text-muted
const BORDER: [number, number, number] = [232, 221, 214]; // --border-color
const CREAM: [number, number, number] = [248, 244, 238];

/**
 * Renders a trip itinerary to a downloadable PDF using jsPDF.
 *
 * jsPDF is dynamically imported so it never loads during SSR and stays out of
 * the initial bundle. Emoji are intentionally omitted from the document because
 * jsPDF's core fonts cannot render them (they would appear as blank glyphs).
 * Errors propagate to the caller so it can surface user feedback.
 */
@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportTrip(trip: UserTrip): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // Header band
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('TRIPMIND ITINERARY', 20, 18);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(13);
    const region = trip.country ? `${trip.destination}, ${trip.country}` : trip.destination;
    doc.text(`${region} — ${trip.departureDate} to ${trip.returnDate}`, 20, 28);

    let y = 55;

    // Summary
    doc.setTextColor(...PRIMARY);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Summary', 20, y);
    y += 8;
    doc.setDrawColor(...BORDER);
    doc.line(20, y - 3, 190, y - 3);
    doc.setTextColor(...DARK);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);

    if (trip.flight) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Flight:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(
        `${trip.flight.airline} (${trip.flight.flightNumber}) | ${trip.flight.departure} -> ${trip.flight.arrival} | ${trip.flight.departureTime} - ${trip.flight.arrivalTime}`,
        25,
        y + 5,
      );
      y += 13;
    }

    if (trip.hotel) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Hotel:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${trip.hotel.name} | ${trip.hotel.address} | Rating: ${trip.hotel.rating}/10`, 25, y + 5);
      y += 15;
    }

    // Day-by-day
    for (const day of trip.days) {
      if (y > 240) {
        doc.addPage();
        y = 25;
      }
      doc.setFillColor(...CREAM);
      doc.rect(20, y, 170, 10, 'F');
      doc.setTextColor(...PRIMARY);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Day ${day.dayNumber}: ${day.title} (${day.date})`, 24, y + 6.5);
      y += 16;

      for (const activity of day.activities) {
        if (y > 270) {
          doc.addPage();
          y = 25;
        }
        doc.setTextColor(...PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(activity.time, 20, y);

        doc.setTextColor(...DARK);
        doc.text(activity.locationName, 42, y);

        doc.setTextColor(...MUTED);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        const descLines = doc.splitTextToSize(activity.description, 140) as string[];
        doc.text(descLines, 42, y + 4.5);
        y += descLines.length * 4.5 + 6;
      }
      y += 6;
    }

    doc.save(`Itinerary_${trip.destination.replace(/\s+/g, '_')}.pdf`);
  }
}
