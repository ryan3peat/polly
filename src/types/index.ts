export interface StyleItem {
  id: string;
  headline: string;
  image_url: string;
  summary: string;
  source_name: string;
  source_url: string;
  category: 'Celebrity' | 'Trend' | 'Shopping';
  created_at: string;
  is_saved: boolean;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  saving: string;
  expiry_date: string;
  booking_url: string;
  category: 'Dining' | 'Flights';
  source_name: string;
  created_at: string;
}
