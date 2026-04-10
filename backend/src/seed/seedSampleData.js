const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Service = require("../models/Service");

const SAMPLE_ELECTRICIANS = [
  {
    name: "Arjun Power Solutions",
    email: "arjun.electrician@example.com",
    phone: "9876543210",
    rating: 4.8,
    price: 499,
    experience: 8,
    services: ["Fan Repair", "Wiring", "Switch Repair"],
    description: "Apartment and independent home specialist for repair and rewiring jobs.",
    location: { lat: 17.4416, lng: 78.391 },
    locationMeta: { area: "Madhapur", city: "Hyderabad", pincode: "500081", addressLabel: "Madhapur, Hyderabad, 500081" },
  },
  {
    name: "Meera Home Electric",
    email: "meera.electrician@example.com",
    phone: "9123456780",
    rating: 4.9,
    price: 650,
    experience: 10,
    services: ["Light Installation", "Full House Check", "Wiring"],
    description: "Detailed inspection and lighting installation expert for residential projects.",
    location: { lat: 17.4523, lng: 78.4012 },
    locationMeta: { area: "HITEC City", city: "Hyderabad", pincode: "500081", addressLabel: "HITEC City, Hyderabad, 500081" },
  },
  {
    name: "Sanjay QuickFix Electricals",
    email: "sanjay.electrician@example.com",
    phone: "9988776655",
    rating: 4.6,
    price: 399,
    experience: 6,
    services: ["Fan Repair", "Light Installation", "Doorbell Repair"],
    description: "Fast turnaround electrician focused on urgent repair requests.",
    location: { lat: 17.4301, lng: 78.4147 },
    locationMeta: { area: "Jubilee Hills", city: "Hyderabad", pincode: "500033", addressLabel: "Jubilee Hills, Hyderabad, 500033" },
  },
];

const ADMIN_USER = {
  name: "Service Admin",
  email: "admin@example.com",
  phone: "9000000000",
  location: { lat: 17.4435, lng: 78.3772 },
  locationMeta: { area: "Kondapur", city: "Hyderabad", pincode: "500084", addressLabel: "Kondapur, Hyderabad, 500084" },
};

async function upsertElectricianProfile(entry) {
  const existingUser = await User.findOne({ email: entry.email });
  const hashedPassword = existingUser?.password || (await bcrypt.hash("Electric123!", 10));

  const user = await User.findOneAndUpdate(
    { email: entry.email },
    {
      $setOnInsert: {
        password: hashedPassword,
      },
      $set: {
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        location: entry.location,
        locationMeta: {
          ...entry.locationMeta,
          source: "seed",
          resolvedBy: "seed_data",
          lastUpdatedAt: new Date(),
        },
      },
      $addToSet: {
        roles: "electrician",
      },
    },
    { new: true, upsert: true }
  );

  await Service.findOneAndUpdate(
    { electrician: user._id },
    {
      electrician: user._id,
      name: entry.name,
      description: entry.description,
      category: "electrician",
      price: entry.price,
      rating: entry.rating,
      reviewsCount: Math.round(entry.rating * 32),
      available: true,
      experience: entry.experience,
      verified: true,
      services: entry.services,
      phone: entry.phone,
      location: entry.location,
      locationMeta: {
        ...entry.locationMeta,
        source: "seed",
        resolvedBy: "seed_data",
        lastUpdatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );
}

async function seedSampleData() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  await User.findOneAndUpdate(
    { email: ADMIN_USER.email },
    {
      $setOnInsert: {
        password: adminPassword,
      },
      $set: {
        name: ADMIN_USER.name,
        phone: ADMIN_USER.phone,
        location: ADMIN_USER.location,
        locationMeta: {
          ...ADMIN_USER.locationMeta,
          source: "seed",
          resolvedBy: "seed_data",
          lastUpdatedAt: new Date(),
        },
      },
      $addToSet: {
        roles: "admin",
      },
    },
    { new: true, upsert: true }
  );

  for (const electrician of SAMPLE_ELECTRICIANS) {
    await upsertElectricianProfile(electrician);
  }
}

module.exports = seedSampleData;
