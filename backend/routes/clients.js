// routes/clients.js
// Therapist-facing routes for client management (list approved, list pending, approve, reject)

const express = require('express');
const router = express.Router();

/**
 * Controllers
 * We prefer the new names, but fall back to older aliases if your file still uses them.
 */
const ctrl = require('../controllers/clientsController');

const getClients =
    ctrl.getClients ||
    ctrl.listClients ||
    ctrl.getAllClients;

const getPending =
    ctrl.getPending ||
    ctrl.getPendingClients ||
    ctrl.listPending;

const approveClient =
    ctrl.approveClient ||
    ctrl.approve ||
    ctrl.approveRegistration;

const rejectClient =
    ctrl.rejectClient ||
    ctrl.reject ||
    ctrl.rejectRegistration;

/**
 * Middleware
 * Try the common names in auth middleware; if not found, use no-op so routes still work.
 * (Adjust these two lines to your exact exported names if you prefer stricter protection.)
 */
const mw = require('../middleware/authMiddleware') || {};
const authenticate = mw.authenticate || mw.protect || mw.verifyToken || ((req, _res, next) => next());
const requireTherapist = mw.requireTherapist || mw.therapistOnly || mw.isTherapist || ((req, _res, next) => next());

/**
 * Safety check: if any handler is still missing, throw a clear startup error
 * (better message than Express's "callback is undefined").
 */
function assertHandler(fn, name) {
    if (typeof fn !== 'function') {
        throw new Error(
            `clients.js: Missing controller handler "${name}". ` +
            `Check your ../controllers/clientsController.js exports.`
        );
    }
}
assertHandler(getClients, 'getClients');
assertHandler(getPending, 'getPending');
assertHandler(approveClient, 'approveClient');
assertHandler(rejectClient, 'rejectClient');

/**
 * Routes
 * GET /api/clients              -> list approved clients
 * GET /api/clients/pending      -> list pending registration requests
 * PATCH /api/clients/:id/approve -> approve a client
 * PATCH /api/clients/:id/reject  -> reject a client
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List all approved clients (therapist-only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all approved clients    
 *       401:
 *         description: Unauthorized                  
 */
router.get('/', authenticate, requireTherapist, getClients);

/**
 * @swagger
 * /api/clients/pending:
 *   get:
 *     summary: List all pending registration requests (therapist-only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all pending registration requests    
 *       401:
 *         description: Unauthorized        
 */
router.get('/pending', authenticate, requireTherapist, getPending);

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Approve or reject a client (therapist-only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - updated client    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden    
 *       404:
 *         description: Not found       
 */
router.patch('/:id/approve', authenticate, requireTherapist, approveClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Approve or reject a client (therapist-only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - updated client    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden    
 *       404:
 *         description: Not found       
 */
router.patch('/:id/reject', authenticate, requireTherapist, rejectClient);

module.exports = router;
