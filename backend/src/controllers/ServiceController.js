const Service = require("../models/Service");
const {
  DEFAULT_LOCATION,
  isValidLatLng,
  haversineDistanceKm,
  estimateEtaMinutes,
  buildAreaLabel,
  matchesByAreaOrPincode,
  fallbackDistanceByReason,
  resolveLocationDetails,
} = require("../utils/location");

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const matchesRequestedService = (serviceDoc, requestedService) => {
  if (!requestedService) return true;

  const target = normalizeValue(requestedService);
  const listedServices = Array.isArray(serviceDoc?.services) ? serviceDoc.services : [];

  return (
    normalizeValue(serviceDoc?.name).includes(target) ||
    listedServices.some((item) => normalizeValue(item).includes(target))
  );
};

const mapService = (serviceDoc, userLocation) => {
  const source = serviceDoc.toObject();
  const lat = userLocation?.lat ?? DEFAULT_LOCATION.lat;
  const lng = userLocation?.lng ?? DEFAULT_LOCATION.lng;

  const distanceKm = Number(haversineDistanceKm(lat, lng, source.location.lat, source.location.lng).toFixed(1));
  const etaMinutes = estimateEtaMinutes(distanceKm);

  return {
    ...source,
    distanceKm,
    etaMinutes,
    estimatedArrival: `${etaMinutes} mins`,
    areaName: source?.locationMeta?.addressLabel || buildAreaLabel(source?.locationMeta || {}),
  };
};

