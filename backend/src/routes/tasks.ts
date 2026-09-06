import { Router } from 'express';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const VALID_STATUSES = Object.values(TaskStatus);
const VALID_PRIORITIES = Object.values(TaskPriority);

type TaskInput = {
  title?: unknown;
  status?: unknown;
  dueDate?: unknown;
  priority?: unknown;
  completed?: unknown;
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

function parseTaskId(raw: string): string {
  const id = String(raw ?? '').trim();
  // Accept both current cuid() IDs and legacy UUID-style IDs present in older local DBs.
  const isCuid = /^c[a-z0-9]{24}$/i.test(id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isCuid && !isUuid) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return id;
}

function parseCompleted(input: TaskInput): boolean | undefined {
  if (input.completed === undefined) return undefined;
  if (typeof input.completed !== 'boolean') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input');
  }
  return input.completed;
}

function validateTaskInput(
  input: TaskInput,
  opts: { statusRequired: boolean }
): {
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  priority: TaskPriority;
} {
  const title = toTrimmedString(input?.title);
  if (!title) throw new AppError(400, 'VALIDATION_ERROR', 'Title is required');
  if (title.length > 120) throw new AppError(400, 'VALIDATION_ERROR', 'Title must be <= 120 characters');

  const rawStatus = input?.status;
  const statusToUse = (rawStatus ?? TaskStatus.TODO) as TaskStatus;

  if (opts.statusRequired && rawStatus === undefined) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Status is required');
  }
  if (!VALID_STATUSES.includes(statusToUse)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status');
  }

  const rawPriority = input?.priority;
  const priorityToUse = (rawPriority ?? TaskPriority.MEDIUM) as TaskPriority;
  if (!VALID_PRIORITIES.includes(priorityToUse)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid priority');
  }

  let dueDate: string | null = null;
  // normalize dueDate "" to null
  if (input?.dueDate === '' || input?.dueDate === null || input?.dueDate === undefined) {
    dueDate = null;
  } else {
    const s = String(input.dueDate);
    if (!isValidDateOnly(s)) throw new AppError(400, 'VALIDATION_ERROR', 'Due date must be YYYY-MM-DD');
    if (s < todayDateOnly()) throw new AppError(400, 'VALIDATION_ERROR', 'Due date cannot be in the past');
    dueDate = s;
  }

  return { title, status: statusToUse, dueDate, priority: priorityToUse };
}

function handleP2025(message: string) {
  return (e: unknown): never => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new AppError(404, 'NOT_FOUND', message);
    }
    throw e;
  };
}

function parseEnumList<T extends string>(raw: string | undefined, valid: readonly T[]): T[] | undefined {
  if (!raw) return undefined;
  const tokens = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean) as T[];
  const uniq = Array.from(new Set(tokens));
  if (uniq.length === 0) return undefined;

  const invalid = uniq.filter((x) => !valid.includes(x));
  if (invalid.length) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query params');
  }

  return uniq;
}

// GET /api/tasks?status=TODO,IN_PROGRESS&priority=HIGH&dueBefore=YYYY-MM-DD&dueAfter=YYYY-MM-DD&q=search
router.get('/', async (req, res, next) => {
  try {
    const status = parseEnumList(req.query.status as string | undefined, VALID_STATUSES);
    const priority = parseEnumList(req.query.priority as string | undefined, VALID_PRIORITIES);

    const q = toTrimmedString(req.query.q);

    const dueBeforeRaw = toTrimmedString(req.query.dueBefore);
    const dueAfterRaw = toTrimmedString(req.query.dueAfter);

    let dueBefore: string | undefined;
    if (dueBeforeRaw) {
      if (!isValidDateOnly(dueBeforeRaw)) throw new AppError(400, 'VALIDATION_ERROR', 'dueBefore must be YYYY-MM-DD');
      dueBefore = dueBeforeRaw;
    }

    let dueAfter: string | undefined;
    if (dueAfterRaw) {
      if (!isValidDateOnly(dueAfterRaw)) throw new AppError(400, 'VALIDATION_ERROR', 'dueAfter must be YYYY-MM-DD');
      dueAfter = dueAfterRaw;
    }

    const where: Prisma.TaskWhereInput = {
      ...(status ? { status: { in: status } } : null),
      ...(priority ? { priority: { in: priority } } : null),
      ...(q
        ? {
            title: {
              contains: q,
            },
          }
        : null),
      ...(dueBefore || dueAfter
        ? {
            dueDate: {
              ...(dueAfter ? { gte: dueAfter } : null),
              ...(dueBefore ? { lte: dueBefore } : null),
            },
          }
        : null),
    };

    const items = await prisma.task.findMany({ orderBy: { createdAt: 'desc' }, where });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseTaskId(req.params.id);
    const item = await prisma.task.findUnique({ where: { id } });
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
    // validate optional completed (HITL/Phase 4), but don't persist (model uses status).
    parseCompleted(req.body as TaskInput);

    const item = await prisma.task.create({
      data,
    });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseTaskId(req.params.id);
    const data = validateTaskInput(req.body as TaskInput, { statusRequired: true });
    parseCompleted(req.body as TaskInput);

    const item = await prisma.task.update({ where: { id }, data }).catch(handleP2025('Task not found'));

    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = parseTaskId(req.params.id);
    const raw = (req.body as { status?: unknown } | undefined)?.status;
    const status = (raw ?? '') as TaskStatus;
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status');
    }

    const item = await prisma.task.update({ where: { id }, data: { status } }).catch(handleP2025('Task not found'));

    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/tasks/:id/priority
router.patch('/:id/priority', async (req, res, next) => {
  try {
    const id = parseTaskId(req.params.id);
    const raw = (req.body as { priority?: unknown } | undefined)?.priority;
    const priority = (raw ?? '') as TaskPriority;
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid priority');
    }

    const item = await prisma.task.update({ where: { id }, data: { priority } }).catch(handleP2025('Task not found'));

    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/tasks/:id (used by e2e helper)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseTaskId(req.params.id);
    await prisma.task.delete({ where: { id } }).catch(handleP2025('Task not found'));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.all('/:id', (_req, _res, next) => {
  next(new AppError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed'));
});

export default router;
