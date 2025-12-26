import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.RAPIDAPI_KEY || '542da881e2msh54e0252da55a234p1cec7ajsn36317b4e6224';
const API_HOST = 'exercisedb.p.rapidapi.com';

async function checkListStructure() {
    console.log('Fetching 1 item from /exercises...');
    try {
        const options = {
            method: 'GET',
            url: `https://${API_HOST}/exercises`,
            params: { limit: '1' },
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST
            }
        };
        const res = await axios.request(options);
        if (res.data && res.data.length > 0) {
            const item = res.data[0];
            console.log('Keys found:', Object.keys(item));
            console.log('Instructions present?', !!item.instructions);
            console.log('Secondary Muscles present?', !!item.secondaryMuscles);
            console.log('MET present?', !!item.met);
            console.log('Sample Item:', JSON.stringify(item, null, 2));
        } else {
            console.log('No data returned.');
        }
    } catch (e: any) {
        console.error(e.message);
    }
}

checkListStructure();
