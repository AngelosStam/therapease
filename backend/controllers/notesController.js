// controllers/notesController.js
// Therapist-only CRUD for client notes

const Note = require('../models/Note');

exports.listByClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const notes = await Note.find({ client: clientId })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(notes);
    } catch (err) {
        console.error('notesController.listByClient error:', err);
        res.status(500).json({ error: 'Failed to load notes' });
    }
};

exports.create = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { text } = req.body || {};
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Note text is required' });
        }
        const note = await Note.create({
            client: clientId,
            author: req.user?.id,
            text: text.trim()
        });
        const fresh = await Note.findById(note._id).lean();
        res.status(201).json(fresh);
    } catch (err) {
        console.error('notesController.create error:', err);
        res.status(500).json({ error: 'Failed to create note' });
    }
};

exports.update = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { text } = req.body || {};
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Note text is required' });
        }
        const updated = await Note.findByIdAndUpdate(
            noteId,
            { $set: { text: text.trim() } },
            { new: true }
        ).lean();
        if (!updated) return res.status(404).json({ error: 'Note not found' });
        res.status(200).json(updated);
    } catch (err) {
        console.error('notesController.update error:', err);
        res.status(500).json({ error: 'Failed to update note' });
    }
};

exports.remove = async (req, res) => {
    try {
        const { noteId } = req.params;
        const r = await Note.findByIdAndDelete(noteId);
        if (!r) return res.status(404).json({ error: 'Note not found' });
        res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        console.error('notesController.remove error:', err);
        res.status(500).json({ error: 'Failed to delete note' });
    }
};
