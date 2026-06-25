'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // 1. Authenticate user on server side first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(`/${locale}/auth?mode=login`);
  }

  // 2. Fetch profile to check if onboarding is complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.goal) {
    redirect(`/${locale}/onboarding`);
  }

  return (
    <DashboardClient 
      initialProfile={profile} 
      userEmail={user.email || ''} 
    />
  );
}
