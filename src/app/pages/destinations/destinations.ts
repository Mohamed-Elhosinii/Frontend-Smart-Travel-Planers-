import { Component, OnInit } from '@angular/core';
import { DestinationCard } from '../../components/destination-card/destination-card';
import { Category } from '../../interfaces/category';
import { RouterLink } from '@angular/router';

import { Destination } from '../../interfaces/destination';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-destinations',
  imports: [DestinationCard, RouterLink, FormsModule, CommonModule],
  templateUrl: './destinations.html',
  styleUrl: './destinations.css',
})
export class Destinations implements OnInit {
  get sectionTitle(): string {
    switch (this.selectedCategory) {
      case 'beach':
        return 'Beach Destinations';
      case 'cities':
        return 'City Destinations';
      case 'adventure':
        return 'Adventure Destinations';
      case 'luxury':
        return 'Luxury Destinations';
      default:
        return 'Popular Destinations';
    }
  }
  categories: Category[] = [
    { id: 'popular', label: 'POPULAR' },
    { id: 'beach', label: 'BEACH' },
    { id: 'cities', label: 'CITIES' },
    { id: 'adventure', label: 'ADVENTURE' },
    { id: 'luxury', label: 'LUXURY' },
  ];

  selectedCategory: string = 'popular';

  selectCategory(id: string) {
    this.selectedCategory = id;

    if (id === 'popular') {
      this.filteredDestinations = this.destinations.filter((d) => d.badge === 'POPULAR');
    } else {
      this.filteredDestinations = this.destinations.filter((d) => d.badge?.toLowerCase() === id);
    }
  }
  //search
  searchText: string = '';

  destinations: Destination[] = [];
  filteredDestinations: Destination[] = [];

  ngOnInit() {
    this.destinations = [
      {
        id: '1',
        name: 'Paris',
        country: 'France',
        countryCode: 'FR',
        description: 'The city of light and romance.',
        imageUrl: '/images/paris.jpg',
        badge: 'POPULAR',
      },
      {
        id: '2',
        name: 'Rome',
        country: 'Italy',
        countryCode: 'IT',
        description: 'Ancient history and stunning architecture.',
        imageUrl: '/images/Rome.jpg',
        badge: 'TRENDING',
      },
      {
        id: '3',
        name: 'Dubai',
        country: 'UAE',
        countryCode: 'AE',
        description: 'Luxury lifestyle and modern skyline.',
        imageUrl: '/images/dubai.jpg',
        badge: 'LUXURY',
      },
      {
        id: '4',
        name: 'New York',
        country: 'USA',
        countryCode: 'US',
        description: 'The city that never sleeps.',
        imageUrl: '/images/newyork.jpg',
        badge: 'POPULAR',
      },
      {
        id: '5',
        name: 'Tokyo',
        country: 'Japan',
        countryCode: 'JP',
        description: 'A perfect mix of tradition and technology.',
        imageUrl: '/images/tokyo.jpg',
        badge: 'TRENDING',
      },
      {
        id: '6',
        name: 'London',
        country: 'United Kingdom',
        countryCode: 'GB',
        description: 'Historic landmarks and modern culture.',
        imageUrl: '/images/london.jpg',
        badge: 'POPULAR',
      },
      {
        id: '7',
        name: 'Barcelona',
        country: 'Spain',
        countryCode: 'ES',
        description: 'Art, architecture, and vibrant streets.',
        imageUrl: '/images/barcelona.jpg',
        badge: 'BEACH',
      },
      {
        id: '8',
        name: 'Cairo',
        country: 'Egypt',
        countryCode: 'EG',
        description: 'Home of the pyramids and ancient civilization.',
        imageUrl: '/images/cairo.jpg',
        badge: 'POPULAR',
      },
      {
        id: '9',
        name: 'Istanbul',
        country: 'Turkey',
        countryCode: 'TR',
        description: 'Where East meets West.',
        imageUrl: '/images/istanbul.jpg',
        badge: 'POPULAR',
      },
      {
        id: '10',
        name: 'Bali',
        country: 'Indonesia',
        countryCode: 'ID',
        description: 'Tropical paradise and beaches.',
        imageUrl: '/images/bali.jpg',
        badge: 'BEACH',
      },
      {
        id: '11',
        name: 'Santorini',
        country: 'Greece',
        countryCode: 'GR',
        description: 'White houses and stunning sea views.',
        imageUrl: '/images/santorini.jpg',
        badge: 'POPULAR',
      },
      {
        id: '12',
        name: 'Maldives',
        country: 'Maldives',
        countryCode: 'MV',
        description: 'Crystal clear water and luxury resorts.',
        imageUrl: '/images/maldives.jpg',
        badge: 'BEACH',
      },
      {
        id: '13',
        name: 'Singapore',
        country: 'Singapore',
        countryCode: 'SG',
        description: 'Modern city with futuristic attractions.',
        imageUrl: '/images/singapore.jpg',
        badge: 'POPULAR',
      },
      {
        id: '14',
        name: 'Los Angeles',
        country: 'USA',
        countryCode: 'US',
        description: 'Hollywood, beaches, and vibrant lifestyle.',
        imageUrl: '/images/losangeles.jpg',
        badge: 'POPULAR',
      },
      {
        id: '15',
        name: 'Amsterdam',
        country: 'Netherlands',
        countryCode: 'NL',
        description: 'Canals, bikes, and charming streets.',
        imageUrl: '/images/amsterdam.jpg',
        badge: 'POPULAR',
      },
    ];
    this.filteredDestinations = this.destinations.filter((d) => d.badge === 'POPULAR');
  }
  //search
  isSearching: boolean = false;
  onSearch() {
    const text = this.searchText.toLowerCase().trim();

    if (text) {
      this.isSearching = true;

      this.filteredDestinations = this.destinations.filter(
        (d) => d.name.toLowerCase().includes(text) || d.country.toLowerCase().includes(text),
      );
    } else {
      this.isSearching = false;
      this.filteredDestinations = this.destinations;
    }
  }
}
