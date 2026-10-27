'use client';

import { useRef } from 'react';
import type { SectionData, SectionKey } from '@codeminds/cms/content/sections';
import { ActionBar, useDraftForm } from '@/components/draft-form';
import { Area, ImageField, input, Label, Repeater, Section, Text } from '@/components/editor';
import { discardSection, publishSectionDraft, saveSection, sectionPreviewLink, submitSection } from '../actions';

type Props = {
  section: SectionKey;
  label: string;
  initial: SectionData[SectionKey];
  draftUpdatedAt: string | null;
  draftStatus: 'draft' | 'in_review' | null;
  isAdmin: boolean;
  icons: string[];
  filesBase: string;
  projectId: string;
};

const lines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
const commas = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
const pad = (i: number) => String(i + 1).padStart(2, '0');
const CATEGORY_LABEL: Record<string, string> = { languages: 'Languages', web: 'Web', mobile: 'Mobile', backend: 'Backend', 'ai-tools': 'AI tools', devops: 'Cloud & DevOps' };

export default function SectionEditor(p: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const f = useDraftForm<SectionData[SectionKey]>({
    formRef,
    initial: p.initial,
    draftUpdatedAt: p.draftUpdatedAt,
    draftStatus: p.draftStatus,
    save: (json, expected) => saveSection(p.section, json, expected),
  });
  const { err, aria, status } = f;
  const listOf = <T,>() => (f.data as unknown as { items: T[] }).items;
  const setItems = (items: unknown[]) => f.set({ items } as never);

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
        <h1 className="font-display text-3xl font-bold">{p.label}</h1>
        <span className="text-sm text-fg-muted">
          {status === 'draft' ? 'Draft changes' : status === 'in_review' ? 'In review' : 'Showing what’s live'}
        </span>
      </div>

      {p.section === 'capabilities' && (
        <Repeater<SectionData['capabilities']['items'][number]>
          title="Capabilities"
          addLabel="Add capability"
          items={listOf()}
          empty={{ title: '', description: '', tags: [], services: [], groups: [] }}
          onChange={setItems}
          itemLabel={(i) => `Capability ${pad(i)}`}
          max={20}
          render={(c, i, upd) => {
            const k = (field: string) => `items.${i}.${field}`;
            const ctx = `Capability ${pad(i)}`;
            return (
              <>
                <Text label="Title" context={ctx} value={c.title} onChange={(v) => upd({ title: v })} error={err(k('title'))} name={k('title')} aria={aria(k('title'))} max={100} />
                <Area label="Description" context={ctx} value={c.description} onChange={(v) => upd({ description: v })} error={err(k('description'))} name={k('description')} aria={aria(k('description'))} max={500} rows={2} />
                <Text label="Tags (comma-separated)" context={ctx} value={c.tags.join(', ')} onChange={(v) => upd({ tags: commas(v) })} error={err(k('tags'))} name={k('tags')} aria={aria(k('tags'))} />
                <Area label="Services (one per line)" context={ctx} value={c.services.join('\n')} onChange={(v) => upd({ services: lines(v) })} error={err(k('services'))} name={k('services')} aria={aria(k('services'))} rows={4} />
                <Text label="Proof (one verifiable line, optional)" context={ctx} value={c.proof ?? ''} onChange={(v) => upd({ proof: v })} error={err(k('proof'))} name={k('proof')} aria={aria(k('proof'))} max={300} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select label="Style" ctx={ctx} id={k('tone')} value={c.tone ?? ''} onChange={(v) => upd({ tone: (v || undefined) as never })} options={[['', 'Light (default)'], ['inverse', 'Dark (one per grid)']]} />
                  <Select label="Width on tablets" ctx={ctx} id={k('spanMd')} value={String(c.spanMd ?? '')} onChange={(v) => upd({ spanMd: (Number(v) || undefined) as never })} options={[['', 'Half (default)'], ['12', 'Full']]} />
                  <Select label="Width on desktop" ctx={ctx} id={k('spanLg')} value={String(c.spanLg ?? '')} onChange={(v) => upd({ spanLg: (Number(v) || undefined) as never })} options={[['', 'Third (default)'], ['6', 'Half'], ['8', 'Two thirds']]} />
                </div>
                <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-3">
                  <legend className="px-1 text-sm font-medium">Service groups (optional, shown side by side)</legend>
                  {c.groups.map((g, n) => (
                    <div key={n} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-start">
                      <Text label="Group title" context={`${ctx} group ${n + 1}`} value={g.title} onChange={(v) => upd({ groups: c.groups.map((x, j) => (j === n ? { ...x, title: v } : x)) })} error={err(k(`groups.${n}.title`))} name={k(`groups.${n}.title`)} aria={aria(k(`groups.${n}.title`))} max={100} />
                      <Area label="Items (one per line)" context={`${ctx} group ${n + 1}`} value={g.items.join('\n')} onChange={(v) => upd({ groups: c.groups.map((x, j) => (j === n ? { ...x, items: lines(v) } : x)) })} name={k(`groups.${n}.items`)} aria={aria(k(`groups.${n}.items`))} rows={3} />
                      <button type="button" aria-label={`Remove ${ctx} group ${n + 1}`} onClick={() => upd({ groups: c.groups.filter((_, j) => j !== n) })} className="mt-7 grid size-11 place-items-center rounded-full text-danger hover:bg-surface-sunk">
                        ✕
                      </button>
                    </div>
                  ))}
                  {c.groups.length < 4 && (
                    <button type="button" className="self-start text-sm text-accent-ink underline underline-offset-4" onClick={() => upd({ groups: [...c.groups, { title: '', items: [] }] })}>
                      Add a group
                    </button>
                  )}
                </fieldset>
              </>
            );
          }}
        />
      )}

      {p.section === 'process' && (
        <Repeater<SectionData['process']['items'][number]>
          title="Steps"
          addLabel="Add step"
          items={listOf()}
          empty={{ title: '', body: '', deliverables: [] }}
          onChange={setItems}
          itemLabel={(i) => `Step ${pad(i)}`}
          max={10}
          render={(s, i, upd) => {
            const k = (field: string) => `items.${i}.${field}`;
            const ctx = `Step ${pad(i)}`;
            return (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Title" context={ctx} value={s.title} onChange={(v) => upd({ title: v })} error={err(k('title'))} name={k('title')} aria={aria(k('title'))} max={100} />
                  <Text label="Duration" context={ctx} value={s.duration ?? ''} onChange={(v) => upd({ duration: v })} error={err(k('duration'))} name={k('duration')} aria={aria(k('duration'))} max={100} />
                </div>
                <Area label="What happens" context={ctx} value={s.body} onChange={(v) => upd({ body: v })} error={err(k('body'))} name={k('body')} aria={aria(k('body'))} max={1000} rows={3} />
                <Area label="Deliverables (one per line)" context={ctx} value={s.deliverables.join('\n')} onChange={(v) => upd({ deliverables: lines(v) })} error={err(k('deliverables'))} name={k('deliverables')} aria={aria(k('deliverables'))} rows={3} />
              </>
            );
          }}
        />
      )}

      {p.section === 'stack' && (
        <Repeater<SectionData['stack']['items'][number]>
          title="Technologies"
          addLabel="Add technology"
          items={listOf()}
          empty={{ label: '', category: 'web', icon: 'code' }}
          onChange={setItems}
          itemLabel={(i) => `Item ${i + 1}`}
          max={100}
          render={(s, i, upd) => {
            const k = (field: string) => `items.${i}.${field}`;
            const ctx = `Item ${i + 1}`;
            return (
              <div className="grid gap-4 sm:grid-cols-3">
                <Text label="Name" context={ctx} value={s.label} onChange={(v) => upd({ label: v })} error={err(k('label'))} name={k('label')} aria={aria(k('label'))} max={60} />
                <Select label="Group" ctx={ctx} id={k('category')} value={s.category} onChange={(v) => upd({ category: v as never })} options={Object.entries(CATEGORY_LABEL)} />
                <Select label="Icon" ctx={ctx} id={k('icon')} value={s.icon} onChange={(v) => upd({ icon: v })} options={p.icons.map((ic) => [ic, ic])} error={err(k('icon'))} />
              </div>
            );
          }}
        />
      )}

      {p.section === 'logos' && (
        <Repeater<SectionData['logos']['items'][number]>
          title="Client logos"
          addLabel="Add client"
          items={listOf()}
          empty={{ name: '', approved: false }}
          onChange={setItems}
          itemLabel={(i) => `Client ${i + 1}`}
          max={50}
          render={(l, i, upd) => {
            const k = (field: string) => `items.${i}.${field}`;
            const ctx = `Client ${i + 1}`;
            return (
              <>
                <Text label="Client name (also the logo’s description)" context={ctx} value={l.name} onChange={(v) => upd({ name: v })} error={err(k('name'))} name={k('name')} aria={aria(k('name'))} max={100} />
                <ImageField label="Logo (optional — without one, the name is shown)" context={ctx} url={l.fileId ? `${p.filesBase}/${l.fileId}/view?project=${p.projectId}` : null} onChange={(img) => upd({ fileId: img.fileId })} />
                <label className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" className="size-4" checked={l.approved} onChange={(e) => upd({ approved: e.target.checked })} />
                  <span>
                    <span className="sr-only">{ctx} </span>The client agreed to be listed
                  </span>
                </label>
              </>
            );
          }}
        />
      )}

      {p.section === 'settings' && <SettingsFields f={f as never} />}

      <ActionBar
        form={f}
        isAdmin={p.isAdmin}
        previewLink={() => sectionPreviewLink(p.section)}
        submit={() => submitSection(p.section)}
        publish={(v) => publishSectionDraft(p.section, v)}
        discard={() => discardSection(p.section)}
      />
    </form>
  );
}

