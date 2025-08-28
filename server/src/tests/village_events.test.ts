import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { villageEventsTable } from '../db/schema';
import { type CreateVillageEventInput, type UpdateVillageEventInput, type GetByIdInput } from '../schema';
import { 
  createVillageEvent, 
  getVillageEvents, 
  getVillageEventById, 
  updateVillageEvent, 
  deleteVillageEvent,
  getUpcomingEvents 
} from '../handlers/village_events';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testEventInput: CreateVillageEventInput = {
  name: 'Festival Kemerdekaan',
  description: 'Perayaan kemerdekaan Indonesia',
  location: 'Lapangan Desa',
  event_date: '2024-08-17',
  organizer: 'Karang Taruna',
  participant_count: 150,
  budget: 5000000,
  status: 'planned'
};

const minimalEventInput: CreateVillageEventInput = {
  name: 'Rapat RT',
  description: null,
  location: 'Balai Desa',
  event_date: '2024-09-01',
  organizer: 'RT 01',
  participant_count: null,
  budget: null,
  status: 'planned'
};

describe('createVillageEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a village event with all fields', async () => {
    const result = await createVillageEvent(testEventInput);

    expect(result.name).toEqual('Festival Kemerdekaan');
    expect(result.description).toEqual('Perayaan kemerdekaan Indonesia');
    expect(result.location).toEqual('Lapangan Desa');
    expect(result.event_date).toEqual('2024-08-17');
    expect(result.organizer).toEqual('Karang Taruna');
    expect(result.participant_count).toEqual(150);
    expect(result.budget).toEqual(5000000);
    expect(typeof result.budget).toEqual('number');
    expect(result.status).toEqual('planned');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a village event with minimal fields', async () => {
    const result = await createVillageEvent(minimalEventInput);

    expect(result.name).toEqual('Rapat RT');
    expect(result.description).toBeNull();
    expect(result.location).toEqual('Balai Desa');
    expect(result.event_date).toEqual('2024-09-01');
    expect(result.organizer).toEqual('RT 01');
    expect(result.participant_count).toBeNull();
    expect(result.budget).toBeNull();
    expect(result.status).toEqual('planned');
    expect(result.id).toBeDefined();
  });

  it('should save village event to database', async () => {
    const result = await createVillageEvent(testEventInput);

    const events = await db.select()
      .from(villageEventsTable)
      .where(eq(villageEventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].name).toEqual('Festival Kemerdekaan');
    expect(events[0].description).toEqual('Perayaan kemerdekaan Indonesia');
    expect(parseFloat(events[0].budget!)).toEqual(5000000);
    expect(events[0].status).toEqual('planned');
  });

  it('should use default status when not provided', async () => {
    const inputWithoutStatus = { ...testEventInput };
    delete (inputWithoutStatus as any).status;

    const result = await createVillageEvent(inputWithoutStatus);
    expect(result.status).toEqual('planned');
  });
});

describe('getVillageEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no events exist', async () => {
    const result = await getVillageEvents();
    expect(result).toEqual([]);
  });

  it('should return all village events', async () => {
    await createVillageEvent(testEventInput);
    await createVillageEvent(minimalEventInput);

    const result = await getVillageEvents();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Festival Kemerdekaan');
    expect(result[1].name).toEqual('Rapat RT');
    expect(typeof result[0].budget).toEqual('number');
    expect(result[1].budget).toBeNull();
  });

  it('should properly convert numeric fields', async () => {
    await createVillageEvent(testEventInput);

    const result = await getVillageEvents();

    expect(result[0].budget).toEqual(5000000);
    expect(typeof result[0].budget).toEqual('number');
  });
});

