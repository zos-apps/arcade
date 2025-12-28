import React, { useState, useRef, useCallback, useEffect } from 'react';

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

const CONSOLES: Console[] = [
  { id: 'nes', name: 'Nintendo (NES)', icon: '🎮', core: 'nes', extensions: ['.nes'], color: '#e60012' },
  { id: 'snes', name: 'Super Nintendo', icon: '🕹️', core: 'snes', extensions: ['.sfc', '.smc'], color: '#7b5aa6' },
  { id: 'n64', name: 'Nintendo 64', icon: '🎯', core: 'n64', extensions: ['.n64', '.z64'], color: '#009e42' },
  { id: 'gb', name: 'Game Boy', icon: '📱', core: 'gb', extensions: ['.gb'], color: '#8b956d' },
  { id: 'gbc', name: 'Game Boy Color', icon: '🌈', core: 'gbc', extensions: ['.gbc'], color: '#663399' },
  { id: 'gba', name: 'Game Boy Advance', icon: '📲', core: 'gba', extensions: ['.gba'], color: '#2e0854' },
  { id: 'nds', name: 'Nintendo DS', icon: '📺', core: 'nds', extensions: ['.nds'], color: '#c0c0c0' },
  { id: 'genesis', name: 'Sega Genesis', icon: '⚡', core: 'segaMD', extensions: ['.md', '.gen'], color: '#0060a8' },
  { id: 'psx', name: 'PlayStation', icon: '🎪', core: 'psx', extensions: ['.bin', '.iso'], color: '#003087' },
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

const Arcade: React.FC<ArcadeProps> = ({ onClose }) => {
  const [view, setView] = useState<'browse' | 'play'>('browse');
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [romFile, setRomFile] = useState<File | null>(null);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emulatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zos-arcade-recent');
    if (saved) setRecentGames(JSON.parse(saved));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect console from extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const detectedConsole = CONSOLES.find(c => c.extensions.includes(ext));
    
    if (detectedConsole) {
      const game: Game = {
        id: file.name,
        name: file.name.replace(/\.[^/.]+$/, ''),
        console: detectedConsole.id,
        year: 'Custom',
        cover: detectedConsole.icon,
      };
      setSelectedGame(game);
      setRomFile(file);
      setView('play');
    }
  }, []);

  const playGame = useCallback((game: Game) => {
    setSelectedGame(game);
    setView('play');
    
    // Add to recent
    const updated = [game, ...recentGames.filter(g => g.id !== game.id)].slice(0, 10);
    setRecentGames(updated);
    localStorage.setItem('zos-arcade-recent', JSON.stringify(updated));
  }, [recentGames]);

  const filteredGames = FEATURED_GAMES.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConsole = !selectedConsole || game.console === selectedConsole;
    return matchesSearch && matchesConsole;
  });

  if (view === 'play' && selectedGame) {
    const console = CONSOLES.find(c => c.id === selectedGame.console);
    
    return (
      <div className="h-full flex flex-col bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setView('browse')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2"
          >
            ← Back to Arcade
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
          {romFile ? (
            <div className="text-center text-white">
              <div className="text-6xl mb-4">{console?.icon}</div>
              <p className="text-xl mb-2">Loading {selectedGame.name}...</p>
              <p className="text-gray-400 text-sm mb-4">EmulatorJS Core: {console?.core}</p>
              <div className="bg-gray-800 p-6 rounded-lg max-w-md">
                <p className="text-sm text-gray-300 mb-4">
                  To enable EmulatorJS, add the following script to your page:
                </p>
                <code className="text-xs text-green-400 block bg-black p-3 rounded">
                  {'<script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>'}
                </code>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-8xl mb-6">{selectedGame.cover}</div>
              <h2 className="text-3xl text-white font-bold mb-2">{selectedGame.name}</h2>
              <p className="text-gray-400 mb-6">{console?.name} • {selectedGame.year}</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg text-lg"
                >
                  📂 Load ROM File
                </button>
                
                <p className="text-gray-500 text-sm">
                  Supported formats: {console?.extensions.join(', ')}
                </p>
                
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg max-w-md mx-auto">
                  <p className="text-gray-400 text-sm">
                    💡 Tip: You can find legally obtainable ROMs for homebrew games 
                    or games you own physical copies of.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls help */}
        <div className="p-3 bg-gray-800 border-t border-gray-700 text-center text-sm text-gray-400">
          Controls: Arrow Keys = D-Pad | Z = B | X = A | Enter = Start | Shift = Select | Q/W = L/R
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
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
        {CONSOLES.map(console => (
          <button
            key={console.id}
            onClick={() => setSelectedConsole(console.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedConsole === console.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span>{console.icon}</span>
            <span>{console.name}</span>
          </button>
        ))}
      </div>

      {/* Games grid */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {recentGames.length > 0 && !selectedConsole && !searchQuery && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-purple-300 mb-3">Recently Played</h2>
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
          {selectedConsole ? CONSOLES.find(c => c.id === selectedConsole)?.name : 'Featured Games'}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {filteredGames.map(game => {
            const console = CONSOLES.find(c => c.id === game.console);
            return (
              <button
                key={game.id}
                onClick={() => playGame(game)}
                className="p-4 bg-gray-800/50 hover:bg-purple-800/30 border border-purple-700/20 hover:border-purple-500/50 rounded-lg transition-all text-left group"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{game.cover}</div>
                <div className="text-white font-medium">{game.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: console?.color }}>{console?.icon}</span>
                  <span className="text-gray-500 text-xs">{console?.name}</span>
                  <span className="text-gray-600 text-xs">• {game.year}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎮</div>
            <p>No games found. Try a different search or load your own ROM!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-900/80 border-t border-purple-800/30 text-center text-xs text-gray-500">
        Powered by <a href="https://emulatorjs.org" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">EmulatorJS</a>
        {' '}• Load legally obtained ROMs for games you own
      </div>
    </div>
  );
};

export default Arcade;
