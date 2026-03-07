import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';

async function seedAdmin(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  const email = 'ism-import@web.de';
  const password = 'cavadiniadmin123';

  const existing = await User.findOne({ email });
  if (existing) {
    await User.updateOne({ email }, { isAdmin: true });
    console.log(`Admin already exists — ensured isAdmin: true for ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name: 'Admin', email, passwordHash, isAdmin: true });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
  console.log('Done');
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
