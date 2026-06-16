import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runVerificationChain } from '@/lib/verification/chain';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get doctor profile
    const { data: doctorProfile, error: profileError } = await supabase
      .from('doctor_profiles')
      .select('registration_number, council_name, qualification')
      .eq('id', user.id)
      .single();

    if (profileError || !doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    if (!doctorProfile.registration_number || !doctorProfile.council_name) {
      return NextResponse.json(
        { error: 'Registration number and council required' },
        { status: 400 }
      );
    }

    // Get doctor name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Run verification chain — await and persist results
    let results;
    try {
      const chainResult = await runVerificationChain({
        doctorId: user.id,
        registrationNumber: doctorProfile.registration_number,
        councilName: doctorProfile.council_name,
        qualification: doctorProfile.qualification || '',
        doctorName: profile?.full_name || 'Unknown Doctor',
      });
      results = chainResult.results;
    } catch (chainError) {
      console.error('Background verification failed:', chainError);
      return NextResponse.json(
        {
          success: false,
          error: 'Background verification failed. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Background verification completed',
      results: results.map((r) => ({
        method: r.method,
        status: r.status,
        confidence: r.confidence,
      })),
    });
  } catch (error) {
    console.error('Background check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
