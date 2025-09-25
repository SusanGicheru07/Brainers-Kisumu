import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import { Hospital, User, Mail, MapPin, Phone, Building } from 'lucide-react';

const HospitalSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    county: '',
    sub_county: '',
    ward: '',
    phone: '',
    email: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const locationData = [
    { county: 'Uasin Gishu County', sub_county: 'Ainabkoi Sub County', ward: 'Kapsoya Ward' },
    { county: 'Nairobi County', sub_county: 'Langata Sub County', ward: 'Nairobi West Ward' },
    { county: 'Uasin Gishu County', sub_county: 'Ainabkoi Sub County', ward: 'Ainabkoi/Olare Ward' },
    { county: 'Nairobi County', sub_county: 'Roysambu Sub County', ward: 'Kahawa Ward' },
    { county: 'Nairobi County', sub_county: 'Embakasi Central Sub County', ward: 'Kayole North Ward' },
    { county: 'Nairobi County', sub_county: 'Embakasi Central Sub County', ward: 'Kayole South Ward' },
    { county: 'Nakuru County', sub_county: 'Njoro Sub County', ward: 'Mau Narok Ward' },
    { county: 'Nakuru County', sub_county: 'Rongai Sub County', ward: 'Soin Ward' },
    { county: 'Nakuru County', sub_county: 'Subukia Sub County', ward: 'Kabazi Ward' },
    { county: 'Nakuru County', sub_county: 'Nakuru East Sub County', ward: 'Nakuru East Ward' },
    { county: 'Uasin Gishu County', sub_county: 'Turbo Sub County', ward: 'Kiplombe Ward' },
    { county: 'Nakuru County', sub_county: 'Naivasha Sub County', ward: 'Viwandani Ward' },
    { county: 'Nakuru County', sub_county: 'Nakuru East Sub County', ward: 'Biashara Ward' },
    { county: 'Nairobi County', sub_county: 'Kibra Sub County', ward: 'Woodley/Kenyatta Golf Course Ward' },
    { county: 'Nairobi County', sub_county: 'Kasarani Sub County', ward: 'Njiru Ward' },
    { county: 'Uasin Gishu County', sub_county: 'Moiben Sub County', ward: 'Kimumu Ward' },
  ];

  // Get unique counties
  const counties = [...new Set(locationData.map(item => item.county))];

  // Get sub-counties for selected county
  const getSubCounties = (selectedCounty) => {
    return [...new Set(locationData.filter(item => item.county === selectedCounty).map(item => item.sub_county))];
  };

  // Get wards for selected sub-county
  const getWards = (selectedCounty, selectedSubCounty) => {
    return locationData.filter(item => item.county === selectedCounty && item.sub_county === selectedSubCounty).map(item => item.ward);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset dependent fields when county changes
    if (name === 'county') {
      setFormData({
        ...formData,
        [name]: value,
        sub_county: '',
        ward: '',
      });
    }
    // Reset ward when sub_county changes
    else if (name === 'sub_county') {
      setFormData({
        ...formData,
        [name]: value,
        ward: '',
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.hospitalSignup(formData);
      navigate('/login', {
        state: {
          message: 'Hospital registration successful! Please log in with your credentials.'
        }
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-teal-500 rounded-lg flex items-center justify-center">
                <Hospital className="h-8 w-8 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">Matricare</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Register Your Hospital</h2>
          <p className="text-gray-600">Create an account to manage your hospital's operations.</p>
        </div>

        <div className="bg-white shadow-soft rounded-2xl border border-gray-100 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hospital Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter hospital name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* County */}
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="county"
                  id="county"
                  required
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 bg-white appearance-none"
                >
                  <option value="">Select County</option>
                  {counties.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sub County */}
            <div>
              <label htmlFor="sub_county" className="block text-sm font-medium text-gray-700 mb-2">
                Sub County
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="sub_county"
                  id="sub_county"
                  required
                  value={formData.sub_county}
                  onChange={handleChange}
                  disabled={!formData.county}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Sub County</option>
                  {formData.county && getSubCounties(formData.county).map((subCounty) => (
                    <option key={subCounty} value={subCounty}>
                      {subCounty}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Ward */}
            <div>
              <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                Ward
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="ward"
                  id="ward"
                  required
                  value={formData.ward}
                  onChange={handleChange}
                  disabled={!formData.sub_county}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Ward</option>
                  {formData.county && formData.sub_county && getWards(formData.county, formData.sub_county).map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Hospital phone number"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Hospital email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Registering Hospital...
                  </div>
                ) : (
                  'Register Hospital'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSignup;