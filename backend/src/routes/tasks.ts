import { Router } from 'express';
import { Prisma, Status, Priority } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const VALID_STATUSES = Object.values(Status);
const VALID_PRIORITIES = Object.values(Priority);

function parseISODate(value: unknown, field: string): Date {
  const d = new Date(String(value));
  if (isNaN(d.getTime())) throw new AppError(400, `${field} must be a valid ISO 8601 date`);
  return d;
}

// Trim a string value; return null for absent, null, or whitespace-only input.
function toStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s || null;
}

// Re-throws unknown errors; maps Prisma P2025 (record not found) to a 404.
function handleP2025(id: string) {
  return (e: unknown): never => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')
      throw new AppError(404, `Task ${id} not found`);
    throw e;
  };
}

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { q, status, sortBy, sortDir = 'asc' } = req.query;

    if (status !== undefined && !VALID_STATUSES.includes(status as Status)) {
      throw new AppError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (!['asc', 'desc'].includes(sortDir as string)) {
      throw new AppError(400, 'sortDir must be asc or desc');
    }
    if (sortBy !== undefined && sortBy !== 'dueDate') {
      throw new AppError(400, "sortBy only supports 'dueDate'");
    }

    const where: Prisma.TaskWhereInput = {};
    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
      ];
    }
    if (status) {
      where.status = status as Status;
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput =
      sortBy === 'dueDate'
        ? { dueDate: { sort: sortDir as Prisma.SortOrder, nulls: 'last' } }
        : { createdAt: 'desc' };

    const tasks = await prisma.task.findMany({ where, orderBy });
    res.json(tasks);
  } catch (e) {
    next(e);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority = 'MEDIUM', dueDate } = req.body ?? {};

    const trimmedTitle = toStr(title);
    if (!trimmedTitle) throw new AppError(400, 'title is required');
    if (!VALID_PRIORITIES.includes(priority as Priority)) {
      throw new AppError(400, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const task = await prisma.task.create({
      data: {
        title: trimmedTitle,
        description: toStr(description),
        priority: priority as Priority,
        dueDate: dueDate != null ? parseISODate(dueDate, 'dueDate') : null,
      },
    });
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

// PUT /api/tasks/:id  — full replace (title required; omitted nullable fields clear to null)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status = 'OPEN', priority = 'MEDIUM', dueDate } = req.body ?? {};

    const trimmedTitle = toStr(title);
    if (!trimmedTitle) throw new AppError(400, 'title is required');
    if (!VALID_STATUSES.includes(status as Status)) {
      throw new AppError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (!VALID_PRIORITIES.includes(priority as Priority)) {
      throw new AppError(400, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const task = await prisma.task
      .update({
        where: { id },
        data: {
          title: trimmedTitle,
          description: toStr(description),
          status: status as Status,
          priority: priority as Priority,
          dueDate: dueDate != null ? parseISODate(dueDate, 'dueDate') : null,
        },
      })
      .catch(handleP2025(id));

    res.json(task);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!VALID_STATUSES.includes(status as Status)) {
      throw new AppError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const task = await prisma.task
      .update({ where: { id }, data: { status: status as Status } })
      .catch(handleP2025(id));

    res.json(task);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } }).catch(handleP2025(id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
