import React, { useState, useRef, useCallback, useEffect, DragEvent } from 'react';

interface ArcadeProps {
  onClose: () => void;
}

interface Console {
  id: string;
  name: string;
  icon: string;
  core: string;
  extensions: string[];
  color: string;
}

interface Game {
  id: string;
  name: string;
  console: string;
  year: string;
  cover: string;
  romUrl?: string;
}

interface RomSite {
  name: string;
  url: string;
  description: string;
  icon: string;
}

const CONSOLES: Console[] = [
  { id: 'nes', name: 'Nintendo (NES)', icon: '🎮', core: 'nes', extensions: ['.nes'], color: '#e60012' },
  { id: 'snes', name: 'Super Nintendo', icon: '🕹️', core: 'snes', extensions: ['.sfc', '.smc'], color: '#7b5aa6' },
  { id: 'n64', name: 'Nintendo 64', icon: '🎯', core: 'n64', extensions: ['.n64', '.z64'], color: '#009e42' },
  { id: 'gb', name: 'Game Boy', icon: '📱', core: 'gb', extensions: ['.gb'], color: '#8b956d' },
  { id: 'gbc', name: 'Game Boy Color', icon: '🌈', core: 'gbc', extensions: ['.gbc'], color: '#663399' },
  { id: 'gba', name: 'Game Boy Advance', icon: '📲', core: 'gba', extensions: ['.gba'], color: '#2e0854' },
  { id: 'nds', name: 'Nintendo DS', icon: '📺', core: 'nds', extensions: ['.nds'], color: '#c0c0c0' },
  { id: 'genesis', name: 'Sega Genesis', icon: '⚡', core: 'segaMD', extensions: ['.md', '.gen'], color: '#0060a8' },
  { id: 'psx', name: 'PlayStation', icon: '🎪', core: 'psx', extensions: ['.bin', '.iso', '.cue'], color: '#003087' },
  { id: 'arcade', name: 'Arcade (MAME)', icon: '🏆', core: 'mame2003', extensions: ['.zip'], color: '#ff6b00' },
];

const FEATURED_GAMES: Game[] = [
  { id: 'smb', name: 'Super Mario Bros', console: 'nes', year: '1985', cover: '🍄' },
  { id: 'zelda', name: 'Legend of Zelda', console: 'nes', year: '1986', cover: '🗡️' },
  { id: 'metroid', name: 'Metroid', console: 'nes', year: '1986', cover: '🚀' },
  { id: 'megaman', name: 'Mega Man', console: 'nes', year: '1987', cover: '🤖' },
  { id: 'smw', name: 'Super Mario World', console: 'snes', year: '1990', cover: '🦖' },
  { id: 'lttp', name: 'A Link to the Past', console: 'snes', year: '1991', cover: '⚔️' },
  { id: 'supermetroid', name: 'Super Metroid', console: 'snes', year: '1994', cover: '👾' },
  { id: 'chronotrigger', name: 'Chrono Trigger', console: 'snes', year: '1995', cover: '⏰' },
  { id: 'ff6', name: 'Final Fantasy VI', console: 'snes', year: '1994', cover: '🔮' },
  { id: 'pokemon', name: 'Pokemon Red', console: 'gb', year: '1996', cover: '⚡' },
  { id: 'pokemonemerald', name: 'Pokemon Emerald', console: 'gba', year: '2005', cover: '💎' },
  { id: 'sm64', name: 'Super Mario 64', console: 'n64', year: '1996', cover: '⭐' },
  { id: 'oot', name: 'Ocarina of Time', console: 'n64', year: '1998', cover: '🎵' },
  { id: 'sonicgen', name: 'Sonic the Hedgehog', console: 'genesis', year: '1991', cover: '🦔' },
  { id: 'ff7', name: 'Final Fantasy VII', console: 'psx', year: '1997', cover: '☁️' },
  { id: 'pacman', name: 'Pac-Man', console: 'arcade', year: '1980', cover: '👻' },
];

const ROM_SITES: RomSite[] = [
  { name: 'Archive.org', url: 'https://archive.org/details/software?query=rom', description: 'Public domain & preserved games', icon: '📚' },
  { name: 'Vimm\'s Lair', url: 'https://vimm.net', description: 'Classic video game preservation', icon: '🏰' },
  { name: 'CDRomance', url: 'https://cdromance.com', description: 'Retro game translations & mods', icon: '💿' },
  { name: 'Romhacking.net', url: 'https://www.romhacking.net', description: 'ROM hacks, translations, patches', icon: '🔧' },
  { name: 'PDRoms', url: 'https://pdroms.de', description: 'Free homebrew & public domain', icon: '🆓' },
  { name: 'itch.io', url: 'https://itch.io/games/tag-gameboy', description: 'Indie homebrew games', icon: '🎮' },
];

