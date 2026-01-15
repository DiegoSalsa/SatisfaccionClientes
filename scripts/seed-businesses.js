import { v4 as uuidv4 } from 'uuid';

import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const businesses = [];
for (let i = 1; i <= 60; i++) {
  businesses.push({
    id: `business_${i}`,
    name: `Negocio ${i}`,
    slug: `negocio-${i}`,
    private_token: uuidv4(),
    logo_url: '', // Placeholder, update as needed
  });
}

const output = JSON.stringify(businesses, null, 2);
writeFileSync(join(__dirname, 'businesses_seed.json'), output);
console.log('Seed file created: businesses_seed.json');
