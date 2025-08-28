import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { publicServicesTable } from '../db/schema';
import { type CreatePublicServiceInput, type UpdatePublicServiceInput, type GetByIdInput } from '../schema';
import {
  createPublicService,
  getPublicServices,
  getPublicServiceById,
  updatePublicService,
  deletePublicService,
  getActivePublicServices,
  togglePublicServiceStatus
} from '../handlers/public_services';
import { eq } from 'drizzle-orm';

const testCreateInput: CreatePublicServiceInput = {
  name: 'Surat Keterangan Domisili',
  description: 'Layanan pembuatan surat keterangan domisili untuk warga desa',
  requirements: 'KTP, KK, Surat Pengantar RT/RW',
  process_time: '3 hari kerja',
  cost: 5000,
  contact_person: 'Budi Santoso',
  office_hours: 'Senin-Jumat 08:00-16:00',
  is_active: 1
};

const testCreateInputMinimal: CreatePublicServiceInput = {
  name: 'Layanan Minimal',
  description: 'Deskripsi layanan minimal',
  requirements: null,
  process_time: null,
  cost: null,
  contact_person: null,
  office_hours: null,
  is_active: 1
};

describe('Public Services Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createPublicService', () => {
    it('should create a public service with all fields', async () => {
      const result = await createPublicService(testCreateInput);

      expect(result.name).toEqual('Surat Keterangan Domisili');
      expect(result.description).toEqual(testCreateInput.description);
      expect(result.requirements).toEqual('KTP, KK, Surat Pengantar RT/RW');
      expect(result.process_time).toEqual('3 hari kerja');
      expect(result.cost).toEqual(5000);
      expect(typeof result.cost).toBe('number');
      expect(result.contact_person).toEqual('Budi Santoso');
      expect(result.office_hours).toEqual('Senin-Jumat 08:00-16:00');
      expect(result.is_active).toEqual(1);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a public service with minimal fields', async () => {
      const result = await createPublicService(testCreateInputMinimal);

      expect(result.name).toEqual('Layanan Minimal');
      expect(result.description).toEqual('Deskripsi layanan minimal');
      expect(result.requirements).toBeNull();
      expect(result.process_time).toBeNull();
      expect(result.cost).toBeNull();
      expect(result.contact_person).toBeNull();
      expect(result.office_hours).toBeNull();
      expect(result.is_active).toEqual(1);
      expect(result.id).toBeDefined();
    });

    it('should save public service to database', async () => {
      const result = await createPublicService(testCreateInput);

      const services = await db.select()
        .from(publicServicesTable)
        .where(eq(publicServicesTable.id, result.id))
        .execute();

      expect(services).toHaveLength(1);
      expect(services[0].name).toEqual('Surat Keterangan Domisili');
      expect(parseFloat(services[0].cost!)).toEqual(5000);
      expect(services[0].is_active).toEqual(1);
    });

    it('should apply default is_active value', async () => {
      const inputWithoutIsActive = {
        ...testCreateInput,
        is_active: undefined as any
      };
      delete inputWithoutIsActive.is_active;

      const result = await createPublicService(inputWithoutIsActive);
      expect(result.is_active).toEqual(1);
    });
  });

  describe('getPublicServices', () => {
    it('should return empty array when no services exist', async () => {
      const result = await getPublicServices();
      expect(result).toEqual([]);
    });

    it('should return all public services', async () => {
      await createPublicService(testCreateInput);
      await createPublicService({ ...testCreateInputMinimal, name: 'Service 2' });

      const result = await getPublicServices();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Surat Keterangan Domisili');
      expect(result[0].cost).toEqual(5000);
      expect(typeof result[0].cost).toBe('number');
      expect(result[1].name).toEqual('Service 2');
      expect(result[1].cost).toBeNull();
    });

    it('should return services with proper numeric conversion', async () => {
      await createPublicService(testCreateInput);

      const result = await getPublicServices();

      expect(result[0].cost).toEqual(5000);
      expect(typeof result[0].cost).toBe('number');
    });
  });

  describe('getPublicServiceById', () => {
    it('should return null when service does not exist', async () => {
      const result = await getPublicServiceById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return public service by ID', async () => {
      const created = await createPublicService(testCreateInput);

      const result = await getPublicServiceById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Surat Keterangan Domisili');
      expect(result!.cost).toEqual(5000);
      expect(typeof result!.cost).toBe('number');
    });
  });

  describe('updatePublicService', () => {
    it('should update all fields of a public service', async () => {
      const created = await createPublicService(testCreateInput);

      const updateInput: UpdatePublicServiceInput = {
        id: created.id,
        name: 'Updated Service Name',
        description: 'Updated description',
        requirements: 'Updated requirements',
        process_time: '5 hari kerja',
        cost: 10000,
        contact_person: 'Updated Person',
        office_hours: 'Updated Hours',
        is_active: 0
      };

      const result = await updatePublicService(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Service Name');
      expect(result.description).toEqual('Updated description');
      expect(result.requirements).toEqual('Updated requirements');
      expect(result.process_time).toEqual('5 hari kerja');
      expect(result.cost).toEqual(10000);
      expect(typeof result.cost).toBe('number');
      expect(result.contact_person).toEqual('Updated Person');
      expect(result.office_hours).toEqual('Updated Hours');
      expect(result.is_active).toEqual(0);
    });

    it('should update partial fields', async () => {
      const created = await createPublicService(testCreateInput);

      const updateInput: UpdatePublicServiceInput = {
        id: created.id,
        name: 'Partially Updated',
        cost: 15000
      };

      const result = await updatePublicService(updateInput);

      expect(result.name).toEqual('Partially Updated');
      expect(result.cost).toEqual(15000);
      expect(result.description).toEqual(testCreateInput.description); // Unchanged
      expect(result.is_active).toEqual(1); // Unchanged
    });

    it('should update cost to null', async () => {
      const created = await createPublicService(testCreateInput);

      const updateInput: UpdatePublicServiceInput = {
        id: created.id,
        cost: null
      };

      const result = await updatePublicService(updateInput);

      expect(result.cost).toBeNull();
    });

    it('should throw error for non-existent service', async () => {
      const updateInput: UpdatePublicServiceInput = {
        id: 999,
        name: 'Non-existent'
      };

      await expect(updatePublicService(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deletePublicService', () => {
    it('should delete existing public service', async () => {
      const created = await createPublicService(testCreateInput);

      const result = await deletePublicService({ id: created.id });

      expect(result.success).toBe(true);

      const service = await getPublicServiceById({ id: created.id });
      expect(service).toBeNull();
    });

    it('should return false for non-existent service', async () => {
      const result = await deletePublicService({ id: 999 });
      expect(result.success).toBe(false);
    });
  });

  describe('getActivePublicServices', () => {
    it('should return only active public services', async () => {
      const activeService = await createPublicService(testCreateInput);
      const inactiveService = await createPublicService({
        ...testCreateInputMinimal,
        name: 'Inactive Service',
        is_active: 0
      });

      const result = await getActivePublicServices();

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(activeService.id);
      expect(result[0].is_active).toEqual(1);
    });

    it('should return empty array when no active services exist', async () => {
      await createPublicService({
        ...testCreateInput,
        is_active: 0
      });

      const result = await getActivePublicServices();
      expect(result).toEqual([]);
    });

    it('should handle numeric conversion for active services', async () => {
      await createPublicService(testCreateInput);

      const result = await getActivePublicServices();

      expect(result[0].cost).toEqual(5000);
      expect(typeof result[0].cost).toBe('number');
    });
  });

  describe('togglePublicServiceStatus', () => {
    it('should toggle active service to inactive', async () => {
      const created = await createPublicService(testCreateInput); // is_active = 1

      const result = await togglePublicServiceStatus({ id: created.id });

      expect(result.is_active).toEqual(0);
      expect(result.id).toEqual(created.id);
    });

    it('should toggle inactive service to active', async () => {
      const created = await createPublicService({
        ...testCreateInput,
        is_active: 0
      });

      const result = await togglePublicServiceStatus({ id: created.id });

      expect(result.is_active).toEqual(1);
      expect(result.id).toEqual(created.id);
    });

    it('should throw error for non-existent service', async () => {
      await expect(togglePublicServiceStatus({ id: 999 })).rejects.toThrow(/not found/i);
    });

    it('should preserve other fields when toggling status', async () => {
      const created = await createPublicService(testCreateInput);

      const result = await togglePublicServiceStatus({ id: created.id });

      expect(result.name).toEqual(created.name);
      expect(result.cost).toEqual(created.cost);
      expect(result.description).toEqual(created.description);
      expect(result.is_active).toEqual(0); // Only this should change
    });
  });
});