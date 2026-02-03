'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Mic, Square, Wand2, Save, ArrowLeft, Scissors, ImagePlus, X, Upload, FileAudio, Music
} from 'lucide-react';

type InputMode = 'record' | 'upload';

export default function CreateEpisode() {
  const router = useRouter();
  
  // Mode toggle
  const [inputMode, setInputMode] = useState<InputMode>('record');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Audio processing options
  const [useNoiseSuppression, setUseNoiseSuppression] = useState(true);
  const [useEchoCancellation, setUseEchoCancellation] = useState(true);
  
  // Episode details
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Cover art state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [audioUrl, coverPreview]);

  // ========== RECORDING FUNCTIONS ==========
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
        setAudioDuration(recordingTime);
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

  // ========== UPLOAD FUNCTIONS ==========
  const handleAudioUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/x-m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|ogg|m4a)$/i)) {
      alert('Please upload a valid audio file (MP3, WAV, WebM, OGG, M4A)');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large. Maximum size is 100MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioBlob(file);
    setAudioUrl(url);
    setUploadedFileName(file.name);
    
    // Get audio duration
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(Math.floor(audio.duration));
      setRecordingTime(Math.floor(audio.duration));
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAudioUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleAudioUpload(file);
  };

  // ========== SHARED FUNCTIONS ==========
  const discardAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setAudioDuration(0);
    setUploadedFileName(null);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSave = async () => {
    if (!audioBlob || !title) {
      alert("Please provide a title and audio");
      return;
    }
    setUploading(true);

    try {
      // Determine file extension based on type
      const isUploadedFile = audioBlob instanceof File;
      let extension = 'webm';
      if (isUploadedFile) {
        const fileName = (audioBlob as File).name;
        extension = fileName.split('.').pop() || 'webm';
      }
      
      // Upload audio file
      const audioFilename = 'episode-' + Date.now() + '.' + extension;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload('audio/' + audioFilename, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: audioPublicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl('audio/' + audioFilename);

      // Upload cover art if provided
      let coverImageUrl = null;
      if (coverFile) {
        const coverFilename = 'cover-' + Date.now() + '.' + coverFile.name.split('.').pop();
        const { error: coverError } = await supabase.storage
          .from('media')
          .upload('covers/' + coverFilename, coverFile);
        
        if (coverError) {
          console.error('Cover upload failed:', coverError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl('covers/' + coverFilename);
          coverImageUrl = publicUrl;
        }
      }

      // Create episode record
      const { data: episode, error: dbError } = await supabase
        .from('episodes')
        .insert({
          title,
          summary,
          audio_url: audioPublicUrl,
          cover_image_url: coverImageUrl,
          duration_seconds: audioDuration || recordingTime,
          audio_file_size: audioBlob.size,
          audio_format: extension,
          is_published: false,
          published_at: null,
          transcription_status: 'processing',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger transcription
      const formData = new FormData();
      
      // Create a proper File object with the correct MIME type
      const mimeTypes: Record<string, string> = {
        'webm': 'audio/webm',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
        'mp4': 'audio/mp4',
      };
      const mimeType = mimeTypes[extension] || 'audio/webm';
      const audioFile = new File([audioBlob], 'recording.' + extension, { type: mimeType });
      
      formData.append('audio', audioFile);
      formData.append('episodeId', episode.id);

      console.log('[CreateEpisode] Sending transcription request...', {
        fileName: audioFile.name,
        fileType: audioFile.type,
        fileSize: audioFile.size,
        episodeId: episode.id
      });

      const transcriptRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const transcriptResult = await transcriptRes.json();
      
      if (!transcriptRes.ok) {
        console.error('[CreateEpisode] Transcription failed:', transcriptResult.error);
        // Update status to failed
        await supabase.from('episodes').update({ transcription_status: 'failed' }).eq('id', episode.id);
      } else {
        console.log('[CreateEpisode] Transcription succeeded:', transcriptResult.nodeCount, 'nodes');
        // Update status to completed (already done in API, but double-check)
        await supabase.from('episodes').update({ transcription_status: 'completed' }).eq('id', episode.id);
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
    const base = 'aspect-square rounded-full flex flex-col items-center justify-center mb-6 border-4 transition-all duration-500';
    if (isRecording) {
      return base + ' border-red-500 bg-red-50 shadow-[0_0_30px_rgba(239,68,68,0.3)]';
    }
    if (audioUrl) {
      return base + ' border-green-500 bg-green-50';
    }
    return base + ' border-stone-200 bg-stone-50';
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => router.back()}
          className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Command Center
        </button>

        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Create New Episode</h1>
        <p className="text-stone-500 mb-8">Record live or upload a pre-recorded episode.</p>

        {/* ===== MODE TOGGLE TABS ===== */}
        <div className="flex gap-2 mb-8 bg-stone-200 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setInputMode('record'); discardAudio(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              inputMode === 'record' 
                ? 'bg-white text-stone-900 shadow-md' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mic size={18} />
            Record Live
          </button>
          <button
            onClick={() => { setInputMode('upload'); discardAudio(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              inputMode === 'upload' 
                ? 'bg-white text-stone-900 shadow-md' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload size={18} />
            Upload Audio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ===== LEFT COLUMN: AUDIO INPUT ===== */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-200">
            
            {inputMode === 'record' ? (
              <>
                {/* RECORD MODE */}
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

                <div className="max-w-[200px] mx-auto">
                  <div className={getTimerClasses()}>
                    <div className="text-4xl font-mono font-bold text-stone-800 tracking-tighter">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest font-semibold">
                      {isRecording ? 'Recording...' : audioUrl ? 'Recorded' : 'Ready'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
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
                      onClick={discardAudio}
                      className="flex items-center gap-2 text-stone-500 hover:text-red-500 transition-colors"
                    >
                      <Scissors size={18} />
                      Discard & Re-record
                    </button>
                  )}
                </div>

                {/* Audio Processing Options */}
                <div className="border-t border-stone-100 pt-6">
                  <p className="text-xs text-stone-500 uppercase font-semibold mb-4 flex items-center gap-2">
                    <Wand2 size={14} /> Audio Enhancement
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
              </>
            ) : (
              <>
                {/* UPLOAD MODE */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-stone-700 flex items-center gap-2">
                    <Upload size={20} /> Upload Audio File
                  </h2>
                </div>

                {!audioUrl ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-stone-300 hover:border-orange-400 hover:bg-stone-50'
                    }`}
                  >
                    <FileAudio size={48} className={`mx-auto mb-4 ${dragActive ? 'text-orange-500' : 'text-stone-400'}`} />
                    <p className="text-stone-700 font-medium mb-2">
                      {dragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
                    </p>
                    <p className="text-stone-500 text-sm mb-4">or click to browse</p>
                    <p className="text-xs text-stone-400">
                      Supports MP3, WAV, WebM, OGG, M4A • Max 100MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Info Card */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music size={24} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 truncate">{uploadedFileName}</p>
                          <p className="text-sm text-stone-500">
                            {formatTime(audioDuration)} • {formatFileSize(audioBlob?.size || 0)}
                          </p>
                        </div>
                        <button
                          onClick={discardAudio}
                          className="text-stone-400 hover:text-red-500 p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-green-600 font-medium text-center">
                      ✓ Audio file ready for processing
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Audio Preview - shared between modes */}
            {audioUrl && (
              <div className="border-t border-stone-100 pt-6 mt-6">
                <p className="text-xs text-stone-500 uppercase font-semibold mb-3">Preview</p>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN: EPISODE DETAILS ===== */}
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
                    rows={3}
                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all"
                  />
                </div>

                {/* Cover Art Picker */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    <ImagePlus size={14} className="inline mr-1" /> Cover Art
                  </label>
                  
                  {coverPreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-stone-200 group">
                      <img 
                        src={coverPreview} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeCover}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white text-xs truncate">{coverFile?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-all group">
                      <ImagePlus size={32} className="text-stone-400 group-hover:text-orange-500 mb-2" />
                      <span className="text-sm text-stone-500 group-hover:text-orange-600">Click to upload cover</span>
                      <span className="text-xs text-stone-400 mt-1">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={uploading || !audioBlob || !title}
              className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⏳</span> Processing & Transcribing...
                </>
              ) : (
                <>
                  <Save size={20} /> Save & Generate Transcript
                </>
              )}
            </button>
            <p className="text-center text-xs text-stone-400">
              We&apos;ll transcribe your audio with AI and take you to the editor.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
