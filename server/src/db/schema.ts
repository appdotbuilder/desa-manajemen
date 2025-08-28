import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';

// Tabel data penduduk
export const residentsTable = pgTable('residents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  job: text('job').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tabel keuangan desa
export const villageFinanceTable = pgTable('village_finance', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'income' atau 'expense'
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  category: text('category').notNull(),
  date: date('date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tabel anggaran desa
export const villageBudgetTable = pgTable('village_budget', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  allocated_amount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull(),
  used_amount: numeric('used_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  year: integer('year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tabel acara/kegiatan desa
export const villageEventsTable = pgTable('village_events', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location').notNull(),
  event_date: date('event_date').notNull(),
  organizer: text('organizer').notNull(),
  participant_count: integer('participant_count'),
  budget: numeric('budget', { precision: 15, scale: 2 }),
  status: text('status').notNull().default('planned'), // 'planned', 'ongoing', 'completed', 'cancelled'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tabel aset desa
export const villageAssetsTable = pgTable('village_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  value: numeric('value', { precision: 15, scale: 2 }).notNull(),
  condition: text('condition').notNull(), // 'excellent', 'good', 'fair', 'poor'
  location: text('location').notNull(),
  purchase_date: date('purchase_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tabel informasi layanan publik
export const publicServicesTable = pgTable('public_services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  process_time: text('process_time'),
  cost: numeric('cost', { precision: 10, scale: 2 }),
  contact_person: text('contact_person'),
  office_hours: text('office_hours'),
  is_active: integer('is_active').notNull().default(1), // 1 for active, 0 for inactive
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for table schemas
export type Resident = typeof residentsTable.$inferSelect;
export type NewResident = typeof residentsTable.$inferInsert;

export type VillageFinance = typeof villageFinanceTable.$inferSelect;
export type NewVillageFinance = typeof villageFinanceTable.$inferInsert;

export type VillageBudget = typeof villageBudgetTable.$inferSelect;
export type NewVillageBudget = typeof villageBudgetTable.$inferInsert;

export type VillageEvent = typeof villageEventsTable.$inferSelect;
export type NewVillageEvent = typeof villageEventsTable.$inferInsert;

export type VillageAsset = typeof villageAssetsTable.$inferSelect;
export type NewVillageAsset = typeof villageAssetsTable.$inferInsert;

export type PublicService = typeof publicServicesTable.$inferSelect;
export type NewPublicService = typeof publicServicesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  residents: residentsTable,
  villageFinance: villageFinanceTable,
  villageBudget: villageBudgetTable,
  villageEvents: villageEventsTable,
  villageAssets: villageAssetsTable,
  publicServices: publicServicesTable,
};