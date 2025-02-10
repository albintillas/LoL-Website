import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { gameName, tagLine } = req.body;
    const region = process.env.REGIONAL_ROUTING;

    // Step 1: Get PUUID from Riot ID
    const accountResponse = await axios.get(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      {
        headers: {
          'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY
        }
      }
    );

    const puuid = accountResponse.data.puuid;

    // Step 2: Get Summoner Data
    const summonerResponse = await axios.get(
      `https://${process.env.PLATFORM_ROUTING}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY
        }
      }
    );

    // Step 3: Get Live Game Data (if available)
    let liveGameData = null;
    try {
      const liveGameResponse = await axios.get(
        `https://${process.env.PLATFORM_ROUTING}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${summonerResponse.data.id}`,
        {
          headers: {
            'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY
          }
        }
      );
      liveGameData = liveGameResponse.data;
    } catch (error) {
      // Summoner is not in a live game
      liveGameData = null;
    }

    // Step 4: Get Match History (last 5 matches)
    const matchesResponse = await axios.get(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=5`,
      {
        headers: {
          'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY
        }
      }
    );

    // Step 5: Get Match Details for KDA stats
    const matches = await Promise.all(
      matchesResponse.data.map(async (matchId) => {
        const matchResponse = await axios.get(
          `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          {
            headers: {
              'X-Riot-Token': process.env.NEXT_PUBLIC_RIOT_API_KEY
            }
          }
        );
        return matchResponse.data;
      })
    );

    // Aggregate KDA stats
    const kdaStats = matches.reduce((acc, match) => {
      const participant = match.info.participants.find(p => p.puuid === puuid);
      if (participant) {
        acc.kills += participant.kills;
        acc.deaths += participant.deaths;
        acc.assists += participant.assists;
        acc.games += 1;
      }
      return acc;
    }, { kills: 0, deaths: 0, assists: 0, games: 0 });

    res.status(200).json({
      summoner: summonerResponse.data,
      liveGame: liveGameData,
      kdaStats,
    });
  } catch (error) {
    console.error('Riot API Error:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.status?.message || 'Internal server error'
    });
  }
}