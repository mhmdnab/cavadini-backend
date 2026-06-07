import app from './app';
import prisma from './lib/prisma';

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGTERM', async () => {
  server.close();
  await prisma.$disconnect();
});
