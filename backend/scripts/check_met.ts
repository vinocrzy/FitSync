import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.RAPIDAPI_KEY || '542da881e2msh54e0252da55a234p1cec7ajsn36317b4e6224';
const API_HOST = 'exercisedb.p.rapidapi.com';

async function checkDetails() {
    const ids = ['0001', '0002']; 
    for (const id of ids) {
        console.log(`Checking details for ${id}...`);
        try {
            const options = {
                method: 'GET',
                url: `https://${API_HOST}/exercises/exercise/${id}`,
                headers: {
                    'x-rapidapi-key': API_KEY,
                    'x-rapidapi-host': API_HOST
                }
            };
            const res = await axios.request(options);
            console.log(`KEYS for ${id}:`, Object.keys(res.data));
            if (res.data.met) console.log('FOUND MET:', res.data.met);
            if (res.data.burn) console.log('FOUND BURN:', res.data.burn);
            console.log('Sub-muscles:', res.data.secondaryMuscles);
        } catch (e: any) {
            console.error(e.message);
        }
    }
}

checkDetails();
