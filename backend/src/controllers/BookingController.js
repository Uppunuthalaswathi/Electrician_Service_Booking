const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const {
  isValidLatLng,
  haversineDistanceKm,
  estimateEtaMinutes,
  matchesByAreaOrPincode,
  fallbackDistanceByReason,
  resolveLocationDetails,
} = require("../utils/location");

const CANCELLABLE_STATUSES = ["pending", "assigned", "accepted", "on_the_way"];
const TRACKABLE_STATUSES = ["accepted", "on_the_way", "arrived", "completed"];

const normalizeValue = (value) => String(value || "").trim().toLowerCase();
const buildEstimatedArrival = (minutes = 0) => `${minutes} mins`;
const buildBillNumber = (bookingId) => `BILL-${String(bookingId).slice(-6).toUpperCase()}`;

const populateBookingQuery = (query) =>
  query
    .populate("user", "name email phone location locationMeta")
    .populate("service")
    .populate("electrician", "name email phone location locationMeta")
    .populate("electricianProfile");

const matchesService = (serviceDoc, serviceName) => {
  const target = normalizeValue(serviceName);
  if (!target) return true;

  return (Array.isArray(serviceDoc?.services) ? serviceDoc.services : []).some((item) =>
    normalizeValue(item).includes(target)
  );
};

const pushStatusHistory = (booking, status, note) => {
  if (!Array.isArray(booking.statusHistory)) {
    booking.statusHistory = [];
  }
  booking.status = status;
  booking.statusHistory.push({
    status,
    note,
    timestamp: new Date(),
  });
};

const getPriceForService = (serviceDoc, serviceName) => {
  const servicePricing = serviceDoc?.servicePricing;
  if (servicePricing && typeof servicePricing.get === "function") {
    const priced = servicePricing.get(serviceName);
    if (priced) return Number(priced);
  }
  return Number(serviceDoc?.price || 0);
};

const computeDistanceAndEta = (userCoordinates, electricianCoordinates, matchReason = "") => {
  const bothHaveCoordinates =
    isValidLatLng(userCoordinates?.lat, userCoordinates?.lng) &&
    isValidLatLng(electricianCoordinates?.lat, electricianCoordinates?.lng);

  const distanceKm = Number(
    (
      bothHaveCoordinates
        ? haversineDistanceKm(
            Number(userCoordinates.lat),
            Number(userCoordinates.lng),
            Number(electricianCoordinates.lat),
            Number(electricianCoordinates.lng)
          )
        : fallbackDistanceByReason(matchReason)
    ).toFixed(1)
  );

  const estimatedArrivalMinutes = estimateEtaMinutes(distanceKm);

  return {
    distanceKm,
    estimatedArrivalMinutes,
    estimatedArrival: buildEstimatedArrival(estimatedArrivalMinutes),
  };
};

async function resolveElectricianProfile({
  serviceId,
  serviceName,
  userLocation,
  userLocationMeta,
  priority,
}) {
  if (serviceId && priority !== "emergency") {
    const directProfile = await Service.findById(serviceId);
    if (directProfile) {
      return {
        electricianProfile: directProfile,
        matchingReason: "direct_service",
      };
    }
  }

  const allAvailable = await Service.find({ available: true });
  const matched = allAvailable.filter((item) => matchesService(item, serviceName));
  const source = matched.length > 0 ? matched : allAvailable;

  if (source.length === 0) {
    return { electricianProfile: null, matchingReason: "" };
  }

  const hasUserCoordinates = isValidLatLng(userLocation?.lat, userLocation?.lng);

  if (hasUserCoordinates) {
    const sorted = source.sort((first, second) => {
      const firstDistance = haversineDistanceKm(
        Number(userLocation.lat),
        Number(userLocation.lng),
        first.location.lat,
        first.location.lng
      );
      const secondDistance = haversineDistanceKm(
        Number(userLocation.lat),
        Number(userLocation.lng),
        second.location.lat,
        second.location.lng
      );

      return firstDistance - secondDistance;
    });

    return {
      electricianProfile: sorted[0],
      matchingReason: "distance",
    };
  }

  const scored = source
    .map((item) => {
      const match = matchesByAreaOrPincode(userLocationMeta, item?.locationMeta || {});
      return { item, score: match.score, reason: match.reason };
    })
    .sort((first, second) => second.score - first.score);

  if (scored[0]?.score > 0) {
    return {
      electricianProfile: scored[0].item,
      matchingReason: scored[0].reason,
    };
  }

  return {
    electricianProfile: source[0],
    matchingReason: "fallback_any",
  };
}

