import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villageBudgetTable } from '../db/schema';
import { type CreateVillageBudgetInput, type UpdateVillageBudgetInput } from '../schema';
import { 
  createVillageBudget, 
  getVillageBudgets, 
  getVillageBudgetById, 
  updateVillageBudget, 
  deleteVillageBudget,
  getBudgetByYear 
} from '../handlers/village_budget';
import { eq } from 'drizzle-orm';

// Test input data
const testBudgetInput: CreateVillageBudgetInput = {
  category: 'Infrastructure',
  allocated_amount: 50000000, // 50 million
  year: 2024
};

const testBudgetInput2: CreateVillageBudgetInput = {
  category: 'Education',
  allocated_amount: 25000000, // 25 million
  year: 2024
};

const testBudgetInput3: CreateVillageBudgetInput = {
  category: 'Health Services',
  allocated_amount: 30000000, // 30 million
  year: 2023
};

describe('Village Budget Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createVillageBudget', () => {
    it('should create a village budget', async () => {
      const result = await createVillageBudget(testBudgetInput);

      // Basic field validation
      expect(result.category).toEqual('Infrastructure');
      expect(result.allocated_amount).toEqual(50000000);
      expect(result.used_amount).toEqual(0); // Default value
      expect(result.year).toEqual(2024);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify numeric types
      expect(typeof result.allocated_amount).toBe('number');
      expect(typeof result.used_amount).toBe('number');
    });

    it('should save budget to database', async () => {
      const result = await createVillageBudget(testBudgetInput);

      // Query database directly
      const budgets = await db.select()
        .from(villageBudgetTable)
        .where(eq(villageBudgetTable.id, result.id))
        .execute();

      expect(budgets).toHaveLength(1);
      expect(budgets[0].category).toEqual('Infrastructure');
      expect(parseFloat(budgets[0].allocated_amount)).toEqual(50000000);
      expect(parseFloat(budgets[0].used_amount)).toEqual(0);
      expect(budgets[0].year).toEqual(2024);
      expect(budgets[0].created_at).toBeInstanceOf(Date);
    });
  });

  describe('getVillageBudgets', () => {
    it('should return empty array when no budgets exist', async () => {
      const result = await getVillageBudgets();
      expect(result).toEqual([]);
    });

    it('should return all village budgets', async () => {
      // Create test budgets
      await createVillageBudget(testBudgetInput);
      await createVillageBudget(testBudgetInput2);

      const result = await getVillageBudgets();

      expect(result).toHaveLength(2);
      
      // Check first budget
      const infraBudget = result.find(b => b.category === 'Infrastructure');
      expect(infraBudget).toBeDefined();
      expect(infraBudget!.allocated_amount).toEqual(50000000);
      expect(typeof infraBudget!.allocated_amount).toBe('number');

      // Check second budget
      const eduBudget = result.find(b => b.category === 'Education');
      expect(eduBudget).toBeDefined();
      expect(eduBudget!.allocated_amount).toEqual(25000000);
      expect(typeof eduBudget!.allocated_amount).toBe('number');
    });
  });

  describe('getVillageBudgetById', () => {
    it('should return null for non-existent budget', async () => {
      const result = await getVillageBudgetById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return budget by ID', async () => {
      const created = await createVillageBudget(testBudgetInput);
      const result = await getVillageBudgetById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.category).toEqual('Infrastructure');
      expect(result!.allocated_amount).toEqual(50000000);
      expect(typeof result!.allocated_amount).toBe('number');
      expect(typeof result!.used_amount).toBe('number');
    });
  });

  describe('updateVillageBudget', () => {
    it('should throw error for non-existent budget', async () => {
      const updateInput: UpdateVillageBudgetInput = {
        id: 999,
        category: 'Updated Category'
      };

      await expect(updateVillageBudget(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should update budget category', async () => {
      const created = await createVillageBudget(testBudgetInput);
      
      const updateInput: UpdateVillageBudgetInput = {
        id: created.id,
        category: 'Updated Infrastructure'
      };

      const result = await updateVillageBudget(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.category).toEqual('Updated Infrastructure');
      expect(result.allocated_amount).toEqual(50000000); // Unchanged
      expect(result.year).toEqual(2024); // Unchanged
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update allocated amount', async () => {
      const created = await createVillageBudget(testBudgetInput);
      
      const updateInput: UpdateVillageBudgetInput = {
        id: created.id,
        allocated_amount: 75000000
      };

      const result = await updateVillageBudget(updateInput);

      expect(result.allocated_amount).toEqual(75000000);
      expect(typeof result.allocated_amount).toBe('number');
      expect(result.category).toEqual('Infrastructure'); // Unchanged
    });

    it('should update used amount', async () => {
      const created = await createVillageBudget(testBudgetInput);
      
      const updateInput: UpdateVillageBudgetInput = {
        id: created.id,
        used_amount: 10000000
      };

      const result = await updateVillageBudget(updateInput);

      expect(result.used_amount).toEqual(10000000);
      expect(typeof result.used_amount).toBe('number');
    });

    it('should update multiple fields', async () => {
      const created = await createVillageBudget(testBudgetInput);
      
      const updateInput: UpdateVillageBudgetInput = {
        id: created.id,
        category: 'Public Works',
        allocated_amount: 80000000,
        used_amount: 15000000,
        year: 2025
      };

      const result = await updateVillageBudget(updateInput);

      expect(result.category).toEqual('Public Works');
      expect(result.allocated_amount).toEqual(80000000);
      expect(result.used_amount).toEqual(15000000);
      expect(result.year).toEqual(2025);
      expect(typeof result.allocated_amount).toBe('number');
      expect(typeof result.used_amount).toBe('number');
    });
  });

  describe('deleteVillageBudget', () => {
    it('should return false for non-existent budget', async () => {
      const result = await deleteVillageBudget({ id: 999 });
      expect(result.success).toBe(false);
    });

    it('should delete existing budget', async () => {
      const created = await createVillageBudget(testBudgetInput);
      
      const result = await deleteVillageBudget({ id: created.id });
      expect(result.success).toBe(true);

      // Verify budget is deleted
      const found = await getVillageBudgetById({ id: created.id });
      expect(found).toBeNull();
    });

    it('should not affect other budgets when deleting', async () => {
      const budget1 = await createVillageBudget(testBudgetInput);
      const budget2 = await createVillageBudget(testBudgetInput2);

      // Delete first budget
      await deleteVillageBudget({ id: budget1.id });

      // Second budget should still exist
      const found = await getVillageBudgetById({ id: budget2.id });
      expect(found).not.toBeNull();
      expect(found!.category).toEqual('Education');
    });
  });

  describe('getBudgetByYear', () => {
    it('should return empty array for year with no budgets', async () => {
      const result = await getBudgetByYear(2025);
      expect(result).toEqual([]);
    });

    it('should return budgets for specific year', async () => {
      // Create budgets for different years
      await createVillageBudget(testBudgetInput); // 2024
      await createVillageBudget(testBudgetInput2); // 2024
      await createVillageBudget(testBudgetInput3); // 2023

      const result2024 = await getBudgetByYear(2024);
      expect(result2024).toHaveLength(2);
      expect(result2024.every(b => b.year === 2024)).toBe(true);

      const result2023 = await getBudgetByYear(2023);
      expect(result2023).toHaveLength(1);
      expect(result2023[0].year).toEqual(2023);
      expect(result2023[0].category).toEqual('Health Services');
    });

    it('should return budgets with correct numeric types', async () => {
      await createVillageBudget(testBudgetInput);

      const result = await getBudgetByYear(2024);
      expect(result).toHaveLength(1);
      expect(typeof result[0].allocated_amount).toBe('number');
      expect(typeof result[0].used_amount).toBe('number');
      expect(result[0].allocated_amount).toEqual(50000000);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      const created = await createVillageBudget(testBudgetInput);
      expect(created.category).toEqual('Infrastructure');

      // Read
      const found = await getVillageBudgetById({ id: created.id });
      expect(found).not.toBeNull();
      expect(found!.id).toEqual(created.id);

      // Update
      const updateInput: UpdateVillageBudgetInput = {
        id: created.id,
        used_amount: 20000000
      };
      const updated = await updateVillageBudget(updateInput);
      expect(updated.used_amount).toEqual(20000000);

      // List
      const allBudgets = await getVillageBudgets();
      expect(allBudgets).toHaveLength(1);
      expect(allBudgets[0].used_amount).toEqual(20000000);

      // Delete
      const deleted = await deleteVillageBudget({ id: created.id });
      expect(deleted.success).toBe(true);

      // Verify deletion
      const afterDelete = await getVillageBudgets();
      expect(afterDelete).toHaveLength(0);
    });
  });
});