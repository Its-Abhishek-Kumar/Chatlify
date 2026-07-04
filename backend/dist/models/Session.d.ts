import mongoose from "mongoose";
export declare const Session: mongoose.Model<{
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
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
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    token: string;
    lastActive: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=Session.d.ts.map