const fs = require('fs');
const path = require('path');

// Function to load states data from JSON file
function loadStatesData() {
    const jsonPath = path.join(__dirname, '..', 'data', 'states.json');
    return new Promise((resolve, reject) => {
        fs.readFile(jsonPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(JSON.parse(data));
        });
    });
}

module.exports = { loadStatesData };