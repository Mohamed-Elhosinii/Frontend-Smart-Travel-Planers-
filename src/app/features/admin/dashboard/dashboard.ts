import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, OverviewStats } from '../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly adminService = inject(AdminService);

  stats: OverviewStats | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = null;
    this.adminService.getOverviewStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard stats:', err);
        this.error = 'Failed to load statistics. Please try again later.';
        this.loading = false;
      }
    });
  }

  // Helper to generate SVG Path for Revenue Line Chart
  getRevenuePath(): string {
    if (!this.stats || this.stats.revenueHistory.length === 0) return '';
    const data = this.stats.revenueHistory;
    const width = 500;
    const height = 150;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => d.revenue), 100);
    const minVal = Math.min(...data.map(d => d.revenue), 0);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
      const y = height - padding - ((d.revenue - minVal) * (height - 2 * padding)) / range;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  // Helper to generate SVG Area Path for Revenue Line Chart (gradient fill)
  getRevenueAreaPath(): string {
    const linePath = this.getRevenuePath();
    if (!linePath) return '';
    const width = 500;
    const height = 150;
    const padding = 20;
    
    // Grab coordinates of first and last points to close the path at the bottom
    const data = this.stats!.revenueHistory;
    const firstX = padding;
    const lastX = padding + (data.length - 1) * ((width - 2 * padding) / (data.length - 1 || 1));
    const bottomY = height - padding;

    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }

  // Helper for user registrations bar positioning
  getBarHeight(count: number): number {
    if (!this.stats || this.stats.userRegistrations.length === 0) return 0;
    const maxCount = Math.max(...this.stats.userRegistrations.map(r => r.count), 1);
    return (count / maxCount) * 100; // Return percentage height
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
