import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Plus, Trash2, 
  Music, ListMusic, Disc3, Volume2, Upload, Sun, Moon,
  ArrowDownUp, Zap
} from 'lucide-react';

// ==========================================
// 1. ESTRUCTURAS DE DATOS
// ==========================================
class SongNode {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  next: SongNode | null = null;
  prev: SongNode | null = null;

  constructor(title: string, artist: string, audioUrl: string) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.title = title;
    this.artist = artist;
    this.audioUrl = audioUrl;
  }
}

class DoublyLinkedList {
  head: SongNode | null = null;
  tail: SongNode | null = null;
  current: SongNode | null = null;
  length: number = 0;

  addLast(title: string, artist: string, audioUrl: string) {
    const newNode = new SongNode(title, artist, audioUrl);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  addFirst(title: string, artist: string, audioUrl: string) {
    const newNode = new SongNode(title, artist, audioUrl);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.length++;
  }

  insertAt(index: number, title: string, artist: string, audioUrl: string) {
    if (index <= 0) return this.addFirst(title, artist, audioUrl);
    if (index >= this.length) return this.addLast(title, artist, audioUrl);

    const newNode = new SongNode(title, artist, audioUrl);
    let temp = this.head;
    
    for (let i = 0; i < index - 1; i++) {
      temp = temp!.next;
    }

    const nextNode = temp!.next;
    newNode.next = nextNode;
    newNode.prev = temp;
    temp!.next = newNode;
    if (nextNode) nextNode.prev = newNode;

    this.length++;
  }

  remove(id: string) {
    if (!this.head) return;

    let temp: SongNode | null = this.head;
    while (temp && temp.id !== id) {
      temp = temp.next;
    }

    if (!temp) return;

    URL.revokeObjectURL(temp.audioUrl);

    if (this.current === temp) {
      this.current = temp.next ? temp.next : temp.prev;
    }

    if (temp.prev) temp.prev.next = temp.next;
    else this.head = temp.next;

    if (temp.next) temp.next.prev = temp.prev;
    else this.tail = temp.prev;

    this.length--;
  }

  // ==========================================
  // INVERTIR LISTA
  // ==========================================
  reverse() {
    if (!this.head || !this.head.next) return;

    let current: SongNode | null = this.head;
    let temp: SongNode | null = null;

    while (current !== null) {
      temp = current.prev;
      current.prev = current.next;
      current.next = temp;
      current = current.prev;
    }

    if (temp !== null) {
      this.tail = this.head;
      this.head = temp.prev;
    }
  }

  next() {
    if (this.current && this.current.next) {
      this.current = this.current.next;
      return true;
    }
    return false;
  }

  prev() {
    if (this.current && this.current.prev) {
      this.current = this.current.prev;
      return true;
    }
    return false;
  }

  setCurrentById(id: string) {
    let temp = this.head;
    while (temp) {
      if (temp.id === id) {
        this.current = temp;
        break;
      }
      temp = temp.next;
    }
  }

  toArray(): SongNode[] {
    const arr: SongNode[] = [];
    let temp = this.head;
    while (temp) {
      arr.push(temp);
      temp = temp.next;
    }
    return arr;
  }
}

// ==========================================
// 2. COMPONENTE REACT
// ==========================================
const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function App() {
  const playlistRef = useRef(new DoublyLinkedList());
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(tick => tick + 1);

  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Estado del Tema
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estado de velocidad
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Estados del formulario
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState('end');
  const [insertIndex, setInsertIndex] = useState(1);

  const songs = playlistRef.current.toArray();
  const currentSong = playlistRef.current.current;
  const listLength = playlistRef.current.length;

  useEffect(() => {
    if (audioRef.current) {
      // Sincronizar la velocidad de reproducción
      audioRef.current.playbackRate = playbackRate;

      if (currentSong) {
        if (audioRef.current.src !== currentSong.audioUrl) {
          audioRef.current.src = currentSong.audioUrl;
          setCurrentTime(0);
          if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Error", e));
          }
        }
      } else {
        audioRef.current.pause();
        audioRef.current.src = "";
        setCurrentTime(0);
        setDuration(0);
      }
    }
  }, [currentSong?.id, isPlaying]);

