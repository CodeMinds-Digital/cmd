'use client';

import { useRef } from 'react';
import type { ProjectData } from '@codeminds/cms/content/project';
import { ActionBar, DangerZone, useDraftForm } from '@/components/draft-form';
import { Area, FieldError, ImageField, Label, Repeater, Section, Text, input, quiet, slugify, type Image } from '@/components/editor';
import { deleteProject, discardDraft, previewLink, publish, saveProject, setVisibility, submitForReview } from '../actions';

type Props = {
  rowId: string;
  initial: ProjectData;
  draftUpdatedAt: string | null;
  draftStatus: 'draft' | 'in_review' | null;
  live: 'published' | 'unpublished' | null;
  isAdmin: boolean;
  siteUrl: string;
  filesBase: string;
  projectId: string;
};

const pad = (n: number) => String(n + 1).padStart(2, '0');

export default function ProjectEditor(p: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const f = useDraftForm<ProjectData>({
    formRef,
    initial: p.initial,
    draftUpdatedAt: p.draftUpdatedAt,
    draftStatus: p.draftStatus,
    save: (json, expected) => saveProject(p.rowId, json, expected),
    // Steps are numbered by position.
    prepare: (d) => ({ ...d, approach: d.approach.map((s, i) => ({ ...s, index: pad(i) })) }),
  });
  const { data, set, err, aria, status } = f;
  const imgUrl = (i: Image) => (i.fileId ? `${p.filesBase}/${i.fileId}/view?project=${p.projectId}` : i.src ? `${p.siteUrl}${i.src}` : null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        f.run(f.save);
      }}
      noValidate
      className="pb-32"
    >
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">{data.title || 'Untitled project'}</h1>
        <span className="text-sm text-fg-muted">
          {p.live === 'published' ? 'Live' : p.live === 'unpublished' ? 'Hidden from the site' : 'Not published yet'}
          {status === 'draft' && ' · draft changes'}
          {status === 'in_review' && ' · in review'}
        </span>
      </div>

      <Section title="Basics">
        <Text label="Title" value={data.title} onChange={(v) => set({ title: v })} error={err('title')} name="title" aria={aria('title')} max={200} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-sm font-medium">
            Address
          </label>
          <div className="flex items-center gap-2">
            <span className="text-fg-muted">/work/</span>
            <input id="slug" className={input} value={data.slug} maxLength={80} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} {...aria('slug')} />
            <button type="button" className={quiet} onClick={() => set({ slug: slugify(data.title) })} disabled={!data.title}>
              From title
            </button>
          </div>
          <FieldError id="slug" text={err('slug')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Client (optional)" value={data.client ?? ''} onChange={(v) => set({ client: v })} error={err('client')} name="client" aria={aria('client')} max={200} />
          <Text label="Year" value={String(data.year ?? '')} onChange={(v) => set({ year: Number(v.replace(/\D/g, '').slice(0, 4)) })} error={err('year')} name="year" aria={aria('year')} inputMode="numeric" max={4} />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Status on the site</legend>
          {(['live', 'coming'] as const).map((s) => (
            <label key={s} className="flex min-h-11 items-center gap-2">
              <input type="radio" name="status" checked={data.status === s} onChange={() => set({ status: s })} className="size-4" />
              {s === 'live' ? 'Live — full case study' : 'Coming soon — hero only'}
            </label>
          ))}
        </fieldset>
        {data.status === 'coming' && <Text label="Expected (e.g. Shipping May 2026)" value={data.eta ?? ''} onChange={(v) => set({ eta: v })} error={err('eta')} name="eta" aria={aria('eta')} max={100} />}
        <Area label="One-line brief" value={data.brief} onChange={(v) => set({ brief: v })} error={err('brief')} name="brief" aria={aria('brief')} max={500} rows={2} />
        <Text
          label="Tags (comma-separated)"
          value={data.tags.join(', ')}
          onChange={(v) => set({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
          error={err('tags')}
          name="tags"
          aria={aria('tags')}
        />
      </Section>

      <Section title="Cover image">
        <ImageField label="Cover" url={imgUrl(data.cover)} onChange={(i) => set({ cover: { ...i, alt: data.cover.alt } })} error={err('cover')} />
        <Text label="Cover description (alt text)" value={data.cover.alt ?? ''} onChange={(v) => set({ cover: { ...data.cover, alt: v } })} error={err('cover.alt')} name="cover.alt" aria={aria('cover.alt')} max={200} />
      </Section>

      <Section title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Our role" value={data.role ?? ''} onChange={(v) => set({ role: v })} error={err('role')} name="role" aria={aria('role')} max={200} />
          <Text label="Duration" value={data.duration ?? ''} onChange={(v) => set({ duration: v })} error={err('duration')} name="duration" aria={aria('duration')} max={100} />
        </div>
        <Text label="Live link (optional)" value={data.liveUrl ?? ''} onChange={(v) => set({ liveUrl: v })} error={err('liveUrl')} name="liveUrl" aria={aria('liveUrl')} type="url" />
        <Area label="The problem" value={data.problem ?? ''} onChange={(v) => set({ problem: v })} error={err('problem')} name="problem" aria={aria('problem')} max={1500} rows={4} />
      </Section>

      <Repeater
        title="Approach"
        addLabel="Add step"
        items={data.approach}
        empty={{ index: '', title: '', body: '' }}
        onChange={(approach) => set({ approach })}
        itemLabel={(i) => `Step ${pad(i)}`}
        render={(s, i, upd) => (
          <>
            <Text label="Title" context={`Step ${pad(i)}`} value={s.title} onChange={(v) => upd({ title: v })} error={err(`approach.${i}.title`)} name={`approach.${i}.title`} aria={aria(`approach.${i}.title`)} max={200} />
            <Area label="What we did" context={`Step ${pad(i)}`} value={s.body} onChange={(v) => upd({ body: v })} error={err(`approach.${i}.body`)} name={`approach.${i}.body`} aria={aria(`approach.${i}.body`)} rows={3} />
          </>
        )}
        max={12}
      />

      <Repeater
        title="Screens"
        addLabel="Add screen"
        items={data.screens}
        empty={{ alt: '' }}
        onChange={(screens) => set({ screens })}
        itemLabel={(i) => `Screen ${i + 1}`}
        render={(s, i, upd) => (
          <>
            <ImageField label="Image" context={`Screen ${i + 1}`} url={imgUrl(s)} onChange={(img) => upd({ src: img.src, fileId: img.fileId })} error={err(`screens.${i}`)} />
            <Text label="Description (alt text)" context={`Screen ${i + 1}`} value={s.alt} onChange={(v) => upd({ alt: v })} error={err(`screens.${i}.alt`)} name={`screens.${i}.alt`} aria={aria(`screens.${i}.alt`)} max={300} />
            <Text label="Caption (optional)" context={`Screen ${i + 1}`} value={s.caption ?? ''} onChange={(v) => upd({ caption: v })} error={err(`screens.${i}.caption`)} name={`screens.${i}.caption`} aria={aria(`screens.${i}.caption`)} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`tone-${i}`} context={`Screen ${i + 1}`} label="Placeholder style (when there’s no image)" />
              <select id={`tone-${i}`} className={input} value={s.tone ?? ''} onChange={(e) => upd({ tone: (e.target.value || undefined) as never })}>
                <option value="">Default</option>
                <option value="paper">Paper</option>
                <option value="ink">Ink</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </>
        )}
        max={12}
      />

      <Repeater
        title="Results"
        addLabel="Add result"
        items={data.metrics}
        empty={{ label: '', value: '' }}
        onChange={(metrics) => set({ metrics })}
        itemLabel={(i) => `Result ${i + 1}`}
        render={(m, i, upd) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Label (e.g. LCP)" context={`Result ${i + 1}`} value={m.label} onChange={(v) => upd({ label: v })} error={err(`metrics.${i}.label`)} name={`metrics.${i}.label`} aria={aria(`metrics.${i}.label`)} max={60} />
            <Text label="Value (e.g. 1.6s)" context={`Result ${i + 1}`} value={m.value} onChange={(v) => upd({ value: v })} error={err(`metrics.${i}.value`)} name={`metrics.${i}.value`} aria={aria(`metrics.${i}.value`)} max={60} />
          </div>
        )}
        max={8}
      />

      <Section title="Client quote">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-4" checked={data.testimonial !== null} onChange={(e) => set({ testimonial: e.target.checked ? { quote: '', author: '', role: '' } : null })} />
          Include a client quote
        </label>
        {data.testimonial && (
          <>
            <Area label="Quote" value={data.testimonial.quote} onChange={(v) => set({ testimonial: { ...data.testimonial!, quote: v } })} error={err('testimonial.quote')} name="testimonial.quote" aria={aria('testimonial.quote')} max={1000} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Who said it" value={data.testimonial.author} onChange={(v) => set({ testimonial: { ...data.testimonial!, author: v } })} error={err('testimonial.author')} name="testimonial.author" aria={aria('testimonial.author')} max={200} />
              <Text label="Their role / company" value={data.testimonial.role} onChange={(v) => set({ testimonial: { ...data.testimonial!, role: v } })} error={err('testimonial.role')} name="testimonial.role" aria={aria('testimonial.role')} max={200} />
            </div>
          </>
        )}
      </Section>

      {p.isAdmin && (p.live || f.updatedAt) && (
        <DangerZone
          form={f}
          live={p.live}
          title={data.title || 'Untitled project'}
          deleteNote="Removes it from the site and the admin, with its steps, screens, results and quote. Uploaded images stay in storage."
          setVisible={(v) => setVisibility(p.rowId, v)}
          remove={() => deleteProject(p.rowId)}
        />
      )}

      <ActionBar
        form={f}
        isAdmin={p.isAdmin}
        previewLink={() => previewLink(p.rowId, data.slug)}
        submit={() => submitForReview(p.rowId)}
        publish={(v) => publish(p.rowId, v)}
        discard={() => discardDraft(p.rowId)}
      />
    </form>
  );
}
