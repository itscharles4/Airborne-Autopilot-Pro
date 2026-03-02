require('dotenv').config();
const mongoose = require('mongoose');
const Drone = require('../models/Drone');
const User = require('../models/User');
const logger = require('../utils/logger');

const drones = [
  { id: 'Alpha-1', name: 'Alpha-1', model: 'DJI Mavic 3',    battery: 100, status: 'IDLE', position: { x: 100, y: 100, z: 0 }, flightHours: 45, errorRate: 2,  stability: 95 },
  { id: 'Beta-2',  name: 'Beta-2',  model: 'DJI Phantom 4',  battery: 78,  status: 'IDLE', position: { x: 200, y: 150, z: 0 }, flightHours: 82, errorRate: 5,  stability: 88 },
  { id: 'Gamma-3', name: 'Gamma-3', model: 'Autel Evo II',   battery: 45,  status: 'CHARGING', position: { x: 150, y: 200, z: 0 }, flightHours: 15, errorRate: 1, stability: 98 },
  { id: 'Delta-4', name: 'Delta-4', model: 'Skydio 2+',      battery: 92,  status: 'IDLE', position: { x: 300, y: 100, z: 0 }, flightHours: 67, errorRate: 8,  stability: 72 },
];

const users = [
  { name: 'Admin User',     email: 'admin@charronix.com',    password: 'Admin@123',    role: 'ADMIN' },
  { name: 'Fleet Operator', email: 'operator@charronix.com', password: 'Operator@123', role: 'OPERATOR' },
  { name: 'Data Analyst',   email: 'analyst@charronix.com',  password: 'Analyst@123',  role: 'ANALYST' },
  { name: 'Charles',        email: 'charles@charronix.com',  password: 'Charles@123',  role: 'ADMIN' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');
    
    await Promise.all([Drone.deleteMany({}), User.deleteMany({})]);
    logger.info('Cleared existing data');
    
    await Drone.insertMany(drones);
    await User.create(users);
    
    logger.info('✅ Seed complete: 4 drones, 4 users');
    process.exit(0);
  } catch (err) {
    logger.error(`Seed error: ${err.message}`);
    process.exit(1);
  }
}

seed();
