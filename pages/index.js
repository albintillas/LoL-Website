import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('EUW');
  const [summonerData, setSummonerData] = useState(null);
  const [liveGameData, setLiveGameData] = useState(null);
  const [kdaStats, setKdaStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/summoner', {
        gameName,
        tagLine,
      });
      setSummonerData(response.data.summoner);
      setLiveGameData(response.data.liveGame);
      setKdaStats(response.data.kdaStats);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch summoner data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-blue-500">
          LoL Summoner Search
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Riot ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="JuanInYourFace"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-800 border border-gray-700"
                required
              />
              <span className="text-gray-400 py-2">#</span>
              <input
                type="text"
                placeholder="EUW"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="w-24 p-2 rounded bg-gray-800 border border-gray-700"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-8 bg-red-800 p-4 rounded">
            Error: {error}
          </div>
        )}

        {summonerData && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg space-y-4">
            <h2 className="text-2xl font-bold">{summonerData.name}</h2>
            <p>Level: {summonerData.summonerLevel}</p>
            <p className="text-gray-400">Account ID: {summonerData.accountId}</p>

            {kdaStats && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold">Recent KDA Stats</h3>
                <p>Kills: {kdaStats.kills}</p>
                <p>Deaths: {kdaStats.deaths}</p>
                <p>Assists: {kdaStats.assists}</p>
                <p>Games: {kdaStats.games}</p>
              </div>
            )}

            {liveGameData && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold">Live Game</h3>
                <p>Mode: {liveGameData.gameMode}</p>
                <p>Duration: {Math.floor(liveGameData.gameLength / 60)} minutes</p>
                <div className="mt-2">
                  <h4 className="font-semibold">Participants:</h4>
                  {liveGameData.participants.map((participant, index) => (
                    <div key={index} className="text-gray-400">
                      {participant.summonerName} ({participant.championName})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}