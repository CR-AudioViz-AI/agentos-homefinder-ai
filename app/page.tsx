'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Search, MapPin, Home, Building2, Warehouse, Key,
  Bed, Bath, Maximize, DollarSign, TrendingUp, Star,
  Phone, Mail, Calendar, ArrowRight, Filter, X
} from 'lucide-react';

const supabase = createClient(
  'https://kteobfyferrukqeolofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZW9iZnlmZXJydWtxZW9sb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTcyNjYsImV4cCI6MjA3NzU1NzI2Nn0.uy-jlF_z6qVb8qogsNyGDLHqT4HhmdRhLrW7zPv3qhY'
);

interface Property {
  id: string;
  category: string;
  property_type: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  primary_photo_url: string | null;
  agent_id: string | null;
}

export default function HomeFinderAI() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceMax, setPriceMax] = useState(5000000);
  const [bedsMin, setBedsMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const floridaCities = [
    'Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Myers',
    'Naples', 'Sarasota', 'Tallahassee', 'Fort Lauderdale', 'West Palm Beach'
  ];

  useEffect(() => {
    loadProperties();
  }, [selectedCategory, priceMax, bedsMin]);

  async function loadProperties() {
    try {
      // Load all publicly visible properties
      let query = supabase
        .from('properties')
        .select('*')
        .eq('visible_on_homefinder', true)
        .eq('status', 'active')
        .lte('list_price', priceMax)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (bedsMin > 0) {
        query = query.gte('bedrooms', bedsMin);
      }

      const { data } = await query.limit(100);
      setProperties(data || []);

      // Load featured properties
      const { data: featured } = await supabase
        .from('properties')
        .select('*')
        .eq('homefinder_featured', true)
        .eq('status', 'active')
        .limit(6);

      setFeaturedProperties(featured || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitContactForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      // Create lead in homefinder_leads table
      await supabase.from('homefinder_leads').insert({
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        interested_property_id: selectedProperty?.id,
        search_criteria: {
          category: selectedCategory,
          max_price: priceMax,
          min_beds: bedsMin,
          location: searchLocation
        },
        status: 'new'
      });

      alert('Thank you! An agent will contact you shortly.');
      setShowContactForm(false);
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Error submitting form. Please try again.');
    }
  }

  const filteredProperties = properties.filter(p =>
    searchLocation === '' ||
    p.city.toLowerCase().includes(searchLocation.toLowerCase()) ||
    p.address_line1.toLowerCase().includes(searchLocation.toLowerCase()) ||
    p.zip_code.includes(searchLocation)
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">HomeFinder AI</h1>
            <p className="text-xl text-blue-100">Find Your Perfect Property in Florida</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Location Search */}
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, ZIP, or Address..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">All Types</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="rental">Rental</option>
                  <option value="land">Land</option>
                  <option value="vacation">Vacation</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <select
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="500000">$500K</option>
                  <option value="1000000">$1M</option>
                  <option value="2000000">$2M</option>
                  <option value="5000000">$5M+</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Beds
                    </label>
                    <select
                      value={bedsMin}
                      onChange={(e) => setBedsMin(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="0">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick City Links */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Cities:</h3>
          <div className="flex flex-wrap gap-2">
            {floridaCities.map((city) => (
              <button
                key={city}
                onClick={() => setSearchLocation(city)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm text-gray-700"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Featured Properties */}
        {featuredProperties.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Properties</h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onContactClick={() => {
                    setSelectedProperty(property);
                    setShowContactForm(true);
                  }}
                  featured={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Properties */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProperties.length} Properties Available
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onContactClick={() => {
                    setSelectedProperty(property);
                    setShowContactForm(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Agent</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitContactForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface PropertyCardProps {
  property: Property;
  onContactClick: () => void;
  featured?: boolean;
}

function PropertyCard({ property, onContactClick, featured = false }: PropertyCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-all ${
      featured ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'
    }`}>
      {featured && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Featured
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
        <Home className="w-16 h-16 text-blue-600 opacity-50" />
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-xl text-gray-900">
            ${property.list_price.toLocaleString()}
          </h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
            {property.category.replace('_', ' ')}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-1">{property.address_line1}</p>
        <p className="text-sm text-gray-500 mb-3">
          {property.city}, {property.state} {property.zip_code}
        </p>

        {property.bedrooms && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms} bed</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms} bath</span>
            </div>
            {property.square_feet && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Maximize className="w-4 h-4" />
                <span>{property.square_feet.toLocaleString()} sqft</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onContactClick}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Contact Agent
        </button>
      </div>
    </div>
  );
}
