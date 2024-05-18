import type { Leaderboard, LiveLeaderboard, UserLeaderboard, UserLive } from "../types/api";
import { addPbToCache, getPb, getRoute } from "./cache";

const getLeaderboardPage = async (page: number) => {
  const ROUTE = "https://dips-plus-plus.xk.io/leaderboard/global/" + page;

  const data: Leaderboard = await getRoute(ROUTE);

  data.forEach(v => addPbToCache(v));

  return data.sort((a, b) => a.rank - b.rank);
}

const getLiveGlobalHeight = async () => {
  const ROUTE = "https://dips-plus-plus.xk.io/live_heights/global";

  const data: LiveLeaderboard = await getRoute(ROUTE);

  return data
    .sort((a, b) => b.height - a.height)
    .filter((p) => p.height > 30 && p.rank <= 100)
    .map(p => {
      const pb = getPb(p.user_id);
      if (!pb) {
        getPlayerPb(p.user_id)
      }
      return {
        ...p,
        pbRank: pb?.rank,
        pbHeight: pb?.height
      }
    });
}

const getPlayerPb = async (wsid: string) => {
  const PB_ROUTE = "https://dips-plus-plus.xk.io/leaderboard/" + wsid;
  const dataPb: UserLeaderboard = await getRoute(PB_ROUTE);

  addPbToCache(dataPb);

  return dataPb;
}

const getPlayerData = async (wsid: string) => {
  const dataPb = await getPlayerPb(wsid);

  const LIVE_ROUTE = "https://dips-plus-plus.xk.io/live_heights/" + wsid;

  const dataLive: UserLive = await getRoute(LIVE_ROUTE);

  const connected = dataLive.last_5_points.length && dataLive.last_5_points[0]![1]! * 1000 > Date.now() - 10 * 1000 * 60;

  let liveRank = 0;
  if (connected) {
    const GLOBAL_ROUTE = "https://dips-plus-plus.xk.io/live_heights/global";
    const dataGlobal: LiveLeaderboard = await getRoute(GLOBAL_ROUTE);
    const data = dataGlobal.find((p) => p.user_id == wsid);
    if (data) liveRank = data.rank;
  }

  return {
    name: dataPb.name,
    pbRank: dataPb.rank,
    pbHeight: dataPb.height,
    pbTs: dataPb.ts,
    connected,
    liveRank,
    liveHeight: dataLive.last_5_points[0]?.at(0), // I use "at" because using ?[0] make the ts thinking it's a "cond ? true : false" smh
    liveTs: dataLive.last_5_points[0]?.at(1)
  }
}

export { getLeaderboardPage, getLiveGlobalHeight, getPlayerData, getPlayerPb }