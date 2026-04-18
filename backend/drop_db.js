const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/buildtrack_ai');
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped');
  process.exit(0);
}
run();
