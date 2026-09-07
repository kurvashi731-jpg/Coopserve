// Run with: npm run seed
// Wipes and repopulates the DB with realistic demo data.
// All seeded login accounts use the password: Demo@1234

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import Cooperative from "./models/Cooperative.js";
import ServiceCategory from "./models/ServiceCategory.js";
import Booking from "./models/Booking.js";
import Review from "./models/Review.js";
import LedgerTransaction from "./models/LedgerTransaction.js";

dotenv.config();

const DEMO_PASSWORD = "Demo@1234";

const CATEGORIES = [
  { name: "Plumbing", icon: "Wrench", description: "Leak repair, pipe fitting, bathroom fixtures" },
  { name: "Electrical", icon: "Zap", description: "Wiring, appliance repair, fan/light installation" },
  { name: "Cleaning", icon: "Sparkles", description: "Home deep cleaning, utensils, sweeping & mopping" },
  { name: "Cooking", icon: "ChefHat", description: "Daily meal prep, tiffin service, event cooking" },
  { name: "Tutoring", icon: "BookOpen", description: "School subjects, spoken English, exam prep" },
  { name: "Gardening", icon: "Flower2", description: "Lawn care, plant maintenance, landscaping" },
];

const WORKER_NAMES = [
  "Ramesh Kumar", "Sunita Devi", "Amit Sharma", "Pooja Yadav", "Vikram Singh",
  "Anjali Verma", "Deepak Prasad", "Kavita Jha", "Manoj Thakur", "Rekha Kumari",
  "Suresh Chauhan", "Meena Gupta", "Rajesh Mandal", "Nisha Kumari",
];

const SKILLS_BY_CATEGORY = {
  Plumbing: ["Pipe fitting", "Leak repair", "Bathroom fixtures", "Water tank cleaning"],
  Electrical: ["Wiring", "Fan installation", "Appliance repair", "MCB/fuse work"],
  Cleaning: ["Deep cleaning", "Sofa cleaning", "Kitchen cleaning", "Bathroom sanitization"],
  Cooking: ["North Indian", "South Indian", "Tiffin service", "Event catering"],
  Tutoring: ["Maths", "Science", "Spoken English", "Computer basics"],
  Gardening: ["Lawn mowing", "Plant care", "Landscaping", "Composting"],
};

