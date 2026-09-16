'use client';

import { useState, useTransition } from 'react';
import { Activity, BadgeDollarSign, Bell, CalendarClock, Image, Link, Send, Smartphone, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { sendNotification } from '../actions/notifications';
import type { DashboardStats } from '../actions/stats';

const statIcons = [Users, Activity, BadgeDollarSign, BadgeDollarSign, Smartphone, Bell];

export default function DashboardTabs({ user, stats }: { user: any; stats: DashboardStats }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications'>('dashboard');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [preview, setPreview] = useState({
    title: 'Fall promo drop',
    message: 'Get back into training with a fresh Onyx offer.',
    bannerUrl: '',
    ctaLabel: 'Open offer',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      setMessage(null);
      const result = await sendNotification(formData);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        const scheduledText = result.scheduled ? 'scheduled' : 'queued';
        setMessage({
          type: 'success',
          text: `Campaign ${scheduledText} for ${result.recipientCount ?? 0} recipient${result.recipientCount === 1 ? '' : 's'}.`,
        });
        form.reset();
      }
    });
  };

  const selectClass = 'bg-transparent border border-[color:var(--primary)] text-[color:var(--text)] p-2 w-full outline-none transition-colors focus:border-[color:var(--accent)]';

  return (
    <>
      <nav className="flex gap-2 border-b border-[color:var(--secondary)] pb-2 overflow-x-auto">
        <button
          className={`inline-flex items-center gap-2 font-semibold pb-2 px-2 transition-colors ${activeTab === 'dashboard' ? 'text-[color:var(--text)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--primary)] hover:text-[color:var(--text)]'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Activity size={16} aria-hidden="true" />
          Dashboard
        </button>
        <button
          className={`inline-flex items-center gap-2 font-semibold pb-2 px-2 transition-colors ${activeTab === 'notifications' ? 'text-[color:var(--text)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--primary)] hover:text-[color:var(--text)]'}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} aria-hidden="true" />
          Notifications
        </button>
      </nav>

      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 text-sm text-[color:var(--primary)] sm:flex-row sm:items-center sm:justify-between">
                <span>Live admin status from Supabase tables.</span>
                <span>Updated {new Date(stats.generatedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.cards.map((item, index) => {
              const Icon = statIcons[index] ?? Activity;
              return (
                <Card key={`${item.label}-${index}`} className="min-h-[150px]">
                  <CardContent className="flex h-full flex-col justify-between gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--primary)]">{item.label}</p>
                        <p className="mt-2 text-3xl font-bold text-[color:var(--text)]">{item.value}</p>
                      </div>
                      <div className="border border-[color:var(--secondary)] p-2 text-[color:var(--accent)]" aria-hidden="true">
                        <Icon size={20} />
                      </div>
                    </div>
                    <p className={`text-sm ${item.status === 'ok' ? 'text-[color:var(--primary)]' : 'text-[color:var(--accent)]'}`}>{item.detail}</p>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Composer</CardTitle>
              <CardDescription>Create push, in-app, and banner promotions for Onyx users.</CardDescription>
            </CardHeader>

            <CardContent>
              <form className="grid grid-cols-1 gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2 lg:col-span-2">
                  <Label>Title</Label>
                  <Input
                    name="title"
                    type="text"
                    placeholder="Fall promo drop"
                    required
                    disabled={isPending}
                    onChange={(e) => setPreview((current) => ({ ...current, title: e.target.value || 'Fall promo drop' }))}
                  />
                </div>

                <div className="flex flex-col gap-2 lg:col-span-2">
                  <Label>Message</Label>
                  <Textarea
                    name="message"
                    placeholder="Tell users what is new, useful, or discounted."
                    required
                    disabled={isPending}
                    onChange={(e) => setPreview((current) => ({ ...current, message: e.target.value || 'Get back into training with a fresh Onyx offer.' }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Subtitle</Label>
                  <Input name="subtitle" type="text" placeholder="Optional short support line" disabled={isPending} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Promo code</Label>
                  <Input name="promoCode" type="text" placeholder="ONYX20" disabled={isPending} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Channel</Label>
                  <select name="channel" className={selectClass} disabled={isPending} defaultValue="all">
                    <option value="all">Push + in-app + banner</option>
                    <option value="push">Push notification</option>
                    <option value="in_app">In-app notification</option>
                    <option value="banner">App banner</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Audience</Label>
                  <select name="audience" className={selectClass} disabled={isPending} defaultValue="all">
                    <option value="all">All users</option>
                    <option value="active_members">Active members</option>
                    <option value="push_enabled">Push enabled devices</option>
                    <option value="purchasers">Users with purchases</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 lg:col-span-2">
                  <Label>Banner image URL</Label>
                  <div className="relative">
                    <Image className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--primary)]" size={16} aria-hidden="true" />
                    <Input
                      name="bannerUrl"
                      type="url"
                      placeholder="https://..."
                      className="pl-9"
                      disabled={isPending}
                      onChange={(e) => setPreview((current) => ({ ...current, bannerUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Deep link</Label>
                  <div className="relative">
                    <Link className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--primary)]" size={16} aria-hidden="true" />
                    <Input name="deepLink" type="text" placeholder="/programs/raw-power" className="pl-9" disabled={isPending} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>CTA label</Label>
                  <Input
                    name="ctaLabel"
                    type="text"
                    placeholder="Open offer"
                    disabled={isPending}
                    onChange={(e) => setPreview((current) => ({ ...current, ctaLabel: e.target.value || 'Open offer' }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Priority</Label>
                  <select name="priority" className={selectClass} disabled={isPending} defaultValue="normal">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Schedule</Label>
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--primary)]" size={16} aria-hidden="true" />
                    <Input name="scheduledFor" type="datetime-local" className="pl-9" disabled={isPending} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:col-span-2">
                  <Label>Expires</Label>
                  <Input name="expiresAt" type="datetime-local" disabled={isPending} />
                </div>

                {message && (
                  <div className={`lg:col-span-2 p-3 text-sm border ${message.type === 'error' ? 'bg-[color:var(--secondary)] text-[color:var(--text)] border-[color:var(--primary)]' : 'bg-[color:var(--background)] text-[color:var(--accent)] border-[color:var(--accent)]'}`}>
                    {message.text}
                  </div>
                )}

                <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[color:var(--primary)]">Campaigns are stored with recipient rows for tracking and later push delivery.</p>
                  <Button type="submit" className="inline-flex w-fit items-center gap-2" disabled={isPending}>
                    <Send size={16} aria-hidden="true" />
                    {isPending ? 'Queuing...' : 'Queue Campaign'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Approximate push and banner shape.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="border border-[color:var(--secondary)] bg-white/40 p-4">
                {preview.bannerUrl ? (
                  <img src={preview.bannerUrl} alt="" className="mb-4 aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="mb-4 flex aspect-[16/9] items-center justify-center border border-dashed border-[color:var(--secondary)] text-sm text-[color:var(--primary)]">
                    Banner image
                  </div>
                )}
                <h3 className="text-lg font-bold text-[color:var(--text)]">{preview.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--primary)]">{preview.message}</p>
                <div className="mt-4 inline-flex border border-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-[color:var(--text)]">
                  {preview.ctaLabel}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