const STORAGE_KEY = 'zos-arcade-state';

const Arcade: React.FC<ArcadeProps> = ({ onClose }) => {
  const [view, setView] = useState<'browse' | 'play' | 'sites'>('browse');
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [romFile, setRomFile] = useState<File | null>(null);
  const [romUrl, setRomUrl] = useState<string | null>(null);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emulatorRef = useRef<HTMLDivElement>(null);

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      setRecentGames(state.recentGames || []);
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ recentGames }));
  }, [recentGames]);

  const processRomFile = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const detectedConsole = CONSOLES.find(c => c.extensions.includes(ext));
    
    if (detectedConsole) {
      const game: Game = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        console: detectedConsole.id,
        year: 'Custom',
        cover: detectedConsole.icon,
      };
      
      // Create object URL for the ROM
      const url = URL.createObjectURL(file);
      setRomUrl(url);
      setRomFile(file);
      setSelectedGame(game);
      setView('play');
      
      // Add to recent
      const updated = [game, ...recentGames.filter(g => g.id !== game.id)].slice(0, 20);
      setRecentGames(updated);
    } else {
      alert(`Unsupported file type: ${ext}\n\nSupported: ${CONSOLES.flatMap(c => c.extensions).join(', ')}`);
    }
  }, [recentGames]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processRomFile(file);
  }, [processRomFile]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const romFile = files.find(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return CONSOLES.some(c => c.extensions.includes(ext));
    });
    
    if (romFile) {
      processRomFile(romFile);
    }
  }, [processRomFile]);

  const playGame = useCallback((game: Game) => {
    setSelectedGame(game);
    setRomFile(null);
    setRomUrl(null);
    setView('play');
    
    const updated = [game, ...recentGames.filter(g => g.id !== game.id)].slice(0, 20);
    setRecentGames(updated);
  }, [recentGames]);

  const filteredGames = FEATURED_GAMES.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConsole = !selectedConsole || game.console === selectedConsole;
    return matchesSearch && matchesConsole;
  });

  // ROM Sites view
  if (view === 'sites') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
        <div className="p-4 border-b border-purple-800/30 flex items-center justify-between">
          <button
            onClick={() => setView('browse')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-purple-300">📥 ROM Sources</h1>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-yellow-300 mb-2">⚠️ Legal Notice</h3>
              <p className="text-yellow-200/70 text-sm">
                Only download ROMs for games you legally own. Many sites offer homebrew,
                public domain, and fan-made games that are free to download and play.
              </p>
            </div>

            <div className="space-y-4">
              {ROM_SITES.map(site => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-800/50 hover:bg-purple-800/30 border border-purple-700/20 hover:border-purple-500/50 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{site.icon}</span>
                    <div>
                      <h3 className="font-bold text-white text-lg">{site.name}</h3>
                      <p className="text-gray-400">{site.description}</p>
                      <p className="text-purple-400 text-sm mt-1">{site.url}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-bold text-white mb-3">💡 How to Play</h3>
              <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                <li>Download a ROM file from one of the sources above</li>
                <li>Drag and drop the ROM file onto this window, or click "Load ROM"</li>
                <li>The emulator will automatically detect the console and start playing</li>
                <li>Use keyboard or gamepad to control the game</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Play view
  if (view === 'play' && selectedGame) {
    const console = CONSOLES.find(c => c.id === selectedGame.console);
    
    return (
      <div className="h-full flex flex-col bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => { setView('browse'); setRomUrl(null); setRomFile(null); }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{console?.icon}</span>
            <span className="text-white font-bold">{selectedGame.name}</span>
          </div>
          <div className="text-gray-400 text-sm">
            {console?.name} • {selectedGame.year}
          </div>
        </div>

        {/* Emulator area */}
        <div className="flex-1 flex items-center justify-center bg-black" ref={emulatorRef}>
          {romUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              {/* EmulatorJS container - would be initialized here */}
              <div className="text-center text-white">
                <div className="text-6xl mb-4">{console?.icon}</div>
                <p className="text-xl mb-2">🎮 Ready to Play!</p>
                <p className="text-gray-400 text-sm mb-4">ROM: {selectedGame.name}</p>
                
                {/* In production, EmulatorJS would render here */}
                <div id="emulator-container" className="w-[640px] h-[480px] bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">
                    <p className="mb-2">EmulatorJS would render here</p>
                    <code className="text-xs bg-black/50 px-2 py-1 rounded">
                      Core: {console?.core}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`text-center p-8 ${isDragging ? 'bg-purple-900/50' : ''} rounded-xl transition-all`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-8xl mb-6">{selectedGame.cover}</div>
              <h2 className="text-3xl text-white font-bold mb-2">{selectedGame.name}</h2>
              <p className="text-gray-400 mb-6">{console?.name} • {selectedGame.year}</p>
              
              <div className={`border-2 border-dashed rounded-xl p-8 mb-6 transition-all ${
                isDragging ? 'border-purple-400 bg-purple-900/30' : 'border-gray-600'
              }`}>
                <p className="text-gray-400 mb-4">
                  {isDragging ? '📥 Drop ROM here!' : '📂 Drag & drop ROM file here'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg text-lg"
                >
                  Or click to browse
                </button>
              </div>
              
              <p className="text-gray-500 text-sm mb-4">
                Supported: {console?.extensions.join(', ')}
              </p>
              
              <button
                onClick={() => setView('sites')}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                📥 Where to find ROMs
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-3 bg-gray-800 border-t border-gray-700 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-6">
            <span>⬆️⬇️⬅️➡️ D-Pad</span>
            <span>Z = B</span>
            <span>X = A</span>
            <span>Enter = Start</span>
            <span>Shift = Select</span>
            <span>Q/W = L/R</span>
          </div>
        </div>
      </div>
    );
  }

  // Browse view
  return (
    <div 
      className={`h-full flex flex-col bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 ${
        isDragging ? 'ring-4 ring-purple-500 ring-inset' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-900/80 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-8xl mb-4">📥</div>
            <p className="text-2xl font-bold">Drop ROM to Play!</p>
            <p className="text-purple-300 mt-2">
              Supported: {CONSOLES.flatMap(c => c.extensions).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 text-center border-b border-purple-800/30">
        <div className="text-5xl mb-2">🕹️</div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          ARCADE
        </h1>
        <p className="text-purple-300/60 mt-1">Retro gaming powered by EmulatorJS</p>
      </div>

      {/* Search & Controls */}
      <div className="px-6 py-4 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-purple-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={CONSOLES.flatMap(c => c.extensions).join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
        >
          📂 Load ROM
        </button>
        <button
          onClick={() => setView('sites')}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          📥 Get ROMs
        </button>
      </div>

      {/* Console filter */}
      <div className="px-6 pb-4 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedConsole(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            !selectedConsole ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Systems
        </button>
        {CONSOLES.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedConsole(c.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedConsole === c.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Games grid */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {recentGames.length > 0 && !selectedConsole && !searchQuery && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-purple-300 mb-3">⏱️ Recently Played</h2>
            <div className="grid grid-cols-4 gap-3">
              {recentGames.slice(0, 4).map(game => (
                <button
                  key={game.id}
                  onClick={() => playGame(game)}
                  className="p-4 bg-gray-800/50 hover:bg-purple-800/30 rounded-lg transition-all text-left"
                >
                  <div className="text-3xl mb-2">{game.cover}</div>
                  <div className="text-white font-medium truncate">{game.name}</div>
                  <div className="text-gray-500 text-xs">{CONSOLES.find(c => c.id === game.console)?.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-purple-300 mb-3">
          {selectedConsole ? CONSOLES.find(c => c.id === selectedConsole)?.name : '🎯 Featured Games'}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {filteredGames.map(game => {
            const c = CONSOLES.find(con => con.id === game.console);
            return (
              <button
                key={game.id}
                onClick={() => playGame(game)}
                className="p-4 bg-gray-800/50 hover:bg-purple-800/30 border border-purple-700/20 hover:border-purple-500/50 rounded-lg transition-all text-left group"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{game.cover}</div>
                <div className="text-white font-medium">{game.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: c?.color }}>{c?.icon}</span>
                  <span className="text-gray-500 text-xs">{c?.name}</span>
                  <span className="text-gray-600 text-xs">• {game.year}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p>No games found. Try a different search!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-900/80 border-t border-purple-800/30 text-center text-xs text-gray-500 flex items-center justify-center gap-4">
        <span>Powered by <a href="https://emulatorjs.org" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">EmulatorJS</a></span>
        <span>•</span>
        <span>Drag & drop ROMs to play</span>
        <span>•</span>
        <span>{CONSOLES.length} systems supported</span>
      </div>
    </div>
  );
};

export default Arcade;
