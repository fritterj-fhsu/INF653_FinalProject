const { loadStatesData } = require('../utils/dataLoader');
const State = require('../models/States');

async function getAllStates(req, res) {
    try {
        const statesData = await loadStatesData();
        const funFactsData = await State.find({});
        let filteredData = statesData;
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
}

async function getStateByCode(req, res) {
    try {
        const stateData = await findStateData(req.params.state);
        if (!stateData) {
            return res.status(404).json({ error: 'State not found' });
        }
        res.json(stateData);
    } catch (error) {
        console.error('Error fetching state data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getRandomFunFact(req, res) {
    try {
        const stateData = await findStateData(req.params.state.toUpperCase());
        if (!stateData) {
            return res.status(404).json({ error: 'State not found' });
        }
        const additionalFunFacts = await State.findOne({ stateCode: req.params.state.toUpperCase() });
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
}

async function getCapital(req, res) {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, capital: stateData.capital_city });
}

async function getNickname(req, res) {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, nickname: stateData.nickname });
}

async function getPopulation(req, res) {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, population: stateData.population });
}

async function getAdmissionDate(req, res) {
    const stateData = await findStateData(req.params.state);
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }
    res.json({ state: stateData.state, admitted: stateData.admission_date });
}

async function postFunFacts(req, res) {
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
}

async function patchFunFact(req, res) {
    const stateCode = req.params.state.toUpperCase();
    const { index, funfact } = req.body;

    if (!index || !funfact) {
        return res.status(400).json({ error: 'Index and funfact are required' });
    }

    try {
        const adjustedIndex = index - 1;
        const updatedState = await State.findOne({ stateCode: stateCode });
        if (!updatedState) {
            return res.status(404).json({ error: 'State not found' });
        }
        if (adjustedIndex < 0 || adjustedIndex >= updatedState.funfacts.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        updatedState.funfacts[adjustedIndex] = funfact;
        await updatedState.save();
        res.json(updatedState);
    } catch (error) {
        console.error('Error updating fun fact:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function deleteFunFact(req, res) {
    const stateCode = req.params.state.toUpperCase();
    const { index } = req.body;

    if (!index) {
        return res.status(400).json({ error: 'Index is required' });
    }

    try {
        const updatedState = await State.findOne({ stateCode: stateCode });
        if (!updatedState) {
            return res.status(404).json({ error: 'State not found' });
        }
        const adjustedIndex = index - 1;
        if (adjustedIndex < 0 || adjustedIndex >= updatedState.funfacts.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        updatedState.funfacts.splice(adjustedIndex, 1);
        await updatedState.save();
        res.json(updatedState);
    } catch (error) {
        console.error('Error deleting fun fact:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getAllStates,
    getStateByCode,
    getRandomFunFact,
    getCapital,
    getNickname,
    getPopulation,
    getAdmissionDate,
    postFunFacts,
    patchFunFact,
    deleteFunFact
};