async function seed() {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Worker.deleteMany({}),
    Cooperative.deleteMany({}),
    ServiceCategory.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    LedgerTransaction.deleteMany({}),
  ]);

  console.log("Seeding categories...");
  await ServiceCategory.insertMany(CATEGORIES);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("Seeding cooperative admins + cooperatives...");
  const coopAdmin1User = await User.create({
    name: "Shakti Coop Admin",
    email: "admin1@coopserve.demo",
    passwordHash,
    role: "coopAdmin",
    phone: "9800000001",
    address: "Patna, Bihar",
  });
  const coopAdmin2User = await User.create({
    name: "Nagar Sahayog Admin",
    email: "admin2@coopserve.demo",
    passwordHash,
    role: "coopAdmin",
    phone: "9800000002",
    address: "Darbhanga, Bihar",
  });

  const coop1 = await Cooperative.create({
    name: "Shakti Seva Cooperative",
    description: "A worker-owned cooperative for household services in Patna.",
    adminUserId: coopAdmin1User._id,
    commissionRate: 0.1,
    welfareShare: 0.4,
  });
  const coop2 = await Cooperative.create({
    name: "Nagar Sahayog Cooperative",
    description: "Community-run cooperative supporting local service workers in Darbhanga.",
    adminUserId: coopAdmin2User._id,
    commissionRate: 0.1,
    welfareShare: 0.4,
  });
  const cooperatives = [coop1, coop2];

  console.log("Seeding customer accounts...");
  const customers = [];
  for (let i = 1; i <= 4; i++) {
    const c = await User.create({
      name: `Demo Customer ${i}`,
      email: `customer${i}@coopserve.demo`,
      passwordHash,
      role: "customer",
      phone: `98100000${i}0`,
      address: `${i}, Model Town, Darbhanga, Bihar`,
    });
    customers.push(c);
  }

  console.log("Seeding workers...");
  const workers = [];
  for (let i = 0; i < WORKER_NAMES.length; i++) {
    const category = CATEGORIES[i % CATEGORIES.length].name;
    const coop = cooperatives[i % cooperatives.length];
    const skills = SKILLS_BY_CATEGORY[category];
    const isPatna = i % 2 === 0;
    // Patna ~ 25.5941, 85.1376 | Darbhanga ~ 26.1542, 85.8918 — small random offset per worker
    const baseLat = isPatna ? 25.5941 : 26.1542;
    const baseLng = isPatna ? 85.1376 : 85.8918;

    const wUser = await User.create({
      name: WORKER_NAMES[i],
      email: `worker${i + 1}@coopserve.demo`,
      passwordHash,
      role: "worker",
      phone: `97000000${String(i).padStart(2, "0")}`,
      address: `${i + 1} Ward, ${isPatna ? "Patna" : "Darbhanga"}, Bihar`,
      photoUrl: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      location: { lat: baseLat + (Math.random() - 0.5) * 0.08, lng: baseLng + (Math.random() - 0.5) * 0.08 },
    });

    const avgRating = Math.round((3.8 + Math.random() * 1.1) * 10) / 10;
    const worker = await Worker.create({
      userId: wUser._id,
      cooperativeId: coop._id,
      category: [category],
      skills: skills.slice(0, 3),
      priceRange: { min: 150, max: 600 },
      bio: `Experienced ${category.toLowerCase()} professional with ${2 + (i % 8)} years of service in the community.`,
      verified: i % 4 !== 0, // most verified, a few pending (for the admin demo screen)
      aadharLast4: i % 3 !== 2 ? String(1000 + i * 137).slice(-4) : "", // most have submitted Aadhaar
      idVerified: i % 3 === 0, // some fully ID-confirmed, some pending admin confirmation (for the demo)
      trustScore: 55 + Math.round(Math.random() * 40),
      avgRating,
      totalRatings: 5 + (i % 10),
      totalJobs: 5 + (i % 15),
    });

    coop.memberWorkerIds.push(worker._id);
    workers.push(worker);
  }
  await Promise.all(cooperatives.map((c) => c.save()));

  console.log("Seeding completed bookings + reviews + ledger transactions...");
  const sampleComments = [
    "Very professional and on time.",
    "Good work, fair price, will book again.",
    "Solved the issue quickly. Recommended.",
    "Polite and skilled. Happy with the service.",
    "Decent job, could improve punctuality.",
  ];

  for (let i = 0; i < 12; i++) {
    const worker = workers[i % workers.length];
    const customer = customers[i % customers.length];
    const amount = 200 + Math.floor(Math.random() * 400);
    const daysAgo = 2 + i;

    const booking = await Booking.create({
      customerId: customer._id,
      workerId: worker._id,
      category: worker.category[0],
      scheduledAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      address: customer.address,
      notes: "Demo seeded booking",
      status: "completed",
      amount,
      completedAt: new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000),
    });

    // Track most recent booking date per worker to set a realistic lastMatchedAt
    worker.lastMatchedAt = booking.scheduledAt;
    await worker.save();

    const rating = 4 + Math.round(Math.random());
    await Review.create({
      bookingId: booking._id,
      customerId: customer._id,
      workerId: worker._id,
      rating: Math.min(rating, 5),
      comment: sampleComments[i % sampleComments.length],
    });

    const coop = cooperatives.find((c) => String(c._id) === String(worker.cooperativeId));
    const platformFee = Math.round(amount * coop.commissionRate * 100) / 100;
    const welfareFundContribution = Math.round(platformFee * coop.welfareShare * 100) / 100;
    const workerPayout = Math.round((amount - platformFee) * 100) / 100;

    await LedgerTransaction.create({
      bookingId: booking._id,
      workerId: worker._id,
      cooperativeId: coop._id,
      grossAmount: amount,
      platformFee,
      welfareFundContribution,
      workerPayout,
    });

    coop.welfareFundBalance += welfareFundContribution;
  }
  await Promise.all(cooperatives.map((c) => c.save()));

  console.log("Seeding a few live bookings (different statuses, for the demo)...");
  const liveStatuses = ["requested", "accepted", "in_progress"];
  for (let i = 0; i < 3; i++) {
    const worker = workers[(i + 3) % workers.length];
    const customer = customers[i % customers.length];
    await Booking.create({
      customerId: customer._id,
      workerId: worker._id,
      category: worker.category[0],
      scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      address: customer.address,
      notes: "Live demo booking",
      status: liveStatuses[i],
      amount: 250 + i * 50,
    });
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Demo login credentials (password for all: Demo@1234):");
  console.log("  Cooperative Admin: admin1@coopserve.demo / admin2@coopserve.demo");
  console.log("  Customer:          customer1@coopserve.demo (through customer4)");
  console.log("  Worker:            worker1@coopserve.demo (through worker14)");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