  const handlePlayPause = () => {
    if (!currentSong || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Error", e));
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (playlistRef.current.next()) {
      setIsPlaying(true);
      forceUpdate();
    } else {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const handlePrev = () => {
    if (playlistRef.current.prev()) {
      setIsPlaying(true);
      forceUpdate();
    }
  };

  const handlePlaySpecific = (id: string) => {
    playlistRef.current.setCurrentById(id);
    setIsPlaying(true);
    forceUpdate();
  };

  const handleSpeedChange = () => {
    const rates = [0.5, 1, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  const handleReverseList = () => {
    playlistRef.current.reverse();
    forceUpdate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Selecciona un archivo de audio");

    const audioUrl = URL.createObjectURL(file);
    const finalTitle = title.trim() || "Canción Desconocida";
    const finalArtist = artist.trim() || "Artista Desconocido";

    if (position === 'start') playlistRef.current.addFirst(finalTitle, finalArtist, audioUrl);
    else if (position === 'end') playlistRef.current.addLast(finalTitle, finalArtist, audioUrl);
    else playlistRef.current.insertAt(insertIndex, finalTitle, finalArtist, audioUrl);

    setTitle(''); setArtist(''); setFile(null); forceUpdate();
  };

  const handleRemoveSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const isRemovingCurrent = currentSong?.id === id;
    playlistRef.current.remove(id);
    
    if (playlistRef.current.length === 0) setIsPlaying(false);
    else if (isRemovingCurrent && !playlistRef.current.current) setIsPlaying(false);
    forceUpdate();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    // Wrapper principal que controla el tema
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-200 font-sans p-4 md:p-8 flex items-center justify-center transition-colors duration-300">
        
        <audio 
          ref={audioRef}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={handleNext}
        />

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* ================= REPRODUCTOR ================= */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl shadow-zinc-200 dark:shadow-none border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-red-600 dark:text-red-500 tracking-tight">
                <Disc3 className={`w-7 h-7 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                Sputify
              </h2>
              
              {/* Controles superiores: Ecualizador + Botón de Tema */}
              <div className="flex items-center gap-4">
                <div className="flex gap-1 h-4 items-end">
                  {[1, 2, 3, 4].map((bar) => (
                    <div 
                      key={bar} 
                      className={`w-1 bg-red-500 rounded-t-sm transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-1'}`}
                      style={{ height: isPlaying ? `${Math.random() * 16 + 8}px` : '4px', animationDelay: `${bar * 0.1}s` }}
                    />
                  ))}
                </div>
                
                {/* Botón de Velocidad */}
                <button 
                  onClick={handleSpeedChange}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-red-600 dark:text-red-500 font-bold text-xs transition-colors"
                  title="Cambiar Velocidad (Modo Nightcore)"
                >
                  <Zap className="w-4 h-4" />
                  x{playbackRate}
                </button>

                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                  title="Cambiar Tema"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-red-500 to-red-900 dark:from-red-600 dark:to-black shadow-lg shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/40 mix-blend-overlay"></div>
                {currentSong ? (
                  <Music className="w-24 h-24 text-white/90" />
                ) : (
                  <ListMusic className="w-16 h-16 text-white/60" />
                )}
              </div>

              <div className="h-20">
                {currentSong ? (
                  <>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{currentSong.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">{currentSong.artist}</p>
                  </>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic">Agrega tu música para comenzar</p>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-6 group">
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden cursor-pointer">
                  <div 
                    className="bg-red-500 h-full rounded-full relative" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={handlePrev}
                  disabled={!currentSong || !currentSong.prev}
                  className="p-3 text-zinc-400 hover:text-red-500 dark:hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                >
                  <SkipBack className="w-8 h-8 fill-current" />
                </button>
                
                <button 
                  onClick={handlePlayPause}
                  disabled={!currentSong}
                  className="w-16 h-16 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-500/30 dark:shadow-red-600/30 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                
                <button 
                  onClick={handleNext}
                  disabled={!currentSong || !currentSong.next}
                  className="p-3 text-zinc-400 hover:text-red-500 dark:hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                >
                  <SkipForward className="w-8 h-8 fill-current" />
                </button>
              </div>
            </div>
          </div>

          {/* ================= LISTA Y FORMULARIO ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Upload className="w-5 h-5 text-red-500" />
                Cargar Música (Lista Doble)
              </h3>
              
              <form onSubmit={handleAddSong} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all bg-zinc-50 dark:bg-black">
                    <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                      <Upload className="w-5 h-5" />
                      {file ? file.name : 'Seleccionar archivo de audio (.mp3, .wav)'}
                    </span>
                    <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                <input 
                  type="text" 
                  placeholder="Título (Se autocompleta)" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-colors text-zinc-900 dark:text-zinc-200"
                />
                <input 
                  type="text" 
                  placeholder="Artista (Opcional)" 
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-colors text-zinc-900 dark:text-zinc-200"
                />
                
                <div className="flex gap-2 items-center bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 md:col-span-2 transition-colors duration-300">
                  <select 
                    value={position} 
                    onChange={(e) => setPosition(e.target.value)}
                    className="bg-transparent text-zinc-700 dark:text-zinc-300 outline-none p-2 flex-1 cursor-pointer"
                  >
                    <option value="end" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200">Insertar al Final</option>
                    <option value="start" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200">Insertar al Inicio</option>
                    <option value="custom" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200">Posición Específica...</option>
                  </select>

                  {position === 'custom' && (
                    <input 
                      type="number" min="0" max={listLength} value={insertIndex}
                      onChange={(e) => setInsertIndex(parseInt(e.target.value) || 0)}
                      className="w-20 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-center outline-none text-zinc-900 dark:text-zinc-200"
                    />
                  )}
                  
                  <button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-6 rounded-lg transition-colors ml-auto flex items-center gap-2 disabled:opacity-50"
                    disabled={!file}
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 flex-1 flex flex-col min-h-[300px] transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <ListMusic className="w-5 h-5 text-red-500" />
                  Cola de Reproducción
                </h3>
                
                <div className="flex items-center gap-3">
                  {/* Botón de Invertir Lista */}
                  <button 
                    onClick={handleReverseList}
                    disabled={listLength < 2}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Invertir Lista (Reverse Doubly Linked List)"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5" />
                    Invertir
                  </button>

                  <span className="text-xs font-medium px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full">
                    {listLength} canciones
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {songs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 space-y-3">
                    <Music className="w-12 h-12 opacity-20" />
                    <p>La lista está vacía.</p>
                  </div>
                ) : (
                  songs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;
                    
                    return (
                      <div 
                        key={song.id}
                        onClick={() => handlePlaySpecific(song.id)}
                        className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                          isCurrent 
                            ? 'bg-red-50 dark:bg-red-600/10 border-red-200 dark:border-red-500/50' 
                            : 'bg-zinc-50 dark:bg-black/50 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {isCurrent && isPlaying ? (
                            <Volume2 className="w-5 h-5 text-red-500 animate-pulse" />
                          ) : isCurrent ? (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 text-sm group-hover:hidden">{index + 1}</span>
                          )}
                          {!isCurrent && (
                            <Play className="w-5 h-5 text-zinc-400 hidden group-hover:block ml-1" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isCurrent ? 'text-red-600 dark:text-red-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {song.title}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-500 truncate">{song.artist}</p>
                        </div>

                        <button 
                          onClick={(e) => handleRemoveSong(song.id, e)}
                          className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
        `}} />
      </div>
    </div>
  );
}