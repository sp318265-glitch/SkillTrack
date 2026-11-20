import { Router } from 'express';
import Task from '../models/Task.js';

const router = Router();

// List only this student's tasks
router.get('/', async (request, response) => {
  try {
    const tasks = await Task.find({ owner: request.userId }).sort({ createdAt: -1 });
    response.json(tasks);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: 'Could not load tasks.' });
  }
});

// Create a task for this student
router.post('/', async (request, response) => {
  try {
    const { title, description } = request.body;

    if (typeof title !== 'string' || !title.trim()) {
      return response.status(400).json({ message: 'Task title is required.' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      owner: request.userId
    });

    response.status(201).json(task);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: 'Could not create task.' });
  }
});

// Update a task owned by this student
router.patch('/:id', async (request, response) => {
  try {
    const updates = {};
    const { title, description, status } = request.body;

    if (typeof title === 'string') updates.title = title.trim();
    if (typeof description === 'string') updates.description = description.trim();
    if (['planned', 'in-progress', 'completed'].includes(status)) {
      updates.status = status;
    }

    const task = await Task.findOneAndUpdate(
      { _id: request.params.id, owner: request.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) return response.status(404).json({ message: 'Task not found.' });
    response.json(task);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: 'Could not update task.' });
  }
});

// Delete a task owned by this student
router.delete('/:id', async (request, response) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: request.params.id,
      owner: request.userId
    });

    if (!task) return response.status(404).json({ message: 'Task not found.' });
    response.json({ message: 'Task deleted.' });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: 'Could not delete task.' });
  }
});

export default router;