import { z } from 'zod';

// Resident schemas
export const residentSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  job: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Resident = z.infer<typeof residentSchema>;

export const createResidentInputSchema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  address: z.string().min(1, 'Alamat tidak boleh kosong'),
  job: z.string().min(1, 'Pekerjaan tidak boleh kosong'),
});

export type CreateResidentInput = z.infer<typeof createResidentInputSchema>;

export const updateResidentInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  job: z.string().min(1).optional(),
});

export type UpdateResidentInput = z.infer<typeof updateResidentInputSchema>;

// Village Finance schemas
export const villageFinanceSchema = z.object({
  id: z.number(),
  type: z.enum(['income', 'expense']),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  date: z.string(), // Date stored as string in DB
  created_at: z.coerce.date(),
});

export type VillageFinance = z.infer<typeof villageFinanceSchema>;

export const createVillageFinanceInputSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong'),
  amount: z.number().positive('Jumlah harus lebih besar dari 0'),
  category: z.string().min(1, 'Kategori tidak boleh kosong'),
  date: z.string(),
});

export type CreateVillageFinanceInput = z.infer<typeof createVillageFinanceInputSchema>;

export const updateVillageFinanceInputSchema = z.object({
  id: z.number(),
  type: z.enum(['income', 'expense']).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  date: z.string().optional(),
});

export type UpdateVillageFinanceInput = z.infer<typeof updateVillageFinanceInputSchema>;

// Village Budget schemas
export const villageBudgetSchema = z.object({
  id: z.number(),
  category: z.string(),
  allocated_amount: z.number(),
  used_amount: z.number(),
  year: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type VillageBudget = z.infer<typeof villageBudgetSchema>;

export const createVillageBudgetInputSchema = z.object({
  category: z.string().min(1, 'Kategori tidak boleh kosong'),
  allocated_amount: z.number().positive('Jumlah anggaran harus lebih besar dari 0'),
  year: z.number().int().min(2000, 'Tahun tidak valid'),
});

export type CreateVillageBudgetInput = z.infer<typeof createVillageBudgetInputSchema>;

export const updateVillageBudgetInputSchema = z.object({
  id: z.number(),
  category: z.string().min(1).optional(),
  allocated_amount: z.number().positive().optional(),
  used_amount: z.number().nonnegative().optional(),
  year: z.number().int().min(2000).optional(),
});

export type UpdateVillageBudgetInput = z.infer<typeof updateVillageBudgetInputSchema>;

// Village Events schemas
export const villageEventSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  location: z.string(),
  event_date: z.string(), // Date stored as string in DB
  organizer: z.string(),
  participant_count: z.number().int().nullable(),
  budget: z.number().nullable(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type VillageEvent = z.infer<typeof villageEventSchema>;

export const createVillageEventInputSchema = z.object({
  name: z.string().min(1, 'Nama acara tidak boleh kosong'),
  description: z.string().nullable(),
  location: z.string().min(1, 'Lokasi tidak boleh kosong'),
  event_date: z.string(),
  organizer: z.string().min(1, 'Penyelenggara tidak boleh kosong'),
  participant_count: z.number().int().nonnegative().nullable(),
  budget: z.number().positive().nullable(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('planned'),
});

export type CreateVillageEventInput = z.infer<typeof createVillageEventInputSchema>;

export const updateVillageEventInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  location: z.string().min(1).optional(),
  event_date: z.string().optional(),
  organizer: z.string().min(1).optional(),
  participant_count: z.number().int().nonnegative().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional(),
});

export type UpdateVillageEventInput = z.infer<typeof updateVillageEventInputSchema>;

// Village Assets schemas
export const villageAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  value: z.number(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  location: z.string(),
  purchase_date: z.string().nullable(), // Date stored as string in DB
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type VillageAsset = z.infer<typeof villageAssetSchema>;

export const createVillageAssetInputSchema = z.object({
  name: z.string().min(1, 'Nama aset tidak boleh kosong'),
  description: z.string().nullable(),
  category: z.string().min(1, 'Kategori tidak boleh kosong'),
  value: z.number().positive('Nilai aset harus lebih besar dari 0'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  location: z.string().min(1, 'Lokasi tidak boleh kosong'),
  purchase_date: z.string().nullable(),
});

export type CreateVillageAssetInput = z.infer<typeof createVillageAssetInputSchema>;

export const updateVillageAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  location: z.string().min(1).optional(),
  purchase_date: z.string().nullable().optional(),
});

export type UpdateVillageAssetInput = z.infer<typeof updateVillageAssetInputSchema>;

// Public Services schemas
export const publicServiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  requirements: z.string().nullable(),
  process_time: z.string().nullable(),
  cost: z.number().nullable(),
  contact_person: z.string().nullable(),
  office_hours: z.string().nullable(),
  is_active: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PublicService = z.infer<typeof publicServiceSchema>;

export const createPublicServiceInputSchema = z.object({
  name: z.string().min(1, 'Nama layanan tidak boleh kosong'),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong'),
  requirements: z.string().nullable(),
  process_time: z.string().nullable(),
  cost: z.number().nonnegative().nullable(),
  contact_person: z.string().nullable(),
  office_hours: z.string().nullable(),
  is_active: z.number().int().min(0).max(1).default(1),
});

export type CreatePublicServiceInput = z.infer<typeof createPublicServiceInputSchema>;

export const updatePublicServiceInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().nullable().optional(),
  process_time: z.string().nullable().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  office_hours: z.string().nullable().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

export type UpdatePublicServiceInput = z.infer<typeof updatePublicServiceInputSchema>;

// Query schemas
export const getByIdInputSchema = z.object({
  id: z.number(),
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;