import 'server-only';
import { unstable_cache as nextCache } from 'next/cache';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { urlForFile, BUCKETS } from '@/lib/appwrite/url-for-asset';

// ── Capabilities ────────────────────────────────────────────────────
export type Capability = {
  $id: string;
  displayIndex: string;
  title: string;
  description: string;
  orderIndex: number;
};

async function fetchCapabilities(): Promise<Capability[]> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'capability',
      [Query.limit(50), Query.orderAsc('orderIndex')],
    );
    return res.documents.map((d) => ({
      $id: d.$id,
      displayIndex: String(d.displayIndex ?? ''),
      title: String(d.title ?? ''),
      description: String(d.description ?? ''),
      orderIndex: typeof d.orderIndex === 'number' ? d.orderIndex : 0,
    }));
  } catch {
    return [];
  }
}

export const getCapabilities = nextCache(fetchCapabilities, ['capability'], {
  tags: ['capability'],
});

// ── Process steps ───────────────────────────────────────────────────
export type ProcessStep = {
  $id: string;
  displayIndex: string;
  title: string;
  duration: string;
  body: string;
  deliverables: string[];
  iconPath: string;
  orderIndex: number;
};

async function fetchProcessSteps(): Promise<ProcessStep[]> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'processStep',
      [Query.limit(50), Query.orderAsc('orderIndex')],
    );
    return res.documents.map((d) => ({
      $id: d.$id,
      displayIndex: String(d.displayIndex ?? ''),
      title: String(d.title ?? ''),
      duration: String(d.duration ?? ''),
      body: String(d.body ?? ''),
      deliverables: Array.isArray(d.deliverables)
        ? d.deliverables.map(String)
        : [],
      iconPath: String(d.iconPath ?? ''),
      orderIndex: typeof d.orderIndex === 'number' ? d.orderIndex : 0,
    }));
  } catch {
    return [];
  }
}

export const getProcessSteps = nextCache(fetchProcessSteps, ['processStep'], {
  tags: ['processStep'],
});

// ── Client logos ────────────────────────────────────────────────────
export type ClientLogo = {
  $id: string;
  name: string;
  logoUrl?: string;
  ndaBound: boolean;
  orderIndex: number;
};

async function fetchClientLogos(): Promise<ClientLogo[]> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'clientLogo',
      [
        Query.limit(50),
        Query.orderAsc('orderIndex'),
        // Exclude NDA-bound logos at the query layer when supported.
        // Appwrite scalar booleans take direct values.
        Query.equal('ndaBound', false),
      ],
    );
    return res.documents.map((d) => {
      const fileId = typeof d.logoFileId === 'string' && d.logoFileId.length > 0
        ? d.logoFileId
        : undefined;
      return {
        $id: d.$id,
        name: String(d.name ?? ''),
        logoUrl: fileId ? urlForFile(fileId, BUCKETS.publicAssets) : undefined,
        ndaBound: Boolean(d.ndaBound),
        orderIndex: typeof d.orderIndex === 'number' ? d.orderIndex : 0,
      };
    });
  } catch {
    return [];
  }
}

export const getClientLogos = nextCache(fetchClientLogos, ['clientLogo'], {
  tags: ['clientLogo'],
});
