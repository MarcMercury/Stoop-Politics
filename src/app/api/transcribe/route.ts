import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const episodeId = formData.get('episodeId') as string;

    if (!audioFile || !episodeId) {
      return NextResponse.json(
        { error: 'Missing audio file or episode ID' },
        { status: 400 }
      );
    }

    // 1. Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // 2. Parse segments into transcript nodes
    const segments = transcription.segments || [];
    const nodes = segments.map((segment: any, index: number) => ({
      episode_id: episodeId,
      content: segment.text.trim(),
      display_order: index,
      start_time: segment.start,
      end_time: segment.end,
    }));

    // 3. Insert into database
    if (nodes.length > 0) {
      const { error } = await supabase
        .from('transcript_nodes')
        .insert(nodes);

      if (error) {
        console.error('DB Error:', error);
        return NextResponse.json(
          { error: 'Failed to save transcript' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      nodeCount: nodes.length,
      fullText: transcription.text,
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
