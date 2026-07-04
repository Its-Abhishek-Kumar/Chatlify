import mongoose from "mongoose";
export declare const ScheduledMessage: mongoose.Model<{
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    text: string;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    sent: boolean;
    scheduledFor: NativeDate;
    media?: {
        type?: "image" | "video" | "file" | null;
        url?: string | null;
    } | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=ScheduledMessage.d.ts.map