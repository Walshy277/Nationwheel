const governmentAliases: Record<string, string> = {
  "Absol. Monarchy": "Absolute Monarchy",
  "Auth. Republic": "Authoritarian Republic",
  "Clan council": "Clan Council",
  "Colony - Military Govt": "Colony - Military Government",
  "Colony (Plesshurye)": "Colony - Plesshurye",
  Communism: "Communist State",
  Communist: "Communist State",
  "Communist Social Republic": "Communist Republic",
  "Const. Monarchy": "Constitutional Monarchy",
  "Crypto-Anarchy": "Crypto Anarchy",
  "Cyber-Dictatorship": "Cyber Dictatorship",
  "Democracy now Communist": "Communist Democracy",
  "Fed. Republic": "Federal Republic",
  Fascism: "Fascist State",
  "Guild merchant state": "Guild Merchant State",
  "Parlement. Democracy": "Parliamentary Democracy",
  "Technocratic State": "Technocracy",
};

export function normalizeGovernment(government: string) {
  return governmentAliases[government.trim()] ?? government.trim();
}

export function governmentAliasEntries() {
  return Object.entries(governmentAliases);
}
