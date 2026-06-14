export interface Destination {
  id: string;
  name: string;
  country: string;
  countryCode: string; 
  description: string;
  imageUrl: string;
  
  badge?: 'TRENDING' | 'LUXURY' | 'POPULAR' | 'BEACH';
}
