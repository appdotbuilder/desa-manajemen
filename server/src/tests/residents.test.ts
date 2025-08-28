import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { residentsTable } from '../db/schema';
import { type CreateResidentInput, type UpdateResidentInput, type GetByIdInput } from '../schema';
import { createResident, getResidents, getResidentById, updateResident, deleteResident } from '../handlers/residents';
import { eq } from 'drizzle-orm';

// Test input data
const testResidentInput: CreateResidentInput = {
  name: 'John Doe',
  address: 'Jl. Merdeka No. 123, Jakarta',
  job: 'Software Engineer'
};

const testUpdateInput: UpdateResidentInput = {
  id: 1,
  name: 'Jane Doe',
  address: 'Jl. Sudirman No. 456, Surabaya'
  // job intentionally omitted to test partial updates
};

describe('Residents Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createResident', () => {
    it('should create a resident successfully', async () => {
      const result = await createResident(testResidentInput);

      expect(result.name).toEqual('John Doe');
      expect(result.address).toEqual('Jl. Merdeka No. 123, Jakarta');
      expect(result.job).toEqual('Software Engineer');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save resident to database', async () => {
      const result = await createResident(testResidentInput);

      const residents = await db.select()
        .from(residentsTable)
        .where(eq(residentsTable.id, result.id))
        .execute();

      expect(residents).toHaveLength(1);
      expect(residents[0].name).toEqual('John Doe');
      expect(residents[0].address).toEqual('Jl. Merdeka No. 123, Jakarta');
      expect(residents[0].job).toEqual('Software Engineer');
      expect(residents[0].created_at).toBeInstanceOf(Date);
      expect(residents[0].updated_at).toBeInstanceOf(Date);
    });

    it('should create multiple residents with unique IDs', async () => {
      const resident1 = await createResident(testResidentInput);
      const resident2 = await createResident({
        name: 'Alice Smith',
        address: 'Jl. Gatot Subroto No. 789',
        job: 'Teacher'
      });

      expect(resident1.id).not.toEqual(resident2.id);
      expect(resident2.name).toEqual('Alice Smith');
    });
  });

  describe('getResidents', () => {
    it('should return empty array when no residents exist', async () => {
      const result = await getResidents();
      expect(result).toEqual([]);
    });

    it('should return all residents', async () => {
      // Create test residents
      await createResident(testResidentInput);
      await createResident({
        name: 'Bob Wilson',
        address: 'Jl. Thamrin No. 321',
        job: 'Doctor'
      });

      const result = await getResidents();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('John Doe');
      expect(result[1].name).toEqual('Bob Wilson');
      expect(result.every(r => r.created_at instanceof Date)).toBe(true);
      expect(result.every(r => r.updated_at instanceof Date)).toBe(true);
    });

    it('should return residents in insertion order', async () => {
      const first = await createResident({ name: 'First', address: 'Address 1', job: 'Job 1' });
      const second = await createResident({ name: 'Second', address: 'Address 2', job: 'Job 2' });

      const result = await getResidents();

      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(first.id);
      expect(result[1].id).toEqual(second.id);
    });
  });

  describe('getResidentById', () => {
    it('should return null when resident does not exist', async () => {
      const result = await getResidentById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return resident when it exists', async () => {
      const created = await createResident(testResidentInput);
      const result = await getResidentById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('John Doe');
      expect(result!.address).toEqual('Jl. Merdeka No. 123, Jakarta');
      expect(result!.job).toEqual('Software Engineer');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return correct resident among multiple', async () => {
      const first = await createResident(testResidentInput);
      const second = await createResident({
        name: 'Second Resident',
        address: 'Different Address',
        job: 'Different Job'
      });

      const result = await getResidentById({ id: second.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(second.id);
      expect(result!.name).toEqual('Second Resident');
      expect(result!.address).toEqual('Different Address');
    });
  });

  describe('updateResident', () => {
    it('should update resident successfully', async () => {
      const created = await createResident(testResidentInput);
      const updateData = { ...testUpdateInput, id: created.id };

      const result = await updateResident(updateData);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Jane Doe');
      expect(result.address).toEqual('Jl. Sudirman No. 456, Surabaya');
      expect(result.job).toEqual('Software Engineer'); // Should remain unchanged
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
    });

    it('should persist changes to database', async () => {
      const created = await createResident(testResidentInput);
      const updateData = { ...testUpdateInput, id: created.id };

      await updateResident(updateData);

      const fromDb = await db.select()
        .from(residentsTable)
        .where(eq(residentsTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(1);
      expect(fromDb[0].name).toEqual('Jane Doe');
      expect(fromDb[0].address).toEqual('Jl. Sudirman No. 456, Surabaya');
      expect(fromDb[0].job).toEqual('Software Engineer'); // Unchanged
    });

    it('should update only provided fields', async () => {
      const created = await createResident(testResidentInput);

      // Update only job
      const partialUpdate = await updateResident({
        id: created.id,
        job: 'Data Scientist'
      });

      expect(partialUpdate.name).toEqual('John Doe'); // Unchanged
      expect(partialUpdate.address).toEqual('Jl. Merdeka No. 123, Jakarta'); // Unchanged
      expect(partialUpdate.job).toEqual('Data Scientist'); // Changed
    });

    it('should throw error when resident does not exist', async () => {
      const updateData: UpdateResidentInput = {
        id: 999,
        name: 'Non-existent User'
      };

      await expect(updateResident(updateData)).rejects.toThrow(/not found/i);
    });

    it('should update all fields when provided', async () => {
      const created = await createResident(testResidentInput);

      const fullUpdate: UpdateResidentInput = {
        id: created.id,
        name: 'Completely New Name',
        address: 'Completely New Address',
        job: 'Completely New Job'
      };

      const result = await updateResident(fullUpdate);

      expect(result.name).toEqual('Completely New Name');
      expect(result.address).toEqual('Completely New Address');
      expect(result.job).toEqual('Completely New Job');
    });
  });

  describe('deleteResident', () => {
    it('should delete resident successfully', async () => {
      const created = await createResident(testResidentInput);

      const result = await deleteResident({ id: created.id });

      expect(result.success).toBe(true);

      // Verify deletion
      const fromDb = await db.select()
        .from(residentsTable)
        .where(eq(residentsTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(0);
    });

    it('should return false when resident does not exist', async () => {
      const result = await deleteResident({ id: 999 });

      expect(result.success).toBe(false);
    });

    it('should not affect other residents', async () => {
      const resident1 = await createResident(testResidentInput);
      const resident2 = await createResident({
        name: 'Keep This One',
        address: 'Keep Address',
        job: 'Keep Job'
      });

      await deleteResident({ id: resident1.id });

      // Verify resident2 still exists
      const remaining = await db.select()
        .from(residentsTable)
        .where(eq(residentsTable.id, resident2.id))
        .execute();

      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toEqual('Keep This One');

      // Verify resident1 is gone
      const deleted = await db.select()
        .from(residentsTable)
        .where(eq(residentsTable.id, resident1.id))
        .execute();

      expect(deleted).toHaveLength(0);
    });

    it('should handle multiple deletions', async () => {
      const resident1 = await createResident(testResidentInput);
      const resident2 = await createResident({
        name: 'Second Resident',
        address: 'Second Address',
        job: 'Second Job'
      });

      const result1 = await deleteResident({ id: resident1.id });
      const result2 = await deleteResident({ id: resident2.id });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Verify both are deleted
      const allResidents = await getResidents();
      expect(allResidents).toHaveLength(0);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete CRUD operations', async () => {
      // Create
      const created = await createResident(testResidentInput);
      expect(created.name).toEqual('John Doe');

      // Read (single)
      const fetched = await getResidentById({ id: created.id });
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toEqual(created.id);

      // Update
      const updated = await updateResident({
        id: created.id,
        name: 'Updated Name'
      });
      expect(updated.name).toEqual('Updated Name');

      // Read (all)
      const allResidents = await getResidents();
      expect(allResidents).toHaveLength(1);
      expect(allResidents[0].name).toEqual('Updated Name');

      // Delete
      const deleteResult = await deleteResident({ id: created.id });
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const afterDelete = await getResidents();
      expect(afterDelete).toHaveLength(0);
    });
  });
});