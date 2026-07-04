import { Connection } from "../models/Connection.js";
import { ConnectionNotification } from "../models/ConnectionNotification.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { io } from "../server.js";

export const sendConnectionRequest = async (req: any, res: any) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.userId;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({ message: "Cannot connect to yourself" });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if connection already exists in either direction
    let connection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (connection) {
      if (connection.status === "accepted") {
        return res.status(400).json({ message: "Already connected" });
      }
      if (connection.status === "pending") {
        return res.status(400).json({ message: "Connection request already pending" });
      }
      // If rejected, allow re-requesting by updating status back to pending
      connection.status = "pending";
      connection.requester = requesterId;
      connection.recipient = recipientId;
      await connection.save();
    } else {
      connection = await Connection.create({
        requester: requesterId,
        recipient: recipientId,
        status: "pending"
      });
    }

    // Create a connection notification for recipient
    const notification = await ConnectionNotification.create({
      userId: recipientId,
      senderId: requesterId,
      type: "request",
      isRead: false
    });

    const populatedNotif = await notification.populate("senderId", "name username avatar");
    io.to(recipientId.toString()).emit("connection:request", populatedNotif);

    res.json({ message: "Connection request sent successfully", connection });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to send connection request", error: err.message });
  }
};

export const respondConnectionRequest = async (req: any, res: any) => {
  try {
    const { connectionId, action } = req.body; // action: 'accept' | 'reject'
    const userId = req.userId;

    if (!connectionId || !action) {
      return res.status(400).json({ message: "Connection ID and action are required" });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    // Verify the logged-in user is the recipient of the request
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to respond to this request" });
    }

    if (action === "accept") {
      connection.status = "accepted";
      await connection.save();

      // Mark incoming requests notifications from this sender as read
      await ConnectionNotification.updateMany(
        { userId: userId, senderId: connection.requester, type: "request" },
        { isRead: true }
      );

      // Create an accepted notification alert for the requester
      const notification = await ConnectionNotification.create({
        userId: connection.requester,
        senderId: userId,
        type: "accepted",
        isRead: false
      });

      const populatedNotif = await notification.populate("senderId", "name username avatar");
      io.to(connection.requester.toString()).emit("connection:accepted", populatedNotif);

      res.json({ message: "Connection accepted", connection });
    } else if (action === "reject") {
      // Delete connection record to allow clean retries in the future
      await Connection.findByIdAndDelete(connectionId);

      // Mark incoming requests notifications as read
      await ConnectionNotification.deleteMany({
        userId: userId,
        senderId: connection.requester,
        type: "request"
      });

      res.json({ message: "Connection rejected and cleared" });
    } else {
      res.status(400).json({ message: "Invalid action type" });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to respond to connection request", error: err.message });
  }
};

export const getConnections = async (req: any, res: any) => {
  try {
    const userId = req.userId;

    const connections = await Connection.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).populate("requester recipient", "name username avatar isOnline lastSeen");

    res.json(connections);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to retrieve connections", error: err.message });
  }
};

export const getNotifications = async (req: any, res: any) => {
  try {
    const userId = req.userId;

    const notifications = await ConnectionNotification.find({
      userId: userId,
      isRead: false
    })
      .populate("senderId", "name username avatar")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to retrieve notifications", error: err.message });
  }
};

export const markNotificationsRead = async (req: any, res: any) => {
  try {
    const userId = req.userId;

    await ConnectionNotification.updateMany(
      { userId: userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "Notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to mark notifications as read", error: err.message });
  }
};

export const withdrawConnectionRequest = async (req: any, res: any) => {
  try {
    const { connectionId } = req.body;
    const userId = req.userId;

    if (!connectionId) {
      return res.status(400).json({ message: "Connection ID is required" });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to withdraw this request" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Can only withdraw pending requests" });
    }

    const recipientId = connection.recipient.toString();

    await Connection.findByIdAndDelete(connectionId);

    await ConnectionNotification.deleteMany({
      userId: recipientId,
      senderId: userId,
      type: "request"
    });

    io.to(recipientId).emit("connection:withdrawn", { connectionId, senderId: userId });

    res.json({ message: "Connection request withdrawn and removed", connectionId });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to withdraw connection request", error: err.message });
  }
};

export const removeConnection = async (req: any, res: any) => {
  try {
    const { connectionId } = req.params;
    const userId = req.userId;

    if (!connectionId) {
      return res.status(400).json({ message: "Connection ID is required" });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    const requesterId = connection.requester.toString();
    const recipientId = connection.recipient.toString();
    const currentUserId = userId.toString();

    if (requesterId !== currentUserId && recipientId !== currentUserId) {
      return res.status(403).json({ message: "Unauthorized to remove this connection" });
    }

    const friendId = requesterId === currentUserId ? recipientId : requesterId;

    await Connection.findByIdAndDelete(connectionId);
    await ConnectionNotification.deleteMany({
      $or: [
        { userId: currentUserId, senderId: friendId },
        { userId: friendId, senderId: currentUserId },
      ],
    });

    io.to(friendId).emit("connection:removed", {
      connectionId,
      friendId: currentUserId,
    });
    io.to(currentUserId).emit("connection:removed", {
      connectionId,
      friendId,
    });

    res.json({ message: "Friend removed", connectionId, friendId });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to remove friend", error: err.message });
  }
};
