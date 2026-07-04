import mongoose from "mongoose";
export declare const CallHistory: mongoose.Model<{
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    type: "video" | "audio";
    conversationId: mongoose.Types.ObjectId;
    status: "missed" | "completed" | "busy";
    callerId: mongoose.Types.ObjectId;
    duration: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=CallHistory.d.ts.map