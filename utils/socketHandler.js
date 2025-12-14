const socketIO = require('socket.io');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @param {Array} allowedOrigins - Array of allowed CORS origins
 */
const initializeSocket = (server, allowedOrigins = []) => {
    io = socketIO(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // User authentication - join user-specific room
        socket.on('authenticate', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`👤 User ${userId} authenticated and joined room`);
                socket.emit('authenticated', { userId, socketId: socket.id });
            }
        });

        // Join emergency room for real-time updates
        socket.on('join-emergency', (emergencyId) => {
            if (emergencyId) {
                socket.join(`emergency:${emergencyId}`);
                console.log(`🚨 Socket ${socket.id} joined emergency room: ${emergencyId}`);
            }
        });

        // Leave emergency room
        socket.on('leave-emergency', (emergencyId) => {
            if (emergencyId) {
                socket.leave(`emergency:${emergencyId}`);
                console.log(`🚪 Socket ${socket.id} left emergency room: ${emergencyId}`);
            }
        });

        // Chat room join
        socket.on('join-chat', (chatRoomId) => {
            if (chatRoomId) {
                socket.join(`chat:${chatRoomId}`);
                console.log(`💬 Socket ${socket.id} joined chat room: ${chatRoomId}`);
            }
        });

        // Chat message
        socket.on('send-message', (data) => {
            const { chatRoomId, message, userId, userName } = data;
            if (chatRoomId && message) {
                io.to(`chat:${chatRoomId}`).emit('new-message', {
                    message,
                    userId,
                    userName,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { chatRoomId, userId, userName, isTyping } = data;
            if (chatRoomId) {
                socket.to(`chat:${chatRoomId}`).emit('user-typing', {
                    userId,
                    userName,
                    isTyping
                });
            }
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });

        // Error handler
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    console.log('🔌 Socket.IO server initialized');
    return io;
};

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket first.');
    }
    return io;
};

/**
 * Emit emergency alert to user
 * @param {String} userId - User ID
 * @param {Object} emergency - Emergency data
 */
const emitEmergencyAlert = (userId, emergency) => {
    if (io) {
        io.to(`user:${userId}`).emit('emergency-alert', emergency);
        console.log(`🚨 Emergency alert sent to user ${userId}`);
    }
};

/**
 * Emit emergency status update
 * @param {String} emergencyId - Emergency ID
 * @param {Object} update - Update data
 */
const emitEmergencyUpdate = (emergencyId, update) => {
    if (io) {
        io.to(`emergency:${emergencyId}`).emit('emergency-update', update);
        console.log(`📢 Emergency update sent for ${emergencyId}`);
    }
};

/**
 * Emit hospital response notification
 * @param {String} userId - User ID
 * @param {String} emergencyId - Emergency ID
 * @param {Object} hospital - Hospital response data
 */
const emitHospitalResponse = (userId, emergencyId, hospital) => {
    if (io) {
        const notification = {
            type: 'hospital-response',
            emergencyId,
            hospital,
            timestamp: new Date().toISOString()
        };

        // Send to user's room
        io.to(`user:${userId}`).emit('hospital-response', notification);

        // Send to emergency room
        io.to(`emergency:${emergencyId}`).emit('emergency-update', {
            status: 'responded',
            hospital,
            timestamp: new Date().toISOString()
        });

        console.log(`🏥 Hospital response notification sent for emergency ${emergencyId}`);
    }
};

/**
 * Emit appointment reminder
 * @param {String} userId - User ID
 * @param {Object} appointment - Appointment data
 */
const emitAppointmentReminder = (userId, appointment) => {
    if (io) {
        io.to(`user:${userId}`).emit('appointment-reminder', {
            type: 'appointment-reminder',
            appointment,
            timestamp: new Date().toISOString()
        });
        console.log(`📅 Appointment reminder sent to user ${userId}`);
    }
};

/**
 * Emit chat message to room
 * @param {String} chatRoomId - Chat room ID
 * @param {Object} message - Message data
 */
const emitChatMessage = (chatRoomId, message) => {
    if (io) {
        io.to(`chat:${chatRoomId}`).emit('new-message', message);
    }
};

/**
 * Emit general notification to user
 * @param {String} userId - User ID
 * @param {Object} notification - Notification data
 */
const emitNotification = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString()
        });
        console.log(`🔔 Notification sent to user ${userId}: ${notification.type}`);
    }
};

/**
 * Broadcast system announcement to all connected clients
 * @param {Object} announcement - Announcement data
 */
const broadcastAnnouncement = (announcement) => {
    if (io) {
        io.emit('system-announcement', {
            ...announcement,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 System announcement broadcast: ${announcement.message}`);
    }
};

module.exports = {
    initializeSocket,
    getIO,
    emitEmergencyAlert,
    emitEmergencyUpdate,
    emitHospitalResponse,
    emitAppointmentReminder,
    emitChatMessage,
    emitNotification,
    broadcastAnnouncement
};
