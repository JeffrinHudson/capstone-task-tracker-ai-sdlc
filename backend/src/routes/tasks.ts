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
  priority: TaskPriority;
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

  const rawPriority = input?.priority;
  const priorityToUse = (rawPriority ?? TaskPriority.MEDIUM) as TaskPriority;
  if (!VALID_PRIORITIES.includes(priorityToUse))
    fields.priority = 'Priority must be LOW, MEDIUM, or HIGH';

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
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query params', {
      filter: `Invalid values: ${invalid.join(', ')}`,
    });
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

    const fields: Record<string, string> = {};

    let dueBefore: string | undefined;
    if (dueBeforeRaw) {
      if (!isValidDateOnly(dueBeforeRaw)) fields.dueBefore = 'dueBefore must be YYYY-MM-DD';
      else dueBefore = dueBeforeRaw;
    }

    let dueAfter: string | undefined;
    if (dueAfterRaw) {
      if (!isValidDateOnly(dueAfterRaw)) fields.dueAfter = 'dueAfter must be YYYY-MM-DD';
      else dueAfter = dueAfterRaw;
    }

    if (Object.keys(fields).length) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query params', fields);
    }

    const where: Prisma.TaskWhereInput = {
      ...(status ? { status: { in: status } } : null),
      ...(priority ? { priority: { in: priority } } : null),
      ...(q
        ? {
            title: {
              contains: q,
              mode: 'insensitive',
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

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const raw = (req.body as { status?: unknown } | undefined)?.status;
    const status = (raw ?? '') as TaskStatus;
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input', {
        status: 'Status must be TODO, IN_PROGRESS, or DONE',
      });
    }

    const item = await prisma.task
      .update({ where: { id: req.params.id }, data: { status } })
      .catch(handleP2025('Task not found'));

    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/tasks/:id/priority
router.patch('/:id/priority', async (req, res, next) => {
  try {
    const raw = (req.body as { priority?: unknown } | undefined)?.priority;
    const priority = (raw ?? '') as TaskPriority;
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input', {
        priority: 'Priority must be LOW, MEDIUM, or HIGH',
      });
    }

    const item = await prisma.task
      .update({ where: { id: req.params.id }, data: { priority } })
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
