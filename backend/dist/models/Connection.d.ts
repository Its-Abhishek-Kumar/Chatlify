import mongoose from "mongoose";
export declare const Connection: mongoose.Model<{
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    status: "pending" | "accepted" | "rejected";
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=Connection.d.ts.map