function Select({ label, ctx, id, value, onChange, options, error }: { label: string; ctx?: string; id: string; value: string; onChange: (v: string) => void; options: [string, string][]; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} label={label} context={ctx} />
      <select id={id} className={input} value={value} onChange={(e) => onChange(e.target.value)} {...(error ? { 'aria-invalid': true, 'aria-describedby': `err-${id}` } : {})}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {error && (
        <p id={`err-${id}`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type SettingsForm = {
  data: SectionData['settings'];
  set: (patch: Partial<SectionData['settings']>) => void;
  err: (k: string) => string | undefined;
  aria: (k: string) => object;
};

function SettingsFields({ f }: { f: SettingsForm }) {
  const { data: s, set, err, aria } = f;
  const t = (key: keyof SectionData['settings'], label: string, max: number, type = 'text') => (
    <Text label={label} value={String(s[key] ?? '')} onChange={(v) => set({ [key]: v } as never)} error={err(key)} name={key} aria={aria(key)} max={max} type={type} />
  );
  const n = (key: 'deliveryMinWeeks' | 'deliveryMaxWeeks', label: string) => (
    <Text label={label} value={String(s[key] ?? '')} onChange={(v) => set({ [key]: Number(v.replace(/\D/g, '').slice(0, 2)) } as never)} error={err(key)} name={key} aria={aria(key)} inputMode="numeric" max={2} />
  );
  return (
    <>
      <Section title="Contact">
        {t('email', 'Contact email', 254, 'email')}
        {t('calUrl', 'Booking link (https://…)', 2000, 'url')}
        <div className="grid gap-4 sm:grid-cols-2">
          {t('replyWithin', 'We reply within (e.g. 24 hours)', 40)}
          {t('timezoneLabel', 'Time zone label (e.g. IST · UTC+5:30)', 40)}
        </div>
      </Section>
      <Section title="Studio">
        <div className="grid gap-4 sm:grid-cols-2">
          {t('city', 'City', 60)}
          {t('country', 'Country', 60)}
        </div>
        <Text label="Disciplines (comma-separated)" value={s.disciplines.join(', ')} onChange={(v) => set({ disciplines: commas(v) })} error={err('disciplines')} name="disciplines" aria={aria('disciplines')} />
      </Section>
      <Section title="Availability">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-4" checked={s.bookingOpen} onChange={(e) => set({ bookingOpen: e.target.checked })} />
          Booking new projects
        </label>
        {t('bookingDetail', 'Availability detail (optional, e.g. “2 slots in Nov”)', 80)}
        <div className="grid gap-4 sm:grid-cols-2">
          {n('deliveryMinWeeks', 'Delivery: from (weeks)')}
          {n('deliveryMaxWeeks', 'Delivery: to (weeks)')}
        </div>
      </Section>
    </>
  );
}
