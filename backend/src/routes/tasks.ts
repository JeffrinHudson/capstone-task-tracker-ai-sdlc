import { Router } from 'express';
import { Prisma, TaskStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const VALID_STATUSES = Object.values(TaskStatus);

type TaskInput = {
  title?: unknown;
  status?: unknown;
  dueDate?: unknown;
};

function toTrimmedString(val: unknown): string {
  return String(val ?? '').trim();
}

function isValidDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateTaskInput(
  input: TaskInput,
  opts: { statusRequired: boolean }
): {
  title: string;
  status: TaskStatus;
  dueDate: string | null;
} {
  const fields: Record<string, string> = {};

  const title = toTrimmedString(input?.title);
  if (!title) fields.title = 'Title is required';
  else if (title.length < 1 || title.length > 200) fields.title = 'Title must be 1–200 characters';

  const rawStatus = input?.status;
  const statusToUse = (rawStatus ?? TaskStatus.TODO) as TaskStatus;

  if (opts.statusRequired && rawStatus === undefined) fields.status = 'Status is required';
  if (!VALID_STATUSES.includes(statusToUse))
    fields.status = 'Status must be TODO, IN_PROGRESS, or DONE';

  let dueDate: string | null = null;
  // normalize dueDate "" to null
  if (input?.dueDate === '' || input?.dueDate === null || input?.dueDate === undefined) {
    dueDate = null;
  } else {
    const s = String(input.dueDate);
    if (!isValidDateOnly(s)) fields.dueDate = 'Due date must be YYYY-MM-DD';
    else if (s < todayDateOnly()) fields.dueDate = 'Due date cannot be in the past';
    else dueDate = s;
  }

  if (Object.keys(fields).length) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input', fields);
  }

  return { title, status: statusToUse, dueDate };
}

function handleP2025(message: string) {
  return (e: unknown): never => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new AppError(404, 'NOT_FOUND', message);
    }
    throw e;
  };
}

// GET /api/tasks
router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Task not found');
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const data = validateTaskInput(req.body as TaskInput, { statusRequired: false });
    const item = await prisma.task.create({ data });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const data = validateTaskInput(req.body as TaskInput, { statusRequired: true });

    const item = await prisma.task
      .update({ where: { id: req.params.id }, data })
      .catch(handleP2025('Task not found'));

    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/tasks/:id (used by e2e helper)
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } }).catch(handleP2025('Task not found'));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
