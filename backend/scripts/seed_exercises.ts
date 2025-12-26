import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { db } from '../src/db';
import { exercises } from '../src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const API_KEY = process.env.RAPIDAPI_KEY || '542da881e2msh54e0252da55a234p1cec7ajsn36317b4e6224';
const API_HOST = 'exercisedb.p.rapidapi.com';
const DOWNLOAD_DIR = path.join(__dirname, '../../frontend/public/exercises');
console.log('Download Directory:', DOWNLOAD_DIR);

// Ensure directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  console.log('Creating directory...');
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Rate Limiting Helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadFile(baseUrl: string, filename: string, params?: any) {
  const filePath = path.join(DOWNLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1024) { 
        console.log(`Skipping download, ${filename} exists (${stats.size} bytes).`);
        return;
      }
      console.log(`Overwriting ${filename} (${stats.size} bytes)`);
  }

  console.log(`Downloading ${baseUrl} with params ${JSON.stringify(params)}...`);
  const writer = fs.createWriteStream(filePath);

  try {
      const response = await axios({
        url: baseUrl,
        method: 'GET',
        responseType: 'stream',
        params,
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': API_HOST
        }
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            console.log(`Download finished: ${filename}`);
            resolve(true);
        });
        writer.on('error', (err) => {
            console.error(`File write error for ${filename}:`, err);
            reject(err);
        });
      });
  } catch (err: any) {
      writer.close();
      fs.unlinkSync(filePath); // Delete empty file
      throw new Error(`Download failed: ${err.message}`);
  }
}

async function seed() {
  let offset = 0;
  const limit = 50; 
  let totalProcessed = 0;
  let keepFetching = true;
  
  // SAFETY LIMIT for Basic Plans (usually 500-1000 reqs/month)
  // User requested extraction of all data.
  const MAX_GLOBAL_ITEMS = 1300; 

  try {
    console.log(`Starting Seeding (Safety Limit: ${MAX_GLOBAL_ITEMS})...`);
    
    while (keepFetching) {
        if (totalProcessed >= MAX_GLOBAL_ITEMS) {
            console.log(`\nHit Safety Limit of ${MAX_GLOBAL_ITEMS} items. Stopping to preserve API quota.`);
            break;
        }
        console.log(`Fetching batch: Offset ${offset}, Limit ${limit}...`);
        
        const options = {
          method: 'GET',
          url: 'https://exercisedb.p.rapidapi.com/exercises',
          params: { limit: limit.toString(), offset: offset.toString() }, 
          headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': API_HOST
          }
        };

        let data: any[] = [];
        try {
            const response = await axios.request(options);
            data = response.data;
        } catch (e: any) {
            console.error(`API Fetch Error: ${e.message}`);
            // If 429, wait and retry? For now break to save state.
            break; 
        }

        if (!Array.isArray(data) || data.length === 0) {
            console.log('No more data received. Seeding complete.');
            keepFetching = false;
            break;
        }

        console.log(`Fetched ${data.length} items. Processing...`);

        for (const item of data) {
          // Map Data
          const name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
          const muscleGroup = item.bodyPart.charAt(0).toUpperCase() + item.bodyPart.slice(1);
          
          // Equipment: Ensure it's stored as an array string ["dumbbell"], not just "dumbbell"
          // API returns string usually e.g. "body weight"
          const equipmentVal = JSON.stringify([item.equipment]); 
          
          const type = 'rep'; 
          const imageName = `${item.id}.gif`;
          const expectedParams = { resolution: '720', exerciseId: item.id };
          const downloadPath = `/exercises/${imageName}`;

          // Rich Data Mapping
          const instructions = item.instructions ? JSON.stringify(item.instructions) : '[]';
          const primaryMuscles = item.target ? JSON.stringify([item.target]) : '[]'; // "abs" -> ["abs"]
          const secondaryMuscles = item.secondaryMuscles ? JSON.stringify(item.secondaryMuscles) : '[]';
          
          // Estimate MET if missing (API often omits this in list view)
          // Rough estimates: Cardio ~8, Legs ~6, Arms ~4, Abs ~4
          let estimatedMet = 5;
          const lowerPart = item.bodyPart.toLowerCase();
          if (lowerPart.includes('cardio')) estimatedMet = 9;
          else if (lowerPart.includes('legs') || lowerPart.includes('plyo')) estimatedMet = 6;
          else if (lowerPart.includes('chest') || lowerPart.includes('back')) estimatedMet = 5.5;
          else if (lowerPart.includes('waist') || lowerPart.includes('abs')) estimatedMet = 3.5;
          
          const metValue = item.met || estimatedMet;

          // Check if exists in DB FIRST to skip expensive logic if purely resuming
          const existing = await db.select().from(exercises).where(eq(exercises.name, name));
          const dbExists = existing.length > 0;
          const hasValidImage = dbExists && existing[0].imageUrl && fs.existsSync(path.join(DOWNLOAD_DIR, imageName));
          
          if (dbExists && hasValidImage) {
              process.stdout.write('.'); 
              continue; 
          }

          console.log(`\nProcessing: ${name}`);

          let success = false;

          // Try download if we don't have valid image locally
          const localPath = path.join(DOWNLOAD_DIR, imageName);
          if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1024) {
              console.log('Image exists locally.');
              success = true;
          } else {
             // Try User's Endpoint
             try {
                await downloadFile(`https://${API_HOST}/image`, imageName, expectedParams);
                success = true; 
             } catch (e: any) {
                console.log(`Download failed: ${e.message}`);
                // Retry simple ID?
                if (item.id.startsWith('0')) {
                   try {
                     const simpleId = item.id.replace(/^0+/, '');
                     await downloadFile(`https://${API_HOST}/image`, imageName, { resolution: '720', exerciseId: simpleId });
                     success = true; 
                   } catch(e2) {}
                }
             }
          }
          
          const finalImageUrl = success ? downloadPath : null;

          const dbPayload = {
              name,
              muscleGroup,
              equipment: equipmentVal,
              type,
              imageUrl: finalImageUrl,
              instructions,
              primaryMuscles,
              secondaryMuscles,
              metValue,
              description: item.description || `A ${item.difficulty || 'standard'} exercise targeting the ${item.target}.`
          };

          if (!dbExists) {
              await db.insert(exercises).values(dbPayload);
              console.log(`Inserted: ${name}`);
          } else {
              // Update rich data even if exists
               await db.update(exercises)
                .set(dbPayload)
                .where(eq(exercises.name, name));
              console.log(`Updated: ${name}`);
          }
        }
        
        offset += limit;
        totalProcessed += data.length;
        console.log(`\nTotal Processed so far: ${totalProcessed}`);
        
        // Politeness sleep between batches
        await sleep(500);
    }

    console.log(`\nFINAL TOTAL: ${totalProcessed} exercises processed.`);
    process.exit(0);

  } catch (error) {
    console.error('Seeding Fatal Error:', error);
    process.exit(1);
  }
}

seed();
