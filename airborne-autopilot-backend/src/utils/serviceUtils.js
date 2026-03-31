const CITY_GRAPH = require('../algorithms/graph');

const ADDRESS_MAP = {
  '123 main st, bangalore': 10,
  'main st, bangalore': 10,
  'depot': 0,
  'hospital': 1,
  'mall': 2,
  'airport': 3,
  'downtown': 5,
  'university': 6,
  'stadium': 7,
  'park': 8,
  'library': 9,
  'market': 10,
  'station': 11,
  'hotel': 12,
  'school': 13,
  'factory': 14,
  'bank': 15,
  'clinic': 16,
  'warehouse': 17,
  'plaza': 18,
  'tower': 19,
};

function geocodeAddress(address) {
  if (!address || typeof address !== 'string') return null;
  const key = address.trim().toLowerCase();
  if (ADDRESS_MAP[key] !== undefined) return ADDRESS_MAP[key];
  // fallback: if user provided numeric node
  const maybeNum = Number(key);
  if (!Number.isNaN(maybeNum) && Number.isInteger(maybeNum) && maybeNum >= 0 && maybeNum < CITY_GRAPH.numNodes) {
    return maybeNum;
  }

  // substring match
  for (const [name, node] of Object.entries(ADDRESS_MAP)) {
    if (key.includes(name)) return node;
  }

  return null;
}

function isServiceHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 22;
}

module.exports = { geocodeAddress, isServiceHours };
