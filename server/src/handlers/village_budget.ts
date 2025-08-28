import { db } from '../db';
import { villageBudgetTable } from '../db/schema';
import { type CreateVillageBudgetInput, type UpdateVillageBudgetInput, type VillageBudget, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createVillageBudget(input: CreateVillageBudgetInput): Promise<VillageBudget> {
  try {
    // Insert village budget record
    const result = await db.insert(villageBudgetTable)
      .values({
        category: input.category,
        allocated_amount: input.allocated_amount.toString(), // Convert number to string for numeric column
        year: input.year,
        used_amount: '0' // Default value as string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budget = result[0];
    return {
      ...budget,
      allocated_amount: parseFloat(budget.allocated_amount), // Convert string back to number
      used_amount: parseFloat(budget.used_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Village budget creation failed:', error);
    throw error;
  }
}

export async function getVillageBudgets(): Promise<VillageBudget[]> {
  try {
    const results = await db.select()
      .from(villageBudgetTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(budget => ({
      ...budget,
      allocated_amount: parseFloat(budget.allocated_amount),
      used_amount: parseFloat(budget.used_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch village budgets:', error);
    throw error;
  }
}

export async function getVillageBudgetById(input: GetByIdInput): Promise<VillageBudget | null> {
  try {
    const results = await db.select()
      .from(villageBudgetTable)
      .where(eq(villageBudgetTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const budget = results[0];
    return {
      ...budget,
      allocated_amount: parseFloat(budget.allocated_amount),
      used_amount: parseFloat(budget.used_amount)
    };
  } catch (error) {
    console.error('Failed to fetch village budget by ID:', error);
    throw error;
  }
}

export async function updateVillageBudget(input: UpdateVillageBudgetInput): Promise<VillageBudget> {
  try {
    // Build update object, converting numeric fields to strings
    const updateData: any = {};
    if (input.category !== undefined) updateData.category = input.category;
    if (input.allocated_amount !== undefined) updateData.allocated_amount = input.allocated_amount.toString();
    if (input.used_amount !== undefined) updateData.used_amount = input.used_amount.toString();
    if (input.year !== undefined) updateData.year = input.year;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const results = await db.update(villageBudgetTable)
      .set(updateData)
      .where(eq(villageBudgetTable.id, input.id))
      .returning()
      .execute();

    if (results.length === 0) {
      throw new Error(`Village budget with ID ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const budget = results[0];
    return {
      ...budget,
      allocated_amount: parseFloat(budget.allocated_amount),
      used_amount: parseFloat(budget.used_amount)
    };
  } catch (error) {
    console.error('Village budget update failed:', error);
    throw error;
  }
}

export async function deleteVillageBudget(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    const results = await db.delete(villageBudgetTable)
      .where(eq(villageBudgetTable.id, input.id))
      .returning({ id: villageBudgetTable.id })
      .execute();

    return { success: results.length > 0 };
  } catch (error) {
    console.error('Village budget deletion failed:', error);
    throw error;
  }
}

export async function getBudgetByYear(year: number): Promise<VillageBudget[]> {
  try {
    const results = await db.select()
      .from(villageBudgetTable)
      .where(eq(villageBudgetTable.year, year))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(budget => ({
      ...budget,
      allocated_amount: parseFloat(budget.allocated_amount),
      used_amount: parseFloat(budget.used_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch budgets by year:', error);
    throw error;
  }
}