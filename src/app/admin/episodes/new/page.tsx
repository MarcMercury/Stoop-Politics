'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Mic, Square, Wand2, Save, ArrowLeft, Scissors 
} from 'lucide-react';

export default function CreateEpisode() {
  const router = useRouter();
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [useNoiseSuppression, setUseNoiseSuppression] = useState(true);
  const [useEchoCancellation, setUseEchoCancellation] = useState(true);
  
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          noiseSuppression: useNoiseSuppression,
          echoCancellation: useEchoCancellation,
          autoGainControl: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  const handleSave = async () => {
    if (!audioBlob || !title) {
      alert("Please provide a title and recording");
      return;
    }
    setUploading(true);

    try {
      const filename = 'episode-' + Date.now() + '.webm';
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload('audio/' + filename, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl('audio/' + filename);

      const { data: episode, error: dbError } = await supabase
        .from('episodes')
        .insert({
          title,
          summary,
          audio_url: publicUrl,
          duration_seconds: recordingTime,
          is_published: false,
          published_at: null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('episodeId', episode.id);

      const transcriptRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptRes.ok) {
        console.error('Transcription failed');
      }

      router.push('/admin/episodes/' + episode.id);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error saving episode: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getTimerClasses = () => {
    const base = 'aspect-square rounded-full flex flex-col items-center justify-center mb-8 border-4 transition-all duration-500';
    if (isRecording) {
      return base + ' border-red-500 bg-red-50 shadow-[0_0_30px_rgba(239,68,68,0.3)]';
    }
    return base + ' border-stone-100 bg-stone-50';
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <button 
          onClick={() => router.back()}
          className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Command Center
        </button>

        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Record New Episode</h1>
        <p className="text-stone-500 mb-10">Step into the booth. We will handle the technical stuff.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-stone-700 flex items-center gap-2">
                <Mic size={20} /> The Booth
              </h2>
              {isRecording && (
                <span className="flex items-center gap-2 text-red-600 font-mono text-sm animate-pulse">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  ON AIR
                </span>
              )}
            </div>

            <div className={getTimerClasses()}>
              <div className="text-5xl font-mono font-bold text-stone-800 tracking-tighter">
                {formatTime(recordingTime)}
              </div>
              <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest font-semibold">
                {isRecording ? 'Recording...' : audioUrl ? 'Recorded' : 'Ready'}
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              {!isRecording && !audioUrl && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200"
                >
                  <Mic size={20} />
                  Start Recording
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-full font-semibold hover:bg-stone-900 transition-all"
                >
                  <Square size={20} />
                  Stop Recording
                </button>
              )}

              {audioUrl && !isRecording && (
                <button
                  onClick={discardRecording}
                  className="flex items-center gap-2 text-stone-500 hover:text-red-500 transition-colors"
                >
                  <Scissors size={18} />
                  Discard and Re-record
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="border-t border-stone-100 pt-6">
                <p className="text-xs text-stone-500 uppercase font-semibold mb-2">Preview</p>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}

            <div className="border-t border-stone-100 pt-6 mt-6">
              <p className="text-xs text-stone-500 uppercase font-semibold mb-4 flex items-center gap-2">
                <Wand2 size={14} /> Freshen Up My Audio
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-stone-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useNoiseSuppression} 
                    onChange={(e) => setUseNoiseSuppression(e.target.checked)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  Reduce Background Noise
                </label>
                <label className="flex items-center gap-3 text-sm text-stone-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useEchoCancellation} 
                    onChange={(e) => setUseEchoCancellation(e.target.checked)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  Remove Echo
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-200">
              <h2 className="font-bold text-stone-700 mb-4">Episode Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., The Rent Is Too Damn High"
                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="A quick teaser for your listeners..."
                    rows={4}
                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={uploading || !audioBlob || !title}
              className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⏳</span> Generating Transcript...
                </>
              ) : (
                <>
                  <Save size={20} /> Save and Generate Transcript
                </>
              )}
            </button>
            <p className="text-center text-xs text-stone-400">
              We will transcribe your audio and take you to the editor to add links.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