describe('getVillageEventById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when event does not exist', async () => {
    const result = await getVillageEventById({ id: 999 });
    expect(result).toBeNull();
  });

  it('should return village event by ID', async () => {
    const created = await createVillageEvent(testEventInput);

    const result = await getVillageEventById({ id: created.id });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.name).toEqual('Festival Kemerdekaan');
    expect(result!.budget).toEqual(5000000);
    expect(typeof result!.budget).toEqual('number');
  });
});

describe('updateVillageEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update village event fields', async () => {
    const created = await createVillageEvent(testEventInput);

    const updateInput: UpdateVillageEventInput = {
      id: created.id,
      name: 'Festival Updated',
      budget: 7500000,
      status: 'ongoing'
    };

    const result = await updateVillageEvent(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Festival Updated');
    expect(result.budget).toEqual(7500000);
    expect(typeof result.budget).toEqual('number');
    expect(result.status).toEqual('ongoing');
    expect(result.location).toEqual('Lapangan Desa'); // Unchanged field
  });

  it('should update nullable fields to null', async () => {
    const created = await createVillageEvent(testEventInput);

    const updateInput: UpdateVillageEventInput = {
      id: created.id,
      description: null,
      budget: null,
      participant_count: null
    };

    const result = await updateVillageEvent(updateInput);

    expect(result.description).toBeNull();
    expect(result.budget).toBeNull();
    expect(result.participant_count).toBeNull();
  });

  it('should update updated_at timestamp', async () => {
    const created = await createVillageEvent(testEventInput);
    const originalUpdatedAt = created.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await updateVillageEvent({
      id: created.id,
      name: 'Updated Name'
    });

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when event not found', async () => {
    const updateInput: UpdateVillageEventInput = {
      id: 999,
      name: 'Non-existent Event'
    };

    await expect(updateVillageEvent(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should save changes to database', async () => {
    const created = await createVillageEvent(testEventInput);

    await updateVillageEvent({
      id: created.id,
      name: 'Database Test Event',
      budget: 2500000
    });

    const events = await db.select()
      .from(villageEventsTable)
      .where(eq(villageEventsTable.id, created.id))
      .execute();

    expect(events[0].name).toEqual('Database Test Event');
    expect(parseFloat(events[0].budget!)).toEqual(2500000);
  });
});

describe('deleteVillageEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing village event', async () => {
    const created = await createVillageEvent(testEventInput);

    const result = await deleteVillageEvent({ id: created.id });

    expect(result.success).toBe(true);

    // Verify deletion
    const events = await db.select()
      .from(villageEventsTable)
      .where(eq(villageEventsTable.id, created.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should return false when event does not exist', async () => {
    const result = await deleteVillageEvent({ id: 999 });
    expect(result.success).toBe(false);
  });
});

describe('getUpcomingEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no upcoming events exist', async () => {
    const result = await getUpcomingEvents();
    expect(result).toEqual([]);
  });

  it('should return only planned and ongoing events', async () => {
    // Create events with different statuses
    await createVillageEvent({ ...testEventInput, name: 'Planned Event', status: 'planned' });
    await createVillageEvent({ ...testEventInput, name: 'Ongoing Event', status: 'ongoing' });
    await createVillageEvent({ ...testEventInput, name: 'Completed Event', status: 'completed' });
    await createVillageEvent({ ...testEventInput, name: 'Cancelled Event', status: 'cancelled' });

    const result = await getUpcomingEvents();

    expect(result).toHaveLength(2);
    expect(result.find(e => e.name === 'Planned Event')).toBeDefined();
    expect(result.find(e => e.name === 'Ongoing Event')).toBeDefined();
    expect(result.find(e => e.name === 'Completed Event')).toBeUndefined();
    expect(result.find(e => e.name === 'Cancelled Event')).toBeUndefined();
  });

  it('should properly convert numeric fields for upcoming events', async () => {
    await createVillageEvent({ ...testEventInput, status: 'planned' });

    const result = await getUpcomingEvents();

    expect(result[0].budget).toEqual(5000000);
    expect(typeof result[0].budget).toEqual('number');
  });
});