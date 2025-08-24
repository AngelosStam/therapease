// routes/notes.js
// Therapist-only routes for client notes

const express = require('express');
const router = express.Router();

let mw;
try { mw = require('../middleware/authMiddleware'); } catch { mw = {}; }
const authenticate =
    mw.authenticate || mw.protect || mw.verifyToken || ((_req, _res, next) => next());
const requireTherapist =
    mw.requireTherapist || mw.therapistOnly || mw.isTherapist || ((_req, _res, next) => next());

const ctrl = require('../controllers/notesController');

// List notes for a client
router.get('/:clientId', authenticate, requireTherapist, ctrl.listByClient);

// Create a note for a client
router.post('/:clientId', authenticate, requireTherapist, ctrl.create);

// Update a note
router.patch('/:noteId', authenticate, requireTherapist, ctrl.update);

// Delete a note
router.delete('/:noteId', authenticate, requireTherapist, ctrl.remove);

module.exports = router;
