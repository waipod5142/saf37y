import { useState, useEffect } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    timestamp: null,
  });

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 300000, // 5 minutes
    ...options,
  };

  const getCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS or network connection.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location.';
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      defaultOptions
    );
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const reset = () => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
      timestamp: null,
    });
  };

  return {
    ...state,
    getCurrentLocation,
    clearError,
    reset,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}