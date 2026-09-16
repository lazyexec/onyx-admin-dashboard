'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';

export default function DashboardTabs({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications'>('dashboard');

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
            <form className="flex flex-col gap-4 max-w-lg mt-2" onSubmit={(e) => { e.preventDefault(); alert('Not implemented yet'); }}>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input type="text" placeholder="Promo Title" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Message</Label>
                <Textarea placeholder="Promo Message..." required />
              </div>
              <Button type="submit" className="w-fit mt-2">Send Promotion</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
