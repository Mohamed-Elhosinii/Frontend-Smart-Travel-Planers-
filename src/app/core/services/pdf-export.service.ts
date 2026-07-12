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
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('VANTIO', 20, 18);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(240, 240, 240);
    doc.text('AI-CRAFTED TRAVEL ITINERARY', 20, 24);

    // Right-aligned destination and country
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    const region = trip.country ? `${trip.destination}, ${trip.country}` : trip.destination;
    doc.text(region.toUpperCase(), 190, 18, { align: 'right' });

    // Right-aligned dates
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(240, 240, 240);
    doc.text(`${trip.departureDate} to ${trip.returnDate}`, 190, 24, { align: 'right' });

    // White divider line in the header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(20, 28, 190, 28);

    // Style tags in header
    if (trip.travelStyle && trip.travelStyle.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`STYLE: ${trip.travelStyle.join(' • ').toUpperCase()}`, 20, 36);
    }

    let y = 60;

    // Summary Section
    doc.setTextColor(...PRIMARY);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Trip Overview', 20, y);
    y += 8;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(20, y - 3, 190, y - 3);
    doc.setTextColor(...DARK);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);

    // Budget Overview
    doc.setFont('Helvetica', 'bold');
    doc.text('Budget Details:', 20, y);
    doc.setFont('Helvetica', 'normal');
    const remainingBudget = trip.totalBudget - trip.spentBudget;
    doc.text(
      `Total Budget: $${trip.totalBudget.toFixed(2)}  |  Estimated Cost: $${trip.spentBudget.toFixed(2)}  |  Remaining: $${remainingBudget.toFixed(2)}`,
      25,
      y + 5,
    );
    y += 13;

    // Outbound Flight
    if (trip.flight) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Outbound Flight:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(
        `${trip.flight.airline} (${trip.flight.flightNumber}) | ${trip.flight.departure} -> ${trip.flight.arrival} | ${trip.flight.departureTime} - ${trip.flight.arrivalTime}`,
        25,
        y + 5,
      );
      y += 13;
    }

    // Return Flight
    if (trip.returnFlight) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Return Flight:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(
        `${trip.returnFlight.airline} (${trip.returnFlight.flightNumber}) | ${trip.returnFlight.departure} -> ${trip.returnFlight.arrival} | ${trip.returnFlight.departureTime} - ${trip.returnFlight.arrivalTime}`,
        25,
        y + 5,
      );
      y += 13;
    }

    // Hotel Details
    if (trip.hotel) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Hotel / Accommodation:', 20, y);
      doc.setFont('Helvetica', 'normal');
      const hotelRating = trip.hotel.rating ? `${(trip.hotel.rating / 2).toFixed(1)} / 5` : 'N/A';
      const hotelStarsText = trip.hotel.stars ? ` (${trip.hotel.stars} Stars)` : '';
      doc.text(
        `${trip.hotel.name}${hotelStarsText} | Rating: ${hotelRating} | ${trip.hotel.address}`,
        25,
        y + 5,
      );
      y += 16;
    }

    // Day-by-day Itinerary
    for (const day of trip.days) {
      if (y > 230) {
        doc.addPage();
        y = 25;
      }
      
      // Draw day banner background
      doc.setFillColor(...CREAM);
      doc.rect(20, y, 170, 10, 'F');
      
      // Day title
      doc.setTextColor(...PRIMARY);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Day ${day.dayNumber}: ${day.title} (${day.date})`, 24, y + 6.5);

      // Day Weather Summary
      if (day.weather) {
        doc.setTextColor(...MUTED);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        const weatherText = `${Math.round(day.weather.tempMax)}°C / ${Math.round(day.weather.tempMin)}°C, ${day.weather.condition}`;
        doc.text(weatherText, 186, y + 6.5, { align: 'right' });
      }

      y += 16;

      // Activities
      for (const activity of day.activities) {
        if (y > 265) {
          doc.addPage();
          y = 25;
        }

        // Time on left column
        doc.setTextColor(...PRIMARY);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(activity.time, 20, y);

        // Activity Name / Title & Location Name
        doc.setTextColor(...DARK);
        const nameText = activity.title === activity.locationName || !activity.locationName
          ? activity.title
          : `${activity.title} — ${activity.locationName}`;
        
        const nameLines = doc.splitTextToSize(nameText, 140) as string[];
        doc.text(nameLines, 42, y);

        // Clickable Photo Link on the right side of the name line
        if (activity.imageUrl) {
          doc.setTextColor(...PRIMARY);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          const linkWidth = doc.getTextWidth('[View Photo]');
          doc.textWithLink('[View Photo]', 190 - linkWidth, y, { url: activity.imageUrl });
        }

        const titleHeightOffset = nameLines.length * 4.5;

        // Activity sub-details: Category, Cost, Rating, Address
        let detailsList: string[] = [];
        if (activity.category) detailsList.push(`Category: ${activity.category}`);
        if (activity.cost && activity.cost > 0) detailsList.push(`Est. Cost: $${activity.cost}`);
        if (activity.rating) detailsList.push(`Rating: ${activity.rating} stars`);
        if (activity.address) detailsList.push(`Address: ${activity.address}`);

        if (detailsList.length > 0) {
          doc.setTextColor(...MUTED);
          doc.setFont('Helvetica', 'oblique');
          doc.setFontSize(8);
          doc.text(detailsList.join('  |  '), 42, y + titleHeightOffset + 1);
        }

        // Description
        doc.setTextColor(...DARK);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        const descLines = doc.splitTextToSize(activity.description, 140) as string[];
        const descStartOffset = titleHeightOffset + (detailsList.length > 0 ? 5 : 2);
        
        doc.text(descLines, 42, y + descStartOffset);
        y += descStartOffset + descLines.length * 4.5 + 6;
      }
      y += 6;
    }

    // Add page numbers and footer tagline to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Draw footer line
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.25);
      doc.line(20, 282, 190, 282);
      
      // Page number text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
      
      // Tagline on bottom-left
      doc.text('Plan your next journey with Vantio', 20, 287);
    }

    doc.save(`Itinerary_${trip.destination.replace(/\s+/g, '_')}.pdf`);
  }
}
