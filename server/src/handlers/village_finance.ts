import { db } from '../db';
import { villageFinanceTable } from '../db/schema';
import { type CreateVillageFinanceInput, type UpdateVillageFinanceInput, type VillageFinance, type GetByIdInput } from '../schema';
import { eq, sum, sql } from 'drizzle-orm';

export async function createVillageFinance(input: CreateVillageFinanceInput): Promise<VillageFinance> {
  try {
    // Insert village finance record
    const result = await db.insert(villageFinanceTable)
      .values({
        type: input.type,
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        category: input.category,
        date: input.date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const finance = result[0];
    return {
      ...finance,
      type: finance.type as 'income' | 'expense', // Cast to proper union type
      amount: parseFloat(finance.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Village finance creation failed:', error);
    throw error;
  }
}

export async function getVillageFinances(): Promise<VillageFinance[]> {
  try {
    const results = await db.select()
      .from(villageFinanceTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(finance => ({
      ...finance,
      type: finance.type as 'income' | 'expense', // Cast to proper union type
      amount: parseFloat(finance.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch village finances:', error);
    throw error;
  }
}

export async function getVillageFinanceById(input: GetByIdInput): Promise<VillageFinance | null> {
  try {
    const results = await db.select()
      .from(villageFinanceTable)
      .where(eq(villageFinanceTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const finance = results[0];
    return {
      ...finance,
      type: finance.type as 'income' | 'expense', // Cast to proper union type
      amount: parseFloat(finance.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Failed to fetch village finance by ID:', error);
    throw error;
  }
}

export async function updateVillageFinance(input: UpdateVillageFinanceInput): Promise<VillageFinance> {
  try {
    // Build update values, converting amount to string if provided
    const updateValues: any = {};
    if (input.type !== undefined) updateValues.type = input.type;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.amount !== undefined) updateValues.amount = input.amount.toString();
    if (input.category !== undefined) updateValues.category = input.category;
    if (input.date !== undefined) updateValues.date = input.date;

    const result = await db.update(villageFinanceTable)
      .set(updateValues)
      .where(eq(villageFinanceTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Village finance with ID ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const finance = result[0];
    return {
      ...finance,
      type: finance.type as 'income' | 'expense', // Cast to proper union type
      amount: parseFloat(finance.amount)
    };
  } catch (error) {
    console.error('Village finance update failed:', error);
    throw error;
  }
}

export async function deleteVillageFinance(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(villageFinanceTable)
      .where(eq(villageFinanceTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Village finance deletion failed:', error);
    throw error;
  }
}

export async function getFinanceSummary(): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
  try {
    // Calculate total income
    const incomeResult = await db.select({
      total: sum(villageFinanceTable.amount)
    })
      .from(villageFinanceTable)
      .where(eq(villageFinanceTable.type, 'income'))
      .execute();

    // Calculate total expense
    const expenseResult = await db.select({
      total: sum(villageFinanceTable.amount)
    })
      .from(villageFinanceTable)
      .where(eq(villageFinanceTable.type, 'expense'))
      .execute();

    const totalIncome = parseFloat(incomeResult[0]?.total || '0');
    const totalExpense = parseFloat(expenseResult[0]?.total || '0');
    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance
    };
  } catch (error) {
    console.error('Failed to calculate finance summary:', error);
    throw error;
  }
}