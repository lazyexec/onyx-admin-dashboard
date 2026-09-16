'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { sendNotification } from '../actions/notifications';

export default function DashboardTabs({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications'>('dashboard');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

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
        setMessage({ type: 'success', text: 'Notification sent successfully!' });
        form.reset();
      }
    });
  };

  return (
    <>
      <nav className="flex gap-4 border-b border-[color:var(--secondary)] pb-2">
        <button 
          className={`font-semibold pb-2 px-2 transition-colors ${activeTab === 'dashboard' ? 'text-[color:var(--text)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--primary)] hover:text-[color:var(--text)]'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`font-semibold pb-2 px-2 transition-colors ${activeTab === 'notifications' ? 'text-[color:var(--text)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--primary)] hover:text-[color:var(--text)]'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </nav>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>You are logged in as {user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[color:var(--primary)] text-sm">Overview metrics will appear here.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>Send promotional notifications to users.</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form className="flex flex-col gap-4 max-w-lg mt-2" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input name="title" type="text" placeholder="Promo Title" required disabled={isPending} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Message</Label>
                <Textarea name="message" placeholder="Promo Message..." required disabled={isPending} />
              </div>
              
              {message && (
                <div className={`p-3 text-sm border ${message.type === 'error' ? 'bg-[color:var(--secondary)] text-[color:var(--text)] border-[color:var(--primary)]' : 'bg-[color:var(--background)] text-[color:var(--accent)] border-[color:var(--accent)]'}`}>
                  {message.text}
                </div>
              )}

              <Button type="submit" className="w-fit mt-2" disabled={isPending}>
                {isPending ? 'Sending...' : 'Send Promotion'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
