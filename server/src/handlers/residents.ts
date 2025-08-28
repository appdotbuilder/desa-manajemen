import { db } from '../db';
import { residentsTable } from '../db/schema';
import { type CreateResidentInput, type UpdateResidentInput, type Resident, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createResident(input: CreateResidentInput): Promise<Resident> {
  try {
    const result = await db.insert(residentsTable)
      .values({
        name: input.name,
        address: input.address,
        job: input.job
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Resident creation failed:', error);
    throw error;
  }
}

export async function getResidents(): Promise<Resident[]> {
  try {
    const result = await db.select()
      .from(residentsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch residents:', error);
    throw error;
  }
}

export async function getResidentById(input: GetByIdInput): Promise<Resident | null> {
  try {
    const result = await db.select()
      .from(residentsTable)
      .where(eq(residentsTable.id, input.id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch resident by ID:', error);
    throw error;
  }
}

export async function updateResident(input: UpdateResidentInput): Promise<Resident> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof residentsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    if (input.job !== undefined) {
      updateData.job = input.job;
    }

    const result = await db.update(residentsTable)
      .set(updateData)
      .where(eq(residentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Resident with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Resident update failed:', error);
    throw error;
  }
}

export async function deleteResident(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(residentsTable)
      .where(eq(residentsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Resident deletion failed:', error);
    throw error;
  }
}