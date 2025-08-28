import { db } from '../db';
import { publicServicesTable } from '../db/schema';
import { type CreatePublicServiceInput, type UpdatePublicServiceInput, type PublicService, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPublicService(input: CreatePublicServiceInput): Promise<PublicService> {
  try {
    const result = await db.insert(publicServicesTable)
      .values({
        name: input.name,
        description: input.description,
        requirements: input.requirements,
        process_time: input.process_time,
        cost: input.cost ? input.cost.toString() : null,
        contact_person: input.contact_person,
        office_hours: input.office_hours,
        is_active: input.is_active
      })
      .returning()
      .execute();

    const service = result[0];
    return {
      ...service,
      cost: service.cost ? parseFloat(service.cost) : null
    };
  } catch (error) {
    console.error('Public service creation failed:', error);
    throw error;
  }
}

export async function getPublicServices(): Promise<PublicService[]> {
  try {
    const results = await db.select()
      .from(publicServicesTable)
      .execute();

    return results.map(service => ({
      ...service,
      cost: service.cost ? parseFloat(service.cost) : null
    }));
  } catch (error) {
    console.error('Failed to fetch public services:', error);
    throw error;
  }
}

export async function getPublicServiceById(input: GetByIdInput): Promise<PublicService | null> {
  try {
    const results = await db.select()
      .from(publicServicesTable)
      .where(eq(publicServicesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const service = results[0];
    return {
      ...service,
      cost: service.cost ? parseFloat(service.cost) : null
    };
  } catch (error) {
    console.error('Failed to fetch public service by ID:', error);
    throw error;
  }
}

export async function updatePublicService(input: UpdatePublicServiceInput): Promise<PublicService> {
  try {
    const updateValues: any = {};
    
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.requirements !== undefined) updateValues.requirements = input.requirements;
    if (input.process_time !== undefined) updateValues.process_time = input.process_time;
    if (input.cost !== undefined) updateValues.cost = input.cost ? input.cost.toString() : null;
    if (input.contact_person !== undefined) updateValues.contact_person = input.contact_person;
    if (input.office_hours !== undefined) updateValues.office_hours = input.office_hours;
    if (input.is_active !== undefined) updateValues.is_active = input.is_active;

    const result = await db.update(publicServicesTable)
      .set(updateValues)
      .where(eq(publicServicesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Public service with ID ${input.id} not found`);
    }

    const service = result[0];
    return {
      ...service,
      cost: service.cost ? parseFloat(service.cost) : null
    };
  } catch (error) {
    console.error('Public service update failed:', error);
    throw error;
  }
}

export async function deletePublicService(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(publicServicesTable)
      .where(eq(publicServicesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Public service deletion failed:', error);
    throw error;
  }
}

export async function getActivePublicServices(): Promise<PublicService[]> {
  try {
    const results = await db.select()
      .from(publicServicesTable)
      .where(eq(publicServicesTable.is_active, 1))
      .execute();

    return results.map(service => ({
      ...service,
      cost: service.cost ? parseFloat(service.cost) : null
    }));
  } catch (error) {
    console.error('Failed to fetch active public services:', error);
    throw error;
  }
}

export async function togglePublicServiceStatus(input: GetByIdInput): Promise<PublicService> {
  try {
    // First, get the current service to check its current status
    const currentService = await getPublicServiceById(input);
    if (!currentService) {
      throw new Error(`Public service with ID ${input.id} not found`);
    }

    // Toggle the status (1 -> 0, 0 -> 1)
    const newStatus = currentService.is_active === 1 ? 0 : 1;

    const result = await db.update(publicServicesTable)
      .set({ is_active: newStatus })
      .where(eq(publicServicesTable.id, input.id))
      .returning()
      .execute();

    const service = result[0];
    return {
      ...service,
      cost: service.cost ? parseFloat(service.cost) : null
    };
  } catch (error) {
    console.error('Public service status toggle failed:', error);
    throw error;
  }
}