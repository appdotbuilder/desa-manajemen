import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villageFinanceTable } from '../db/schema';
import { type CreateVillageFinanceInput, type UpdateVillageFinanceInput, type GetByIdInput } from '../schema';
import { 
  createVillageFinance, 
  getVillageFinances, 
  getVillageFinanceById, 
  updateVillageFinance, 
  deleteVillageFinance, 
  getFinanceSummary 
} from '../handlers/village_finance';
import { eq } from 'drizzle-orm';

// Test input data
const testIncomeInput: CreateVillageFinanceInput = {
  type: 'income',
  description: 'Dana desa dari pemerintah',
  amount: 50000000,
  category: 'Dana Desa',
  date: '2024-01-15'
};

const testExpenseInput: CreateVillageFinanceInput = {
  type: 'expense',
  description: 'Pembelian peralatan kantor',
  amount: 5000000,
  category: 'Operasional',
  date: '2024-01-20'
};

describe('Village Finance Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createVillageFinance', () => {
    it('should create an income record', async () => {
      const result = await createVillageFinance(testIncomeInput);

      expect(result.type).toEqual('income');
      expect(result.description).toEqual('Dana desa dari pemerintah');
      expect(result.amount).toEqual(50000000);
      expect(typeof result.amount).toEqual('number');
      expect(result.category).toEqual('Dana Desa');
      expect(result.date).toEqual('2024-01-15');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should create an expense record', async () => {
      const result = await createVillageFinance(testExpenseInput);

      expect(result.type).toEqual('expense');
      expect(result.description).toEqual('Pembelian peralatan kantor');
      expect(result.amount).toEqual(5000000);
      expect(typeof result.amount).toEqual('number');
      expect(result.category).toEqual('Operasional');
      expect(result.date).toEqual('2024-01-20');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save record to database', async () => {
      const result = await createVillageFinance(testIncomeInput);

      const records = await db.select()
        .from(villageFinanceTable)
        .where(eq(villageFinanceTable.id, result.id))
        .execute();

      expect(records).toHaveLength(1);
      expect(records[0].type).toEqual('income');
      expect(records[0].description).toEqual('Dana desa dari pemerintah');
      expect(parseFloat(records[0].amount)).toEqual(50000000);
      expect(records[0].category).toEqual('Dana Desa');
      expect(records[0].date).toEqual('2024-01-15');
    });
  });

  describe('getVillageFinances', () => {
    it('should return empty array when no records exist', async () => {
      const result = await getVillageFinances();
      expect(result).toEqual([]);
    });

    it('should return all finance records', async () => {
      await createVillageFinance(testIncomeInput);
      await createVillageFinance(testExpenseInput);

      const result = await getVillageFinances();

      expect(result).toHaveLength(2);
      expect(result[0].type).toEqual('income');
      expect(result[0].amount).toEqual(50000000);
      expect(typeof result[0].amount).toEqual('number');
      expect(result[1].type).toEqual('expense');
      expect(result[1].amount).toEqual(5000000);
      expect(typeof result[1].amount).toEqual('number');
    });

    it('should return records with correct numeric types', async () => {
      await createVillageFinance(testIncomeInput);

      const result = await getVillageFinances();

      expect(result).toHaveLength(1);
      expect(typeof result[0].amount).toEqual('number');
      expect(result[0].amount).toEqual(50000000);
    });
  });

  describe('getVillageFinanceById', () => {
    it('should return null for non-existent record', async () => {
      const result = await getVillageFinanceById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return correct record by ID', async () => {
      const created = await createVillageFinance(testIncomeInput);

      const result = await getVillageFinanceById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.type).toEqual('income');
      expect(result!.description).toEqual('Dana desa dari pemerintah');
      expect(result!.amount).toEqual(50000000);
      expect(typeof result!.amount).toEqual('number');
      expect(result!.category).toEqual('Dana Desa');
    });

    it('should return record with correct numeric conversion', async () => {
      const created = await createVillageFinance(testExpenseInput);

      const result = await getVillageFinanceById({ id: created.id });

      expect(result).not.toBeNull();
      expect(typeof result!.amount).toEqual('number');
      expect(result!.amount).toEqual(5000000);
    });
  });

  describe('updateVillageFinance', () => {
    it('should update all fields', async () => {
      const created = await createVillageFinance(testIncomeInput);

      const updateInput: UpdateVillageFinanceInput = {
        id: created.id,
        type: 'expense',
        description: 'Updated description',
        amount: 25000000,
        category: 'Updated Category',
        date: '2024-02-01'
      };

      const result = await updateVillageFinance(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.type).toEqual('expense');
      expect(result.description).toEqual('Updated description');
      expect(result.amount).toEqual(25000000);
      expect(typeof result.amount).toEqual('number');
      expect(result.category).toEqual('Updated Category');
      expect(result.date).toEqual('2024-02-01');
    });

    it('should update partial fields', async () => {
      const created = await createVillageFinance(testIncomeInput);

      const updateInput: UpdateVillageFinanceInput = {
        id: created.id,
        description: 'Partially updated description',
        amount: 75000000
      };

      const result = await updateVillageFinance(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.type).toEqual('income'); // Should remain unchanged
      expect(result.description).toEqual('Partially updated description');
      expect(result.amount).toEqual(75000000);
      expect(typeof result.amount).toEqual('number');
      expect(result.category).toEqual('Dana Desa'); // Should remain unchanged
    });

    it('should throw error for non-existent record', async () => {
      const updateInput: UpdateVillageFinanceInput = {
        id: 999,
        description: 'Non-existent record'
      };

      expect(updateVillageFinance(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should persist changes to database', async () => {
      const created = await createVillageFinance(testIncomeInput);

      const updateInput: UpdateVillageFinanceInput = {
        id: created.id,
        amount: 80000000,
        category: 'Updated in DB'
      };

      await updateVillageFinance(updateInput);

      const records = await db.select()
        .from(villageFinanceTable)
        .where(eq(villageFinanceTable.id, created.id))
        .execute();

      expect(records).toHaveLength(1);
      expect(parseFloat(records[0].amount)).toEqual(80000000);
      expect(records[0].category).toEqual('Updated in DB');
    });
  });

  describe('deleteVillageFinance', () => {
    it('should delete existing record', async () => {
      const created = await createVillageFinance(testIncomeInput);

      const result = await deleteVillageFinance({ id: created.id });

      expect(result.success).toBe(true);

      // Verify record is deleted
      const records = await db.select()
        .from(villageFinanceTable)
        .where(eq(villageFinanceTable.id, created.id))
        .execute();

      expect(records).toHaveLength(0);
    });

    it('should return success even for non-existent record', async () => {
      const result = await deleteVillageFinance({ id: 999 });
      expect(result.success).toBe(true);
    });
  });

  describe('getFinanceSummary', () => {
    it('should return zeros when no records exist', async () => {
      const result = await getFinanceSummary();

      expect(result.totalIncome).toEqual(0);
      expect(result.totalExpense).toEqual(0);
      expect(result.balance).toEqual(0);
    });

    it('should calculate summary with only income', async () => {
      await createVillageFinance(testIncomeInput);
      await createVillageFinance({
        ...testIncomeInput,
        amount: 30000000,
        description: 'Additional income'
      });

      const result = await getFinanceSummary();

      expect(result.totalIncome).toEqual(80000000);
      expect(result.totalExpense).toEqual(0);
      expect(result.balance).toEqual(80000000);
    });

    it('should calculate summary with only expenses', async () => {
      await createVillageFinance(testExpenseInput);
      await createVillageFinance({
        ...testExpenseInput,
        amount: 3000000,
        description: 'Additional expense'
      });

      const result = await getFinanceSummary();

      expect(result.totalIncome).toEqual(0);
      expect(result.totalExpense).toEqual(8000000);
      expect(result.balance).toEqual(-8000000);
    });

    it('should calculate correct summary with mixed records', async () => {
      await createVillageFinance(testIncomeInput); // 50M income
      await createVillageFinance({
        ...testIncomeInput,
        amount: 25000000,
        description: 'Additional income'
      }); // 25M income
      await createVillageFinance(testExpenseInput); // 5M expense
      await createVillageFinance({
        ...testExpenseInput,
        amount: 10000000,
        description: 'Major expense'
      }); // 10M expense

      const result = await getFinanceSummary();

      expect(result.totalIncome).toEqual(75000000);
      expect(result.totalExpense).toEqual(15000000);
      expect(result.balance).toEqual(60000000);
      expect(typeof result.totalIncome).toEqual('number');
      expect(typeof result.totalExpense).toEqual('number');
      expect(typeof result.balance).toEqual('number');
    });
  });
});