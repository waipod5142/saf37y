// Test script to debug Sri Lanka data issue
const { getDashboardMachineStatsByBU } = require('./data/machines.ts');

async function testSriLanka() {
  console.log('Testing Sri Lanka dashboard data...');
  
  try {
    const result = await getDashboardMachineStatsByBU('daily', 'lk');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testSriLanka();