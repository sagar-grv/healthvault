import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'doctor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { count: waitingCount } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', user.id)
    .eq('status', 'waiting');

  const { count: todayCompleted } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', user.id)
    .eq('status', 'completed')
    .gte('consultation_started_at', today);

  const { count: inConsultation } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', user.id)
    .eq('status', 'in_consultation');

  const { data: completedToday } = await supabase
    .from('queue_entries')
    .select('checked_in_at, consultation_started_at, consultation_ended_at')
    .eq('doctor_id', user.id)
    .eq('status', 'completed')
    .gte('consultation_ended_at', today);

  let avgWaitMinutes = 0;
  if (completedToday && completedToday.length > 0) {
    const totalWait = completedToday.reduce((sum, e) => {
      if (e.checked_in_at && e.consultation_started_at) {
        return (
          sum +
          (new Date(e.consultation_started_at).getTime() - new Date(e.checked_in_at).getTime())
        );
      }
      return sum;
    }, 0);
    avgWaitMinutes = Math.round(totalWait / completedToday.length / 60000);
  }

  return NextResponse.json({
    waiting_count: waitingCount || 0,
    today_completed: todayCompleted || 0,
    in_consultation: inConsultation || 0,
    avg_wait_minutes: avgWaitMinutes,
  });
}
