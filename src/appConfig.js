export const DEFAULT_LANGUAGE = "ja";

export const LANGUAGE_STORAGE_KEY = "soccerLanguage";
export const BUILD_STORAGE_KEY = "soccerPlayerBuild";
export const PLAYER_NAME_STORAGE_KEY = "soccerOnlinePlayerName";
export const ONLINE_TEAM_STORAGE_KEY = "soccerOnlineTeam";
export const CONTROLS_STORAGE_KEY = "soccerControlBindings";
export const KIT_STORAGE_KEY = "soccerKit";
export const MATCH_RULE_STORAGE_KEY = "soccerMatchRule";
export const ONLINE_CLIENT_STORAGE_KEY = "soccerOnlineClientId";

export const ONLINE_ROOM_PARAM = "room";
export const ONLINE_INPUT_INTERVAL = 1000 / 24;
export const ONLINE_SNAPSHOT_INTERVAL = 1000 / 15;
export const ONLINE_TEAM_KEYS = ["home", "away"];

export const PLAYER_NAME_MAX_LENGTH = 16;

export const DEFAULT_MATCH_RULE = "time3";
export const MATCH_RULES = {
  time3: { type: "time", seconds: 180 },
  first3: { type: "firstTo", goals: 3 },
  first5: { type: "firstTo", goals: 5 },
  first7: { type: "firstTo", goals: 7 },
};