exports.createService = async (req, res) => {
  try {
    const { name, description, price, services, available, location, phone } = req.body;
    const resolvedLocation = await resolveLocationDetails({
      mode: req.body.locationMode,
      lat: location?.lat ?? req.body.lat,
      lng: location?.lng ?? req.body.lng,
      area: req.body.area,
      city: req.body.city,
      pincode: req.body.pincode,
      address: req.body.address,
    });

    if (!name || !price || !Array.isArray(services) || services.length === 0 || !resolvedLocation.hasCoordinates) {
      return res.status(400).json({
        message: "Name, price, services, and a valid location are required",
      });
    }

    const service = await Service.findOneAndUpdate(
      { electrician: req.user.id },
      {
        electrician: req.user.id,
        name,
        description: description || "",
        category: "electrician",
        price: Number(price),
        available: available !== false,
        services,
        phone: phone || "",
        location: resolvedLocation.coordinates,
        locationMeta: {
          area: resolvedLocation.area || "",
          city: resolvedLocation.city || "",
          pincode: resolvedLocation.pincode || "",
          addressLabel: resolvedLocation.addressLabel || "",
          source: resolvedLocation.mode || "manual",
          resolvedBy: resolvedLocation.resolvedBy || "",
          lastUpdatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { service, sortBy, lat, lng, area, city, pincode } = req.query;
    const query = { category: "electrician" };
    const services = await Service.find(query).populate("electrician", "name email phone");

    const userLocation = {
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    };
    const hasUserCoordinates = isValidLatLng(userLocation.lat, userLocation.lng);
    const userLocationMeta = { area, city, pincode };

    let filtered = services
      .filter((item) => matchesRequestedService(item, service))
      .filter((item) => {
        if (!area && !city && !pincode) return true;
        const itemArea = normalizeValue(item?.locationMeta?.area);
        const itemCity = normalizeValue(item?.locationMeta?.city);
        const itemPincode = normalizeValue(item?.locationMeta?.pincode);

        const wantedArea = normalizeValue(area);
        const wantedCity = normalizeValue(city);
        const wantedPincode = normalizeValue(pincode);

        if (wantedPincode && itemPincode === wantedPincode) return true;
        if (wantedArea && wantedCity && itemArea === wantedArea && itemCity === wantedCity) return true;
        if (wantedCity && itemCity === wantedCity) return true;
        return false;
      })
      .map((item) => {
        if (hasUserCoordinates) {
          return mapService(item, userLocation);
        }

        const source = item.toObject();
        const match = matchesByAreaOrPincode(userLocationMeta, source?.locationMeta || {});
        const distanceKm = Number(fallbackDistanceByReason(match.reason).toFixed(1));
        const etaMinutes = estimateEtaMinutes(distanceKm);

        return {
          ...source,
          distanceKm,
          etaMinutes,
          estimatedArrival: `${etaMinutes} mins`,
          areaName: source?.locationMeta?.addressLabel || buildAreaLabel(source?.locationMeta || {}),
        };
      });

    if (sortBy === "price") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "rating") {
      filtered = filtered.sort((a, b) => b.rating - a.rating);
    } else {
      filtered = filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyServiceProfile = async (req, res) => {
  try {
    const service = await Service.findOne({ electrician: req.user.id });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllServicesForAdmin = async (req, res) => {
  try {
    const services = await Service.find().populate("electrician", "name email phone");
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createServiceAsAdmin = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      services,
      available,
      location,
      phone,
      rating,
      experience,
    } = req.body;
    const resolvedLocation = await resolveLocationDetails({
      mode: req.body.locationMode,
      lat: location?.lat ?? req.body.lat,
      lng: location?.lng ?? req.body.lng,
      area: req.body.area,
      city: req.body.city,
      pincode: req.body.pincode,
      address: req.body.address,
    });

    if (
      !name ||
      !price ||
      !Array.isArray(services) ||
      services.length === 0 ||
      !resolvedLocation.hasCoordinates
    ) {
      return res.status(400).json({
        message: "Name, price, services, and valid location are required",
      });
    }

    const service = await Service.create({
      name,
      description: description || "",
      category: "electrician",
      price: Number(price),
      available: available !== false,
      services,
      phone: phone || "",
      rating: Number(rating || 4.5),
      experience: Number(experience || 3),
      location: resolvedLocation.coordinates,
      locationMeta: {
        area: resolvedLocation.area || "",
        city: resolvedLocation.city || "",
        pincode: resolvedLocation.pincode || "",
        addressLabel: resolvedLocation.addressLabel || "",
        source: resolvedLocation.mode || "manual",
        resolvedBy: resolvedLocation.resolvedBy || "",
        lastUpdatedAt: new Date(),
      },
      verified: true,
    });

    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMyServiceProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.electrician;
    delete updates.category;
    const locationRequested =
      typeof updates?.location?.lat !== "undefined" ||
      typeof updates?.location?.lng !== "undefined" ||
      typeof updates?.lat !== "undefined" ||
      typeof updates?.lng !== "undefined" ||
      typeof updates?.area !== "undefined" ||
      typeof updates?.city !== "undefined" ||
      typeof updates?.pincode !== "undefined";

    if (locationRequested) {
      const resolvedLocation = await resolveLocationDetails({
        mode: updates.locationMode,
        lat: updates?.location?.lat ?? updates.lat,
        lng: updates?.location?.lng ?? updates.lng,
        area: updates.area,
        city: updates.city,
        pincode: updates.pincode,
        address: updates.address,
      });

      if (resolvedLocation.hasCoordinates) {
        updates.location = resolvedLocation.coordinates;
      }
      updates.locationMeta = {
        area: resolvedLocation.area || "",
        city: resolvedLocation.city || "",
        pincode: resolvedLocation.pincode || "",
        addressLabel: resolvedLocation.addressLabel || "",
        source: resolvedLocation.mode || "manual",
        resolvedBy: resolvedLocation.resolvedBy || "",
        lastUpdatedAt: new Date(),
      };
    }

    delete updates.lat;
    delete updates.lng;
    delete updates.area;
    delete updates.city;
    delete updates.pincode;
    delete updates.address;
    delete updates.locationMode;

    const service = await Service.findOneAndUpdate(
      { electrician: req.user.id },
      updates,
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Electrician profile not found" });
    }

    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
