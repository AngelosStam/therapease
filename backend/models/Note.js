// models/Note.js
// Therapist client-notes: free-form notes per client (therapist-only access)

const mongoose = require('mongoose');
const { Schema } = mongoose;

const NoteSchema = new Schema(
    {
        client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // therapist
        text: { type: String, trim: true, required: true }
    },
    { timestamps: true }
);

NoteSchema.index({ client: 1, createdAt: -1 });

module.exports = mongoose.model('Note', NoteSchema);