exports.createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      serviceName,
      date,
      timeSlot,
      address,
      problemDescription,
      priority,
      isEmergency,
      userLocation,
      paymentMethod,
    } = req.body;

    if (!serviceName || !date || !timeSlot || !address) {
      return res.status(400).json({
        message: "Service, date, time slot, and address are required",
      });
    }

    const requester = await User.findById(req.user.id).select("location locationMeta");
    const bookingPriority = priority === "emergency" || isEmergency ? "emergency" : "normal";

    const resolvedLocation = await resolveLocationDetails({
      mode: req.body.locationMode,
      lat: userLocation?.lat ?? req.body.lat ?? requester?.location?.lat,
      lng: userLocation?.lng ?? req.body.lng ?? requester?.location?.lng,
      area: req.body.area ?? requester?.locationMeta?.area,
      city: req.body.city ?? requester?.locationMeta?.city,
      pincode: req.body.pincode ?? requester?.locationMeta?.pincode,
      address,
    });

    const customerLocationForMatch = resolvedLocation.hasCoordinates
      ? resolvedLocation.coordinates
      : requester?.location || null;

    const customerLocation = isValidLatLng(customerLocationForMatch?.lat, customerLocationForMatch?.lng)
      ? {
          lat: Number(customerLocationForMatch.lat),
          lng: Number(customerLocationForMatch.lng),
        }
      : {
          lat: null,
          lng: null,
        };

    const customerLocationMeta = {
      area: resolvedLocation.area || requester?.locationMeta?.area || "",
      city: resolvedLocation.city || requester?.locationMeta?.city || "",
      pincode: resolvedLocation.pincode || requester?.locationMeta?.pincode || "",
      addressLabel:
        resolvedLocation.addressLabel ||
        requester?.locationMeta?.addressLabel ||
        address ||
        "",
      source: resolvedLocation.mode || requester?.locationMeta?.source || "manual",
    };

    const { electricianProfile, matchingReason } = await resolveElectricianProfile({
      serviceId,
      serviceName,
      userLocation: customerLocationForMatch,
      userLocationMeta: customerLocationMeta,
      priority: bookingPriority,
    });

    if (!electricianProfile) {
      return res.status(404).json({ message: "No electrician found for this service" });
    }

    const metrics = computeDistanceAndEta(
      customerLocationForMatch,
      electricianProfile.location,
      matchingReason
    );

    const initialStatus = bookingPriority === "emergency" ? "accepted" : "pending";

    const booking = await Booking.create({
      user: req.user.id,
      electrician: electricianProfile.electrician || null,
      service: electricianProfile._id,
      electricianProfile: electricianProfile._id,
      serviceName,
      date,
      timeSlot,
      address,
      problemDescription: problemDescription || "",
      priority: bookingPriority,
      isEmergency: bookingPriority === "emergency",
      userLocation: customerLocation,
      userLocationMeta: customerLocationMeta,
      electricianLocation: {
        lat: electricianProfile.location.lat,
        lng: electricianProfile.location.lng,
        updatedAt: new Date(),
      },
      electricianLocationMeta: {
        area: electricianProfile?.locationMeta?.area || "",
        city: electricianProfile?.locationMeta?.city || "",
        pincode: electricianProfile?.locationMeta?.pincode || "",
        addressLabel: electricianProfile?.locationMeta?.addressLabel || "",
        source: electricianProfile?.locationMeta?.source || "manual",
      },
      status: initialStatus,
      paymentMode: paymentMethod || "Cash",
      payment: {
        method: paymentMethod || "",
        status: "unpaid",
        amount: getPriceForService(electricianProfile, serviceName),
        billNumber: "",
      },
      price: getPriceForService(electricianProfile, serviceName),
      distanceKm: metrics.distanceKm,
      estimatedArrivalMinutes: metrics.estimatedArrivalMinutes,
      estimatedArrival: metrics.estimatedArrival,
      confirmedAt: new Date(),
      statusHistory: [
        {
          status: initialStatus,
          note:
            bookingPriority === "emergency"
              ? "Emergency request auto-assigned to nearest available electrician"
              : "Booking created and waiting for electrician response",
        },
      ],
    });

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));

    res.status(201).json({
      message:
        bookingPriority === "emergency"
          ? "Emergency booking created and nearest available electrician auto-assigned"
          : "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await populateBookingQuery(
      Booking.find({ user: req.user.id }).sort({ createdAt: -1 })
    );
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTrackableBookings = async (req, res) => {
  try {
    const bookings = await populateBookingQuery(
      Booking.find({ user: req.user.id, status: { $in: TRACKABLE_STATUSES } }).sort({ updatedAt: -1 })
    );
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await populateBookingQuery(Booking.findById(req.params.id));

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isOwner =
      String(booking.user?._id || booking.user) === req.user.id ||
      String(booking.electrician?._id || booking.electrician) === req.user.id ||
      req.user.roles.includes("admin");

    if (!isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getElectricianBookings = async (req, res) => {
  try {
    const bookings = await populateBookingQuery(
      Booking.find({ electrician: req.user.id }).sort({ createdAt: -1 })
    );

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, electrician: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    pushStatusHistory(booking, "accepted", "Electrician accepted the request");
    booking.rejectedReason = "";
    await booking.save();

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ message: "Booking accepted", booking: populatedBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, electrician: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.rejectedReason = req.body.reason || "Unavailable for selected slot";
    pushStatusHistory(booking, "rejected", booking.rejectedReason);
    await booking.save();

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ message: "Booking rejected", booking: populatedBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["on_the_way", "arrived", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const booking = await Booking.findOne({ _id: req.params.id, electrician: req.user.id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    pushStatusHistory(
      booking,
      status,
      status === "on_the_way"
        ? "Electrician is travelling to the user location"
        : status === "arrived"
          ? "Electrician has arrived at the location"
          : "Service has been completed"
    );

    if (status === "completed") {
      booking.payment.billNumber = buildBillNumber(booking._id);
    }

    await booking.save();

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ message: "Booking status updated", booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLiveLocation = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, electrician: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const resolvedLocation = await resolveLocationDetails({
      mode: req.body.locationMode,
      lat: req.body.lat,
      lng: req.body.lng,
      area: req.body.area,
      city: req.body.city,
      pincode: req.body.pincode,
      address: req.body.address,
    });

    if (!resolvedLocation.hasCoordinates) {
      return res.status(400).json({
        message: "Unable to resolve electrician location. Use auto-detect or provide area/city/pincode.",
      });
    }

    booking.electricianLocation = {
      lat: Number(resolvedLocation.coordinates.lat),
      lng: Number(resolvedLocation.coordinates.lng),
      updatedAt: new Date(),
    };

    booking.electricianLocationMeta = {
      area: resolvedLocation.area || booking.electricianLocationMeta?.area || "",
      city: resolvedLocation.city || booking.electricianLocationMeta?.city || "",
      pincode: resolvedLocation.pincode || booking.electricianLocationMeta?.pincode || "",
      addressLabel:
        resolvedLocation.addressLabel || booking.electricianLocationMeta?.addressLabel || "",
      source: resolvedLocation.mode || "auto",
    };

    const fallbackMatch = matchesByAreaOrPincode(
      booking.userLocationMeta || {},
      booking.electricianLocationMeta || {}
    );

    const metrics = computeDistanceAndEta(
      booking.userLocation,
      booking.electricianLocation,
      fallbackMatch.reason
    );

    booking.distanceKm = metrics.distanceKm;
    booking.estimatedArrivalMinutes = metrics.estimatedArrivalMinutes;
    booking.estimatedArrival = metrics.estimatedArrival;

    await booking.save();

    res.json({
      success: true,
      distanceKm: booking.distanceKm,
      estimatedArrival: booking.estimatedArrival,
      estimatedArrivalMinutes: booking.estimatedArrivalMinutes,
      electricianLocationMeta: booking.electricianLocationMeta,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!CANCELLABLE_STATUSES.includes(booking.status) || booking.status === "arrived") {
      return res.status(400).json({ message: "This booking can no longer be cancelled" });
    }

    pushStatusHistory(booking, "cancelled", "Cancelled by user");
    await booking.save();

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ success: true, booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.makePayment = async (req, res) => {
  try {
    const { method } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Payment is available only after completion" });
    }

    booking.payment = {
      ...booking.payment,
      method,
      status: "paid",
      amount: booking.price,
      billNumber: booking.payment.billNumber || buildBillNumber(booking._id),
      paidAt: new Date(),
    };

    booking.paymentMode = method;
    await booking.save();

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ success: true, booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Review can be added only after completion" });
    }

    booking.review = {
      rating: Number(rating),
      feedback: feedback || "",
      createdAt: new Date(),
    };
    await booking.save();

    if (booking.electricianProfile) {
      const electricianProfile = await Service.findById(booking.electricianProfile);
      if (electricianProfile) {
        const existingTotal = electricianProfile.rating * electricianProfile.reviewsCount;
        electricianProfile.reviewsCount += 1;
        electricianProfile.rating = Number(
          ((existingTotal + Number(rating)) / electricianProfile.reviewsCount).toFixed(1)
        );
        await electricianProfile.save();
      }
    }

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ success: true, booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await populateBookingQuery(Booking.find().sort({ createdAt: -1 }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignElectrician = async (req, res) => {
  try {
    const { electricianId } = req.body;
    const electricianProfile = await Service.findById(electricianId);
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.electricianProfile = electricianProfile?._id || null;
    booking.electrician = electricianProfile?.electrician || null;
    booking.service = electricianProfile?._id || null;

    if (electricianProfile?.location) {
      booking.electricianLocation = {
        lat: electricianProfile.location.lat,
        lng: electricianProfile.location.lng,
        updatedAt: new Date(),
      };

      booking.electricianLocationMeta = {
        area: electricianProfile?.locationMeta?.area || "",
        city: electricianProfile?.locationMeta?.city || "",
        pincode: electricianProfile?.locationMeta?.pincode || "",
        addressLabel: electricianProfile?.locationMeta?.addressLabel || "",
        source: electricianProfile?.locationMeta?.source || "manual",
      };

      const fallbackMatch = matchesByAreaOrPincode(
        booking.userLocationMeta || {},
        booking.electricianLocationMeta || {}
      );
      const metrics = computeDistanceAndEta(
        booking.userLocation,
        booking.electricianLocation,
        fallbackMatch.reason
      );

      booking.distanceKm = metrics.distanceKm;
      booking.estimatedArrivalMinutes = metrics.estimatedArrivalMinutes;
      booking.estimatedArrival = metrics.estimatedArrival;
    }

    pushStatusHistory(booking, "assigned", "Admin assigned an electrician");
    await booking.save();

    const populatedBooking = await populateBookingQuery(Booking.findById(booking._id));
    res.json({ success: true, booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

