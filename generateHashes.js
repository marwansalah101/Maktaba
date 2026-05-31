const bcrypt = require('bcryptjs');

const passwords = [
  'Maktaba@123',
  'Maktaba@456',
  'Maktaba@789',
  'Maktaba@321',
  'Maktaba@654',
];

async function generate() {
  for (const pass of passwords) {
    const hash = await bcrypt.hash(pass, 12);
    console.log(`${pass} → ${hash}`);
  }
}

generate();