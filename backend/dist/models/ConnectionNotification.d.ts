import mongoose from "mongoose";
export declare const ConnectionNotification: mongoose.Model<{
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    userId: mongoose.Types.ObjectId;
    type: "accepted" | "request";
    senderId: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=ConnectionNotification.d.ts.map