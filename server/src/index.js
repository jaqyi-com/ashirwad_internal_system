const app = require('./app');
const { startAttendanceCron, startRealTimeListeners } = require('./jobs/attendance.cron');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🚀 Ashirwad IMS Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);

  // Start attendance cron + real-time device listeners
  startAttendanceCron();
  await startRealTimeListeners();
});

