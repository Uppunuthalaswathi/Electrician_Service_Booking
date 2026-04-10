export const CITY_OPTIONS = [
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Pune",
];

export const getReadableArea = (locationMeta = {}) =>
  [locationMeta?.area, locationMeta?.city, locationMeta?.pincode].filter(Boolean).join(", ");

export const detectBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 30000,
      }
    );
  });
