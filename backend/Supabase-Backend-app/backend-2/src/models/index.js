import { Sequelize } from 'sequelize';

// Initialize Sequelize with your database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to true for SQL query logging
});

// Import models
import User from './User.js';
import Contact from './Contact.js';
import Upload from './Upload.js';

// Define associations
User.hasMany(Contact);
Contact.belongsTo(User);
User.hasMany(Upload);
Upload.belongsTo(User);

// Export models and sequelize instance
export { sequelize, User, Contact, Upload };