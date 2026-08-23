/**
 * attendance.service.js
 * Connects to a CP Plus / ZKTeco device via TCP (port 4370)
 * and syncs attendance logs into the database.
 */
const ZKLib = require('zkteco-js');
const prisma = require('../config/prisma');

const CONNECTION_TIMEOUT = 10000; // 10s
const SESSION_TIMEOUT   = 8000;  // 8s

/**
 * Sync all attendance records from a device into the DB.
 * @param {object} device  — AttendanceDevice prisma record
 */
async function syncDevice(device) {
  const zk = new ZKLib(device.ipAddress, device.port, CONNECTION_TIMEOUT, SESSION_TIMEOUT);
  try {
    await zk.createSocket();

    // Pull users from device and upsert into employees table
    const { data: users } = await zk.getUsers();
    for (const u of users) {
      if (!u.userId || u.userId === '0') continue;
      await prisma.employee.upsert({
        where: { deviceUserId: String(u.userId) },
        update: { name: u.name || `Employee ${u.userId}` },
        create: {
          deviceUserId: String(u.userId),
          name: u.name || `Employee ${u.userId}`,
        },
      });
    }

    // Pull attendance logs
    const { data: records } = await zk.getAttendances();
    let inserted = 0;

    for (const rec of records) {
      const deviceUserId = String(rec.deviceUserId);
      const timestamp    = new Date(rec.recordTime);

      // Determine punch type (0 = IN, 1 = OUT; vendor varies)
      let punchType = 'UNKNOWN';
      if (rec.inOutStatus === 0 || rec.type === 0) punchType = 'IN';
      else if (rec.inOutStatus === 1 || rec.type === 1) punchType = 'OUT';

      // Find or create employee
      let employee = await prisma.employee.findUnique({ where: { deviceUserId } });
      if (!employee) {
        employee = await prisma.employee.create({
          data: { deviceUserId, name: `Employee ${deviceUserId}` },
        });
      }

      // Upsert log (unique by employeeId + timestamp)
      await prisma.attendanceLog.upsert({
        where: { employeeId_timestamp: { employeeId: employee.id, timestamp } },
        update: { punchType },
        create: {
          employeeId: employee.id,
          deviceId:   device.id,
          timestamp,
          punchType,
        },
      });
      inserted++;
    }

    // Update lastSync
    await prisma.attendanceDevice.update({
      where: { id: device.id },
      data:  { lastSync: new Date() },
    });

    await zk.disconnect();
    return { success: true, records: inserted };
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    throw err;
  }
}

/**
 * Sync all active devices.
 */
async function syncAll() {
  const devices = await prisma.attendanceDevice.findMany({ where: { isActive: true } });
  const results = [];
  for (const d of devices) {
    try {
      const r = await syncDevice(d);
      results.push({ device: d.name, ...r });
    } catch (err) {
      results.push({ device: d.name, success: false, error: err.message });
    }
  }
  return results;
}

/**
 * Start real-time punch listener for a device.
 * Keeps a persistent socket open and inserts punches as they happen.
 */
async function startRealTimeListener(device) {
  const zk = new ZKLib(device.ipAddress, device.port, CONNECTION_TIMEOUT, SESSION_TIMEOUT);
  try {
    await zk.createSocket();
    console.log(`[Attendance] Real-time listener started for ${device.name} (${device.ipAddress})`);

    await zk.getRealTimeLogs(async (log) => {
      try {
        const deviceUserId = String(log.deviceUserId || log.userId);
        const timestamp    = new Date(log.recordTime || log.attTime);

        let punchType = 'UNKNOWN';
        if (log.inOutStatus === 0 || log.type === 0) punchType = 'IN';
        else if (log.inOutStatus === 1 || log.type === 1) punchType = 'OUT';

        let employee = await prisma.employee.findUnique({ where: { deviceUserId } });
        if (!employee) {
          employee = await prisma.employee.create({
            data: { deviceUserId, name: `Employee ${deviceUserId}` },
          });
        }

        await prisma.attendanceLog.upsert({
          where: { employeeId_timestamp: { employeeId: employee.id, timestamp } },
          update: { punchType },
          create: { employeeId: employee.id, deviceId: device.id, timestamp, punchType },
        });

        console.log(`[Attendance] Live punch: ${employee.name} — ${punchType} at ${timestamp.toLocaleTimeString()}`);
      } catch (e) {
        console.error('[Attendance] Real-time insert error:', e.message);
      }
    });
  } catch (err) {
    console.error(`[Attendance] Real-time listener failed for ${device.name}:`, err.message);
  }
}

module.exports = { syncDevice, syncAll, startRealTimeListener };
