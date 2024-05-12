const express = require('express');
const router = express.Router();
const statesController = require('../controllers/statesController');

router.get('/', statesController.getAllStates);
router.get('/:state', statesController.getStateByCode);
router.get('/:state/funfact', statesController.getRandomFunFact);
router.get('/:state/capital', statesController.getCapital);
router.get('/:state/nickname', statesController.getNickname);
router.get('/:state/population', statesController.getPopulation);
router.get('/:state/admission', statesController.getAdmissionDate);
router.post('/:state/funfact', statesController.postFunFacts);
router.patch('/:state/funfact', statesController.patchFunFact);
router.delete('/:state/funfact', statesController.deleteFunFact);

module.exports = router;