const express = require('express');
const router = express.Router();
const { loadStatesData } = require('../utils/dataLoader');
const State = require('../models/States'); // Assuming your Mongoose model is named State

// Helper function to find state data by code
async function findStateData(stateCode) {
    const statesData = await loadStatesData();
    return statesData.find(s => s.code.toLowerCase() === stateCode.toLowerCase());
}

// GET all states data or filter based on contiguity
router.get('/', async (req, res) => {
    try {
        const statesData = await loadStatesData(); // Load data from JSON file
        const funFactsData = await State.find({}); // Load fun facts from MongoDB
        const { contig } = req.query; // This will be 'true', 'false', or undefined

        let filteredData = statesData;

        // Filter based on contiguity if contig parameter is provided
        if (contig !== undefined) {
            if (contig === 'true') {
                // Exclude Alaska and Hawaii
                filteredData = statesData.filter(state => state.code !== 'AK' && state.code !== 'HI');
            } else if (contig === 'false') {
                // Include only Alaska and Hawaii
                filteredData = statesData.filter(state => state.code === 'AK' || state.code === 'HI');
            }
        }

        // Merge the data
        const mergedData = filteredData.map(state => {
            const stateFunFacts = funFactsData.find(fact => fact.stateCode === state.code);
            return {
                ...state,
                funfacts: stateFunFacts ? stateFunFacts.funfacts : []
            };
        });

        res.json({ states: mergedData });
    } catch (error) {
        console.error('Error fetching states data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET data for a specific state by code
router.get('/:state', async (req, res) => {
    const stateCode = req.params.state;
    try {
        const stateData = await findStateData(stateCode);
        if (!stateData) {
            return res.status(404).json({ error: 'State not found' });
        }
        res.json(stateData);
    } catch (error) {
        console.error('Error fetching state data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET a random fun fact for a specific state by code
router.get('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase(); // Ensure the state code is in uppercase for consistent querying
    try {
        const stateData = await findStateData(stateCode);
        if (!stateData) {
            return res.status(404).json({ error: 'State not found' });
        }

        // Fetch additional fun facts from MongoDB
        const additionalFunFacts = await State.findOne({ stateCode: stateCode });
        
        // Combine fun facts from JSON and MongoDB
        let allFunFacts = stateData.funfacts || [];
        if (additionalFunFacts && additionalFunFacts.funfacts) {
            allFunFacts = allFunFacts.concat(additionalFunFacts.funfacts);
        }

        if (allFunFacts.length === 0) {
            return res.status(404).json({ error: 'No fun facts found for this state' });
        }

        const randomFact = allFunFacts[Math.floor(Math.random() * allFunFacts.length)];
        res.json({ funfact: randomFact });
    } catch (error) {
        console.error('Error fetching fun fact:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET the capital of a specific state
router.get('/:state/capital', async (req, res) => {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, capital: stateData.capital_city });
});

// GET the nickname of a specific state
router.get('/:state/nickname', async (req, res) => {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, nickname: stateData.nickname });
});

// GET the population of a specific state
router.get('/:state/population', async (req, res) => {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, population: stateData.population });
});

// GET the admission date of a specific state
router.get('/:state/admission', async (req, res) => {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, admitted: stateData.admission_date });
});

// POST fun facts for a specific state
router.post('/:state/funfact', async (req, res) => {
    const { state } = req.params;
    const { funfacts } = req.body;
    try {
        const updatedState = await State.findOneAndUpdate(
            { stateCode: state.toUpperCase() },
            { $push: { funfacts: { $each: funfacts } } },
            { new: true, upsert: true }
        );
        res.json(updatedState);
    } catch (error) {
        console.error('Error updating fun facts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PATCH a specific fun fact for a specific state
router.patch('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase(); // Normalize state code
    const { index, funfact } = req.body;

    if (!index || !funfact) {
        return res.status(400).json({ error: 'Index and funfact are required' });
    }

    try {
        // MongoDB uses zero-based indexing, adjust the provided index
        const adjustedIndex = index - 1;

        // Find the document and update the specific fun fact
        const updatedState = await State.findOneAndUpdate(
            { stateCode: stateCode },
            { $set: { [`funfacts.${adjustedIndex}`]: funfact } },
            { new: true } // Return the updated document
        );

        if (!updatedState) {
            return res.status(404).json({ error: 'State not found' });
        }

        res.json(updatedState);
    } catch (error) {
        console.error('Error updating fun fact:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE a specific fun fact for a specific state
router.delete('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase(); // Normalize state code
    const { index } = req.body;

    if (!index) {
        return res.status(400).json({ error: 'Index is required' });
    }

    try {
        // MongoDB uses zero-based indexing, adjust the provided index
        const adjustedIndex = index - 1;

        // Find the document and remove the specific fun fact
        const updatedState = await State.findOneAndUpdate(
            { stateCode: stateCode },
            { $unset: { [`funfacts.${adjustedIndex}`]: 1 } }, // Remove the element at the specified index
            { new: true }
        );

        if (!updatedState) {
            return res.status(404).json({ error: 'State not found' });
        }

        // Clean up the array to remove any null entries left by $unset
        await State.updateOne(
            { stateCode: stateCode },
            { $pull: { funfacts: null } }
        );

        res.json(updatedState);
    } catch (error) {
        console.error('Error deleting fun fact:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;