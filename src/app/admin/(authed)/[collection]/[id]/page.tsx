import Link from 'next/link';
import { notFound } from 'next/navigation';
import { databases } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { getCollection } from '@/lib/admin/collections';
import EditForm from '@/components/admin/EditForm';

type Params = { collection: string; id: string };

export default async function EditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { collection: collectionId, id: rawId } = await params;
  const cfg = getCollection(collectionId);
  if (!cfg) notFound();

  // Special routes:
  //   /admin/<coll>/_new       → create a new document
  //   /admin/<coll>/_singleton → singleton edit (creates if missing)
  const isNew = rawId === '_new';
  const isSingleton = rawId === '_singleton';

  let doc: Record<string, unknown> | null = null;

  if (isSingleton) {
    if (!cfg.singleton) notFound();
    try {
      doc = await databases.getDocument(APPWRITE_DATABASE_ID, cfg.id, cfg.id);
    } catch {
      doc = null; // not yet created — first save will create
    }
  } else if (!isNew) {
    try {
      doc = await databases.getDocument(APPWRITE_DATABASE_ID, cfg.id, rawId);
    } catch {
      notFound();
    }
  }

  const titleField = cfg.titleField ?? 'label';
  const docTitle =
    doc && typeof doc[titleField] === 'string'
      ? (doc[titleField] as string)
      : null;
  const headingTitle = isNew
    ? `New ${cfg.label.toLowerCase()}`
    : (docTitle ?? cfg.label);

  return (
    <div>
      <nav className="font-mono text-mono-sm text-paper-400 mb-8" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-paper-200 transition-colors">
          Admin
        </Link>
        <span className="mx-2">/</span>
        {cfg.singleton ? (
          <span>{cfg.label}</span>
        ) : (
          <>
            <Link
              href={`/admin/${cfg.id}`}
              className="hover:text-paper-200 transition-colors"
            >
              {cfg.label}
            </Link>
            <span className="mx-2">/</span>
            <span>{isNew ? 'new' : (docTitle ?? rawId)}</span>
          </>
        )}
      </nav>

      <h1 className="text-h1 font-bold text-paper-50 mb-12 text-balance">
        {headingTitle}
      </h1>

      <EditForm cfg={cfg} documentId={rawId} doc={doc} />
    </div>
  );
}
