# Database Scripts

This directory contains standalone utility scripts for managing the database, such as the initial data seeder.

## Files
- `data.ts`: Contains the raw JSON payload with all the categories and questions used for the quiz.
- `seed.ts`: A Prisma-powered script that reads `data.ts` and bulk-inserts all records into your connected PostgreSQL database.

## How to Run

### Method 1: Using npm (Recommended)
You can manually run the seeder at any time using the custom script defined in `package.json`:
```bash
npm run seed
```

### Method 2: Integrated with Prisma
Because we added the `prisma.seed` configuration to `package.json`, this script will automatically run whenever you reset your database:
```bash
npx prisma db seed
# OR
npx prisma migrate reset
```

### Method 3: Direct Execution
If you want to run it directly without any wrappers, use `tsx`:
```bash
npx tsx scripts/seed.ts
```
