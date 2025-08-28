import { db } from '../db';
import { villageEventsTable } from '../db/schema';
import { type CreateVillageEventInput, type UpdateVillageEventInput, type VillageEvent, type GetByIdInput } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function createVillageEvent(input: CreateVillageEventInput): Promise<VillageEvent> {
  try {
    // Insert village event record
    const result = await db.insert(villageEventsTable)
      .values({
        name: input.name,
        description: input.description,
        location: input.location,
        event_date: input.event_date,
        organizer: input.organizer,
        participant_count: input.participant_count,
        budget: input.budget ? input.budget.toString() : null, // Convert number to string for numeric column
        status: input.status || 'planned'
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const event = result[0];
    return {
      ...event,
      budget: event.budget ? parseFloat(event.budget) : null, // Convert string back to number
      status: event.status as 'planned' | 'ongoing' | 'completed' | 'cancelled'
    };
  } catch (error) {
    console.error('Village event creation failed:', error);
    throw error;
  }
}

export async function getVillageEvents(): Promise<VillageEvent[]> {
  try {
    const results = await db.select()
      .from(villageEventsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(event => ({
      ...event,
      budget: event.budget ? parseFloat(event.budget) : null,
      status: event.status as 'planned' | 'ongoing' | 'completed' | 'cancelled'
    }));
  } catch (error) {
    console.error('Failed to fetch village events:', error);
    throw error;
  }
}

export async function getVillageEventById(input: GetByIdInput): Promise<VillageEvent | null> {
  try {
    const results = await db.select()
      .from(villageEventsTable)
      .where(eq(villageEventsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const event = results[0];
    return {
      ...event,
      budget: event.budget ? parseFloat(event.budget) : null,
      status: event.status as 'planned' | 'ongoing' | 'completed' | 'cancelled'
    };
  } catch (error) {
    console.error('Failed to fetch village event by ID:', error);
    throw error;
  }
}

export async function updateVillageEvent(input: UpdateVillageEventInput): Promise<VillageEvent> {
  try {
    // Prepare update values, converting numeric fields to strings
    const updateValues: any = {};
    
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.location !== undefined) updateValues.location = input.location;
    if (input.event_date !== undefined) updateValues.event_date = input.event_date;
    if (input.organizer !== undefined) updateValues.organizer = input.organizer;
    if (input.participant_count !== undefined) updateValues.participant_count = input.participant_count;
    if (input.budget !== undefined) updateValues.budget = input.budget ? input.budget.toString() : null;
    if (input.status !== undefined) updateValues.status = input.status;

    // Always update the updated_at field
    updateValues.updated_at = new Date();

    const result = await db.update(villageEventsTable)
      .set(updateValues)
      .where(eq(villageEventsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Village event not found');
    }

    const event = result[0];
    return {
      ...event,
      budget: event.budget ? parseFloat(event.budget) : null,
      status: event.status as 'planned' | 'ongoing' | 'completed' | 'cancelled'
    };
  } catch (error) {
    console.error('Village event update failed:', error);
    throw error;
  }
}

export async function deleteVillageEvent(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(villageEventsTable)
      .where(eq(villageEventsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Village event deletion failed:', error);
    throw error;
  }
}

export async function getUpcomingEvents(): Promise<VillageEvent[]> {
  try {
    const results = await db.select()
      .from(villageEventsTable)
      .where(or(
        eq(villageEventsTable.status, 'planned'),
        eq(villageEventsTable.status, 'ongoing')
      ))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(event => ({
      ...event,
      budget: event.budget ? parseFloat(event.budget) : null,
      status: event.status as 'planned' | 'ongoing' | 'completed' | 'cancelled'
    }));
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    throw error;
  }
}