/**
 * attendance.cron.js
 * Periodic sync job — runs every 5 minutes for all active devices.
 */
const cron = require('node-cron');
const { syncAll, startRealTimeListener } = require('../services/attendance.service');
const prisma = require('../config/prisma');

function startAttendanceCron() {
  // Sync every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const results = await syncAll();
      const ok  = results.filter(r => r.success).length;
      const bad = results.filter(r => !r.success).length;
      if (results.length > 0) {
        console.log(`[Attendance Cron] Sync done — ${ok} OK, ${bad} failed`);
      }
    } catch (err) {
      console.error('[Attendance Cron] Error:', err.message);
    }
  });

  console.log('[Attendance Cron] Scheduled — syncing every 5 minutes');
}

/**
 * Start real-time listeners for all active devices on server boot.
 */
async function startRealTimeListeners() {
  try {
    const devices = await prisma.attendanceDevice.findMany({ where: { isActive: true } });
    for (const d of devices) {
      startRealTimeListener(d).catch(() => {}); // non-blocking, fails silently
    }
  } catch (err) {
    console.error('[Attendance] Could not start real-time listeners:', err.message);
  }
}

module.exports = { startAttendanceCron, startRealTimeListeners };
