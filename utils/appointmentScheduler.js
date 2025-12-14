const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentReminder } = require('./emailTemplates');

/**
 * Check for upcoming appointments and send reminders
 * Runs every hour and sends reminders for appointments 24 hours away
 */
const checkUpcomingAppointments = async () => {
    try {
        console.log('🔔 Checking for appointments needing reminders...');

        // Calculate the time range: 23-25 hours from now
        const now = new Date();
        const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        // Find appointments in the next 24 hours (within 23-25 hour window)
        const upcomingAppointments = await Appointment.find({
            date: {
                $gte: twentyThreeHoursFromNow.toISOString().split('T')[0],
                $lte: twentyFiveHoursFromNow.toISOString().split('T')[0]
            },
            status: 'scheduled',
            reminderSent: { $ne: true } // Only if reminder hasn't been sent
        });

        console.log(`📊 Found ${upcomingAppointments.length} appointments needing reminders`);

        for (const appointment of upcomingAppointments) {
            try {
                // Get user details
                const user = await User.findById(appointment.userId);

                if (!user || !user.email) {
                    console.warn(`⚠️  User not found or no email for appointment ${appointment._id}`);
                    continue;
                }

                // Check if the appointment is actually in the 24-hour window
                const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
                const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

                // Only send if between 23 and 25 hours away
                if (hoursUntilAppointment >= 23 && hoursUntilAppointment <= 25) {
                    // Send reminder email
                    const result = await sendAppointmentReminder(user.email, user.name, appointment);

                    if (result.success) {
                        // Mark reminder as sent
                        appointment.reminderSent = true;
                        await appointment.save();
                        console.log(`✅ Reminder sent for appointment ${appointment._id} to ${user.email}`);
                    } else {
                        console.error(`❌ Failed to send reminder for appointment ${appointment._id}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing appointment ${appointment._id}:`, error);
                // Continue with next appointment even if one fails
            }
        }

        console.log('✅ Appointment reminder check complete');
    } catch (error) {
        console.error('Error in checkUpcomingAppointments:', error);
    }
};

/**
 * Start the appointment reminder scheduler
 * Runs every hour at minute 0
 */
const startAppointmentScheduler = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running scheduled appointment reminder check');
        await checkUpcomingAppointments();
    });

    console.log('🚀 Appointment reminder scheduler started (runs hourly)');

    // Run immediately on startup for testing
    if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Running initial reminder check (development mode)');
        setTimeout(() => checkUpcomingAppointments(), 5000); // Run after 5 seconds
    }
};

/**
 * Manual trigger for testing
 */
const triggerReminderCheck = async () => {
    console.log('🧪 Manually triggering reminder check...');
    await checkUpcomingAppointments();
};

module.exports = {
    startAppointmentScheduler,
    triggerReminderCheck,
    checkUpcomingAppointments
};
