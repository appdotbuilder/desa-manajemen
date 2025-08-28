import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villageAssetsTable } from '../db/schema';
import { type CreateVillageAssetInput, type UpdateVillageAssetInput, type GetByIdInput } from '../schema';
import { 
  createVillageAsset, 
  getVillageAssets, 
  getVillageAssetById, 
  updateVillageAsset, 
  deleteVillageAsset, 
  getAssetsByCategory, 
  getAssetsSummary 
} from '../handlers/village_assets';
import { eq } from 'drizzle-orm';

// Test inputs
const testAssetInput: CreateVillageAssetInput = {
  name: 'Test Asset',
  description: 'A test village asset',
  category: 'Infrastructure',
  value: 150000.50,
  condition: 'good',
  location: 'Village Center',
  purchase_date: '2023-01-15',
};

const minimalAssetInput: CreateVillageAssetInput = {
  name: 'Minimal Asset',
  description: null,
  category: 'Equipment',
  value: 25000,
  condition: 'excellent',
  location: 'Storage Room',
  purchase_date: null,
};

describe('Village Assets Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createVillageAsset', () => {
    it('should create a village asset with all fields', async () => {
      const result = await createVillageAsset(testAssetInput);

      expect(result.name).toEqual('Test Asset');
      expect(result.description).toEqual('A test village asset');
      expect(result.category).toEqual('Infrastructure');
      expect(result.value).toEqual(150000.50);
      expect(typeof result.value).toBe('number');
      expect(result.condition).toEqual('good');
      expect(result.location).toEqual('Village Center');
      expect(result.purchase_date).toEqual('2023-01-15');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a village asset with nullable fields', async () => {
      const result = await createVillageAsset(minimalAssetInput);

      expect(result.name).toEqual('Minimal Asset');
      expect(result.description).toBeNull();
      expect(result.category).toEqual('Equipment');
      expect(result.value).toEqual(25000);
      expect(result.condition).toEqual('excellent');
      expect(result.location).toEqual('Storage Room');
      expect(result.purchase_date).toBeNull();
      expect(result.id).toBeDefined();
    });

    it('should save village asset to database', async () => {
      const result = await createVillageAsset(testAssetInput);

      const assets = await db.select()
        .from(villageAssetsTable)
        .where(eq(villageAssetsTable.id, result.id))
        .execute();

      expect(assets).toHaveLength(1);
      expect(assets[0].name).toEqual('Test Asset');
      expect(parseFloat(assets[0].value)).toEqual(150000.50);
      expect(assets[0].condition).toEqual('good');
    });
  });

  describe('getVillageAssets', () => {
    it('should return empty array when no assets exist', async () => {
      const result = await getVillageAssets();
      expect(result).toEqual([]);
    });

    it('should return all village assets', async () => {
      await createVillageAsset(testAssetInput);
      await createVillageAsset(minimalAssetInput);

      const result = await getVillageAssets();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Asset');
      expect(result[0].value).toEqual(150000.50);
      expect(typeof result[0].value).toBe('number');
      expect(result[1].name).toEqual('Minimal Asset');
      expect(result[1].value).toEqual(25000);
      expect(typeof result[1].value).toBe('number');
    });
  });

  describe('getVillageAssetById', () => {
    it('should return null for non-existent asset', async () => {
      const result = await getVillageAssetById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return specific village asset by ID', async () => {
      const created = await createVillageAsset(testAssetInput);

      const result = await getVillageAssetById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Asset');
      expect(result!.value).toEqual(150000.50);
      expect(typeof result!.value).toBe('number');
      expect(result!.condition).toEqual('good');
    });
  });

  describe('updateVillageAsset', () => {
    it('should update specific fields only', async () => {
      const created = await createVillageAsset(testAssetInput);

      const updateInput: UpdateVillageAssetInput = {
        id: created.id,
        name: 'Updated Asset Name',
        value: 200000,
      };

      const result = await updateVillageAsset(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Asset Name');
      expect(result.description).toEqual('A test village asset'); // Should remain unchanged
      expect(result.value).toEqual(200000);
      expect(typeof result.value).toBe('number');
      expect(result.condition).toEqual('good'); // Should remain unchanged
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update all fields', async () => {
      const created = await createVillageAsset(testAssetInput);

      const updateInput: UpdateVillageAssetInput = {
        id: created.id,
        name: 'Completely Updated Asset',
        description: 'Updated description',
        category: 'Vehicles',
        value: 300000,
        condition: 'fair',
        location: 'New Location',
        purchase_date: '2024-01-01',
      };

      const result = await updateVillageAsset(updateInput);

      expect(result.name).toEqual('Completely Updated Asset');
      expect(result.description).toEqual('Updated description');
      expect(result.category).toEqual('Vehicles');
      expect(result.value).toEqual(300000);
      expect(result.condition).toEqual('fair');
      expect(result.location).toEqual('New Location');
      expect(result.purchase_date).toEqual('2024-01-01');
    });

    it('should throw error for non-existent asset', async () => {
      const updateInput: UpdateVillageAssetInput = {
        id: 999,
        name: 'Non-existent Asset',
      };

      expect(updateVillageAsset(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should handle nullable field updates', async () => {
      const created = await createVillageAsset(testAssetInput);

      const updateInput: UpdateVillageAssetInput = {
        id: created.id,
        description: null,
        purchase_date: null,
      };

      const result = await updateVillageAsset(updateInput);

      expect(result.description).toBeNull();
      expect(result.purchase_date).toBeNull();
      expect(result.name).toEqual('Test Asset'); // Should remain unchanged
    });
  });

  describe('deleteVillageAsset', () => {
    it('should delete existing village asset', async () => {
      const created = await createVillageAsset(testAssetInput);

      const result = await deleteVillageAsset({ id: created.id });

      expect(result.success).toBe(true);

      // Verify asset is deleted
      const deletedAsset = await getVillageAssetById({ id: created.id });
      expect(deletedAsset).toBeNull();
    });

    it('should return false for non-existent asset', async () => {
      const result = await deleteVillageAsset({ id: 999 });
      expect(result.success).toBe(false);
    });
  });

  describe('getAssetsByCategory', () => {
    it('should return empty array for non-existent category', async () => {
      const result = await getAssetsByCategory('Non-existent');
      expect(result).toEqual([]);
    });

    it('should return assets filtered by category', async () => {
      await createVillageAsset(testAssetInput); // Infrastructure category
      await createVillageAsset(minimalAssetInput); // Equipment category
      await createVillageAsset({
        ...testAssetInput,
        name: 'Another Infrastructure Asset',
        category: 'Infrastructure',
      });

      const infrastructureAssets = await getAssetsByCategory('Infrastructure');
      expect(infrastructureAssets).toHaveLength(2);
      expect(infrastructureAssets.every(asset => asset.category === 'Infrastructure')).toBe(true);

      const equipmentAssets = await getAssetsByCategory('Equipment');
      expect(equipmentAssets).toHaveLength(1);
      expect(equipmentAssets[0].category).toEqual('Equipment');
      expect(equipmentAssets[0].value).toEqual(25000);
      expect(typeof equipmentAssets[0].value).toBe('number');
    });
  });

  describe('getAssetsSummary', () => {
    it('should return zero summary for empty database', async () => {
      const result = await getAssetsSummary();

      expect(result.totalValue).toEqual(0);
      expect(result.totalCount).toEqual(0);
      expect(result.byCondition).toEqual({
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      });
    });

    it('should calculate correct summary for multiple assets', async () => {
      // Create assets with different conditions
      await createVillageAsset({
        ...testAssetInput,
        condition: 'excellent',
        value: 100000,
      });
      await createVillageAsset({
        ...testAssetInput,
        name: 'Good Asset',
        condition: 'good',
        value: 50000,
      });
      await createVillageAsset({
        ...testAssetInput,
        name: 'Fair Asset',
        condition: 'fair',
        value: 30000,
      });
      await createVillageAsset({
        ...testAssetInput,
        name: 'Poor Asset',
        condition: 'poor',
        value: 10000,
      });
      await createVillageAsset({
        ...testAssetInput,
        name: 'Another Good Asset',
        condition: 'good',
        value: 60000,
      });

      const result = await getAssetsSummary();

      expect(result.totalValue).toEqual(250000);
      expect(result.totalCount).toEqual(5);
      expect(result.byCondition).toEqual({
        excellent: 1,
        good: 2,
        fair: 1,
        poor: 1,
      });
    });

    it('should handle decimal values correctly in summary', async () => {
      await createVillageAsset({
        ...testAssetInput,
        value: 150000.75,
      });
      await createVillageAsset({
        ...minimalAssetInput,
        value: 25000.25,
      });

      const result = await getAssetsSummary();

      expect(result.totalValue).toEqual(175001);
      expect(result.totalCount).toEqual(2);
    });
  });
});