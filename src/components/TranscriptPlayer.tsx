'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Share2, Check, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptNode {
  id: string;
  content: string;
  start_time: number | null;
  end_time: number | null;
  reference_link?: string;
  reference_title?: string;
  display_order: number;
}

interface TranscriptPlayerProps {
  audioUrl: string;
  transcriptNodes: TranscriptNode[];
  episodeTitle: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function TranscriptPlayer({ audioUrl, transcriptNodes, episodeTitle, isCollapsed = true, onToggleCollapse }: TranscriptPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const [copiedTime, setCopiedTime] = useState<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Handle URL parameter for deep linking on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const timeParam = urlParams.get('t');
    
    if (timeParam) {
      const seconds = parseFloat(timeParam);
      if (!isNaN(seconds) && audioRef.current) {
        // Wait for audio to be ready
        const seekToTime = () => {
          if (audioRef.current) {
            audioRef.current.currentTime = seconds;
            setCurrentTime(seconds);
          }
        };
        
        if (audioRef.current.readyState >= 1) {
          seekToTime();
        } else {
          audioRef.current.addEventListener('loadedmetadata', seekToTime, { once: true });
        }
      }
    }
  }, []);

  // Update current time as audio plays
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Handle metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Handle play/pause state
  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Find active transcript node based on current time
  useEffect(() => {
    if (transcriptNodes.length === 0) return;

    let foundIndex: number | null = null;
    
    for (let i = 0; i < transcriptNodes.length; i++) {
      const node = transcriptNodes[i];
      if (node.start_time !== null && node.end_time !== null) {
        if (currentTime >= node.start_time && currentTime < node.end_time) {
          foundIndex = i;
          break;
        }
      } else if (node.start_time !== null) {
        // If no end_time, check if we're past this node's start and before next node's start
        const nextNode = transcriptNodes[i + 1];
        if (currentTime >= node.start_time) {
          if (!nextNode || nextNode.start_time === null || currentTime < nextNode.start_time) {
            foundIndex = i;
            break;
          }
        }
      }
    }
    
    setActiveNodeIndex(foundIndex);
  }, [currentTime, transcriptNodes]);

  // Auto-scroll to active node
  useEffect(() => {
    if (activeNodeIndex !== null && transcriptRef.current) {
      const activeElement = transcriptRef.current.querySelector(`[data-node-index="${activeNodeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeNodeIndex]);

  // Handle clicking on a transcript node
  const handleNodeClick = (node: TranscriptNode, index: number) => {
    if (node.start_time !== null && audioRef.current) {
      audioRef.current.currentTime = node.start_time;
      setCurrentTime(node.start_time);
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('t', node.start_time.toFixed(1));
      window.history.replaceState({}, '', url.toString());
      
      // Auto-play when clicking a node
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Share timestamp link
  const handleShareTimestamp = async (node: TranscriptNode) => {
    if (node.start_time === null) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('t', node.start_time.toFixed(1));
    const shareUrl = url.toString();
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedTime(node.start_time);
      setTimeout(() => setCopiedTime(null), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedTime(node.start_time);
      setTimeout(() => setCopiedTime(null), 2000);
    }
  };

  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* ===== STICKY AUDIO PLAYER ===== */}
      <div className="sticky top-16 z-40 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-md border-y border-stone-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-4">
          {/* Custom Audio Controls */}
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            
            {/* Progress Bar */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs font-mono text-stone-500 dark:text-slate-400 w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative h-2 bg-stone-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) {
                      audioRef.current.currentTime = time;
                    }
                    setCurrentTime(time);
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-xs font-mono text-stone-500 dark:text-slate-400 w-12">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          >
            <source src={audioUrl} type="audio/webm" />
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/mp4" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>

      {/* ===== INTERACTIVE TRANSCRIPT ===== */}
      <article className="max-w-3xl mx-auto px-6 py-12 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 dark:text-slate-500">
            Transcript
          </h3>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown size={16} />
                  Read Full Transcript
                </>
              ) : (
                <>
                  <ChevronUp size={16} />
                  Collapse Transcript
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Collapsible Container */}
        <div 
          className={`relative overflow-hidden transition-all duration-500 ease-in-out ${
            isCollapsed ? 'max-h-40' : 'max-h-[5000px]'
          }`}
        >
          <div 
            ref={transcriptRef}
            className="prose prose-lg prose-stone dark:prose-invert max-w-none leading-relaxed text-stone-700 dark:text-slate-300"
          >
          {transcriptNodes && transcriptNodes.length > 0 ? (
            transcriptNodes.map((node, index) => {
              const isActive = activeNodeIndex === index;
              const hasTimestamp = node.start_time !== null;
              
              return (
                <span
                  key={node.id}
                  data-node-index={index}
                  className={`
                    relative group inline mr-1
                    ${hasTimestamp ? 'cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded px-0.5 -mx-0.5 transition-colors' : ''}
                    ${isActive ? 'bg-orange-100 dark:bg-orange-900/40 ring-2 ring-orange-400 dark:ring-orange-500 rounded' : ''}
                  `}
                  onClick={() => hasTimestamp && handleNodeClick(node, index)}
                >
                  {node.reference_link ? (
                    <a 
                      href={node.reference_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-orange-600 dark:text-orange-400 font-semibold underline decoration-2 decoration-orange-200 dark:decoration-orange-700 hover:decoration-orange-600 dark:hover:decoration-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all cursor-pointer rounded px-0.5"
                      title={node.reference_title || 'View Source'}
                    >
                      {node.content}
                    </a>
                  ) : (
                    <span>{node.content}</span>
                  )}
                  
                  {/* Share timestamp button - shows on hover */}
                  {hasTimestamp && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareTimestamp(node);
                      }}
                      className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-stone-100 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded text-stone-400 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-sm"
                      title="Copy link to this moment"
                    >
                      {copiedTime === node.start_time ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <LinkIcon className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </span>
              );
            })
          ) : (
            <p className="text-stone-400 dark:text-slate-500 italic">
              Transcript will appear here once generated.
            </p>
          )}
          </div>
          
          {/* Gradient fade overlay when collapsed */}
          {isCollapsed && transcriptNodes && transcriptNodes.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-stone-50 dark:from-slate-900 to-transparent pointer-events-none" />
          )}
        </div>
        
        {/* Expand button at bottom when collapsed */}
        {isCollapsed && transcriptNodes && transcriptNodes.length > 0 && onToggleCollapse && (
          <div className="text-center mt-4">
            <button
              onClick={onToggleCollapse}
              className="inline-flex items-center gap-2 bg-stone-900 dark:bg-slate-700 hover:bg-stone-800 dark:hover:bg-slate-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg"
            >
              <ChevronDown size={18} />
              Read Full Transcript
            </button>
            <p className="text-xs text-stone-400 dark:text-slate-500 mt-2">
              Click any sentence to jump to that moment
            </p>
          </div>
        )}
        
        {/* Collapse button at bottom when expanded */}
        {!isCollapsed && transcriptNodes && transcriptNodes.length > 0 && onToggleCollapse && (
          <div className="text-center mt-8 pt-6 border-t border-stone-200 dark:border-slate-700">
            <button
              onClick={onToggleCollapse}
              className="inline-flex items-center gap-2 bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <ChevronUp size={18} />
              Collapse Transcript
            </button>
          </div>
        )}
      </article>
    </>
  );
}
