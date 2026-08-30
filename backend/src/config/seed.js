const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('./env');
const User = require('../models/User');
const Errand = require('../models/Errand');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const Dispute = require('../models/Dispute');
const Rating = require('../models/Rating');

const seedData = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing collections
    await User.deleteMany({});
    await Errand.deleteMany({});
    await Message.deleteMany({});
    await Transaction.deleteMany({});
    await Dispute.deleteMany({});
    await Rating.deleteMany({});
    console.log('[Seed] Cleared existing data');

    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // 1. Create Demo Users
    const users = await User.create([
      {
        name: 'Aryan Sharma',
        email: 'aryan@campus.edu',
        passwordHash: hashedPassword,
        phone: '+919876543210',
        role: 'admin',
        hostelOrCollegeId: 'Hostel-H4-Room302',
        karmaScore: 150,
        isVerified: true,
        trustedContacts: [
          { name: 'Priya Patel', phone: '+919876543211' },
          { name: 'Rahul Verma', phone: '+919876543212' },
        ],
      },
      {
        name: 'Priya Patel',
        email: 'priya@campus.edu',
        passwordHash: hashedPassword,
        phone: '+919876543211',
        role: 'user',
        hostelOrCollegeId: 'Hostel-G2-Room114',
        karmaScore: 120,
        isVerified: true,
        trustedContacts: [
          { name: 'Aryan Sharma', phone: '+919876543210' },
        ],
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@campus.edu',
        passwordHash: hashedPassword,
        phone: '+919876543212',
        role: 'user',
        hostelOrCollegeId: 'Hostel-H1-Room205',
        karmaScore: 95,
        isVerified: true,
        trustedContacts: [],
      },
    ]);

    console.log(`[Seed] Created ${users.length} demo users`);
    const [aryan, priya, rahul] = users;

    // 2. Create Sample Errands
    const errands = await Errand.create([
      {
        title: 'Need 2 Lays Chips and Amul Taaza Milk',
        description: 'Please pick up from the campus night canteen. Deliver to H4 3rd floor.',
        category: 'food',
        budget: 150,
        address: 'Hostel 4, Room 302, North Campus',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139], // [longitude, latitude]
        },
        requesterId: aryan._id,
        status: 'posted',
        statusHistory: [
          { status: 'posted', timestamp: new Date(Date.now() - 3600000), updatedBy: aryan._id },
        ],
      },
      {
        title: 'Paracetamol & Cough Syrup from Campus Pharmacy',
        description: 'Urgent medication needed. Running slight fever.',
        category: 'pharmacy',
        budget: 200,
        address: 'Hostel G2, Ground Floor Gate',
        location: {
          type: 'Point',
          coordinates: [77.2100, 28.6145],
        },
        requesterId: priya._id,
        runnerId: rahul._id,
        status: 'in_progress',
        statusHistory: [
          { status: 'posted', timestamp: new Date(Date.now() - 7200000), updatedBy: priya._id },
          { status: 'accepted', timestamp: new Date(Date.now() - 3600000), updatedBy: rahul._id },
          { status: 'in_progress', timestamp: new Date(Date.now() - 1800000), updatedBy: rahul._id },
        ],
      },
      {
        title: 'Lab Manual & Graph Sheets from Central Stationery',
        description: 'Need A4 ruled sheets and Physics lab record.',
        category: 'stationery',
        budget: 120,
        address: 'Hostel H1, Room 205',
        location: {
          type: 'Point',
          coordinates: [77.2085, 28.6120],
        },
        requesterId: rahul._id,
        runnerId: aryan._id,
        status: 'delivered',
        statusHistory: [
          { status: 'posted', timestamp: new Date(Date.now() - 14400000), updatedBy: rahul._id },
          { status: 'accepted', timestamp: new Date(Date.now() - 10800000), updatedBy: aryan._id },
          { status: 'in_progress', timestamp: new Date(Date.now() - 7200000), updatedBy: aryan._id },
          { status: 'delivered', timestamp: new Date(Date.now() - 3600000), updatedBy: aryan._id },
        ],
      },
    ]);

    console.log(`[Seed] Created ${errands.length} sample errands`);

    // 3. Create Sample Messages on active errand
    await Message.create([
      {
        errandId: errands[1]._id,
        senderId: priya._id,
        text: 'Hi Rahul, thanks for taking this! The medicine strip is Dolo 650.',
      },
      {
        errandId: errands[1]._id,
        senderId: rahul._id,
        text: 'Got it Priya, I am at the campus pharmacy counter right now.',
      },
    ]);

    // 4. Create Sample Transaction
    await Transaction.create({
      errandId: errands[2]._id,
      paidBy: aryan._id,
      amount: 110,
      notes: 'Physics record book ₹80 + Graph sheets ₹30',
      status: 'settled',
      settledAt: new Date(),
    });

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials to Login:');
    console.log('1. Admin & Student Account:');
    console.log('   Email:    aryan@campus.edu');
    console.log('   Password: Password@123');
    console.log('');
    console.log('2. Student Account:');
    console.log('   Email:    priya@campus.edu');
    console.log('   Password: Password@123');
    console.log('');
    console.log('3. Student Account:');
    console.log('   Email:    rahul@campus.edu');
    console.log('   Password: Password@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
