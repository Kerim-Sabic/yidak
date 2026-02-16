'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { JobDraftLocation } from '@/components/blocks/job-posting/types';
import type { GCCCountry } from '@yidak/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';


interface LocationPickerLabels {
  searchPlaceholder: string;
  useCurrentLocation: string;
  addressLabel: string;
  cityLabel: string;
  areaLabel: string;
  buildingLabel: string;
  countryLabel: string;
  geolocationError: string;
}

interface CountryOption {
  code: GCCCountry;
  label: string;
}

interface LocationPickerProps {
  value: JobDraftLocation;
  labels: LocationPickerLabels;
  cityOptions: ReadonlyArray<string>;
  countryOptions: ReadonlyArray<CountryOption>;
  onChange: (value: JobDraftLocation) => void;
}

const defaultCountries: ReadonlyArray<CountryOption> = [
  { code: 'AE', label: 'UAE' },
  { code: 'SA', label: 'KSA' },
  { code: 'QA', label: 'Qatar' },
  { code: 'BH', label: 'Bahrain' },
  { code: 'KW', label: 'Kuwait' },
  { code: 'OM', label: 'Oman' }
];

const toAddress = (city: string, country: GCCCountry): string => `${city}, ${country}`;

const toCountry = (value: string, options: ReadonlyArray<CountryOption>): GCCCountry => {
  const country = options.find((item) => item.code === value);
  return country?.code ?? 'AE';
};

const mapSrc = (latitude: number, longitude: number): string =>
  `https://maps.google.com/maps?q=${latitude},${longitude}&z=13&output=embed`;

export const LocationPicker = ({
  value,
  labels,
  cityOptions,
  countryOptions,
  onChange
}: LocationPickerProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState(value.city);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredCities = useMemo(
    () => cityOptions.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5),
    [cityOptions, query]
  );

  const options = countryOptions.length > 0 ? countryOptions : defaultCountries;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => { setQuery(event.target.value); }}
                className="ps-9"
                placeholder={labels.searchPlaceholder}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setErrorMessage('');
                    onChange({
                      ...value,
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                      address: value.address || toAddress(value.city || labels.useCurrentLocation, value.country)
                    });
                  },
                  () => { setErrorMessage(labels.geolocationError); },
                  {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 30_000
                  }
                );
              }}
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              {labels.useCurrentLocation}
            </Button>
          </div>

          {query ? (
            <div className="flex flex-wrap gap-2">
              {filteredCities.map((city) => (
                <Button
                  key={city}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery(city);
                    onChange({
                      ...value,
                      city,
                      address: value.address || toAddress(city, value.country)
                    });
                  }}
                >
                  {city}
                </Button>
              ))}
            </div>
          ) : null}

          {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      <div className="relative overflow-hidden rounded-xl border">
        <iframe
          title="Location picker map"
          src={mapSrc(value.latitude, value.longitude)}
          className="h-64 w-full border-0"
          loading="lazy"
        />

        <motion.div
          animate={
            reducedMotion
              ? { y: 0 }
              : {
                  y: [0, -6, 0]
                }
          }
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 200,
                  damping: 10,
                  repeat: Infinity
                }
          }
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary"
        >
          <MapPin className="h-8 w-8 drop-shadow-lg" aria-hidden="true" />
        </motion.div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">{labels.addressLabel}</Label>
            <Input
              id="address"
              value={value.address}
              onChange={(event) => { onChange({ ...value, address: event.target.value }); }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">{labels.cityLabel}</Label>
            <Input
              id="city"
              value={value.city}
              onChange={(event) => { onChange({ ...value, city: event.target.value }); }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">{labels.areaLabel}</Label>
            <Input
              id="area"
              value={value.area}
              onChange={(event) => { onChange({ ...value, area: event.target.value }); }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building">{labels.buildingLabel}</Label>
            <Input
              id="building"
              value={value.building}
              onChange={(event) => { onChange({ ...value, building: event.target.value }); }}
            />
          </div>

          <div className="space-y-2">
            <Label>{labels.countryLabel}</Label>
            <Select
              value={value.country}
              onValueChange={(country) => { onChange({ ...value, country: toCountry(country, options) }); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export type { CountryOption };
export default LocationPicker;
