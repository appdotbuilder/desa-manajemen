import { db } from '../db';
import { villageAssetsTable } from '../db/schema';
import { type CreateVillageAssetInput, type UpdateVillageAssetInput, type VillageAsset, type GetByIdInput } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function createVillageAsset(input: CreateVillageAssetInput): Promise<VillageAsset> {
  try {
    const result = await db.insert(villageAssetsTable)
      .values({
        name: input.name,
        description: input.description,
        category: input.category,
        value: input.value.toString(), // Convert number to string for numeric column
        condition: input.condition,
        location: input.location,
        purchase_date: input.purchase_date,
      })
      .returning()
      .execute();

    const asset = result[0];
    return {
      ...asset,
      value: parseFloat(asset.value), // Convert string back to number
      condition: asset.condition as "excellent" | "good" | "fair" | "poor",
    };
  } catch (error) {
    console.error('Village asset creation failed:', error);
    throw error;
  }
}

export async function getVillageAssets(): Promise<VillageAsset[]> {
  try {
    const assets = await db.select()
      .from(villageAssetsTable)
      .execute();

    return assets.map(asset => ({
      ...asset,
      value: parseFloat(asset.value), // Convert string back to number
      condition: asset.condition as "excellent" | "good" | "fair" | "poor",
    }));
  } catch (error) {
    console.error('Failed to fetch village assets:', error);
    throw error;
  }
}

export async function getVillageAssetById(input: GetByIdInput): Promise<VillageAsset | null> {
  try {
    const assets = await db.select()
      .from(villageAssetsTable)
      .where(eq(villageAssetsTable.id, input.id))
      .execute();

    if (assets.length === 0) {
      return null;
    }

    const asset = assets[0];
    return {
      ...asset,
      value: parseFloat(asset.value), // Convert string back to number
      condition: asset.condition as "excellent" | "good" | "fair" | "poor",
    };
  } catch (error) {
    console.error('Failed to fetch village asset by ID:', error);
    throw error;
  }
}

export async function updateVillageAsset(input: UpdateVillageAssetInput): Promise<VillageAsset> {
  try {
    // Build update values object, only including provided fields
    const updateValues: any = {};
    
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.category !== undefined) updateValues.category = input.category;
    if (input.value !== undefined) updateValues.value = input.value.toString(); // Convert number to string
    if (input.condition !== undefined) updateValues.condition = input.condition;
    if (input.location !== undefined) updateValues.location = input.location;
    if (input.purchase_date !== undefined) updateValues.purchase_date = input.purchase_date;

    // Always update the updated_at timestamp
    updateValues.updated_at = sql`now()`;

    const result = await db.update(villageAssetsTable)
      .set(updateValues)
      .where(eq(villageAssetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Village asset with ID ${input.id} not found`);
    }

    const asset = result[0];
    return {
      ...asset,
      value: parseFloat(asset.value), // Convert string back to number
      condition: asset.condition as "excellent" | "good" | "fair" | "poor",
    };
  } catch (error) {
    console.error('Village asset update failed:', error);
    throw error;
  }
}

export async function deleteVillageAsset(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(villageAssetsTable)
      .where(eq(villageAssetsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Village asset deletion failed:', error);
    throw error;
  }
}

export async function getAssetsByCategory(category: string): Promise<VillageAsset[]> {
  try {
    const assets = await db.select()
      .from(villageAssetsTable)
      .where(eq(villageAssetsTable.category, category))
      .execute();

    return assets.map(asset => ({
      ...asset,
      value: parseFloat(asset.value), // Convert string back to number
      condition: asset.condition as "excellent" | "good" | "fair" | "poor",
    }));
  } catch (error) {
    console.error('Failed to fetch assets by category:', error);
    throw error;
  }
}

export async function getAssetsSummary(): Promise<{ totalValue: number; totalCount: number; byCondition: Record<string, number> }> {
  try {
    // Get total count and total value
    const totalResult = await db.select({
      totalCount: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(${villageAssetsTable.value}::numeric), 0)`,
    })
    .from(villageAssetsTable)
    .execute();

    // Get counts by condition
    const conditionResult = await db.select({
      condition: villageAssetsTable.condition,
      count: sql<number>`count(*)`,
    })
    .from(villageAssetsTable)
    .groupBy(villageAssetsTable.condition)
    .execute();

    // Initialize condition counts
    const byCondition: Record<string, number> = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };

    // Fill in actual counts
    conditionResult.forEach(row => {
      byCondition[row.condition] = Number(row.count);
    });

    return {
      totalValue: Number(totalResult[0].totalValue),
      totalCount: Number(totalResult[0].totalCount),
      byCondition,
    };
  } catch (error) {
    console.error('Failed to fetch assets summary:', error);
    throw error;
  }
}