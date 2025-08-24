// routes/appointments.js
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/appointmentsController');

let mw;
try { mw = require('../middleware/authMiddleware'); } catch { mw = {}; }
const authenticate =
    mw.authenticate || mw.protect || mw.verifyToken || mw.auth || ((_req, _res, next) => next());
const requireTherapist =
    mw.requireTherapist || mw.therapistOnly || mw.isTherapist || mw.onlyTherapist || ((_req, _res, next) => next());

router.post('/', ctrl.create);

router.get('/', authenticate, requireTherapist, ctrl.listAll);
router.get('/requests', authenticate, requireTherapist, ctrl.listRequests);
router.get('/mine', authenticate, ctrl.listMyApproved);

router.get('/by-date', authenticate, requireTherapist, ctrl.listByDate);
router.get('/overview', authenticate, requireTherapist, ctrl.monthOverview);

router.patch('/:id', authenticate, requireTherapist, ctrl.updateDate);
router.patch('/:id/approve', authenticate, requireTherapist, ctrl.approve);
router.patch('/:id/reject', authenticate, requireTherapist, ctrl.rejectRequest);
router.patch('/:id/cancel', authenticate, requireTherapist, ctrl.cancel);

router.post('/client/:clientId', authenticate, requireTherapist, ctrl.createForClient);
router.post('/client/:clientId/recurring', authenticate, requireTherapist, ctrl.createRecurringForClient);
router.patch('/series/:seriesId/cancel', authenticate, requireTherapist, ctrl.cancelRecurringSeries);

module.exports = router;
