const express = require('express');
const prisma  = require('../config/prisma');
const { asyncHandler }            = require('../middleware/error.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { syncDevice, startRealTimeListener } = require('../services/attendance.service');

const router = express.Router();

// ── DEVICES ──────────────────────────────────────────────────────────────────

// GET /api/attendance/devices
router.get('/devices', authenticate, asyncHandler(async (req, res) => {
  const devices = await prisma.attendanceDevice.findMany({ orderBy: { name: 'asc' } });
  res.json(devices);
}));

// POST /api/attendance/devices
router.post('/devices', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
  const { name, ipAddress, port } = req.body;
  if (!name || !ipAddress) return res.status(400).json({ error: 'Name and IP address are required.' });
  const device = await prisma.attendanceDevice.create({
    data: { name, ipAddress, port: parseInt(port) || 4370 },
  });
  // Start real-time listener for new device (non-blocking)
  startRealTimeListener(device).catch(() => {});
  res.status(201).json(device);
}));

// PUT /api/attendance/devices/:id
router.put('/devices/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
  const device = await prisma.attendanceDevice.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(device);
}));

// DELETE /api/attendance/devices/:id
router.delete('/devices/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  await prisma.attendanceDevice.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Device deactivated.' });
}));

// POST /api/attendance/devices/:id/test  — test connection
router.post('/devices/:id/test', authenticate, asyncHandler(async (req, res) => {
  const device = await prisma.attendanceDevice.findUnique({ where: { id: req.params.id } });
  if (!device) return res.status(404).json({ error: 'Device not found.' });

  const ZKLib = require('zkteco-js');
  const zk = new ZKLib(device.ipAddress, device.port, 5000, 3000);
  try {
    await zk.createSocket();
    const { data: users } = await zk.getUsers();
    await zk.disconnect();
    res.json({ success: true, message: `Connected! Found ${users.length} users on device.` });
  } catch (err) {
    res.status(503).json({ success: false, message: `Connection failed: ${err.message}` });
  }
}));

// POST /api/attendance/sync  — manual sync all devices
router.post('/sync', authenticate, asyncHandler(async (req, res) => {
  const { syncAll } = require('../services/attendance.service');
  const results = await syncAll();
  res.json({ results });
}));

// POST /api/attendance/devices/:id/sync  — sync single device
router.post('/devices/:id/sync', authenticate, asyncHandler(async (req, res) => {
  const device = await prisma.attendanceDevice.findUnique({ where: { id: req.params.id } });
  if (!device) return res.status(404).json({ error: 'Device not found.' });
  try {
    const result = await syncDevice(device);
    res.json(result);
  } catch (err) {
    res.status(503).json({ success: false, error: err.message });
  }
}));

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────

// GET /api/attendance/employees
router.get('/employees', authenticate, asyncHandler(async (req, res) => {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json(employees);
}));

// PUT /api/attendance/employees/:id
router.put('/employees/:id', authenticate, asyncHandler(async (req, res) => {
  const emp = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
  res.json(emp);
}));

// ── ATTENDANCE LOGS ───────────────────────────────────────────────────────────

// GET /api/attendance/today
router.get('/today', authenticate, asyncHandler(async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);

  const logs = await prisma.attendanceLog.findMany({
    where: { timestamp: { gte: start, lte: end } },
    include: { employee: true, device: { select: { name: true } } },
    orderBy: { timestamp: 'desc' },
  });

  // Build summary: present/absent/late
  const employees = await prisma.employee.findMany({ where: { isActive: true } });
  const presentIds = new Set(logs.map(l => l.employeeId));
  const present = presentIds.size;
  const absent  = employees.length - present;

  res.json({ logs, summary: { total: employees.length, present, absent } });
}));

// GET /api/attendance/range?from=&to=&employeeId=
router.get('/range', authenticate, asyncHandler(async (req, res) => {
  const { from, to, employeeId } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates are required.' });

  const where = {
    timestamp: { gte: new Date(from), lte: new Date(to + 'T23:59:59') },
    ...(employeeId && { employeeId }),
  };

  const logs = await prisma.attendanceLog.findMany({
    where,
    include: { employee: { select: { name: true, department: true } }, device: { select: { name: true } } },
    orderBy: [{ employeeId: 'asc' }, { timestamp: 'asc' }],
  });
  res.json(logs);
}));

// GET /api/attendance/summary?month=2026-08
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7);
  const [year, mon] = month.split('-').map(Number);
  const from = new Date(year, mon - 1, 1);
  const to   = new Date(year, mon, 0, 23, 59, 59);

  const logs = await prisma.attendanceLog.findMany({
    where: { timestamp: { gte: from, lte: to } },
    include: { employee: { select: { id: true, name: true, department: true } } },
    orderBy: { timestamp: 'asc' },
  });

  const employees = await prisma.employee.findMany({ where: { isActive: true } });
  const workingDays = getWorkingDays(from, to);

  // Group logs by employee → day
  const byEmp = {};
  for (const log of logs) {
    const eid = log.employeeId;
    if (!byEmp[eid]) byEmp[eid] = { employee: log.employee, days: {} };
    const day = log.timestamp.toISOString().substring(0, 10);
    if (!byEmp[eid].days[day]) byEmp[eid].days[day] = [];
    byEmp[eid].days[day].push(log);
  }

  const summary = employees.map(emp => {
    const data = byEmp[emp.id] || { days: {} };
    let totalMinutes = 0, presentDays = 0;

    for (const [, dayLogs] of Object.entries(data.days)) {
      const ins  = dayLogs.filter(l => l.punchType === 'IN').sort((a, b) => a.timestamp - b.timestamp);
      const outs = dayLogs.filter(l => l.punchType === 'OUT').sort((a, b) => a.timestamp - b.timestamp);
      if (ins.length || outs.length) presentDays++;
      if (ins.length && outs.length) {
        totalMinutes += Math.round((outs[outs.length - 1].timestamp - ins[0].timestamp) / 60000);
      }
    }

    return {
      employeeId: emp.id,
      name:       emp.name,
      department: emp.department,
      presentDays,
      absentDays:  Math.max(0, workingDays - presentDays),
      totalHours:  +(totalMinutes / 60).toFixed(1),
    };
  });

  res.json({ month, workingDays, summary });
}));

function getWorkingDays(from, to) {
  let count = 0, d = new Date(from);
  while (d <= to) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

module.exports = router;
