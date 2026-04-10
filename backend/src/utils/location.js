const DEFAULT_LOCATION = { lat: 17.4435, lng: 78.3772 };

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value) => String(value || "").trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();

const isValidLatLng = (lat, lng) =>
  Number.isFinite(Number(lat)) &&
  Number.isFinite(Number(lng)) &&
  Number(lat) >= -90 &&
  Number(lat) <= 90 &&
  Number(lng) >= -180 &&
  Number(lng) <= 180;

const buildAddressQuery = ({ area, city, pincode, address }) => {
  const parts = [normalizeText(address), normalizeText(area), normalizeText(city), normalizeText(pincode), "India"]
    .filter(Boolean);

  return parts.join(", ");
};

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeAddress({ area, city, pincode, address }) {
  const query = buildAddressQuery({ area, city, pincode, address });
  if (!query) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const data = await fetchJsonWithTimeout(url, {
    headers: {
      "User-Agent": "Electrician-Service-Booking-App/1.0",
      "Accept-Language": "en",
    },
  });

  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  const lat = toNumber(first.lat);
  const lng = toNumber(first.lon);
  if (!isValidLatLng(lat, lng)) return null;

  return {
    lat,
    lng,
    area:
      normalizeText(first?.address?.suburb) ||
      normalizeText(first?.address?.neighbourhood) ||
      normalizeText(first?.address?.quarter) ||
      normalizeText(area),
    city:
      normalizeText(first?.address?.city) ||
      normalizeText(first?.address?.town) ||
      normalizeText(first?.address?.state_district) ||
      normalizeText(city),
    pincode: normalizeText(first?.address?.postcode) || normalizeText(pincode),
    displayName: normalizeText(first.display_name),
    resolvedFrom: "geocoding",
  };
}

async function reverseGeocode({ lat, lng }) {
  if (!isValidLatLng(lat, lng)) return null;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const data = await fetchJsonWithTimeout(url, {
    headers: {
      "User-Agent": "Electrician-Service-Booking-App/1.0",
      "Accept-Language": "en",
    },
  });

  if (!data) return null;
  return {
    area:
      normalizeText(data?.address?.suburb) ||
      normalizeText(data?.address?.neighbourhood) ||
      normalizeText(data?.address?.quarter) ||
      "",
    city:
      normalizeText(data?.address?.city) ||
      normalizeText(data?.address?.town) ||
      normalizeText(data?.address?.state_district) ||
      "",
    pincode: normalizeText(data?.address?.postcode) || "",
    displayName: normalizeText(data?.display_name) || "",
    resolvedFrom: "reverse_geocoding",
  };
}

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const estimateEtaMinutes = (distanceKm = 0) => {
  if (distanceKm <= 2) return 15;
  if (distanceKm <= 5) return 25;
  if (distanceKm <= 8) return 40;
  return 55;
};

const buildAreaLabel = ({ area, city, pincode }) =>
  [normalizeText(area), normalizeText(city), normalizeText(pincode)].filter(Boolean).join(", ");

const matchesByAreaOrPincode = (requestMeta = {}, targetMeta = {}) => {
  const reqPincode = normalizeLower(requestMeta.pincode);
  const targetPincode = normalizeLower(targetMeta.pincode);
  if (reqPincode && targetPincode && reqPincode === targetPincode) {
    return { score: 3, reason: "pincode" };
  }

  const reqArea = normalizeLower(requestMeta.area);
  const targetArea = normalizeLower(targetMeta.area);
  const reqCity = normalizeLower(requestMeta.city);
  const targetCity = normalizeLower(targetMeta.city);

  if (reqArea && targetArea && reqArea === targetArea && reqCity && targetCity && reqCity === targetCity) {
    return { score: 2, reason: "area_city" };
  }

  if (reqCity && targetCity && reqCity === targetCity) {
    return { score: 1, reason: "city" };
  }

  return { score: 0, reason: "" };
};

const fallbackDistanceByReason = (reason) => {
  if (reason === "pincode") return 2.5;
  if (reason === "area_city") return 4.5;
  if (reason === "city") return 8.0;
  return 12.0;
};

async function resolveLocationDetails(input = {}) {
  const mode = normalizeLower(input.mode) || "manual";
  const lat = toNumber(input.lat ?? input.location?.lat);
  const lng = toNumber(input.lng ?? input.location?.lng);
  const area = normalizeText(input.area);
  const city = normalizeText(input.city);
  const pincode = normalizeText(input.pincode);
  const address = normalizeText(input.address || input.addressText);

  const fromCoords = isValidLatLng(lat, lng) ? { lat, lng } : null;
  if (fromCoords) {
    const reverse = await reverseGeocode(fromCoords);
    return {
      coordinates: fromCoords,
      area: reverse?.area || area,
      city: reverse?.city || city,
      pincode: reverse?.pincode || pincode,
      addressLabel: reverse?.displayName || buildAreaLabel({ area, city, pincode }) || address,
      mode: mode === "auto" ? "auto" : "manual",
      resolvedBy: reverse?.resolvedFrom || "coordinates",
      hasCoordinates: true,
    };
  }

  const geocoded = await geocodeAddress({ area, city, pincode, address });
  if (geocoded) {
    return {
      coordinates: { lat: geocoded.lat, lng: geocoded.lng },
      area: geocoded.area || area,
      city: geocoded.city || city,
      pincode: geocoded.pincode || pincode,
      addressLabel: geocoded.displayName || buildAreaLabel({ area, city, pincode }) || address,
      mode: "manual",
      resolvedBy: geocoded.resolvedFrom,
      hasCoordinates: true,
    };
  }

  return {
    coordinates: null,
    area,
    city,
    pincode,
    addressLabel: buildAreaLabel({ area, city, pincode }) || address,
    mode: "manual",
    resolvedBy: "fallback_area",
    hasCoordinates: false,
  };
}

module.exports = {
  DEFAULT_LOCATION,
  isValidLatLng,
  haversineDistanceKm,
  estimateEtaMinutes,
  buildAreaLabel,
  matchesByAreaOrPincode,
  fallbackDistanceByReason,
  resolveLocationDetails,
};
