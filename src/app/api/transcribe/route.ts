import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

// Route segment config for large audio file uploads
export const maxDuration = 60; // Allow up to 60 seconds for long transcriptions

export async function POST(request: NextRequest) {
  console.log('[Transcribe] Starting transcription request...');
  
  try {
    // Verify admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Transcribe] Missing OPENAI_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing OpenAI API key' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Transcribe] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service key' },
        { status: 500 }
      );
    }

    // Initialize clients inside the function to avoid build-time errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const episodeId = formData.get('episodeId') as string;

    console.log('[Transcribe] Received:', { 
      hasAudio: !!audioFile, 
      audioName: audioFile?.name,
      audioType: audioFile?.type,
      audioSize: audioFile?.size,
      episodeId 
    });

    if (!audioFile || !episodeId) {
      return NextResponse.json(
        { error: 'Missing audio file or episode ID' },
        { status: 400 }
      );
    }

    // Validate file size (OpenAI limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB for transcription.' },
        { status: 400 }
      );
    }

    console.log('[Transcribe] Calling OpenAI Whisper API...');

    // 1. Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    console.log('[Transcribe] Whisper response received, segments:', transcription.segments?.length || 0);

    // 2. Parse segments into transcript nodes
    const segments = transcription.segments || [];
    const nodes = segments.map((segment: any, index: number) => ({
      episode_id: episodeId,
      content: segment.text.trim(),
      display_order: index,
      start_time: segment.start,
      end_time: segment.end,
    }));

    console.log('[Transcribe] Saving', nodes.length, 'nodes to database...');

    // 3. Insert into database
    if (nodes.length > 0) {
      const { error } = await supabase
        .from('transcript_nodes')
        .insert(nodes);

      if (error) {
        console.error('[Transcribe] DB Error:', error);
        return NextResponse.json(
          { error: 'Failed to save transcript: ' + error.message },
          { status: 500 }
        );
      }
    }

    // 4. Update episode transcription status
    await supabase
      .from('episodes')
      .update({ transcription_status: 'completed' })
      .eq('id', episodeId);

    console.log('[Transcribe] Success! Saved', nodes.length, 'nodes');

    return NextResponse.json({
      success: true,
      nodeCount: nodes.length,
      fullText: transcription.text,
    });

  } catch (error: any) {
    console.error('[Transcribe] Error:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Transcription failed';
    
    if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'OpenAI API quota exceeded. Please check your billing.';
    } else if (error.message?.includes('Could not process audio')) {
      errorMessage = 'Audio format not supported. Please try MP3, WAV, or WebM.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
