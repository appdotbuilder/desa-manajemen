import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createResidentInputSchema,
  updateResidentInputSchema,
  getByIdInputSchema,
  createVillageFinanceInputSchema,
  updateVillageFinanceInputSchema,
  createVillageBudgetInputSchema,
  updateVillageBudgetInputSchema,
  createVillageEventInputSchema,
  updateVillageEventInputSchema,
  createVillageAssetInputSchema,
  updateVillageAssetInputSchema,
  createPublicServiceInputSchema,
  updatePublicServiceInputSchema,
} from './schema';

// Import handlers
import {
  createResident,
  getResidents,
  getResidentById,
  updateResident,
  deleteResident,
} from './handlers/residents';

import {
  createVillageFinance,
  getVillageFinances,
  getVillageFinanceById,
  updateVillageFinance,
  deleteVillageFinance,
  getFinanceSummary,
} from './handlers/village_finance';

import {
  createVillageBudget,
  getVillageBudgets,
  getVillageBudgetById,
  updateVillageBudget,
  deleteVillageBudget,
  getBudgetByYear,
} from './handlers/village_budget';

import {
  createVillageEvent,
  getVillageEvents,
  getVillageEventById,
  updateVillageEvent,
  deleteVillageEvent,
  getUpcomingEvents,
} from './handlers/village_events';

import {
  createVillageAsset,
  getVillageAssets,
  getVillageAssetById,
  updateVillageAsset,
  deleteVillageAsset,
  getAssetsByCategory,
  getAssetsSummary,
} from './handlers/village_assets';

import {
  createPublicService,
  getPublicServices,
  getPublicServiceById,
  updatePublicService,
  deletePublicService,
  getActivePublicServices,
  togglePublicServiceStatus,
} from './handlers/public_services';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Residents routes
  createResident: publicProcedure
    .input(createResidentInputSchema)
    .mutation(({ input }) => createResident(input)),
  
  getResidents: publicProcedure
    .query(() => getResidents()),
  
  getResidentById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getResidentById(input)),
  
  updateResident: publicProcedure
    .input(updateResidentInputSchema)
    .mutation(({ input }) => updateResident(input)),
  
  deleteResident: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteResident(input)),

  // Village Finance routes
  createVillageFinance: publicProcedure
    .input(createVillageFinanceInputSchema)
    .mutation(({ input }) => createVillageFinance(input)),
  
  getVillageFinances: publicProcedure
    .query(() => getVillageFinances()),
  
  getVillageFinanceById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getVillageFinanceById(input)),
  
  updateVillageFinance: publicProcedure
    .input(updateVillageFinanceInputSchema)
    .mutation(({ input }) => updateVillageFinance(input)),
  
  deleteVillageFinance: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteVillageFinance(input)),
  
  getFinanceSummary: publicProcedure
    .query(() => getFinanceSummary()),

  // Village Budget routes
  createVillageBudget: publicProcedure
    .input(createVillageBudgetInputSchema)
    .mutation(({ input }) => createVillageBudget(input)),
  
  getVillageBudgets: publicProcedure
    .query(() => getVillageBudgets()),
  
  getVillageBudgetById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getVillageBudgetById(input)),
  
  updateVillageBudget: publicProcedure
    .input(updateVillageBudgetInputSchema)
    .mutation(({ input }) => updateVillageBudget(input)),
  
  deleteVillageBudget: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteVillageBudget(input)),
  
  getBudgetByYear: publicProcedure
    .input(z.object({ year: z.number().int() }))
    .query(({ input }) => getBudgetByYear(input.year)),

  // Village Events routes
  createVillageEvent: publicProcedure
    .input(createVillageEventInputSchema)
    .mutation(({ input }) => createVillageEvent(input)),
  
  getVillageEvents: publicProcedure
    .query(() => getVillageEvents()),
  
  getVillageEventById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getVillageEventById(input)),
  
  updateVillageEvent: publicProcedure
    .input(updateVillageEventInputSchema)
    .mutation(({ input }) => updateVillageEvent(input)),
  
  deleteVillageEvent: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteVillageEvent(input)),
  
  getUpcomingEvents: publicProcedure
    .query(() => getUpcomingEvents()),

  // Village Assets routes
  createVillageAsset: publicProcedure
    .input(createVillageAssetInputSchema)
    .mutation(({ input }) => createVillageAsset(input)),
  
  getVillageAssets: publicProcedure
    .query(() => getVillageAssets()),
  
  getVillageAssetById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getVillageAssetById(input)),
  
  updateVillageAsset: publicProcedure
    .input(updateVillageAssetInputSchema)
    .mutation(({ input }) => updateVillageAsset(input)),
  
  deleteVillageAsset: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteVillageAsset(input)),
  
  getAssetsByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => getAssetsByCategory(input.category)),
  
  getAssetsSummary: publicProcedure
    .query(() => getAssetsSummary()),

  // Public Services routes
  createPublicService: publicProcedure
    .input(createPublicServiceInputSchema)
    .mutation(({ input }) => createPublicService(input)),
  
  getPublicServices: publicProcedure
    .query(() => getPublicServices()),
  
  getPublicServiceById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getPublicServiceById(input)),
  
  updatePublicService: publicProcedure
    .input(updatePublicServiceInputSchema)
    .mutation(({ input }) => updatePublicService(input)),
  
  deletePublicService: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deletePublicService(input)),
  
  getActivePublicServices: publicProcedure
    .query(() => getActivePublicServices()),
  
  togglePublicServiceStatus: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => togglePublicServiceStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();