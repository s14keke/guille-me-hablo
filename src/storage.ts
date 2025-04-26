import fs from 'fs';
import path from 'path';

// path where the file containing user data is stored
const filePath = path.join(__dirname, 'lastGuilleTime.json');

// type definition for the data store, which maps user IDs to their last timestamp
type DataStore = { [userId: string]: string };

// reads the data from the JSON file and returns it as an object
function readData(): DataStore {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {}; 
  }
}

// writes the given data object to the JSON file
function writeData(data: DataStore) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); 
}

// saves the timestamp of the last time a user interacted with the bot
export function saveLastTime(userId: string, date: Date) {
  const data = readData();
  data[userId] = date.toISOString(); 
  writeData(data); 
}

// loads the timestamp of the last time a specific user interacted with the bot
export function loadLastTime(userId: string): Date {
  const data = readData(); 
  if (data[userId]) return new Date(data[userId]);
  return new Date(); 
}

export function getAllTimes(): { userId: string; date: Date }[] {
  const data = readData();
  return Object.entries(data).map(([userId, dateString]) => ({
    userId,
    date: new Date(dateString),
  }));
}